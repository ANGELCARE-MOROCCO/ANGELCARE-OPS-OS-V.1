import Link from 'next/link'
import type { Angelcare360ReportsOverviewRecord } from '@/types/angelcare360/reports'
import Angelcare360ReportsRiskPanel from './Angelcare360ReportsRiskPanel'

type Props = {
  overview: Angelcare360ReportsOverviewRecord
}

export default function Angelcare360ReportsHub({ overview }: Props) {
  const cards = [
    { label: 'Rapports catalogue', value: overview.reportCount.toString(), detail: 'Définis dans le socle métier' },
    { label: 'Modèles', value: overview.templateCount.toString(), detail: 'Templates stockés côté serveur' },
    { label: 'Demandes', value: overview.requestCount.toString(), detail: 'Demandes suivies et historisées' },
    { label: 'Exports', value: overview.exportCount.toString(), detail: 'Sorties réelles ou verrouillées' },
    { label: 'Documents', value: overview.documentCount.toString(), detail: 'Pièces générées disponibles' },
    { label: 'Audit', value: overview.latestAuditEvents.length.toString(), detail: 'Derniers événements journalisés' },
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
          <h2 style={sectionTitleStyle}>Capacités verrouillées</h2>
          <p style={sectionTextStyle}>
            La génération PDF A4, les exports CSV/XLSX et les téléchargements réels restent bloqués tant que le moteur de sortie n’est pas configuré.
          </p>
          <div style={actionRowStyle}>
            <Link href="/angelcare-360-command-center/rapports/catalogue" style={actionLinkStyle}>Ouvrir le catalogue</Link>
            <Link href="/angelcare-360-command-center/rapports/modeles" style={actionLinkStyle}>Gérer les modèles</Link>
            <Link href="/angelcare-360-command-center/rapports/demandes" style={actionLinkStyle}>Voir les demandes</Link>
          </div>
        </div>
        <div style={readinessStyle}>
          <div style={readinessTitleStyle}>Lecture de disponibilité</div>
          <ul style={readinessListStyle}>
            <li>Catalogue: {overview.readiness.reportCatalogueReady ? 'prêt' : 'incomplet'}</li>
            <li>Modèles: {overview.readiness.reportTemplateReady ? 'prêts' : 'verrouillés'}</li>
            <li>Demandes: {overview.readiness.reportRequestReady ? 'prêtes' : 'verrouillées'}</li>
            <li>PDF A4: {overview.readiness.pdfA4Ready ? 'prêt' : 'verrouillé'}</li>
            <li>CSV / XLSX: {overview.readiness.csvXlsxReady ? 'prêt' : 'verrouillé'}</li>
            <li>Documents: {overview.readiness.documentReady ? 'prêts' : 'verrouillés'}</li>
          </ul>
        </div>
      </section>

      <Angelcare360ReportsRiskPanel risks={overview.risks} />
    </div>
  )
}

const layoutStyle: React.CSSProperties = { display: 'grid', gap: 16 }
const gridStyle: React.CSSProperties = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }
const cardStyle: React.CSSProperties = { borderRadius: 22, border: '1px solid #dbe4ef', background: '#fff', padding: 16, boxShadow: '0 18px 48px rgba(15,23,42,.05)' }
const labelStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: .8, fontWeight: 900 }
const valueStyle: React.CSSProperties = { marginTop: 8, color: '#0f172a', fontSize: 28, fontWeight: 950 }
const detailStyle: React.CSSProperties = { margin: '8px 0 0', color: '#475569', lineHeight: 1.5, fontWeight: 600 }
const controlStyle: React.CSSProperties = { display: 'grid', gap: 16, gridTemplateColumns: '1.4fr .8fr', padding: 18, borderRadius: 24, border: '1px solid #dbe4ef', background: 'linear-gradient(135deg,#fff 0%,#f8fbff 100%)' }
const sectionTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 18, fontWeight: 950 }
const sectionTextStyle: React.CSSProperties = { margin: '10px 0 0', color: '#475569', lineHeight: 1.65, fontWeight: 600 }
const actionRowStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }
const actionLinkStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 14, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', padding: '10px 14px', textDecoration: 'none', fontWeight: 800 }
const readinessStyle: React.CSSProperties = { borderRadius: 18, border: '1px solid #dbe4ef', background: '#fff', padding: 16 }
const readinessTitleStyle: React.CSSProperties = { color: '#0f172a', fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: .8 }
const readinessListStyle: React.CSSProperties = { margin: '10px 0 0', paddingLeft: 18, display: 'grid', gap: 8, color: '#334155', fontWeight: 600 }
