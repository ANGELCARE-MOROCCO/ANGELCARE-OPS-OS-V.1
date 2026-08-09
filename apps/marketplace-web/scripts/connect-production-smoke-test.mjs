const baseUrl = process.env.CONNECT_SMOKE_BASE_URL || 'http://localhost:3000'
const cookie = process.env.CONNECT_SMOKE_COOKIE || ''
const bearer = process.env.CONNECT_SMOKE_BEARER || ''

const routes = [
  '/api/connect/me',
  '/api/connect/staff',
  '/api/connect/conversations',
  '/api/connect/rooms',
  '/api/connect/notifications',
  '/api/connect/actions',
  '/api/connect/calls',
]

function headers() {
  const h = { accept: 'application/json' }
  if (cookie) h.cookie = cookie
  if (bearer) h.authorization = `Bearer ${bearer}`
  return h
}

async function smokeRoute(route) {
  const url = `${baseUrl}${route}`
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      headers: headers(),
    })
    const text = await res.text()
    const compact = text.slice(0, 500).replace(/\s+/g, ' ')
    const authNote = res.status === 401 ? 'AUTH_REQUIRED' : res.ok ? 'OK' : 'CHECK'
    console.log(`${route} ${res.status} ${authNote} ${compact}`)
    return { route, status: res.status, ok: res.ok, text }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.log(`${route} NETWORK_ERROR ${message}`)
    return { route, status: 0, ok: false, error: message }
  }
}

async function main() {
  console.log('AngelCare Connect production smoke test')
  console.log(`Base URL: ${baseUrl}`)
  console.log(cookie || bearer ? 'Auth: provided through env' : 'Auth: none provided; 401 is expected for protected routes')

  const results = []
  for (const route of routes) results.push(await smokeRoute(route))

  const unauthorized = results.filter((r) => r.status === 401).length
  const networkErrors = results.filter((r) => r.status === 0).length
  const serverErrors = results.filter((r) => r.status >= 500).length

  console.log('Summary:', JSON.stringify({ total: results.length, unauthorized, networkErrors, serverErrors }, null, 2))

  if (networkErrors || serverErrors) process.exit(1)
  if (unauthorized) {
    console.log('Protected routes are working, but this Node test did not include your logged-in browser session. Re-run with CONNECT_SMOKE_COOKIE or use the browser-console smoke test in docs/connect/ANGELCARE_CONNECT_SMOKE_TEST.md.')
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
