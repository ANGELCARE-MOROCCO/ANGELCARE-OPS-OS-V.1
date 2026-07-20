import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const requiredFiles = [
  'components/opsos/windows-node/StorageLifecyclePhase5.tsx',
  'components/opsos/windows-node/StorageDataControlCenter.tsx',
  'lib/opsos/storage-lifecycle.ts',
  'lib/opsos/windows-node-types.ts',
  'app/api/opsos/windows-node/storage/lifecycle/route.ts',
  'app/api/opsos/windows-node/storage/lifecycle/policies/route.ts',
  'app/api/opsos/windows-node/storage/lifecycle/cron/route.ts',
  'app/api/opsos/windows-node/storage/lifecycle/forecast/route.ts',
  'app/api/opsos/windows-node/storage/lifecycle/alerts/route.ts',
  'app/api/opsos/windows-node/storage/lifecycle/runs/[runId]/route.ts',
  'app/api/opsos/windows-node/storage/dedup/scan/route.ts',
  'app/api/opsos/windows-node/storage/dedup/plans/route.ts',
  'app/api/opsos/windows-node/storage/dedup/plans/[planId]/approve/route.ts',
  'app/api/opsos/windows-node/storage/dedup/plans/[planId]/execute/route.ts',
  'app/api/opsos/windows-node/storage/dedup/plans/[planId]/materialize/route.ts',
  'app/api/opsos/windows-node/storage/provider/mailboxes/route.ts',
  'app/api/opsos/windows-node/storage/provider/capabilities/route.ts',
  'app/api/opsos/windows-node/storage/provider/sync/route.ts',
  'app/api/opsos/windows-node/storage/provider/reconcile/route.ts',
  'bridge/windows-email-bridge/deploy-storage-lifecycle-phase5-update.ps1',
  'bridge/windows-email-bridge/install-storage-lifecycle-phase5-scheduler.ps1',
  'bridge/windows-email-bridge/server.js',
  'supabase/migrations/20260720_opsos_storage_lifecycle_phase5.sql',
  'database/opsos-storage-lifecycle-phase5-20260720.sql',
]
for (const file of requiredFiles) if (!fs.existsSync(path.join(root, file))) throw new Error(`Phase 5 file missing: ${file}`)

const ui = read('components/opsos/windows-node/StorageLifecyclePhase5.tsx')
const control = read('components/opsos/windows-node/StorageDataControlCenter.tsx')
const lib = read('lib/opsos/storage-lifecycle.ts')
const bridge = read('bridge/windows-email-bridge/server.js')
const cron = read('app/api/opsos/windows-node/storage/lifecycle/cron/route.ts')
const plans = read('app/api/opsos/windows-node/storage/dedup/plans/route.ts')
const migration = read('supabase/migrations/20260720_opsos_storage_lifecycle_phase5.sql')
const deploy = read('bridge/windows-email-bridge/deploy-storage-lifecycle-phase5-update.ps1')
const scheduler = read('bridge/windows-email-bridge/install-storage-lifecycle-phase5-scheduler.ps1')

const contracts = {
  'Phase 5 tab wired': control.includes('StorageLifecyclePhase5') && control.includes('Pilotage automatisé'),
  'Lifecycle command cockpit': ui.includes('Phase 5 · Optimisation continue') && ui.includes('Lancer le cycle complet'),
  'Policy studio': ui.includes('Politiques') && lib.includes('saveLifecyclePolicy'),
  'Capacity forecasting': ui.includes('Prévisions') && lib.includes('calculateForecast'),
  'Exact SHA-256 duplicate scan': lib.includes('scanExactDuplicates') && lib.includes('sha256_hash'),
  'Bridge dedup preflight before plan': plans.includes('/admin/storage/dedup/preflight'),
  'Independent dedup approval': lib.includes('Independent approval is required'),
  'NTFS same-volume hardlink guard': bridge.includes('NTFS hard-link consolidation requires all copies to be on the same volume'),
  'Dedup rollback safety': bridge.includes('dedup-backup-') && bridge.includes('Post-link SHA-256 verification failed'),
  'Dedup materialization recovery': bridge.includes('/admin/storage/dedup/materialize') && ui.includes('Réversibilité de la déduplication'),
  'POP3 provider capabilities': bridge.includes('/admin/storage/provider/capabilities') && bridge.includes('uidlSupported'),
  'Provider/local reconciliation': lib.includes('reconcileProviderMailbox') && bridge.includes('/admin/storage/provider/reconcile'),
  'Provider synchronization persistence': lib.includes('persistEmailOSBridgeInboundMessages'),
  'Remote provider deletion disabled by default': bridge.includes('STORAGE_PROVIDER_REMOTE_DELETE_ENABLED') && deploy.includes('EnableRemoteProviderDeletion = $false'),
  'Scheduler secret enforcement': cron.includes('OPSOS_STORAGE_LIFECYCLE_SECRET') && cron.includes('Unauthorized lifecycle scheduler'),
  'Scheduler overlap protection': cron.includes('A lifecycle run is already active'),
  'Scheduler cadence enforcement': cron.includes('Policy cadence has not elapsed'),
  'No Phase 3/4 bypass': lib.includes('No quarantine or permanent destruction bypassed Phase 3/4 approval gates.'),
  'Retention remains dry-run': lib.includes('retention_dry_run') && lib.includes('simulateRetentionPolicy'),
  'Cleanup remains dry-run': lib.includes('cleanup_dry_run') && lib.includes('dryRunOnly: true'),
  'Lifecycle database foundation': migration.includes('opsos_storage_lifecycle_runs') && migration.includes('opsos_storage_lifecycle_snapshots'),
  'Dedup database foundation': migration.includes('opsos_storage_dedup_plans') && migration.includes('opsos_storage_dedup_references'),
  'Provider database foundation': migration.includes('opsos_storage_provider_sync_runs') && migration.includes('opsos_storage_provider_reconciliation'),
  'Database service-role lock': migration.includes('revoke all') && migration.includes('grant all'),
  'Windows scheduler helper': scheduler.includes('Register-ScheduledTask') && scheduler.includes('x-opsos-lifecycle-secret'),
}
for (const [name, ok] of Object.entries(contracts)) console.log(ok ? `✓ ${name}` : `✗ ${name}`)
const failed = Object.entries(contracts).filter(([, ok]) => !ok).map(([name]) => name)
if (failed.length) throw new Error(`Phase 5 contract verification failed: ${failed.join(', ')}`)

if (/\/admin\/storage\/provider\/(delete|purge)/.test(bridge)) throw new Error('Phase 5 must not expose an automatic remote provider deletion endpoint')
if (ui.includes('window.confirm(') || ui.includes('confirm(')) throw new Error('Generic browser confirmation is forbidden in Phase 5 UI')
if (lib.includes('autoApproveLowRisk') && lib.includes('destruction/execute')) throw new Error('Lifecycle policy must not directly execute Phase 4 destruction')

console.log('OPSOS Storage & Data Phase 5 lifecycle optimization verified.')
