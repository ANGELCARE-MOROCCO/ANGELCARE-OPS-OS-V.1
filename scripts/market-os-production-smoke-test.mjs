const base = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
const endpoints = [
  '/api/market-os/core',
  '/api/market-os/campaign-lifecycle',
  '/api/market-os/production-state?table=market_os_content_runtime_state',
  '/api/market-os/ambassadors/operations',
  '/api/market-os/content-command-center/dashboard',
  '/api/market-os/seo-blog-workspace',
]
for (const path of endpoints) {
  const url = base + path
  try {
    const res = await fetch(url, { headers: { accept: 'application/json' } })
    const text = await res.text()
    console.log(path, res.status, text.slice(0, 240).replace(/\s+/g, ' '))
  } catch (error) {
    console.error(path, 'FAILED', error.message)
    process.exitCode = 1
  }
}
