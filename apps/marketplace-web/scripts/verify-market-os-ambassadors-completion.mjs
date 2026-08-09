import fs from 'fs'

const checks = [
  ['lib/market-os/ambassadors/server.ts', 'loadAmbassadorWorkspaceSnapshot'],
  ['lib/market-os/ambassadors/server.ts', 'createAmbassadorEntity'],
  ['lib/market-os/ambassadors/server.ts', 'assignAmbassadorTerritory'],
  ['lib/market-os/ambassadors/server.ts', 'generateAmbassadorReport'],
  ['lib/market-os/ambassadors/api.ts', 'listRoute'],
  ['lib/market-os/ambassadors/client.ts', 'fetch(apiUrl(path)'],
  ['app/api/market-os/ambassadors/route.ts', 'loadAmbassadorWorkspaceSnapshot'],
  ['app/api/market-os/ambassadors/reports/export/route.ts', 'generateAmbassadorReport'],
  ['database/20260709_market_os_ambassador_module_completion.sql', 'market_os_ambassadors'],
  ['database/20260709_market_os_ambassador_module_completion.sql', 'market_os_ambassador_audit_logs'],
  ['database/20260709_market_os_ambassador_module_completion.sql', 'Schema Compatibility Fix'],
  ['database/20260709_market_os_ambassador_module_completion.sql', 'gen_random_uuid'],
  ['database/20260709_market_os_ambassador_module_completion.sql', '00000000-0000-0000-0000-000000000001'],
  ['lib/market-os/ambassadors/server.ts', '00000000-0000-0000-0000-000000000001'],
  ['lib/market-os/ambassadors/server.ts', 'randomUUID'],
  ['app/(protected)/market-os/ambassadors/reports/page.tsx', 'mode="reports"'],
]

const forbidden = [
  ['lib/market-os/ambassadors/server.ts', 'ambassadors-server-compat'],
  ['lib/market-os/ambassadors/api.ts', 'ambassadors-api-compat'],
  ['lib/market-os/ambassadors/client.ts', 'ambassador-client-compat'],
  ['app/api/market-os/ambassadors/route.ts', 'ambassador-runtime-compat'],
  ['app/api/market-os/ambassadors/operations/route.ts', 'EMPTY_OPERATIONS'],
  ['database/20260709_market_os_ambassador_module_completion.sql', 'ambassador-settings-default'],
  ['lib/market-os/ambassadors/server.ts', 'ambassador-settings-default'],
]

let failed = false
for (const [file, needle] of checks) {
  const source = fs.readFileSync(file, 'utf8')
  if (!source.includes(needle)) {
    console.error(`FAIL missing ${needle} in ${file}`)
    failed = true
  } else {
    console.log(`OK ${file} contains ${needle}`)
  }
}
for (const [file, needle] of forbidden) {
  const source = fs.readFileSync(file, 'utf8')
  if (source.includes(needle)) {
    console.error(`FAIL forbidden compat marker ${needle} still present in ${file}`)
    failed = true
  } else {
    console.log(`OK ${file} removed ${needle}`)
  }
}

if (failed) process.exit(1)
console.log('Ambassador Market OS completion static verification passed.')
