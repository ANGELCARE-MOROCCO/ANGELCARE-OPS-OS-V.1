import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const sourceUrl = new URL('../lib/angelcare360/server/entitlements.ts', import.meta.url)
const source = await readFile(sourceUrl, 'utf8')

assert.match(source, /const \{ data: items, error: itemError \} = await supabase/, 'snapshot item authority must be queried independently')
assert.match(source, /if \(itemError\) return closedState\('unavailable'/, 'compiled snapshot item failure must remain fail-closed')
assert.match(source, /const auxiliaryAuthorityUnavailable = Boolean\(operationGateError \|\| provisioningError \|\| consumptionError\)/, 'auxiliary runtime authority degradation must be explicit')
assert.doesNotMatch(source, /if \(itemError \|\| operationGateError \|\| provisioningError \|\| consumptionError\) return closedState/, 'auxiliary authority failure must not erase canonical module rights')
assert.match(source, /state: auxiliaryAuthorityUnavailable \? 'partial' : 'active'/, 'auxiliary degradation must remain visible')
assert.match(source, /enabledModules: \[\.\.\.new Set\(modules\.enabled\)\]/, 'canonical compiled module rights must survive auxiliary degradation')
assert.match(source, /const enabledOperations = auxiliaryAuthorityUnavailable\s*\? \[\]/, 'sensitive operations must fail closed when auxiliary authority is unavailable')
assert.match(source, /consumptionError\s*\? 'unknown'/, 'meter state must become unknown when consumption authority is unavailable')
assert.match(source, /const provisioning = provisioningError\s*\? \[\]/, 'unavailable provisioning evidence must not be fabricated')
assert.match(source, /diagnosticCode: auxiliaryAuthorityUnavailable \? 'AUTHORITY_UNAVAILABLE' : null/, 'degraded authority must remain diagnosable')

console.log('CORE_SNAPSHOT_ITEMS_MANDATORY=PASS')
console.log('AUXILIARY_FAILURE_DOES_NOT_ERASE_MODULES=PASS')
console.log('AUXILIARY_OPERATION_FAIL_CLOSED=PASS')
console.log('METER_UNKNOWN_ON_AUTHORITY_FAILURE=PASS')
console.log('PROVISIONING_NOT_FABRICATED=PASS')
console.log('AUXILIARY_DIAGNOSTIC_PRESERVED=PASS')
