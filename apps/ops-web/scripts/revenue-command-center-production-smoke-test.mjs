const base = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
const endpoints = [
  '/api/revenue-command-center/prospects',
  '/api/revenue-command-center/tasks',
  '/api/revenue-command-center/appointments',
  '/api/revenue-command-center/partnerships',
  '/api/revenue-command-center/b2c',
  '/api/revenue-command-center/analytics',
  '/api/revenue-command-center/activity',
  '/api/revenue-command-center/sidebar',
]

for (const endpoint of endpoints) {
  const url = new URL(endpoint, base)
  const res = await fetch(url)
  const text = await res.text()
  console.log(endpoint, res.status, text.slice(0, 240).replace(/\s+/g, ' '))
  if (!res.ok) process.exitCode = 1
}
