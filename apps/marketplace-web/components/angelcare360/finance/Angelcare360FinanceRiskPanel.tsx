type Angelcare360FinanceRiskPanelProps = {
  title: string
  risks: string[]
  disabledReasons?: string[]
}

export default function Angelcare360FinanceRiskPanel({ title, risks, disabledReasons }: Angelcare360FinanceRiskPanelProps) {
  return (
    <section style={panelStyle}>
      <div style={headerStyle}>
        <div style={eyebrowStyle}>Risques / blocages</div>
        <h2 style={titleStyle}>{title}</h2>
      </div>

      {risks.length > 0 ? (
        <ul style={listStyle}>
          {risks.map((risk) => (
            <li key={risk} style={itemStyle}>{risk}</li>
          ))}
        </ul>
      ) : (
        <div style={emptyStyle}>Aucun risque opérationnel détecté sur le périmètre affiché.</div>
      )}

      {disabledReasons && disabledReasons.length > 0 ? (
        <div style={lockBoxStyle}>
          <div style={eyebrowStyle}>Actions verrouillées</div>
          <ul style={listStyle}>
            {disabledReasons.map((reason) => (
              <li key={reason} style={itemStyle}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}

const panelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
  padding: 18,
  borderRadius: 24,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const headerStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
}

const eyebrowStyle: React.CSSProperties = {
  color: '#16a34a',
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  fontSize: 12,
  fontWeight: 900,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: '#0f172a',
  fontSize: 20,
  fontWeight: 950,
}

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: 'grid',
  gap: 10,
}

const itemStyle: React.CSSProperties = {
  color: '#334155',
  lineHeight: 1.6,
  fontWeight: 600,
}

const emptyStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 16,
  background: '#f0fdf4',
  color: '#166534',
  fontWeight: 700,
}

const lockBoxStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 18,
  border: '1px solid #fde68a',
  background: '#fffbeb',
  display: 'grid',
  gap: 10,
}

