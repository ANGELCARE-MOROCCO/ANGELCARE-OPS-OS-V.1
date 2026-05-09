import Link from 'next/link'
import type { StaffPortalPersona } from '@/lib/staff-portal-os/phase3-personalization'

export default function StaffPersonaStrip({ persona }: { persona: StaffPortalPersona }) {
  return (
    <section
      style={{
        background: persona.theme.surface,
        border: `1px solid ${persona.theme.accent}`,
        borderRadius: 26,
        padding: 18,
        boxShadow: `0 18px 55px ${persona.theme.glow}`,
        marginBottom: 22,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(260px,.45fr)', gap: 18, alignItems: 'start' }}>
        <div>
          <div style={{ color: persona.theme.accent, fontSize: 12, fontWeight: 950, textTransform: 'uppercase', letterSpacing: 1.1 }}>
            {persona.label}
          </div>
          <h2 style={{ margin: '6px 0', color: '#0f172a', fontSize: 24 }}>{persona.mission}</h2>
          <p style={{ margin: 0, color: '#475569', fontWeight: 760, lineHeight: 1.55 }}>{persona.briefing}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
            {persona.workspaceFocus.map((item) => (
              <span
                key={item}
                style={{
                  border: `1px solid ${persona.theme.accent}`,
                  background: 'white',
                  color: persona.theme.secondary,
                  borderRadius: 999,
                  padding: '7px 10px',
                  fontWeight: 900,
                  fontSize: 12,
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gap: 9 }}>
          {persona.recommendedActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              style={{
                display: 'block',
                textDecoration: 'none',
                color: '#0f172a',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: 12,
                fontWeight: 900,
              }}
            >
              {action.label}
              <div style={{ color: '#64748b', fontWeight: 700, fontSize: 12, marginTop: 3 }}>{action.detail}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
