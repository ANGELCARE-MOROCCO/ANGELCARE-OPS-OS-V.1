import Link from 'next/link'
import type { Angelcare360ReportsOverviewRecord } from '@/types/angelcare360/reports'
import Angelcare360ReportsRiskPanel from './Angelcare360ReportsRiskPanel'
import {
  ANGELCARE360_COLORS,
  angelcare360MetricCardStyle,
  angelcare360PageShellStyle,
  angelcare360SectionBackdropStyle,
} from '@/components/angelcare360/ui/Angelcare360VisualSystem'

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
          <h2 style={sectionTitleStyle}>Capacités documentaires</h2>
          <p style={sectionTextStyle}>
            La génération PDF A4 navigateur est active, les exports CSV existent sur les familles supportées, et XLSX reste verrouillé tant qu’un moteur tableur n’est pas branché.
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
            <li>Modèles: {overview.readiness.reportTemplateReady ? 'prêts' : 'à compléter'}</li>
            <li>Demandes: {overview.readiness.reportRequestReady ? 'prêtes' : 'à compléter'}</li>
            <li>PDF A4: {overview.readiness.pdfA4Ready ? 'prêt' : 'verrouillé'}</li>
            <li>CSV / XLSX: {overview.readiness.csvXlsxReady ? 'CSV prêt · XLSX verrouillé' : 'verrouillé'}</li>
            <li>Documents: {overview.readiness.documentReady ? 'prêts' : 'à compléter'}</li>
          </ul>
        </div>
      </section>

      <Angelcare360ReportsRiskPanel risks={overview.risks} />
    </div>
  )
}

const layoutStyle: React.CSSProperties = { ...angelcare360PageShellStyle }
const gridStyle: React.CSSProperties = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }
const cardStyle: React.CSSProperties = { ...angelcare360MetricCardStyle, borderRadius: 22, padding: 16 }
const labelStyle: React.CSSProperties = { color: ANGELCARE360_COLORS.slateMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: .8, fontWeight: 900 }
const valueStyle: React.CSSProperties = { marginTop: 8, color: ANGELCARE360_COLORS.navy, fontSize: 28, fontWeight: 950 }
const detailStyle: React.CSSProperties = { margin: '8px 0 0', color: ANGELCARE360_COLORS.slate, lineHeight: 1.5, fontWeight: 600 }
const controlStyle: React.CSSProperties = { display: 'grid', gap: 16, gridTemplateColumns: '1.4fr .8fr', padding: 18, ...angelcare360SectionBackdropStyle }
const sectionTitleStyle: React.CSSProperties = { margin: 0, color: ANGELCARE360_COLORS.navy, fontSize: 18, fontWeight: 950 }
const sectionTextStyle: React.CSSProperties = { margin: '10px 0 0', color: ANGELCARE360_COLORS.slate, lineHeight: 1.65, fontWeight: 600 }
const actionRowStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }
const actionLinkStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderStyle: 'solid', borderColor: ANGELCARE360_COLORS.navy, background: `linear-gradient(180deg, ${ANGELCARE360_COLORS.navy} 0%, ${ANGELCARE360_COLORS.navyDeep} 100%)`, color: ANGELCARE360_COLORS.white, padding: '10px 14px', textDecoration: 'none', fontWeight: 800 }
const readinessStyle: React.CSSProperties = { ...angelcare360SectionBackdropStyle, padding: 16 }
const readinessTitleStyle: React.CSSProperties = { color: ANGELCARE360_COLORS.navy, fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: .8 }
const readinessListStyle: React.CSSProperties = { margin: '10px 0 0', paddingLeft: 18, display: 'grid', gap: 8, color: ANGELCARE360_COLORS.slate, fontWeight: 600 }
