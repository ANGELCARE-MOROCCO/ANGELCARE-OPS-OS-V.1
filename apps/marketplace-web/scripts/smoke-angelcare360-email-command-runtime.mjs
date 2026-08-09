const base = String(process.env.ANGELCARE_SMOKE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const cookie = String(process.env.ANGELCARE_SMOKE_COOKIE || '')
if (!cookie) throw new Error('ANGELCARE_SMOKE_COOKIE is required for authenticated runtime smoke.')
const routes = [
  '/angelcare-360-operator/email-command?view=command',
  '/angelcare-360-operator/email-command?view=automation',
  '/angelcare-360-operator/email-command?view=outbound',
  '/angelcare-360-operator/email-command?view=inbound',
  '/angelcare-360-operator/email-command?view=conversations',
  '/angelcare-360-operator/email-command?view=templates',
  '/angelcare-360-operator/email-command?view=approvals',
  '/angelcare-360-operator/email-command?view=deliverability',
]
let failures = 0
for (const route of routes) {
  const response = await fetch(base + route, { headers: { cookie }, redirect: 'manual' })
  const text = await response.text()
  const ok = response.status === 200 && !/Internal Server Error|Application error|Module build failed/i.test(text)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${response.status} ${route}`)
  if (!ok) failures += 1
}
if (failures) process.exit(1)
console.log(`\n${routes.length} authenticated route smoke checks passed.`)
