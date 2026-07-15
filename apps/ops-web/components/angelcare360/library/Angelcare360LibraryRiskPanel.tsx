import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

type Props = {
  title?: string
  risks: string[]
}

export default function Angelcare360LibraryRiskPanel({ title = 'Risques bibliothèque', risks }: Props) {
  return (
    <section style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>Contrôle documentaire</div>
          <h2 style={titleStyle}>{title}</h2>
        </div>
      </div>
      {risks.length > 0 ? (
        <ul style={listStyle}>
          {risks.map((risk) => <li key={risk} style={itemStyle}>{risk}</li>)}
        </ul>
      ) : (
        <Angelcare360EmptyState title="Aucun risque bloquant" description="La bibliothèque ne détecte pas de rupture immédiate." />
      )}
    </section>
  )
}

const cardStyle: React.CSSProperties = { display: 'grid', gap: 14, padding: 18, borderRadius: 24, border: '1px solid #dbe4ef', background: '#fff', boxShadow: '0 18px 54px rgba(15,23,42,.05)' }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }
const eyebrowStyle: React.CSSProperties = { color: '#0284c7', textTransform: 'uppercase', letterSpacing: 1.1, fontSize: 12, fontWeight: 900 }
const titleStyle: React.CSSProperties = { margin: '8px 0 0', color: '#0f172a', fontSize: 18, fontWeight: 950 }
const listStyle: React.CSSProperties = { margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }
const itemStyle: React.CSSProperties = { color: '#334155', lineHeight: 1.5, fontWeight: 600 }
