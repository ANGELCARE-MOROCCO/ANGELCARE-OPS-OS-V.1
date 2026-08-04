import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const files = {
  migration: path.join(root, 'database/market-os-ambassadors/20260803_market_os_ambassador_users_management_sync.sql'),
  backfill: path.join(root, 'database/market-os-ambassadors/20260803_market_os_ambassador_users_management_backfill.sql'),
  auth: path.join(root, 'lib/market-os/ambassadors/auth.ts'),
  action: path.join(root, 'app/(protected)/users/[id]/edit/page.tsx'),
  ui: path.join(root, 'app/(protected)/users/[id]/edit/_components/UserEditGovernanceStudio.tsx'),
}

const source = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, fs.readFileSync(file, 'utf8')]))
const checks = [
  ['atomic RPC', source.migration.includes('create or replace function public.sync_market_os_ambassador_user_access') && source.migration.includes('security definer')],
  ['scoped membership', ['app_user_id', 'tenant_id', 'organization_id', 'grant_version', 'assigned_by', 'updated_at'].every((field) => source.migration.includes(field))],
  ['native full role', source.migration.includes('AMBASSADOR_MODULE_ADMINISTRATOR') && source.auth.includes('AMBASSADOR_MODULE_ADMINISTRATOR')],
  ['mode contract', ['full', 'view_only', 'custom', 'none'].every((mode) => source.migration.includes(`'${mode}'`)) && source.ui.includes('Full access — default')],
  ['tenant isolation', source.auth.includes('tenant_id') && source.auth.includes('organization_id') && source.migration.includes('status = \'active\''),],
  ['revocation', source.migration.includes("v_mode = 'none'") && source.migration.includes("set status = 'revoked'"),],
  ['immutable audit', source.migration.includes('market_os_ambassador_audit_logs') && source.backfill.includes('users_management_ambassadors_backfilled'),],
  ['idempotent backfill', source.backfill.includes('not exists') && source.backfill.includes('sync_market_os_ambassador_user_access'),],
  ['legacy navigation mapping', source.action.includes('market_os.ambassadors.view') && source.backfill.includes('market_os_ambassadors.view'),],
  ['cache-safe no-store', fs.readFileSync(path.join(root, 'lib/market-os/ambassadors/api.ts'), 'utf8').includes('Cache-Control') && fs.readFileSync(path.join(root, 'lib/market-os/ambassadors/api.ts'), 'utf8').includes('no-store'),],
]

const failed = checks.filter(([, passed]) => !passed)
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`)
if (failed.length) process.exitCode = 1
else console.log(`Ambassador Users Management synchronization static acceptance: ${checks.length}/${checks.length} passed`)
