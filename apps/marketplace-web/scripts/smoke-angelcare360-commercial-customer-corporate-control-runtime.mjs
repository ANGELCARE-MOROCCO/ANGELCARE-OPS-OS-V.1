const base = process.env.ANGELCARE_BASE_URL || 'http://localhost:3000'
const routes = [
  '/angelcare-360-operator/growth?view=command',
  '/angelcare-360-operator/growth?view=portfolio',
  '/angelcare-360-operator/growth?view=health',
  '/angelcare-360-operator/growth?view=performance',
]
let failed = false
for (const route of routes) {
  try {
    const response = await fetch(base + route, { redirect: 'manual' })
    const body = await response.text()
    const bad = /Unhandled Runtime Error|Hydration failed|React Server Components render|Internal Server Error/i.test(body)
    console.log(`${response.status < 500 && !bad ? 'PASS' : 'FAIL'} ${route} -> ${response.status}`)
    if (response.status >= 500 || bad) failed = true
  } catch (error) {
    console.log(`FAIL ${route}: ${error instanceof Error ? error.message : String(error)}`)
    failed = true
  }
}
if (failed) process.exit(1)
console.log('PASS corporate-control route smoke')
