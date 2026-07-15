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
        }}>Quality Center</span>
        <h1 style={{
          margin: '18px 0 10px',
          fontSize: 56,
          lineHeight: .95,
          letterSpacing: '-.055em',
          color: '#0f172a'
        }}>QA Health Center</h1>
        <p style={{ margin: 0, maxWidth: 900, color: '#64748b', fontSize: 18, lineHeight: 1.6 }}>Production readiness checks for routes, data, templates, settings, scoring and execution workflows.</p>
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
          <strong style={{ display: 'block', color: '#0f172a', fontSize: 18, marginBottom: 8 }}>API readiness</strong>
          <p style={{ margin: 0, color: '#64748b', lineHeight: 1.5 }}>Toutes les routes critiques retournent du JSON stable.</p>
        </article>

        <article style={{ padding: 22, borderRadius: 24, background: '#f8fafc', border: '1px solid #e5e7eb' }}>
          <strong style={{ display: 'block', color: '#0f172a', fontSize: 18, marginBottom: 8 }}>Data quality</strong>
          <p style={{ margin: 0, color: '#64748b', lineHeight: 1.5 }}>Prospects, contacts, tâches et propositions vérifiables.</p>
        </article>

        <article style={{ padding: 22, borderRadius: 24, background: '#f8fafc', border: '1px solid #e5e7eb' }}>
          <strong style={{ display: 'block', color: '#0f172a', fontSize: 18, marginBottom: 8 }}>Workflow quality</strong>
          <p style={{ margin: 0, color: '#64748b', lineHeight: 1.5 }}>Les actions directes, templates et relances restent cohérents.</p>
        </article>

      </div>
    </section>
  )
}
