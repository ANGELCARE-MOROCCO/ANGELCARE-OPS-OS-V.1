import type { Angelcare360ReportHistoryRecord } from '@/types/angelcare360/reports'

type Props = {
  history: Angelcare360ReportHistoryRecord[]
}

export default function Angelcare360ExportHistoryWorkspace({ history }: Props) {
  return (
    <div style={stackStyle}>
      {history.length ? history.map((entry) => (
        <article key={`${entry.history_type}-${entry.id}`} style={cardStyle}>
          <div style={rowStyle}>
            <div>
              <div style={eyebrowStyle}>{entry.history_type === 'export' ? 'Export' : 'Rapport'}</div>
              <h3 style={titleStyle}>{entry.label || entry.entity_code}</h3>
              <p style={metaStyle}>{entry.status}</p>
            </div>
            <span style={statusStyle}>{entry.export_format || 'pdf_a4'}</span>
          </div>
          <div style={gridStyle}>
            <Info label="Code" value={entry.entity_code || '—'} />
            <Info label="Début" value={entry.requested_at || '—'} />
            <Info label="Fin" value={entry.completed_at || '—'} />
            <Info label="Fichier" value={entry.file_name || 'Aucun fichier réel'} />
          </div>
        </article>
      )) : <div style={emptyStyle}>Aucun historique d’export réel n’est encore disponible.</div>}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoStyle}>
      <div style={infoLabelStyle}>{label}</div>
      <div style={infoValueStyle}>{value}</div>
    </div>
  )
}

const stackStyle: React.CSSProperties = { display: 'grid', gap: 12 }
const cardStyle: React.CSSProperties = { display: 'grid', gap: 12, padding: 18, borderRadius: 22, border: '1px solid #dbe4ef', background: '#fff', boxShadow: '0 18px 54px rgba(15,23,42,.05)' }
const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }
const eyebrowStyle: React.CSSProperties = { color: '#92400e', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: .8 }
const titleStyle: React.CSSProperties = { margin: '6px 0 0', color: '#0f172a', fontSize: 18, fontWeight: 950 }
const metaStyle: React.CSSProperties = { margin: '6px 0 0', color: '#64748b', fontSize: 13, fontWeight: 700 }
const statusStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '6px 10px', background: '#fef3c7', color: '#b45309', fontSize: 12, fontWeight: 900 }
const gridStyle: React.CSSProperties = { display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }
const infoStyle: React.CSSProperties = { borderRadius: 16, border: '1px solid #e2e8f0', padding: 12, background: '#f8fafc' }
const infoLabelStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: .7, fontWeight: 900 }
const infoValueStyle: React.CSSProperties = { marginTop: 6, color: '#0f172a', fontSize: 14, fontWeight: 700, lineHeight: 1.5 }
const emptyStyle: React.CSSProperties = { padding: 16, borderRadius: 18, border: '1px dashed #cbd5e1', color: '#475569', fontWeight: 700 }
