const base = process.env.ANGELCARE_RUNTIME_BASE_URL || 'http://localhost:3000'
const routes = [
  '/angelcare-360-operator/tenants-product?view=deployments',
  '/angelcare-360-operator/growth?view=portfolio',
  '/angelcare-360-access/activate?token=invalid',
  '/angelcare-360-access/mfa',
]
let failed = false
for (const route of routes) {
  try {
    const response = await fetch(`${base}${route}`, { redirect: 'manual' })
    const body = await response.text()
    const fatal = /Unhandled Runtime Error|Hydration failed|React Server Components render error/i.test(body)
    if (response.status >= 500 || fatal) { failed = true; console.error(`FAIL  ${route} -> ${response.status}`) }
    else console.log(`PASS  ${route} -> ${response.status}`)
  } catch (error) { failed = true; console.error(`FAIL  ${route}: ${error instanceof Error ? error.message : error}`) }
}
if (failed) process.exit(1)
console.log('PASS  Tenant Identity runtime route smoke.')
