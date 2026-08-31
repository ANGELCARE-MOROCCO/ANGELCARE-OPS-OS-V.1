import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const runtimeSource = await readFile(path.join(root, 'lib/angelcare360/server/entitlements.ts'), 'utf8')
const gateSource = await readFile(path.join(root, 'lib/angelcare360/entitlements.ts'), 'utf8')

assert.match(runtimeSource, /SANILA_ALLOW_DEV_LEGACY_ENTITLEMENTS/)
assert.match(runtimeSource, /\['development', 'test'\]\.includes\(String\(process\.env\.NODE_ENV\)\)/)
assert.match(runtimeSource, /enforced: !legacyDemoAccessAllowed\(\)/)
assert.doesNotMatch(runtimeSource, /warning:\s*(?:tenant|subscription|snapshot|item)Error\.message/)
assert.match(runtimeSource, /\.eq\('subscription_id', String\(subscriptionRow\.id\)\)/)
assert.match(runtimeSource, /\.eq\('package_version_id', packageVersionId\)/)
assert.match(runtimeSource, /!\['trial', 'active', 'past_due'\]\.includes\(subscriptionStatus\)/)
assert.doesNotMatch(gateSource, /enabled\.length === 0 && restricted\.length === 0/)

console.log('SANILA entitlement fail-closed guard: PASS')
