import Link from 'next/link'
import type { Angelcare360DocumentListRecord } from '@/types/angelcare360/people'

type Props = {
  documents: Angelcare360DocumentListRecord[]
}

export default function Angelcare360GeneratedDocumentsWorkspace({ documents }: Props) {
  return (
    <div style={stackStyle}>
      {documents.length ? documents.map((document) => (
        <article key={document.id} style={cardStyle}>
          <div style={rowStyle}>
            <div>
              <div style={eyebrowStyle}>{document.category}</div>
              <h3 style={titleStyle}>{document.title}</h3>
              <p style={metaStyle}>{document.file_name}</p>
            </div>
            <span style={statusStyle}>{document.visibility}</span>
          </div>
          <div style={gridStyle}>
            <Info label="Stockage" value={document.storage_provider} />
            <Info label="Chemin" value={document.file_path} />
            <Info label="État" value={document.metadata_json?.document_state || 'active'} />
            <div style={actionCellStyle}>
              <Link href={`/angelcare-360-command-center/documents/generated/${document.id}/print`} style={actionLinkStyle}>Imprimer A4</Link>
            </div>
          </div>
        </article>
      )) : <div style={emptyStyle}>Aucun document généré réel n’est encore disponible.</div>}
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
const eyebrowStyle: React.CSSProperties = { color: '#4d7c0f', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: .8 }
const titleStyle: React.CSSProperties = { margin: '6px 0 0', color: '#0f172a', fontSize: 18, fontWeight: 950 }
const metaStyle: React.CSSProperties = { margin: '6px 0 0', color: '#64748b', fontSize: 13, fontWeight: 700 }
const statusStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '6px 10px', background: '#ecfccb', color: '#4d7c0f', fontSize: 12, fontWeight: 900 }
const gridStyle: React.CSSProperties = { display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }
const actionCellStyle: React.CSSProperties = { display: 'flex', alignItems: 'end' }
const actionLinkStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 14, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', textDecoration: 'none', padding: '10px 14px', fontWeight: 800 }
const infoStyle: React.CSSProperties = { borderRadius: 16, border: '1px solid #e2e8f0', padding: 12, background: '#f8fafc' }
const infoLabelStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: .7, fontWeight: 900 }
const infoValueStyle: React.CSSProperties = { marginTop: 6, color: '#0f172a', fontSize: 14, fontWeight: 700, lineHeight: 1.5 }
const emptyStyle: React.CSSProperties = { padding: 16, borderRadius: 18, border: '1px dashed #cbd5e1', color: '#475569', fontWeight: 700 }
