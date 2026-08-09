type Angelcare360AcademicRiskPanelProps = {
  risks: string[]
  title?: string
}

export default function Angelcare360AcademicRiskPanel({ risks, title = 'Points de vigilance' }: Angelcare360AcademicRiskPanelProps) {
  return (
    <section style={panelStyle}>
      <div style={titleStyle}>{title}</div>
      {risks.length > 0 ? (
        <ul style={listStyle}>
          {risks.map((risk) => (
            <li key={risk} style={itemStyle}>{risk}</li>
          ))}
        </ul>
      ) : (
        <p style={emptyStyle}>Aucun blocage critique détecté.</p>
      )}
    </section>
  )
}

const panelStyle: React.CSSProperties = {
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 16px 44px rgba(15,23,42,.05)',
  padding: 18,
}

const titleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 14,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 1,
}

const listStyle: React.CSSProperties = {
  margin: '12px 0 0',
  paddingLeft: 18,
  display: 'grid',
  gap: 6,
  color: '#78350f',
  fontWeight: 600,
}

const itemStyle: React.CSSProperties = {
  lineHeight: 1.55,
}

const emptyStyle: React.CSSProperties = {
  margin: '12px 0 0',
  color: '#475569',
  fontWeight: 600,
  lineHeight: 1.6,
}
