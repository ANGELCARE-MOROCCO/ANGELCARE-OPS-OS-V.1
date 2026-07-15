import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getCurrentUser } from '@/lib/getUser'
import { getStaffPortalPhase1Data } from '@/lib/staff-portal-os/phase1-data'
import { getStaffPortalPersona } from '@/lib/staff-portal-os/phase3-personalization'

export default async function StaffPortalIntelligencePage() {
  const user = await getCurrentUser()
  const data = await getStaffPortalPhase1Data(user)
  const persona = getStaffPortalPersona(user, data)

  return (
    <AppShell
      title="Staff Portal Intelligence"
      subtitle="Department and position personalization overview"
      breadcrumbs={[{ label: 'Staff Portal', href: '/staff-home' }, { label: 'Intelligence' }]}
      actions={<PageAction href="/staff-home" variant="light">Back to portal</PageAction>}
    >
      <section style={{ background: `linear-gradient(135deg,${persona.theme.primary},${persona.theme.secondary})`, color: 'white', borderRadius: 30, padding: 28, boxShadow: `0 28px 80px ${persona.theme.glow}`, marginBottom: 22 }}>
        <div style={{ color: '#dbeafe', fontWeight: 950, letterSpacing: 1.3, textTransform: 'uppercase', fontSize: 12 }}>
          {persona.label}
        </div>
        <h1 style={{ margin: '8px 0', fontSize: 38 }}>Personalization Intelligence</h1>
        <p style={{ margin: 0, color: '#dbeafe', fontWeight: 760, lineHeight: 1.6, maxWidth: 900 }}>{persona.briefing}</p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, marginBottom: 22 }}>
        {persona.performanceIndicators.map((item) => (
          <div key={item.label} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 24, padding: 18, boxShadow: `0 18px 55px ${persona.theme.glow}` }}>
            <div style={{ color: '#64748b', fontSize: 12, fontWeight: 950, textTransform: 'uppercase', letterSpacing: .8 }}>{item.label}</div>
            <div style={{ color: item.tone, fontSize: 34, fontWeight: 950, marginTop: 8 }}>{item.value}</div>
            <div style={{ color: '#475569', fontWeight: 750 }}>{item.detail}</div>
          </div>
        ))}
      </div>

      <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 26, padding: 18, boxShadow: '0 18px 55px rgba(15,23,42,.07)' }}>
        <h2 style={{ margin: 0, color: '#0f172a' }}>Recommended workspace actions</h2>
        <p style={{ color: '#64748b', fontWeight: 750 }}>Generated from your department, position, role and access context.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
          {persona.recommendedActions.map((action) => (
            <a key={action.href} href={action.href} style={{ display: 'block', textDecoration: 'none', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 18, padding: 14, background: '#f8fafc', fontWeight: 900 }}>
              {action.label}
              <div style={{ color: '#64748b', fontSize: 13, fontWeight: 700, marginTop: 4 }}>{action.detail}</div>
            </a>
          ))}
        </div>
      </section>
    </AppShell>
  )
}
