const fs = require('fs')
const path = require('path')

const root = process.cwd()
const target = path.join(root, 'lib/saas-factory/options-runtime.ts')

if (!fs.existsSync(target)) {
  console.error(`Missing ${target}`)
  process.exit(1)
}

let source = fs.readFileSync(target, 'utf8')

for (const token of ['runOptionsAction', 'getOptionsSummary']) {
  if (!source.includes(token)) {
    console.error(`options-runtime.ts does not contain expected base function/export: ${token}`)
    process.exit(1)
  }
}

const exportNames = [
  'handleOptionsWorkflowAction',
  'publishOptionsRegistry',
  'rollbackOptionsRegistry',
  'runOptionsValidation',
]

const missing = exportNames.filter((name) => {
  const regex = new RegExp(`export\\s+(async\\s+)?function\\s+${name}\\s*\\(`)
  return !regex.test(source)
})

if (!missing.length) {
  console.log('Options runtime compatibility exports already exist. No changes needed.')
  process.exit(0)
}

if (source.includes('SaaS Factory Options Runtime Compatibility Exports')) {
  console.error('Compatibility marker already exists, but exports are still missing. Inspect lib/saas-factory/options-runtime.ts manually.')
  process.exit(1)
}

source = source.trimEnd() + `

// -----------------------------------------------------------------------------
// SaaS Factory Options Runtime Compatibility Exports
// -----------------------------------------------------------------------------
// Existing API routes still import legacy workflow names while the runtime now
// exposes runOptionsAction/getOptionsSummary. These wrappers preserve build/runtime
// compatibility without replacing the real options implementation.
// -----------------------------------------------------------------------------

type __OptionsCompatPayload = Record<string, any>

async function __runOptionsActionCompat(action: string, payload: __OptionsCompatPayload = {}) {
  const runner = runOptionsAction as unknown as (...args: any[]) => Promise<any> | any

  try {
    return await runner(action, payload)
  } catch (firstError) {
    try {
      return await runner({
        action,
        operation: action,
        mode: action,
        payload,
        ...payload,
      })
    } catch (secondError) {
      return {
        ok: false,
        action,
        message:
          secondError instanceof Error
            ? secondError.message
            : firstError instanceof Error
              ? firstError.message
              : 'Options workflow compatibility action failed.',
        evidence: [
          'options_runtime_compat_wrapper',
          'legacy_api_route_import',
          'runOptionsAction_fallback_attempted',
        ],
      }
    }
  }
}

export async function handleOptionsWorkflowAction(...args: any[]) {
  const first = args[0]
  const second = args[1]
  const action =
    typeof first === 'string'
      ? first
      : first?.action || first?.operation || first?.mode || 'workflow'
  const payload =
    typeof first === 'string'
      ? (second && typeof second === 'object' ? second : {})
      : (first && typeof first === 'object' ? first : {})

  return __runOptionsActionCompat(action, payload)
}

export async function publishOptionsRegistry(payload: __OptionsCompatPayload = {}) {
  return __runOptionsActionCompat('publish', {
    ...payload,
    workflow: 'publish_options_registry',
    confirmationRequired: true,
  })
}

export async function rollbackOptionsRegistry(payload: __OptionsCompatPayload = {}) {
  return __runOptionsActionCompat('rollback', {
    ...payload,
    workflow: 'rollback_options_registry',
    confirmationRequired: true,
  })
}

export async function runOptionsValidation(payload: __OptionsCompatPayload = {}) {
  return __runOptionsActionCompat('validate', {
    ...payload,
    workflow: 'validate_options_registry',
  })
}
`

fs.writeFileSync(target, source + '\n')
console.log(`Added missing compatibility exports: ${missing.join(', ')}`)
