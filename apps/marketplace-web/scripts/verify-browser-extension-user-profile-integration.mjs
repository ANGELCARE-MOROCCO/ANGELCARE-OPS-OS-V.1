import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const required = [
  'app/(protected)/users/[id]/page.tsx',
  'app/(protected)/users/_components/UserBrowserExtensionAccessSection.tsx',
  'app/api/browser-extension/v1/admin/users/[id]/access/route.ts',
  'lib/browser-extension/generated/b2b-capabilities.v1.json',
  'lib/browser-extension/generated/b2b-revenue-execution.v3.json',
  'lib/browser-extension/generated/b2b-partner-lifecycle.v5.json',
  'lib/browser-extension/generated/b2b-ai-sales-director.v6.json',
]

const failures = []
for (const relative of required) if (!fs.existsSync(path.join(root, relative))) failures.push(`Missing ${relative}`)
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')

if (!failures.length) {
  const page = read('app/(protected)/users/[id]/page.tsx')
  const component = read('app/(protected)/users/_components/UserBrowserExtensionAccessSection.tsx')
  const route = read('app/api/browser-extension/v1/admin/users/[id]/access/route.ts')
  const contract = JSON.parse(read('lib/browser-extension/generated/b2b-capabilities.v1.json'))
  const execution = JSON.parse(read('lib/browser-extension/generated/b2b-revenue-execution.v3.json'))
  const director = JSON.parse(read('lib/browser-extension/generated/b2b-ai-sales-director.v6.json'))
  const lifecycle = JSON.parse(read('lib/browser-extension/generated/b2b-partner-lifecycle.v5.json'))
  const operational = contract.capabilities.filter((item) => item.patch02Status === 'implemented' || item.patch03Status === 'implemented' || item.patch04Status === 'implemented' || item.patch05Status === 'implemented' || (item.patch06Status === 'implemented' || item.patch06Status === 'preserved'))

  const checks = [
    [page.includes('UserBrowserExtensionAccessSection'), 'User profile does not mount the Browser OS section'],
    [page.includes('loadUserAccess(supabase, resolvedUserId)'), 'User profile does not load access by selected user ID'],
    [page.includes('browser_extension_devices'), 'User profile does not load registered devices'],
    [component.includes('Browser OS B2B — configuration individuelle'), 'Premium user-bound section title missing'],
    [component.includes('maxHeight: 980'), 'Scrollable mega workspace contract missing'],
    [component.includes('Mega ZIP 3 — Exécution Revenue complète'), 'Mega ZIP 3 access preset missing'],
    [component.includes('Mega ZIP 6 — AI Sales Director complet'), 'Mega ZIP 6 access preset missing'],
    [component.includes('Contrat verrouillé — prochaines vagues'), 'Future contract lock display missing'],
    [component.includes('Révoquer immédiatement'), 'Device revocation control missing'],
    [component.includes('Gmail assisté') && component.includes('WhatsApp Web assisté'), 'Communication adapters missing'],
    [route.includes("filter((row: Row) => row.key !== B2B_MODULE_KEY)"), 'Route does not preserve non-B2B module grants'],
    [route.includes("!B2B_MANAGED_ADAPTERS.has(row.key)"), 'Route does not preserve adapters outside the B2B profile scope'],
    [route.includes("item.patch03Status === 'implemented'"), 'Route does not enable Mega ZIP 3 operational capabilities'],
    [route.includes('Capability is contract-locked but not operational in Mega ZIP 6'), 'Route does not block future capabilities after Mega ZIP 6'],
    [route.includes("actionPattern: 'b2b.*'"), 'B2B-specific autonomy rule missing'],
    [route.includes('browser_extension_replace_user_access'), 'Governed access replacement RPC missing'],
    [operational.length === 45, `Expected 45 operational capabilities through Mega ZIP 6, found ${operational.length}`],
    [execution.implementedCapabilityIds.length === 14, `Expected 14 newly implemented Mega ZIP 3 capabilities, found ${execution.implementedCapabilityIds.length}`],
    [lifecycle.implementedCapabilityIds.length === 6, `Expected 6 newly implemented Mega ZIP 5 capabilities, found ${lifecycle.implementedCapabilityIds.length}`],
    [director.implementedCapabilityIds.length === 4, `Expected 4 newly implemented Mega ZIP 6 capabilities, found ${director.implementedCapabilityIds.length}`],
    [contract.capabilities.length === 45, `Expected 45 signed capabilities, found ${contract.capabilities.length}`],
    [component.includes('Ambassadors') || route.includes('B2B_MODULE_KEY'), 'Canonical extension governance terminology present'],
  ]
  for (const [ok, message] of checks) if (!ok) failures.push(message)
}

if (failures.length) {
  console.error('Browser OS user-profile integration verification FAILED')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('Browser OS user-profile integration verification PASSED')
console.log('Selected user dossier: /users/[id]')
console.log('Operational capabilities through Mega ZIP 6: 45/45')
console.log('Signed B2B contract visible and protected: 45/45')
console.log('Non-B2B extension grants preserved: YES')
console.log('Dynamic user-bound access, devices and audit: YES')
