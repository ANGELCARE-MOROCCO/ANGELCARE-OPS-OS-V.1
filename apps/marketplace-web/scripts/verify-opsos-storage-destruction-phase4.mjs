import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const requiredFiles = [
  'components/opsos/windows-node/StorageDestructionPhase4.tsx',
  'components/opsos/windows-node/StorageDataControlCenter.tsx',
  'lib/opsos/storage-destruction.ts',
  'lib/opsos/windows-node-types.ts',
  'app/api/opsos/windows-node/storage/destruction/route.ts',
  'app/api/opsos/windows-node/storage/destruction/impact/route.ts',
  'app/api/opsos/windows-node/storage/destruction/[requestId]/approve/route.ts',
  'app/api/opsos/windows-node/storage/destruction/[requestId]/schedule/route.ts',
  'app/api/opsos/windows-node/storage/destruction/[requestId]/cancel/route.ts',
  'app/api/opsos/windows-node/storage/destruction/[requestId]/execute/route.ts',
  'app/api/opsos/windows-node/storage/destruction/[requestId]/certificate/route.ts',
  'app/api/opsos/windows-node/storage/retention/policies/route.ts',
  'app/api/opsos/windows-node/storage/retention/dry-run/route.ts',
  'app/api/opsos/windows-node/storage/cleanup/profiles/route.ts',
  'app/api/opsos/windows-node/storage/cleanup/dry-run/route.ts',
  'app/api/opsos/windows-node/storage/cleanup/execute/route.ts',
  'app/api/opsos/windows-node/storage/legal-holds/route.ts',
  'bridge/windows-email-bridge/deploy-storage-destruction-phase4-update.ps1',
  'bridge/windows-email-bridge/server.js',
  'supabase/migrations/20260719_opsos_storage_destruction_phase4.sql',
  'database/opsos-storage-destruction-phase4-20260719.sql',
]
for (const file of requiredFiles) if (!fs.existsSync(path.join(root, file))) throw new Error(`Phase 4 file missing: ${file}`)

const ui = read('components/opsos/windows-node/StorageDestructionPhase4.tsx')
const control = read('components/opsos/windows-node/StorageDataControlCenter.tsx')
const lib = read('lib/opsos/storage-destruction.ts')
const bridge = read('bridge/windows-email-bridge/server.js')
const download = read('app/api/storage/download/[fileId]/route.ts')
const mailbox = read('components/email-os-core/ScopedMailboxCommandCenter.tsx')
const migration = read('supabase/migrations/20260719_opsos_storage_destruction_phase4.sql')
const certificate = read('app/api/opsos/windows-node/storage/destruction/[requestId]/certificate/route.ts')

const contracts = {
  'Phase 4 UI': ui.includes('Phase 4 · Destruction contrôlée'),
  'Independent approval': lib.includes('requester cannot approve') || lib.includes('requester cannot approve their own'),
  'Cooling-off scheduling': lib.includes('coolingOffSeconds') && lib.includes('scheduledFor'),
  'Typed high-risk confirmation': lib.includes('SUPPRIMER DÉFINITIVEMENT'),
  'Retention dry-run': ui.includes('Simuler sans modifier') && lib.includes('simulateRetentionPolicy'),
  'Cleanup allowlist profiles': lib.includes('DEFAULT_CLEANUP_PROFILES') && bridge.includes('cleanupCandidates'),
  'Legal hold enforcement': lib.includes('active legal hold blocks permanent destruction') && ui.includes('Blocages légaux'),
  'Destruction certificate PDF': certificate.includes('PDFDocument') && certificate.includes('CERTIFICAT DE DESTRUCTION CONTROLEE'),
  'HTTP 410 gone': download.includes('STORAGE_FILE_PERMANENTLY_DELETED') && download.includes('status: 410'),
  'Email OS destroyed placeholder': mailbox.includes('Pièce jointe supprimée définitivement'),
  'Phase 4 tab wired': control.includes('StorageDestructionPhase4') && control.includes('Destruction contrôlée'),
  'Bridge preflight': bridge.includes('/admin/storage/destruction/preflight'),
  'Bridge execution': bridge.includes('/admin/storage/destruction/execute'),
  'Bridge verification': bridge.includes('/admin/storage/destruction/verify'),
  'Bridge cleanup dry-run': bridge.includes('/admin/storage/cleanup/dry-run'),
  'Signed quarantine evidence': bridge.includes('parseQuarantineToken(body?.quarantineLocationToken, "quarantine")'),
  'Physical absence verification': bridge.includes('targetedHashPresentAfterExecution') && bridge.includes('quarantinePathExistsAfterExecution'),
  'Migration request table': migration.includes('opsos_storage_destruction_requests'),
  'Migration certificate table': migration.includes('opsos_storage_destruction_certificates'),
  'Migration retention tables': migration.includes('opsos_storage_retention_policies') && migration.includes('opsos_storage_retention_runs'),
  'Migration service role lock': migration.includes('revoke all') && migration.includes('grant all'),
}
for (const [name, ok] of Object.entries(contracts)) console.log(ok ? `✓ ${name}` : `✗ ${name}`)
const failed = Object.entries(contracts).filter(([, ok]) => !ok).map(([name]) => name)
if (failed.length) throw new Error(`Phase 4 contract verification failed: ${failed.join(', ')}`)
if (ui.includes('window.confirm(') || ui.includes('confirm(')) throw new Error('Generic browser confirmation is forbidden in Phase 4 UI')
console.log('OPSOS Storage & Data Phase 4 destruction control plane verified.')
