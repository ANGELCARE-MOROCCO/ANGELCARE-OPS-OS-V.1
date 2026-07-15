import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { STAFF_PORTAL_ROUTES } from '@/lib/staff-portal-os/phase5-routes'

export default function StaffPortalRouteAuditPage() {
  const duplicateMap = new Map<string, number>()
  STAFF_PORTAL_ROUTES.forEach((route) => duplicateMap.set(route.href, (duplicateMap.get(route.href) || 0) + 1))
  const duplicates = Array.from(duplicateMap.entries()).filter((entry) => entry[1] > 1)

  return (
    <AppShell
      title="Staff Portal Route Audit"
      subtitle="Route manifest and permission mapping"
      breadcrumbs={[{ label: 'Staff Portal', href: '/staff-home' }, { label: 'Route Audit' }]}
      actions={<PageAction href="/staff-portal-navigation" variant="light">Navigation</PageAction>}
    >
      <section style={{ background: 'linear-gradient(135deg,#020617,#1e3a8a,#0f766e)', color: 'white', borderRadius: 30, padding: 28, boxShadow: '0 28px 80px rgba(2,6,23,.25)', marginBottom: 22 }}>
        <div style={{ color: '#93c5fd', textTransform: 'uppercase', fontWeight: 950, letterSpacing: 1.3, fontSize: 12 }}>Staff Portal OS Phase 5</div>
        <h1 style={{ margin: '8px 0', fontSize: 38 }}>Route Audit & Permissions Map</h1>
        <p style={{ color: '#dbeafe', fontWeight: 760, lineHeight: 1.6, margin: 0, maxWidth: 900 }}>
          Staff Portal route inventory mapped to permission keys for user management and deployment QA.
        </p>
      </section>

      <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 26, padding: 18, boxShadow: '0 18px 55px rgba(15,23,42,.07)' }}>
        <h2 style={{ margin: 0, color: '#0f172a' }}>Route manifest</h2>
        <p style={{ color: '#64748b', fontWeight: 750 }}>
          {STAFF_PORTAL_ROUTES.length} routes registered. Duplicates: {duplicates.length}.
        </p>
        {STAFF_PORTAL_ROUTES.map((route) => (
          <div key={route.href} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(180px,.3fr) minmax(180px,.3fr)', gap: 12, borderBottom: '1px solid #f1f5f9', padding: '13px 0', alignItems: 'center' }}>
            <div>
              <strong style={{ color: '#0f172a' }}>{route.label}</strong>
              <div style={{ color: '#64748b', fontWeight: 720, marginTop: 4 }}>{route.href}</div>
            </div>
            <span style={{ color: '#2563eb', fontWeight: 900 }}>{route.permission}</span>
            <span style={{ color: '#475569', fontWeight: 900 }}>{route.area} · {route.criticality}</span>
          </div>
        ))}
      </section>
    </AppShell>
  )
}
