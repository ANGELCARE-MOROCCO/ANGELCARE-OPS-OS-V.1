'use client'

type Props = {
  risks: string[]
}

export default function Angelcare360CommunicationRiskPanel({ risks }: Props) {
  return (
    <section style={panelStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>Risques de communication</h2>
        <span style={countStyle}>{risks.length} alerte(s)</span>
      </div>
      {risks.length ? (
        <ul style={listStyle}>
          {risks.map((risk) => <li key={risk} style={itemStyle}>{risk}</li>)}
        </ul>
      ) : (
        <div style={okStyle}>Aucune alerte majeure détectée.</div>
      )}
    </section>
  )
}

const panelStyle: React.CSSProperties = { display: 'grid', gap: 12, padding: 18, borderRadius: 24, border: '1px solid #dbe4ef', background: '#fff' }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }
const titleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 17, fontWeight: 900 }
const countStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '5px 10px', background: '#f8fafc', color: '#334155', fontSize: 12, fontWeight: 800 }
const listStyle: React.CSSProperties = { margin: 0, paddingLeft: 18, display: 'grid', gap: 8, color: '#7f1d1d' }
const itemStyle: React.CSSProperties = { lineHeight: 1.5, fontWeight: 600 }
const okStyle: React.CSSProperties = { color: '#166534', fontWeight: 700 }
