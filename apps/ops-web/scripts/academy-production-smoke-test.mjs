const base = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'

const endpoints = [
  '/api/academy/v10/pulse?module=academy',
  '/api/academy/v10/records?module=academy',
]

for (const path of endpoints) {
  const res = await fetch(`${base}${path}`, {
    headers: { accept: 'application/json' },
  }).catch((error) => ({
    ok: false,
    status: 0,
    text: async () => error.message,
  }))

  const body = await res.text()
  console.log(path, res.status, body.slice(0, 260))
}
