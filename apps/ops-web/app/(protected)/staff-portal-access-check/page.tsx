import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getCurrentUser } from '@/lib/getUser'
import { getAllowedAppRoutes, groupRoutesByModule } from '@/lib/auth/page-access'
import { STAFF_PORTAL_ROUTES } from '@/lib/staff-portal-os/phase5-routes'

export default async function StaffPortalAccessCheckPage() {
  const user = await getCurrentUser()
  const allowedRoutes = getAllowedAppRoutes(user)
  const groups = groupRoutesByModule(allowedRoutes)
  const allowedHrefs = new Set<string>(allowedRoutes.map((route) => route.href))

  return (
    <AppShell
      title="Staff Portal Access Check"
      subtitle="Permission-driven visibility diagnostics"
      breadcrumbs={[{ label: 'Staff Portal', href: '/staff-home' }, { label: 'Access Check' }]}
      actions={<PageAction href="/staff-portal-final-qa" variant="light">Final QA</PageAction>}
    >
      <section style={{ background: 'linear-gradient(135deg,#020617,#1e3a8a,#0f766e)', color: 'white', borderRadius: 30, padding: 28, boxShadow: '0 28px 80px rgba(2,6,23,.25)', marginBottom: 22 }}>
        <div style={{ color: '#93c5fd', textTransform: 'uppercase', fontWeight: 950, letterSpacing: 1.3, fontSize: 12 }}>Staff Portal OS Phase 6</div>
        <h1 style={{ margin: '8px 0', fontSize: 38 }}>Access Visibility Check</h1>
        <p style={{ color: '#dbeafe', fontWeight: 760, lineHeight: 1.6, margin: 0, maxWidth: 900 }}>
          See what the signed-in user can access based on user management permissions and page access logic.
        </p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Allowed routes', value: allowedRoutes.length, detail: 'From permission engine', tone: '#2563eb' },
          { label: 'Allowed modules', value: Object.keys(groups).length, detail: 'Grouped module access', tone: '#16a34a' },
          { label: 'Staff portal routes', value: STAFF_PORTAL_ROUTES.length, detail: 'Expected portal manifest', tone: '#7c3aed' },
          { label: 'Visible portal routes', value: STAFF_PORTAL_ROUTES.filter((route) => allowedHrefs.has(String(route.href))).length, detail: 'Directly visible by route', tone: '#ea580c' },
        ].map((metric) => (
          <div key={metric.label} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 24, padding: 18, boxShadow: '0 18px 55px rgba(15,23,42,.07)' }}>
            <div style={{ color: '#64748b', fontSize: 12, fontWeight: 950, textTransform: 'uppercase', letterSpacing: .8 }}>{metric.label}</div>
            <div style={{ color: metric.tone, fontSize: 34, fontWeight: 950, marginTop: 8 }}>{metric.value}</div>
            <div style={{ color: '#475569', fontWeight: 750 }}>{metric.detail}</div>
          </div>
        ))}
      </div>

      <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 26, padding: 18, boxShadow: '0 18px 55px rgba(15,23,42,.07)' }}>
        <h2 style={{ margin: 0, color: '#0f172a' }}>Staff Portal route visibility</h2>
        <p style={{ color: '#64748b', fontWeight: 750 }}>Use this to verify user management permissions after creating/editing users.</p>
        {STAFF_PORTAL_ROUTES.map((route) => {
          const visible = allowedHrefs.has(String(route.href)) || allowedHrefs.has('/staff-home')
          return (
            <div key={route.href} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto', gap: 12, borderBottom: '1px solid #f1f5f9', padding: '13px 0', alignItems: 'center' }}>
              <div>
                <strong style={{ color: '#0f172a' }}>{route.label}</strong>
                <div style={{ color: '#64748b', fontWeight: 720, marginTop: 4 }}>{route.href} · {route.permission}</div>
              </div>
              <span style={{ border: '1px solid #cbd5e1', borderRadius: 999, padding: '5px 9px', fontSize: 12, fontWeight: 950 }}>{visible ? 'visible' : 'not visible'}</span>
              <Link href={route.href} style={{ border: '1px solid #1d4ed8', background: '#2563eb', color: 'white', borderRadius: 999, padding: '7px 10px', textDecoration: 'none', fontSize: 12, fontWeight: 950 }}>Open</Link>
            </div>
          )
        })}
      </section>
    </AppShell>
  )
}
