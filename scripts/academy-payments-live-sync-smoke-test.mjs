const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const endpoints = ['/academy/payments', '/academy/payments?view=payments', '/academy/payments?view=refunds', '/academy/payments?view=invoices']
for (const path of endpoints) {
  const res = await fetch(base + path)
  console.log(path, res.status, res.headers.get('content-type') || '')
}
