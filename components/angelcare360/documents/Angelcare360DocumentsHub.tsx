import Link from 'next/link'
import type { Angelcare360DocumentsOverviewRecord } from '@/types/angelcare360/reports'

type Props = {
  overview: Angelcare360DocumentsOverviewRecord
}

export default function Angelcare360DocumentsHub({ overview }: Props) {
  const cards = [
    { label: 'Documents générés', value: overview.generatedDocumentCount.toString(), detail: 'Fichiers réellement persistés' },
    { label: 'Templates', value: overview.templateCount.toString(), detail: 'Templates documentaires' },
    { label: 'Gouvernance', value: overview.governanceReady ? 'OK' : 'Verrouillée', detail: 'Règles et rétention' },
    { label: 'Audit', value: overview.latestAuditEvents.length.toString(), detail: 'Événements journalisés' },
  ]

  return (
    <div style={layoutStyle}>
      <section style={gridStyle}>
        {cards.map((card) => (
          <article key={card.label} style={cardStyle}>
            <div style={labelStyle}>{card.label}</div>
            <div style={valueStyle}>{card.value}</div>
            <p style={detailStyle}>{card.detail}</p>
          </article>
        ))}
      </section>

      <section style={controlStyle}>
        <div>
          <h2 style={sectionTitleStyle}>Gouvernance documentaire</h2>
          <p style={sectionTextStyle}>
            Les documents générés ne sont pas simulés. Les templates sont contrôlés côté serveur et l’export reste verrouillé.
          </p>
          <div style={actionRowStyle}>
            <Link href="/angelcare-360-command-center/documents/generated" style={actionLinkStyle}>Documents générés</Link>
            <Link href="/angelcare-360-command-center/documents/templates" style={actionLinkStyle}>Templates</Link>
            <Link href="/angelcare-360-command-center/documents/governance" style={actionLinkStyle}>Gouvernance</Link>
          </div>
        </div>
        <div style={readinessStyle}>
          <div style={readinessTitleStyle}>Readiness documentaire</div>
          <ul style={readinessListStyle}>
            <li>Templates: {overview.templateCount > 0 ? 'prêts' : 'verrouillés'}</li>
            <li>Stockage: {overview.storageReady ? 'prêt' : 'verrouillé'}</li>
            <li>Audit: {overview.auditReady ? 'ok' : 'à activer'}</li>
          </ul>
        </div>
      </section>
    </div>
  )
}

const layoutStyle: React.CSSProperties = { display: 'grid', gap: 16 }
const gridStyle: React.CSSProperties = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }
const cardStyle: React.CSSProperties = { borderRadius: 22, border: '1px solid #dbe4ef', background: '#fff', padding: 16, boxShadow: '0 18px 48px rgba(15,23,42,.05)' }
const labelStyle: React.CSSProperties = { color: '#4d7c0f', fontSize: 12, textTransform: 'uppercase', letterSpacing: .8, fontWeight: 900 }
const valueStyle: React.CSSProperties = { marginTop: 8, color: '#0f172a', fontSize: 28, fontWeight: 950 }
const detailStyle: React.CSSProperties = { margin: '8px 0 0', color: '#475569', lineHeight: 1.5, fontWeight: 600 }
const controlStyle: React.CSSProperties = { display: 'grid', gap: 16, gridTemplateColumns: '1.4fr .8fr', padding: 18, borderRadius: 24, border: '1px solid #dbe4ef', background: 'linear-gradient(135deg,#fff 0%,#f7fee7 100%)' }
const sectionTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 18, fontWeight: 950 }
const sectionTextStyle: React.CSSProperties = { margin: '10px 0 0', color: '#475569', lineHeight: 1.65, fontWeight: 600 }
const actionRowStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }
const actionLinkStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 14, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', padding: '10px 14px', textDecoration: 'none', fontWeight: 800 }
const readinessStyle: React.CSSProperties = { borderRadius: 18, border: '1px solid #dbe4ef', background: '#fff', padding: 16 }
const readinessTitleStyle: React.CSSProperties = { color: '#0f172a', fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: .8 }
const readinessListStyle: React.CSSProperties = { margin: '10px 0 0', paddingLeft: 18, display: 'grid', gap: 8, color: '#334155', fontWeight: 600 }
