import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'

const app = path.resolve(process.argv[2] || process.cwd())
const requireFromApp = createRequire(path.join(app, 'package.json'))
let ts
try {
  ts = requireFromApp('typescript')
} catch {
  const globalRoot = execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim()
  const requireGlobal = createRequire(path.join(globalRoot, 'package.json'))
  ts = requireGlobal('typescript')
}

const checks = []
const pass = (label) => { checks.push(label); console.log(`PASS  ${label}`) }
const fail = (label) => { throw new Error(`FAIL  ${label}`) }
const rel = (...parts) => path.join(...parts)
const read = (file) => fs.readFileSync(path.join(app, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(app, file))
const mustExist = (file) => exists(file) ? pass(`file exists: ${file}`) : fail(`missing file: ${file}`)
const mustContain = (file, marker, label = marker) => read(file).includes(marker) ? pass(`${file}: ${label}`) : fail(`${file}: missing ${label}`)

const requiredFiles = [
  'app/(protected)/angelcare-360-operator/email-command/page.tsx',
  'app/api/angelcare360/operator/email-command/route.ts',
  'app/api/angelcare360/email-command/inbound/route.ts',
  'app/api/angelcare360/email-command/worker/route.ts',
  'components/angelcare360/operator/email-command/EmailCommandContract.ts',
  'components/angelcare360/operator/email-command/EmailCommandOperatingSystem.tsx',
  'components/angelcare360/operator/email-command/EmailCommandOperatingSystem.module.css',
  'components/angelcare360/operator/email-command/CustomerCorrespondenceCommand.tsx',
  'components/angelcare360/operator/email-command/CustomerCorrespondenceCommand.module.css',
  'lib/angelcare360/operator/email-command.ts',
  'lib/angelcare360/email/correspondence-ledger.ts',
  'types/angelcare360/operator/email-command.ts',
  'supabase/migrations/20260801_angelcare360_operator_email_automation_correspondence_os.sql',
  'scripts/smoke-angelcare360-email-command-runtime.mjs',
  'scripts/apply-angelcare360-email-command-migration.sh',
  'tsconfig.angelcare360-email-command.json',
]
requiredFiles.forEach(mustExist)

const modeMarkers = ['command','automation','outbound','inbound','conversations','templates','approvals','deliverability']
for (const mode of modeMarkers) mustContain('components/angelcare360/operator/email-command/EmailCommandContract.ts', `key: '${mode}'`, `mode ${mode}`)

const operationMarkers = ['rule.upsert','rule.status','template.upsert','message.compose','message.send','message.update','approval.decide','event.publish','inbound.match','suppression.create']
for (const op of operationMarkers) mustContain('lib/angelcare360/operator/email-command.ts', `'${op}'`, `operation ${op}`)

const eventMarkers = ['tenant.admin.invited','invoice.overdue','ticket.sla_at_risk','complaint.registered','contract.signature_requested','renewal.approaching']
for (const event of eventMarkers) mustContain('components/angelcare360/operator/email-command/EmailCommandContract.ts', `'${event}'`, `event ${event}`)

mustContain('components/angelcare360/operator/growth/GrowthContract.ts', "['correspondence', 'Emails & correspondance']", '14th dossier section')
mustContain('components/angelcare360/operator/growth/CustomerSovereignCommandRoom.tsx', '<CustomerCorrespondenceCommand clientId={id}/>', 'embedded customer correspondence')
mustContain('data/angelcare360/operator-sovereign-navigation.ts', "href: '/angelcare-360-operator/email-command'", 'Email Command navigation')
mustContain('lib/angelcare360/email/email-os-bridge.ts', 'recordOutboundEmailCommand', 'existing Email OS bridge ledger hook')
mustContain('lib/angelcare360/operator/tenant-access.ts', "eventType: 'tenant.admin.invited'", 'tenant invitation correspondence event')
mustContain('lib/angelcare360/operator/tenant-access.ts', "eventType: 'tenant.admin.password_reset_requested'", 'password reset correspondence event')
mustContain('app/api/angelcare360/email-command/inbound/route.ts', 'EMAIL_OS_SYNC_TOKEN', 'protected inbound bridge token')
mustContain('lib/angelcare360/operator/email-command.ts', 'ingestInboundEmail', 'inbound ingestion kernel')
mustContain('lib/angelcare360/operator/email-command.ts', 'evaluateBusinessEvent', 'automation evaluator')
mustContain('lib/angelcare360/operator/email-command.ts', 'dispatchDueEmailCommandMessages', 'scheduled queue and retry worker')
mustContain('app/api/angelcare360/email-command/worker/route.ts', 'EMAIL_COMMAND_WORKER_TOKEN', 'protected automation worker')

const tsFiles = requiredFiles.filter((file) => /\.tsx?$/.test(file)).concat([
  'lib/angelcare360/email/email-os-bridge.ts',
  'lib/angelcare360/operator/tenant-access.ts',
  'components/angelcare360/operator/growth/GrowthContract.ts',
  'components/angelcare360/operator/growth/CustomerSovereignCommandRoom.tsx',
  'data/angelcare360/operator-sovereign-navigation.ts',
])
for (const file of [...new Set(tsFiles)]) {
  const source = read(file)
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind)
  const diagnostics = sf.parseDiagnostics || []
  if (diagnostics.length) {
    const detail = diagnostics.map((d) => {
      const pos = sf.getLineAndCharacterOfPosition(d.start || 0)
      return `${file}:${pos.line + 1}:${pos.character + 1} ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`
    }).join('\n')
    throw new Error(`FAIL  TypeScript syntax\n${detail}`)
  }
  pass(`TypeScript syntax: ${file}`)
}

