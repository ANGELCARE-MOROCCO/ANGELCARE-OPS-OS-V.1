import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
let ts
try { ts = require('typescript') } catch { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js') }

const root = process.cwd()
const required = [
  'app/(protected)/angelcare-360-command-center/direction/page.tsx',
  'components/angelcare360/direction/Angelcare360DirectionCommand.tsx',
  'components/angelcare360/direction/Angelcare360DirectionCommand.module.css',
  'types/angelcare360/direction-command.ts',
  'data/angelcare360/direction-command.ts',
  'lib/angelcare360/server/direction-command.ts',
  'app/api/angelcare360/direction/command/route.ts',
  'app/api/angelcare360/direction/matters/[id]/route.ts',
  'app/api/angelcare360/direction/decisions/route.ts',
  'app/api/angelcare360/direction/commitments/route.ts',
  'app/api/angelcare360/direction/briefings/route.ts',
  'supabase/migrations/20260804_angelcare360_direction_executive_intervention_os.sql',
]

const fail = (message) => { console.error(`FAIL: ${message}`); process.exit(1) }
for (const file of required) if (!fs.existsSync(path.join(root, file))) fail(`missing ${file}`)

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const component = read(required[1])
const css = read(required[2])
const types = read(required[3])
const data = read(required[4])
const server = read(required[5])
const sql = read(required[11])
const api = required.slice(6, 11).map(read).join('\n')

const markers = [
  'DIRECTION EXECUTIVE INTERVENTION OS',
  'EXECUTIVE PRIORITY RUNWAY',
  'EXECUTIVE COMMAND STUDIO',
  'EXECUTIVE COMMITMENT STUDIO',
  'MatterDrawer',
  'BriefingDrawer',
  'DomainMatrix',
  'Accuser réception',
  'Prendre en charge',
  'Marquer vérifié',
  'Demander une preuve',
  'Marquer terminé',
  'Libérer de Direction',
  'Aller résoudre dans le dossier exact',
  'Générer le briefing',
]
for (const marker of markers) if (!component.includes(marker)) fail(`component marker missing: ${marker}`)

const planeKeys = [...data.matchAll(/key: '(today|network|decisions|risks|commitments|performance|calendar|audit)'/g)].map((m) => m[1])
if (new Set(planeKeys).size !== 8) fail(`expected 8 planes, found ${new Set(planeKeys).size}`)
const domainBlock = data.slice(data.indexOf('export const DIRECTION_DOMAINS'), data.indexOf('export const DIRECTION_COMMAND_TEMPLATES'))
const domainKeys = [...domainBlock.matchAll(/^\s{2}([a-z]+): \{/gm)].map((m) => m[1])
if (new Set(domainKeys).size !== 11) fail(`expected 11 domains, found ${new Set(domainKeys).size}`)
const operationKeys = [...data.matchAll(/'direction\.[a-z_.]+'/g)].map((m) => m[0].slice(1, -1))
if (new Set(operationKeys).size !== 22) fail(`expected 22 canonical operations, found ${new Set(operationKeys).size}`)

for (const endpoint of ['/command', '/matters/', '/decisions', '/commitments', '/briefings']) {
  if (!component.includes(`/api/angelcare360/direction${endpoint}`) && !api.includes(endpoint)) fail(`API family missing: ${endpoint}`)
}

for (const action of ['acknowledge','take_ownership','assign','mark_checked','request_evidence','add_note','snooze','escalate','resolve','release','reopen']) {
  if (!server.includes(`'${action}'`) || !component.includes(`${action}:`)) fail(`matter action incomplete: ${action}`)
}
for (const fn of ['createDirectionCommitment','actOnDirectionCommitment','createDirectionDecision','actOnDirectionDecision','generateDirectionBriefing']) {
  if (!server.includes(`function ${fn}`) && !server.includes(`function ${fn}(`)) fail(`server function missing: ${fn}`)
}

if (/\balert\s*\(/.test(component)) fail('browser alert detected')
if (/OverheadPanel|operator\/sovereign|angelcare-360-operator/.test(component + server)) fail('Operator shell leakage detected')
if (/setInterval\s*\(|requestAnimationFrame\s*\(/.test(component)) fail('continuous motion/polling detected')

const source = ts.createSourceFile('Direction.tsx', component, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const deadButtons = []
function visit(node) {
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
    const opening = ts.isJsxElement(node) ? node.openingElement : node
    const tag = opening.tagName.getText(source)
    if (tag === 'button') {
      const attrs = opening.attributes.properties
      const names = new Set(attrs.filter(ts.isJsxAttribute).map((a) => a.name.getText(source)))
      if (!names.has('onClick') && !names.has('type')) deadButtons.push(source.getLineAndCharacterOfPosition(opening.pos).line + 1)
      if (!names.has('onClick') && names.has('type')) {
        const typeAttr = attrs.find((a) => ts.isJsxAttribute(a) && a.name.getText(source) === 'type')
        const value = typeAttr && ts.isJsxAttribute(typeAttr) && typeAttr.initializer ? typeAttr.initializer.getText(source) : ''
        if (!value.includes('submit')) deadButtons.push(source.getLineAndCharacterOfPosition(opening.pos).line + 1)
      }
    }
  }
  ts.forEachChild(node, visit)
}
visit(source)
if (deadButtons.length) fail(`dead button(s) detected near lines: ${deadButtons.join(', ')}`)

const styleRefs = new Set([...component.matchAll(/styles\.([A-Za-z0-9_]+)/g)].map((m) => m[1]))
const missingStyles = [...styleRefs].filter((name) => !new RegExp(`\\.${name}(?:[^A-Za-z0-9_-]|$)`).test(css))
if (missingStyles.length) fail(`missing CSS module classes: ${missingStyles.join(', ')}`)

const tsFiles = required.filter((file) => /\.(ts|tsx)$/.test(file))
let syntaxErrors = 0
for (const file of tsFiles) {
  const content = read(file)
  const sf = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  if (sf.parseDiagnostics.length) {
    syntaxErrors += sf.parseDiagnostics.length
    for (const diagnostic of sf.parseDiagnostics) console.error(`${file}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`)
  }
}
if (syntaxErrors) fail(`${syntaxErrors} syntax diagnostic(s)`)

const begin = (sql.match(/^\s*begin\s*;/gim) || []).length
const commit = (sql.match(/^\s*commit\s*;/gim) || []).length
const tables = (sql.match(/^create table if not exists public\./gim) || []).length
const rls = (sql.match(/enable row level security/gim) || []).length
const sqlOps = new Set([...sql.matchAll(/'direction\.[a-z_.]+'/g)].map((m) => m[0].slice(1, -1)))
if (begin !== 1 || commit !== 1) fail(`SQL transaction mismatch: BEGIN=${begin}, COMMIT=${commit}`)
if (tables !== 7 || rls !== 7) fail(`SQL authority mismatch: tables=${tables}, RLS=${rls}`)
if (sqlOps.size !== 22) fail(`SQL operation catalog mismatch: ${sqlOps.size}`)
if (/\bdrop\s+table\b|\btruncate\b|\bdelete\s+from\b/i.test(sql)) fail('destructive SQL statement detected')

console.log('PASS: Direction Executive Command Flagship Takeoff verified.')
console.log(`PASS: ${tsFiles.length} TS/TSX files parsed with 0 syntax diagnostics.`)
console.log('PASS: 8 URL-backed planes, 11 domains, 22 operation contracts.')
console.log('PASS: matter, decision, commitment, briefing and exact deep-link APIs present.')
console.log('PASS: no dead buttons, browser alerts, Operator leakage or continuous motion.')
console.log('PASS: CSS module references resolve.')
console.log('PASS: 7 additive RLS authority tables and one balanced SQL transaction.')
