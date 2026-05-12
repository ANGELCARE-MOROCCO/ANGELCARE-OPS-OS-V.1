const fs = require('fs')
const path = require('path')

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '' }
function write(file, data) { fs.writeFileSync(file, data, 'utf8'); console.log('patched', file) }

const typesPath = path.join(process.cwd(), 'lib/service-os/types.ts')
let types = read(typesPath)
if (!types) throw new Error('Missing lib/service-os/types.ts')

// Add broad compatibility fields to ServiceBlueprint without weakening usage to any.
if (!/serviceCode\??\s*:\s*string/.test(types)) {
  types = types.replace(/(export\s+type\s+ServiceBlueprint\s*=\s*\{)/, `$1\n  serviceCode?: string`)
}
if (!/code\??\s*:\s*string/.test(types)) {
  types = types.replace(/(export\s+type\s+ServiceBlueprint\s*=\s*\{)/, `$1\n  code?: string`)
}
if (!/status\??\s*:\s*string/.test(types)) {
  types = types.replace(/(export\s+type\s+ServiceBlueprint\s*=\s*\{)/, `$1\n  status?: string`)
}
if (!/marketSegment\??\s*:\s*string/.test(types)) {
  types = types.replace(/(export\s+type\s+ServiceBlueprint\s*=\s*\{)/, `$1\n  marketSegment?: string`)
}

// Ensure common arrays are defined as arrays, not optional undefined-only risks.
const arrayFields = [
  'modules', 'cities', 'defaultWorkflow', 'requiredDocuments', 'requiredCertifications',
  'addons', 'automationRules', 'riskFlags', 'staffRequirements', 'pricingRules'
]
for (const field of arrayFields) {
  const reOptional = new RegExp(`${field}\\??\\s*:\\s*[^\\n]+`, 'm')
  if (reOptional.test(types)) {
    types = types.replace(reOptional, `${field}: string[]`)
  } else {
    types = types.replace(/(export\s+type\s+ServiceBlueprint\s*=\s*\{)/, `$1\n  ${field}: string[]`)
  }
}
write(typesPath, types)

const enginePath = path.join(process.cwd(), 'lib/service-os/blueprint-engine.ts')
let engine = read(enginePath)
if (engine) {
  // Guard direct b.serviceCode usage so partial seed objects don't fail.
  engine = engine.replace(/b\.serviceCode\.toLowerCase\(\)\.replace\('#',''\)/g, `(b.serviceCode ?? b.code ?? b.id ?? '').toLowerCase().replace('#','')`)
  engine = engine.replace(/b\.serviceCode\.toLowerCase\(\)/g, `(b.serviceCode ?? b.code ?? b.id ?? '').toLowerCase()`)
  write(enginePath, engine)
}

console.log('ServiceOS contract hardening complete.')
