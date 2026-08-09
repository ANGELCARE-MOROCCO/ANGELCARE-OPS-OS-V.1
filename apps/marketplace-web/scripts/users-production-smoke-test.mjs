const base = process.env.APP_URL || 'http://localhost:3000'
const endpoints = ['/api/users/health', '/users', '/users/new']
for (const endpoint of endpoints) {
  try {
    const res = await fetch(`${base}${endpoint}`, { redirect: 'manual' })
    const text = await res.text()
    console.log(endpoint, res.status, text.slice(0, 500).replace(/\s+/g, ' '))
  } catch (error) {
    console.log(endpoint, 'fetch failed', error?.message || error)
  }
}
