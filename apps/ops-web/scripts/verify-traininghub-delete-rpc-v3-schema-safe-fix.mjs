import fs from 'node:fs'

const sql = 'database/traininghub_force_delete_partner_v3.sql'
const lib = 'lib/traininghub/production/partner-hard-delete-v2.ts'
const cli = 'scripts/traininghub-hard-delete-partner-v2.mjs'

const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
const sqlText = read(sql)
const libText = read(lib)
const cliText = read(cli)

const checks = [
  ['schema-safe RPC v3 SQL exists', fs.existsSync(sql)],
  ['RPC v3 uses to_jsonb instead of direct record fields', sqlText.includes('to_jsonb(o)') && sqlText.includes("v_org_json->>'name'")],
  ['RPC v3 does not reference v_org.legal_name', !sqlText.includes('v_org.legal_name') && !sqlText.includes('v_org.display_name')],
  ['RPC v3 has dynamic cleanup loops', sqlText.includes('information_schema.columns') && sqlText.includes('direct_org_column')],
  ['RPC v3 returns finalError when blocked', sqlText.includes('finalError')],
  ['hard delete lib uses RPC v3', libText.includes('traininghub_force_delete_partner_v3')],
  ['hard delete lib exposes rpcMsg in failure message', libText.includes('RPC v3 hard delete failed: ${rpcMsg}')],
  ['CLI uses RPC v3', !fs.existsSync(cli) || cliText.includes('traininghub_force_delete_partner_v3')],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub delete RPC v3 schema-safe verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub delete RPC v3 schema-safe verification PASSED.')
