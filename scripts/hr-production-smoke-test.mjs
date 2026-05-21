const base = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
const endpoints = [
  '/api/hr/health',
  '/api/hr/navigation?role=hr_admin',
  '/api/hr/sync/diagnose',
  '/api/hr/production-readiness',
]
for (const path of endpoints) {
  const url = `${base}${path}`
  try {
    const res = await fetch(url)
    const text = await res.text()
    console.log(path, res.status, text.slice(0, 500))
  } catch (error) {
    console.error(path, error.message)
    process.exitCode = 1
  }
}
