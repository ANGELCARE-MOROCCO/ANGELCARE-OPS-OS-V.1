const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const res = await fetch(`${base}/api/academy/documents/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ documentType: 'payment_receipt', title: 'Smoke test receipt', amount: 1, payload: { smoke: true } })
})
console.log('/api/academy/documents/generate', res.status, (await res.text()).slice(0, 500))
