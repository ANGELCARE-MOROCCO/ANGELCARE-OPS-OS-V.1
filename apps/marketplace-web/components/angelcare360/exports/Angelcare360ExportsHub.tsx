import Link from 'next/link'
import type { Angelcare360ExportsOverviewRecord } from '@/types/angelcare360/reports'

type Props = {
  overview: Angelcare360ExportsOverviewRecord
}

export default function Angelcare360ExportsHub({ overview }: Props) {
  const cards = [
    { label: 'Fichiers', value: overview.exportFileCount.toString(), detail: 'Fichiers réels d’export' },
    { label: 'Historique', value: overview.exportHistoryCount.toString(), detail: 'Historique des sorties' },
    { label: 'Exports rapport', value: overview.reportExportCount.toString(), detail: 'Exports reliés aux rapports' },
    { label: 'Blocages', value: overview.blockedExportAttemptCount.toString(), detail: 'Tentatives refusées' },
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
          <h2 style={sectionTitleStyle}>Sorties documentaires</h2>
          <p style={sectionTextStyle}>
            La génération PDF A4 navigateur est active, les exports CSV sont disponibles quand la définition le permet, et XLSX reste verrouillé tant qu’un moteur tableur n’est pas branché.
          </p>
          <div style={actionRowStyle}>
            <Link href="/angelcare-360-command-center/exports/files" style={actionLinkStyle}>Voir les fichiers</Link>
            <Link href="/angelcare-360-command-center/exports/historique" style={actionLinkStyle}>Voir l’historique</Link>
          </div>
        </div>
        <div style={readinessStyle}>
          <div style={readinessTitleStyle}>État de préparation des exports</div>
          <ul style={readinessListStyle}>
            <li>PDF A4: {overview.pdfA4Ready ? 'prêt' : 'verrouillé'}</li>
            <li>CSV / XLSX: {overview.csvXlsxReady ? 'CSV prêt · XLSX verrouillé' : 'verrouillé'}</li>
            <li>Stockage fichier: {overview.fileStorageReady ? 'prêt' : 'à compléter'}</li>
          </ul>
        </div>
      </section>
    </div>
  )
}

const layoutStyle: React.CSSProperties = { display: 'grid', gap: 16 }
const gridStyle: React.CSSProperties = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }
const cardStyle: React.CSSProperties = { borderRadius: 22, border: '1px solid #dbe4ef', background: '#fff', padding: 16, boxShadow: '0 18px 48px rgba(15,23,42,.05)' }
const labelStyle: React.CSSProperties = { color: '#92400e', fontSize: 12, textTransform: 'uppercase', letterSpacing: .8, fontWeight: 900 }
const valueStyle: React.CSSProperties = { marginTop: 8, color: '#0f172a', fontSize: 28, fontWeight: 950 }
const detailStyle: React.CSSProperties = { margin: '8px 0 0', color: '#475569', lineHeight: 1.5, fontWeight: 600 }
const controlStyle: React.CSSProperties = { display: 'grid', gap: 16, gridTemplateColumns: '1.4fr .8fr', padding: 18, borderRadius: 24, border: '1px solid #dbe4ef', background: 'linear-gradient(135deg,#fff 0%,#fffaf0 100%)' }
const sectionTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 18, fontWeight: 950 }
const sectionTextStyle: React.CSSProperties = { margin: '10px 0 0', color: '#475569', lineHeight: 1.65, fontWeight: 600 }
const actionRowStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }
const actionLinkStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 14, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', padding: '10px 14px', textDecoration: 'none', fontWeight: 800 }
const readinessStyle: React.CSSProperties = { borderRadius: 18, border: '1px solid #dbe4ef', background: '#fff', padding: 16 }
const readinessTitleStyle: React.CSSProperties = { color: '#0f172a', fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: .8 }
const readinessListStyle: React.CSSProperties = { margin: '10px 0 0', paddingLeft: 18, display: 'grid', gap: 8, color: '#334155', fontWeight: 600 }
