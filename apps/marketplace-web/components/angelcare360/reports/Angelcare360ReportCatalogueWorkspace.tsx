import type { Angelcare360ReportCatalogueRecord } from '@/types/angelcare360/reports'

type Props = {
  catalogue: Angelcare360ReportCatalogueRecord[]
}

export default function Angelcare360ReportCatalogueWorkspace({ catalogue }: Props) {
  return (
    <div style={stackStyle}>
      {catalogue.length ? catalogue.map((report) => (
        <article key={report.id} style={cardStyle}>
          <div style={headStyle}>
            <div>
              <div style={eyebrowStyle}>{report.report_family}</div>
              <h3 style={titleStyle}>{report.label}</h3>
              <p style={metaStyle}>{report.report_code}</p>
            </div>
            <span style={statusStyle}>{report.status}</span>
          </div>
          <div style={metricsStyle}>
            <Metric label="Modèles" value={String(report.template_count || 0)} />
            <Metric label="Demandes" value={String(report.request_count || 0)} />
            <Metric label="Historique" value={String(report.history_count || 0)} />
            <Metric label="Exports" value={String(report.export_count || 0)} />
          </div>
          <p style={descriptionStyle}>{report.description || 'Aucune description fournie.'}</p>
        </article>
      )) : (
        <div style={emptyStyle}>Aucun rapport catalogue n’est encore disponible.</div>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={metricStyle}>
      <div style={metricLabelStyle}>{label}</div>
      <div style={metricValueStyle}>{value}</div>
    </div>
  )
}

const stackStyle: React.CSSProperties = { display: 'grid', gap: 12 }
const cardStyle: React.CSSProperties = { display: 'grid', gap: 12, padding: 18, borderRadius: 22, border: '1px solid #dbe4ef', background: '#fff', boxShadow: '0 18px 54px rgba(15,23,42,.05)' }
const headStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }
const eyebrowStyle: React.CSSProperties = { color: '#2563eb', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: .9 }
const titleStyle: React.CSSProperties = { margin: '6px 0 0', color: '#0f172a', fontSize: 18, fontWeight: 950 }
const metaStyle: React.CSSProperties = { margin: '6px 0 0', color: '#64748b', fontSize: 13, fontWeight: 700 }
const statusStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '6px 10px', background: '#eff6ff', color: '#1d4ed8', fontSize: 12, fontWeight: 900 }
const metricsStyle: React.CSSProperties = { display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }
const metricStyle: React.CSSProperties = { borderRadius: 16, border: '1px solid #e2e8f0', padding: 12, background: '#f8fafc' }
const metricLabelStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: .7, fontWeight: 900 }
const metricValueStyle: React.CSSProperties = { marginTop: 6, color: '#0f172a', fontSize: 18, fontWeight: 950 }
const descriptionStyle: React.CSSProperties = { margin: 0, color: '#475569', lineHeight: 1.6, fontWeight: 600 }
const emptyStyle: React.CSSProperties = { padding: 18, borderRadius: 20, border: '1px dashed #cbd5e1', color: '#475569', fontWeight: 700 }
