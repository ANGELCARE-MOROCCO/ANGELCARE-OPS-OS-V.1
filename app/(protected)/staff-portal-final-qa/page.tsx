import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getStaffPortalFinalChecks } from '@/lib/staff-portal-os/phase6-final-qa'
import { STAFF_PORTAL_AREAS, STAFF_PORTAL_ROUTES } from '@/lib/staff-portal-os/phase5-routes'

function statusStyle(status: string): React.CSSProperties {
  if (status === 'ok') return { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }
  if (status === 'missing') return { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }
  return { background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }
}

export default function StaffPortalFinalQAPage() {
  const checks = getStaffPortalFinalChecks()
  const ok = checks.filter((check) => check.status === 'ok').length
  const review = checks.filter((check) => check.status === 'review').length
  const missing = checks.filter((check) => check.status === 'missing').length

  return (
    <AppShell
      title="Staff Portal Final QA"
      subtitle="Final production readiness check"
      breadcrumbs={[{ label: 'Staff Portal', href: '/staff-home' }, { label: 'Final QA' }]}
      actions={<PageAction href="/staff-portal-navigation" variant="light">Navigation</PageAction>}
    >
      <section style={{ background: 'linear-gradient(135deg,#020617,#1e3a8a,#0f766e)', color: 'white', borderRadius: 30, padding: 28, boxShadow: '0 28px 80px rgba(2,6,23,.25)', marginBottom: 22 }}>
        <div style={{ color: '#93c5fd', textTransform: 'uppercase', fontWeight: 950, letterSpacing: 1.3, fontSize: 12 }}>Staff Portal OS Phase 6</div>
        <h1 style={{ margin: '8px 0', fontSize: 38 }}>Final QA & Production Readiness</h1>
        <p style={{ color: '#dbeafe', fontWeight: 760, lineHeight: 1.6, margin: 0, maxWidth: 900 }}>
          Route manifest, permission mapping, staff services, memo broadcasts, manager variants and deployment QA in one final control surface.
        </p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Routes', value: STAFF_PORTAL_ROUTES.length, detail: 'Staff portal routes', tone: '#2563eb' },
          { label: 'Areas', value: STAFF_PORTAL_AREAS.length, detail: 'Operating zones', tone: '#16a34a' },
          { label: 'OK checks', value: ok, detail: 'Passing QA checks', tone: '#059669' },
          { label: 'Review/Missing', value: review + missing, detail: 'Needs attention', tone: review + missing ? '#dc2626' : '#059669' },
        ].map((metric) => (
          <div key={metric.label} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 24, padding: 18, boxShadow: '0 18px 55px rgba(15,23,42,.07)' }}>
            <div style={{ color: '#64748b', fontSize: 12, fontWeight: 950, textTransform: 'uppercase', letterSpacing: .8 }}>{metric.label}</div>
            <div style={{ color: metric.tone, fontSize: 34, fontWeight: 950, marginTop: 8 }}>{metric.value}</div>
            <div style={{ color: '#475569', fontWeight: 750 }}>{metric.detail}</div>
          </div>
        ))}
      </div>

      <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 26, padding: 18, boxShadow: '0 18px 55px rgba(15,23,42,.07)', marginBottom: 22 }}>
        <h2 style={{ margin: 0, color: '#0f172a' }}>Final QA checks</h2>
        <p style={{ color: '#64748b', fontWeight: 750 }}>All checks should be OK before pushing to production.</p>
        {checks.map((check) => (
          <div key={check.key} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, borderBottom: '1px solid #f1f5f9', padding: '13px 0', alignItems: 'center' }}>
            <div>
              <strong style={{ color: '#0f172a' }}>{check.label}</strong>
              <div style={{ color: '#64748b', fontWeight: 720, marginTop: 4 }}>{check.detail}</div>
            </div>
            <span style={{ ...statusStyle(check.status), borderRadius: 999, padding: '5px 9px', fontSize: 12, fontWeight: 950 }}>{check.status}</span>
          </div>
        ))}
      </section>

      <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 26, padding: 18, boxShadow: '0 18px 55px rgba(15,23,42,.07)' }}>
        <h2 style={{ margin: 0, color: '#0f172a' }}>Smoke-test routes</h2>
        <p style={{ color: '#64748b', fontWeight: 750 }}>Open these after deployment.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12 }}>
          {STAFF_PORTAL_ROUTES.map((route) => (
            <Link key={route.href} href={route.href} style={{ display: 'block', textDecoration: 'none', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 18, padding: 14, background: '#f8fafc', fontWeight: 900 }}>
              {route.label}
              <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{route.href}</div>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  )
}
