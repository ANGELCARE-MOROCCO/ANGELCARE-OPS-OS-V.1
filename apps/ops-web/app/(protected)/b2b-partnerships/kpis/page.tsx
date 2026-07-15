import Link from 'next/link'

export default function Page() {
  return (
    <section style={{
      display: 'grid',
      gap: 22,
      padding: 24,
      borderRadius: 32,
      background: '#fff',
      border: '1px solid #e5e7eb',
      boxShadow: '0 24px 70px rgba(15,23,42,.08)'
    }}>
      <div>
        <span style={{
          display: 'inline-flex',
          padding: '8px 12px',
          borderRadius: 999,
          background: '#eff6ff',
          color: '#2563eb',
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: '.12em',
          textTransform: 'uppercase'
        }}>Executive Intelligence</span>
        <h1 style={{
          margin: '18px 0 10px',
          fontSize: 56,
          lineHeight: .95,
          letterSpacing: '-.055em',
          color: '#0f172a'
        }}>Executive KPI Suite</h1>
        <p style={{ margin: 0, maxWidth: 900, color: '#64748b', fontSize: 18, lineHeight: 1.6 }}>Leadership performance view for pipeline, outreach, meetings, proposals, conversion and execution discipline.</p>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/b2b-partnerships/templates" style={{ padding: '14px 18px', borderRadius: 16, background: '#0f172a', color: '#fff', textDecoration: 'none', fontWeight: 900 }}>Templates</Link>
        <Link href="/b2b-partnerships/campaigns" style={{ padding: '14px 18px', borderRadius: 16, background: '#fff', border: '1px solid #e5e7eb', color: '#0f172a', textDecoration: 'none', fontWeight: 900 }}>Campaigns</Link>
        <Link href="/b2b-partnerships/settings" style={{ padding: '14px 18px', borderRadius: 16, background: '#fff', border: '1px solid #e5e7eb', color: '#0f172a', textDecoration: 'none', fontWeight: 900 }}>Settings</Link>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 16
      }}>
        
        <article style={{ padding: 22, borderRadius: 24, background: '#f8fafc', border: '1px solid #e5e7eb' }}>
          <strong style={{ display: 'block', color: '#0f172a', fontSize: 18, marginBottom: 8 }}>Pipeline KPIs</strong>
          <p style={{ margin: 0, color: '#64748b', lineHeight: 1.5 }}>Prospects actifs, partenaires signés, valeur annuelle et conversion.</p>
        </article>

        <article style={{ padding: 22, borderRadius: 24, background: '#f8fafc', border: '1px solid #e5e7eb' }}>
          <strong style={{ display: 'block', color: '#0f172a', fontSize: 18, marginBottom: 8 }}>Execution KPIs</strong>
          <p style={{ margin: 0, color: '#64748b', lineHeight: 1.5 }}>Outreach, appels, réunions, propositions et relances.</p>
        </article>

        <article style={{ padding: 22, borderRadius: 24, background: '#f8fafc', border: '1px solid #e5e7eb' }}>
          <strong style={{ display: 'block', color: '#0f172a', fontSize: 18, marginBottom: 8 }}>Management KPIs</strong>
          <p style={{ margin: 0, color: '#64748b', lineHeight: 1.5 }}>Risques, recommandations et qualité de la donnée CRM.</p>
        </article>

      </div>
    </section>
  )
}
