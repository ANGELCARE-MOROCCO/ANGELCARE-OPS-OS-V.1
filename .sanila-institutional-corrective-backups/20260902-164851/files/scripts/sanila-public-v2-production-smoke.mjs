const origin = process.env.SANILA_PRODUCTION_ORIGIN || 'https://my.angelcarehub.com'
const checks = [
  ['/', 'marketplace-root'],
  ['/angelcare-marketplace/fr', 'marketplace-fr'],
  ['/angelcare-marketplace/fr/sanila', 'sanila-root'],
  ['/angelcare-marketplace/fr/sanila/finance', 'sanila-finance'],
  ['/angelcare-marketplace/fr/sanila/admissions', 'sanila-admissions'],
  ['/angelcare-marketplace/fr/sanila/pedagogie', 'sanila-pedagogie'],
  ['/angelcare-marketplace/fr/sanila/transport', 'sanila-transport'],
  ['/angelcare-marketplace/fr/sanila/securite', 'sanila-security'],
  ['/angelcare-marketplace/fr/sanila/demonstration', 'sanila-demo'],
  ['/angelcare-marketplace/fr/sanila/connexion', 'sanila-access'],
]
let failed = false
for (const [route, label] of checks) {
  try {
    const response = await fetch(`${origin}${route}`, { redirect: 'follow' })
    const body = await response.text()
    const hasSanila = /SANILA/i.test(body)
    if (!response.ok) { console.error(`FAIL ${label} HTTP ${response.status}`); failed = true; continue }
    if ((label === 'marketplace-root' || label === 'marketplace-fr') && hasSanila && !/ANGELCARE Marketplace/i.test(body)) {
      console.error(`FAIL ${label} appears SANILA-owned`); failed = true; continue
    }
    if (label.startsWith('sanila-') && !hasSanila) { console.error(`FAIL ${label} missing SANILA marker`); failed = true; continue }
    console.log(`PASS ${label} ${response.status}`)
  } catch (error) { console.error(`FAIL ${label} ${error instanceof Error ? error.message : String(error)}`); failed = true }
}
if (failed) process.exit(1)
console.log('SANILA_PUBLIC_V2_PRODUCTION_SMOKE=PASS')