function cssClasses(source) {
  const result = new Set()
  for (const match of source.matchAll(/\.([A-Za-z_][\w-]*)/g)) result.add(match[1])
  return result
}
const pairs = [
  ['components/angelcare360/operator/email-command/EmailCommandOperatingSystem.tsx','components/angelcare360/operator/email-command/EmailCommandOperatingSystem.module.css'],
  ['components/angelcare360/operator/email-command/CustomerCorrespondenceCommand.tsx','components/angelcare360/operator/email-command/CustomerCorrespondenceCommand.module.css'],
]
for (const [tsx, css] of pairs) {
  const classes = cssClasses(read(css))
  const refs = [...read(tsx).matchAll(/styles\.([A-Za-z_][\w]*)/g)].map((m) => m[1])
  for (const name of [...new Set(refs)]) classes.has(name) ? pass(`CSS module resolves ${path.basename(tsx)}: ${name}`) : fail(`CSS module missing ${name} for ${tsx}`)
  const source = read(css).replace(/\/\*[\s\S]*?\*\//g, '')
  for (const match of source.matchAll(/([^{}]+)\{/g)) {
    const selector = match[1].trim()
    if (!selector || selector.startsWith('@') || selector === 'from' || selector === 'to' || /^\d+(\.\d+)?%$/.test(selector)) continue
    for (const part of selector.split(',')) {
      const clean = part.trim()
      if (!clean || clean.startsWith('@')) continue
      if (!/[.#][A-Za-z_][\w-]*/.test(clean) && !clean.includes(':global(')) fail(`impure CSS module selector in ${css}: ${clean}`)
    }
  }
  pass(`CSS Module purity: ${css}`)
}

const sourceFiles = requiredFiles.filter((file) => /\.(ts|tsx|css)$/.test(file)).map(read).join('\n')
for (const forbidden of ['href="javascript:', 'TODO_ACTION', 'type="password"', 'placeholder="UUID', 'placeholder="ID technique']) {
  sourceFiles.includes(forbidden) ? fail(`forbidden marker present: ${forbidden}`) : pass(`forbidden marker absent: ${forbidden}`)
}

const ui = read('components/angelcare360/operator/email-command/EmailCommandOperatingSystem.tsx') + read('components/angelcare360/operator/email-command/EmailCommandContract.ts')
for (const visual of ['Communication flow command field','Automation Studio','Outbound Operations','Inbound Intelligence','Customer Conversations','Templates & Journeys','Approvals & Governance','Deliverability & Audit']) {
  ui.includes(visual) ? pass(`distinct workspace marker: ${visual}`) : fail(`missing workspace marker: ${visual}`)
}

console.log(`\n${checks.length} checks passed. Email Automation, Customer Correspondence & Inbox Intelligence OS is statically accepted.`)
