import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { STAFF_PORTAL_AREAS, STAFF_PORTAL_ROUTES } from '@/lib/staff-portal-os/phase5-routes'

function priorityStyle(priority: string): React.CSSProperties {
  if (priority === 'core') return { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }
  if (priority === 'high') return { background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd' }
  if (priority === 'medium') return { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' }
  return { background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1' }
}

export default function StaffPortalNavigationPage() {
  return (
    <AppShell
      title="Staff Portal Navigation"
      subtitle="Staff Portal OS route hub"
      breadcrumbs={[{ label: 'Staff Portal', href: '/staff-home' }, { label: 'Navigation' }]}
      actions={<PageAction href="/staff-portal-route-audit" variant="light">Route Audit</PageAction>}
    >
      <section style={{ background: 'linear-gradient(135deg,#020617,#1e3a8a,#0f766e)', color: 'white', borderRadius: 30, padding: 28, boxShadow: '0 28px 80px rgba(2,6,23,.25)', marginBottom: 22 }}>
        <div style={{ color: '#93c5fd', textTransform: 'uppercase', fontWeight: 950, letterSpacing: 1.3, fontSize: 12 }}>Staff Portal OS Phase 5</div>
        <h1 style={{ margin: '8px 0', fontSize: 38 }}>Staff Portal Navigation Hub</h1>
        <p style={{ color: '#dbeafe', fontWeight: 760, lineHeight: 1.6, margin: 0, maxWidth: 900 }}>
          A clean route hub for personalized staff landing, services, memos, manager command and portal intelligence.
        </p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Routes', value: STAFF_PORTAL_ROUTES.length, detail: 'Staff Portal route inventory', tone: '#2563eb' },
          { label: 'Areas', value: STAFF_PORTAL_AREAS.length, detail: 'Portal operating zones', tone: '#16a34a' },
          { label: 'Core', value: STAFF_PORTAL_ROUTES.filter((r) => r.criticality === 'core').length, detail: 'Mission critical routes', tone: '#7c3aed' },
          { label: 'Admin', value: STAFF_PORTAL_ROUTES.filter((r) => r.area === 'Admin' || r.area === 'Memos').length, detail: 'Admin/control surfaces', tone: '#dc2626' },
        ].map((metric) => (
          <div key={metric.label} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 24, padding: 18, boxShadow: '0 18px 55px rgba(15,23,42,.07)' }}>
            <div style={{ color: '#64748b', fontSize: 12, fontWeight: 950, textTransform: 'uppercase', letterSpacing: .8 }}>{metric.label}</div>
            <div style={{ color: metric.tone, fontSize: 34, fontWeight: 950, marginTop: 8 }}>{metric.value}</div>
            <div style={{ color: '#475569', fontWeight: 750 }}>{metric.detail}</div>
          </div>
        ))}
      </div>

      {STAFF_PORTAL_AREAS.map((area) => (
        <section key={area} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 26, padding: 18, boxShadow: '0 18px 55px rgba(15,23,42,.07)', marginBottom: 18 }}>
          <h2 style={{ margin: 0, color: '#0f172a' }}>{area}</h2>
          <p style={{ color: '#64748b', fontWeight: 750 }}>Staff Portal OS routes in this operating area.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
            {STAFF_PORTAL_ROUTES.filter((route) => route.area === area).map((route) => (
              <Link key={route.href} href={route.href} style={{ display: 'block', textDecoration: 'none', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 18, padding: 14, background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <strong>{route.label}</strong>
                  <span style={{ ...priorityStyle(route.criticality), borderRadius: 999, padding: '4px 8px', fontSize: 11, fontWeight: 950 }}>{route.criticality}</span>
                </div>
                <p style={{ color: '#64748b', fontWeight: 720, lineHeight: 1.45 }}>{route.description}</p>
                <div style={{ color: '#2563eb', fontWeight: 900, fontSize: 12 }}>{route.href}</div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </AppShell>
  )
}
