import Link from 'next/link'

export function CsaRevenueRecoveryPanel() {
  const rows = [
    ['Proposal hesitation', '12 families', '23.4K MAD', '/revenue-command-center'],
    ['Payment delay', '7 accounts', '18.4K MAD', '/billing'],
    ['Service downgrade risk', '5 families', '9.2K MAD', '/families'],
  ]

  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>Revenue Recovery Radar</h2>
      <p style={textStyle}>Protect revenue by acting on hesitation, payment delay, churn and service downgrade risks.</p>
      <div style={gridStyle}>
        {rows.map(([label, count, value, href]) => (
          <Link key={label} href={href} style={rowStyle}>
            <strong>{label}</strong>
            <span>{count}</span>
            <b>{value}</b>
          </Link>
        ))}
      </div>
    </section>
  )
}

export function CsaFamilyExperiencePanel() {
  const rows = [
    ['Red sentiment', '3 urgent', '/families'],
    ['Pending satisfaction call', '16 today', '/families'],
    ['Service feedback missing', '21 records', '/services'],
    ['Complaint closure', '4 unresolved', '/incidents'],
  ]

  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>Family Experience Control</h2>
      <p style={textStyle}>Monitor client sentiment, satisfaction, service expectations and retention actions.</p>
      <div style={gridStyle}>
        {rows.map(([label, count, href]) => (
          <Link key={label} href={href} style={rowStyle}>
            <strong>{label}</strong>
            <span>{count}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export function CsaServiceActivationPanel() {
  const rows = [
    ['Ready to activate', '6 services', '/services'],
    ['Missing family info', '9 files', '/families'],
    ['Staff/service mismatch', '3 alerts', '/operations'],
    ['Start confirmation', '11 pending', '/services'],
  ]

  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>Service Activation Desk</h2>
      <p style={textStyle}>Control the launch path from lead intent to operational service activation.</p>
      <div style={gridStyle}>
        {rows.map(([label, count, href]) => (
          <Link key={label} href={href} style={rowStyle}>
            <strong>{label}</strong>
            <span>{count}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

const panelStyle: React.CSSProperties = { border: '1px solid #dbe3ee', borderRadius: 28, background: '#fff', padding: 20, boxShadow: '0 18px 44px rgba(15,23,42,.06)' }
const titleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 22, fontWeight: 1000 }
const textStyle: React.CSSProperties = { color: '#64748b', lineHeight: 1.6, fontWeight: 650 }
const gridStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const rowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, alignItems: 'center', textDecoration: 'none', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 18, padding: 14, background: '#f8fafc' }
