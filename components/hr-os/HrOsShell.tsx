import Link from 'next/link'

export function HrOsShell({
  title = 'AngelCare HR OS',
  subtitle = 'Human resources operating workspace',
  children,
  actions,
}: {
  title?: string
  subtitle?: string
  children: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>HR OPERATING SYSTEM</div>
          <h1 style={titleStyle}>{title}</h1>
          <p style={subtitleStyle}>{subtitle}</p>
        </div>
        <div style={actionsStyle}>
          {actions}
          <Link href="/hr-os" style={backStyle}>HR Home</Link>
        </div>
      </section>

      <section style={contentStyle}>{children}</section>
    </main>
  )
}

export default HrOsShell

const pageStyle: React.CSSProperties = {
  display: 'grid',
  gap: 18,
}

const heroStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 18,
  padding: 28,
  borderRadius: 30,
  background: 'radial-gradient(circle at top left,#2563eb,#020617 68%)',
  color: '#fff',
  boxShadow: '0 28px 70px rgba(15,23,42,.22)',
}

const eyebrowStyle: React.CSSProperties = {
  display: 'inline-flex',
  padding: '7px 12px',
  borderRadius: 999,
  background: 'rgba(255,255,255,.12)',
  color: '#dbeafe',
  fontWeight: 950,
  fontSize: 12,
  marginBottom: 12,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 34,
  fontWeight: 950,
}

const subtitleStyle: React.CSSProperties = {
  margin: '10px 0 0',
  color: '#dbeafe',
  fontWeight: 750,
  maxWidth: 760,
  lineHeight: 1.6,
}

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  flexWrap: 'wrap',
}

const backStyle: React.CSSProperties = {
  display: 'inline-flex',
  padding: '11px 14px',
  borderRadius: 14,
  background: 'rgba(255,255,255,.12)',
  border: '1px solid rgba(255,255,255,.18)',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 950,
}

const contentStyle: React.CSSProperties = {
  display: 'grid',
  gap: 18,
}
