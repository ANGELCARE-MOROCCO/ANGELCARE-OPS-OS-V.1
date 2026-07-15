import Link from 'next/link'
import { HR_PHASE6_ROUTE_GROUPS, HR_PHASE6_ALL_ROUTES } from '@/lib/hr-unified/max-phase6-routes'

function priorityStyle(priority: string): React.CSSProperties {
  if (priority === 'core') return { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }
  if (priority === 'high') return { background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd' }
  if (priority === 'medium') return { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' }
  return { background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }
}

export function HRPhase6TopNav() {
  const topRoutes = [
    { label: 'Dashboard', href: '/hr' },
    { label: 'Navigation', href: '/hr/navigation' },
    { label: 'Control Room', href: '/hr/control-room' },
    { label: 'Recruitment', href: '/hr/recruitment' },
    { label: 'Staff', href: '/hr/staff' },
    { label: 'Tasks', href: '/hr/tasks' },
    { label: 'Health', href: '/hr/system-health' },
  ]

  return (
    <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '0 0 18px' }}>
      {topRoutes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          style={{
            textDecoration: 'none',
            color: '#0f172a',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 999,
            padding: '9px 12px',
            fontWeight: 900,
            boxShadow: '0 8px 22px rgba(15,23,42,.06)',
          }}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  )
}

export function HRPhase6NavigationBoard() {
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {HR_PHASE6_ROUTE_GROUPS.map((group) => (
        <section
          key={group.title}
          style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 26,
            padding: 20,
            boxShadow: '0 18px 55px rgba(15,23,42,.07)',
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: '#2563eb', fontWeight: 950, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>
              HR Navigation Group
            </div>
            <h2 style={{ margin: '4px 0', color: '#0f172a', fontSize: 24 }}>{group.title}</h2>
            <p style={{ margin: 0, color: '#64748b', fontWeight: 700 }}>{group.description}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
            {group.routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  color: '#0f172a',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 18,
                  padding: 15,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'start' }}>
                  <strong style={{ fontSize: 16 }}>{route.label}</strong>
                  <span style={{ ...priorityStyle(route.priority), borderRadius: 999, padding: '4px 8px', fontSize: 11, fontWeight: 950 }}>
                    {route.priority}
                  </span>
                </div>
                <p style={{ margin: '8px 0 0', color: '#64748b', fontWeight: 700, lineHeight: 1.45 }}>{route.description}</p>
                <div style={{ marginTop: 10, color: '#2563eb', fontWeight: 900, fontSize: 12 }}>{route.href}</div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export function HRPhase6RouteStats() {
  const total = HR_PHASE6_ALL_ROUTES.length
  const core = HR_PHASE6_ALL_ROUTES.filter((route) => route.priority === 'core').length
  const high = HR_PHASE6_ALL_ROUTES.filter((route) => route.priority === 'high').length
  const groups = HR_PHASE6_ROUTE_GROUPS.length

  const cards = [
    { label: 'Total HR routes', value: total, detail: 'Integrated in route map', tone: '#2563eb' },
    { label: 'Core routes', value: core, detail: 'Critical workspaces', tone: '#059669' },
    { label: 'High routes', value: high, detail: 'Important controls', tone: '#7c3aed' },
    { label: 'Route groups', value: groups, detail: 'Navigation sections', tone: '#ea580c' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14 }}>
      {cards.map((card) => (
        <div key={card.label} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 22, padding: 18, boxShadow: '0 14px 45px rgba(15,23,42,.07)' }}>
          <div style={{ color: '#64748b', fontSize: 12, fontWeight: 950, textTransform: 'uppercase', letterSpacing: 0.8 }}>{card.label}</div>
          <div style={{ color: card.tone, fontSize: 32, fontWeight: 950, marginTop: 8 }}>{card.value}</div>
          <div style={{ color: '#475569', fontWeight: 700, marginTop: 6 }}>{card.detail}</div>
        </div>
      ))}
    </div>
  )
}
