import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
let ts
try { ts = require('typescript') } catch { ts = require('/usr/local/lib/node_modules/typescript') }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const required = [
  'lib/whatsapp-desktop/control-plane.ts',
  'lib/whatsapp-desktop/control-plane-server.ts',
  'lib/whatsapp-desktop/types.ts',
  'components/whatsapp-os/WhatsAppGovernanceControlPlane.tsx',
  'components/whatsapp-os/WhatsAppDesktopAdmin.tsx',
  'components/whatsapp-os/CorporateStationAdmin.tsx',
  'app/api/whatsapp-desktop/control-plane/overview/route.ts',
  'app/api/whatsapp-desktop/devices/[id]/desired-state/route.ts',
  'app/api/whatsapp-desktop/devices/[id]/synchronize/route.ts',
  'app/api/whatsapp-desktop/devices/[id]/diagnostics/route.ts',
  'app/api/whatsapp-desktop/commands/[id]/retry/route.ts',
  'app/api/whatsapp-desktop/commands/[id]/cancel/route.ts',
  'app/api/whatsapp-desktop/alerts/[id]/acknowledge/route.ts',
  'app/api/whatsapp-desktop/alerts/[id]/resolve/route.ts',
  'supabase/migrations/20260725_whatsapp_desktop_backoffice_control_plane_mega_zip14.sql',
]
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8')
const assert = (condition, message) => { if (!condition) throw new Error(message) }
for (const rel of required) assert(fs.existsSync(path.join(root, rel)), `MISSING:${rel}`)

const adminPage = read('app/(protected)/whatsapp-os/admin/page.tsx')
assert(adminPage.includes('WhatsAppDesktopAdmin'), 'EXISTING_ADMIN_ROUTE_NOT_PRESERVED')
const admin = read('components/whatsapp-os/WhatsAppDesktopAdmin.tsx')
for (const marker of ['MZ14', 'WhatsAppGovernanceControlPlane', 'Vue exécutive', 'Commandes distantes', 'Sécurité']) assert(admin.includes(marker), `ADMIN_MARKER_MISSING:${marker}`)
assert(!admin.includes('JSON.stringify(row.new_state'), 'RAW_JSON_AUDIT_OUTPUT_REINTRODUCED')
const ui = read('components/whatsapp-os/WhatsAppGovernanceControlPlane.tsx')
for (const marker of ['État désiré', 'État signalé', 'Synchroniser maintenant', 'Demander un diagnostic', 'Chronologie des commandes', 'Prendre en charge', 'Clôturer avec preuve', 'Desktop 1.7.2 gelé']) assert(ui.includes(marker), `UI_MARKER_MISSING:${marker}`)
assert(!/\bWindows,/.test(ui), 'INVALID_LUCIDE_WINDOWS_EXPORT_REINTRODUCED')
const release = read('lib/desktop/release.ts')
assert(release.includes('version: "1.7.2"'), 'DESKTOP_RELEASE_NOT_FROZEN_AT_1_7_2')

const typesSource = read('lib/whatsapp-desktop/types.ts')
assert(typesSource.includes('last_ip?: string | null'), 'DEVICE_LAST_IP_TYPE_MISSING')
const serverSource = read('lib/whatsapp-desktop/control-plane-server.ts')
for (const marker of ['const deviceRows: Row[]', 'const allCommands: Row[]', 'asArray<Row>(overview.devices)']) assert(serverSource.includes(marker), `SERVER_ROW_TYPING_MISSING:${marker}`)
const sql = read('supabase/migrations/20260725_whatsapp_desktop_backoffice_control_plane_mega_zip14.sql')
for (const marker of ['whatsapp_desktop_device_governance_state', 'whatsapp_desktop_sync_runs', 'whatsapp_desktop_governance_alerts', 'correlation_id', 'acknowledgement_deadline', 'ac_plus_enabled', 'split_enabled']) assert(sql.includes(marker), `SQL_MARKER_MISSING:${marker}`)
assert(!/message_content|whatsapp_messages|cookie_value|session_cookie/i.test(sql), 'FORBIDDEN_WHATSAPP_CONTENT_STORAGE')
for (const marker of ['deadlock_detected', 'lock_not_available', 'pg_sleep', 'MZ14_R2_SUPABASE_MIGRATION_APPLIED']) assert(sql.includes(marker), `R2_SQL_HARDENING_MISSING:${marker}`)
assert(!/^\s*begin\s*;/i.test(sql), 'MONOLITHIC_SQL_TRANSACTION_REINTRODUCED')

const tsFiles = []
function walk(dir) { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const full = path.join(dir, entry.name); if (entry.isDirectory()) walk(full); else if (/\.(ts|tsx)$/.test(full) && (full.includes('/whatsapp-desktop/') || full.includes('/components/whatsapp-os/CorporateStationAdmin') || full.includes('/components/whatsapp-os/WhatsApp'))) tsFiles.push(full) } }
walk(path.join(root, 'app/api'))
walk(path.join(root, 'lib/whatsapp-desktop'))
walk(path.join(root, 'components/whatsapp-os'))
let errors = 0
for (const file of tsFiles) {
  const result = ts.transpileModule(fs.readFileSync(file, 'utf8'), { fileName: file, reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.Preserve, isolatedModules: true } })
  for (const diagnostic of result.diagnostics || []) if (diagnostic.category === ts.DiagnosticCategory.Error) { errors += 1; console.error(`${file}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`) }
}
assert(errors === 0, `TYPESCRIPT_ISOLATED_ERRORS:${errors}`)

const pure = ts.transpileModule(read('lib/whatsapp-desktop/control-plane.ts'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText
const module = { exports: {} }
vm.runInNewContext(`(function(module,exports,require){${pure}\n})(module,module.exports,require)`, { module, require, Date, Set, Object, Array, Number, String, Math, console })
const { evaluateDeviceSynchronization } = module.exports
const now = new Date().toISOString()
const base = { device: { id: 'd1', device_name: 'POSTE-1', approval_status: 'approved', desktop_version: '1.7.2', last_heartbeat_at: now, reported_state: { station_mode: 'standard', policy_version: 3, whatsapp_visible: false, tab_count: 2, browser_health: 'healthy', authorization_state: 'authorized', desktop_version: '1.7.2' } }, desiredState: { desired_mode: 'standard', desired_policy_version: 3, desired_whatsapp_enabled: true, desired_ac_plus_enabled: true, desired_split_enabled: true, desired_maximum_tabs: 8 }, workspaceAccess: [{ status: 'approved' }], assignments: [{ status: 'active' }], pendingCommands: [] }
const good = evaluateDeviceSynchronization(base)
assert(good.status === 'synchronized' && good.score === 100, 'SYNC_BEHAVIOR_FAILED')
const drift = evaluateDeviceSynchronization({ ...base, desiredState: { ...base.desiredState, desired_mode: 'locked' } })
assert(drift.status === 'drift' && drift.recommended_actions.includes('APPLY_STATION_MODE'), 'MODE_DRIFT_BEHAVIOR_FAILED')
const blocked = evaluateDeviceSynchronization({ ...base, device: { ...base.device, approval_status: 'suspended' } })
assert(blocked.status === 'blocked', 'BLOCKER_BEHAVIOR_FAILED')

console.log(`MZ14 TypeScript isolated syntax: ${tsFiles.length} files, 0 errors`)
console.log('MZ14 desired/reported synchronization behavior verified.')
console.log('MZ14 exact route /whatsapp-os/admin preserved; Desktop 1.7.2 frozen.')
console.log('MZ14_WHATSAPP_ADMIN_GOVERNANCE_CONTROL_PLANE_VERIFIED')
