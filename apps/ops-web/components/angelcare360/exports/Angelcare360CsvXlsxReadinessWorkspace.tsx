type Props = {
  readiness: {
    ready: boolean
    csvReady: boolean
    xlsxReady: boolean
    storageReady: boolean
    permissionReady: boolean
    reason: string
  }
}

export default function Angelcare360CsvXlsxReadinessWorkspace({ readiness }: Props) {
  return (
    <section style={cardStyle}>
      <h2 style={titleStyle}>CSV / XLSX</h2>
      <p style={textStyle}>{readiness.reason}</p>
      <ul style={listStyle}>
        <li>CSV: {readiness.csvReady ? 'prêt' : 'verrouillé'}</li>
        <li>XLSX: {readiness.xlsxReady ? 'prêt' : 'verrouillé'}</li>
        <li>Stockage: {readiness.storageReady ? 'prêt' : 'verrouillé'}</li>
        <li>Permission: {readiness.permissionReady ? 'ok' : 'manquante'}</li>
      </ul>
    </section>
  )
}

const cardStyle: React.CSSProperties = { display: 'grid', gap: 12, padding: 18, borderRadius: 22, border: '1px solid #dbe4ef', background: '#fff', boxShadow: '0 18px 48px rgba(15,23,42,.05)' }
const titleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 18, fontWeight: 950 }
const textStyle: React.CSSProperties = { margin: 0, color: '#475569', lineHeight: 1.65, fontWeight: 600 }
const listStyle: React.CSSProperties = { margin: 0, paddingLeft: 18, display: 'grid', gap: 8, color: '#334155', fontWeight: 600 }
