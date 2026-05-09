import AppShell from '@/app/components/erp/AppShell'

const routes = [
  '/ai-command-center',
  '/ai-command-center/hr-copilot',
  '/ai-command-center/revenue-copilot',
  '/ai-command-center/market-copilot',
  '/ai-command-center/academy-copilot',
  '/ai-command-center/executive-copilot',
]

export default function Page() {
  return (
    <AppShell title="AI Command QA" subtitle="Smoke-test routes">
      <div style={{ display: 'grid', gap: 12 }}>
        {routes.map((route) => (
          <a key={route} href={route} style={{ border: '1px solid #e2e8f0', borderRadius: 16, padding: 14, textDecoration: 'none', color: '#0f172a', background: 'white' }}>
            {route}
          </a>
        ))}
      </div>
    </AppShell>
  )
}
