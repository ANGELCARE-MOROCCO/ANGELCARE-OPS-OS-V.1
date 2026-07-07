import Link from 'next/link'
import type { Angelcare360PayrollPeriodDetailRecord } from '@/types/angelcare360/payroll'
import Angelcare360PayrollDataTable from './Angelcare360PayrollDataTable'

type Angelcare360PayrollPeriodDetailProps = {
  period: Angelcare360PayrollPeriodDetailRecord
}

export default function Angelcare360PayrollPeriodDetail({ period }: Angelcare360PayrollPeriodDetailProps) {
  return (
    <section style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>Période de paie</div>
          <h2 style={titleStyle}>{period.label}</h2>
          <p style={subtitleStyle}>
            {period.period_code} · {period.starts_on} → {period.ends_on}
          </p>
        </div>
        <div style={badgeRowStyle}>
          <span style={badgeStyle}>{period.status}</span>
          {period.payment_date ? <span style={badgeStyle}>{period.payment_date}</span> : null}
        </div>
      </div>

      <div style={metricsStyle}>
        <Metric label="Dossiers" value={period.payroll_record_count || 0} />
        <Metric label="Validés" value={period.validated_record_count || 0} />
        <Metric label="Payés" value={period.paid_record_count || 0} />
        <Metric label="Brut" value={period.gross_total || 0} />
        <Metric label="Net" value={period.net_total || 0} />
      </div>

      {period.blocked_reason ? <div style={lockStyle}>{period.blocked_reason}</div> : null}

      {period.records && period.records.length > 0 ? (
        <Angelcare360PayrollDataTable
          title="Dossiers de cette période"
          description="Dossiers liés à cette période de paie."
          rows={period.records}
          emptyTitle="Aucun dossier"
          emptyDescription="Aucun dossier n’est rattaché à cette période."
          columns={[
            { key: 'staff', label: 'Personnel', render: (row) => row.staff_full_name || row.staff_code || '—' },
            { key: 'number', label: 'Dossier', render: (row) => <Link href={row.detail_href || '#'} style={linkStyle}>{row.payroll_number}</Link> },
            { key: 'base', label: 'Base', align: 'right', render: (row) => `${row.base_salary}` },
            { key: 'gross', label: 'Brut', align: 'right', render: (row) => `${row.gross_amount}` },
            { key: 'net', label: 'Net', align: 'right', render: (row) => `${row.net_amount}` },
            { key: 'status', label: 'Statut', render: (row) => row.status },
          ]}
        />
      ) : null}
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <article style={metricCardStyle}>
      <div style={metricLabelStyle}>{label}</div>
      <div style={metricValueStyle}>{String(value)}</div>
    </article>
  )
}

const cardStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
}

const eyebrowStyle: React.CSSProperties = {
  color: '#d97706',
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  fontSize: 12,
  fontWeight: 900,
}

const titleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#0f172a',
  fontSize: 24,
  fontWeight: 950,
}

const subtitleStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: '#64748b',
  fontWeight: 600,
}

const badgeRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

const badgeStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '6px 10px',
  background: '#fffbeb',
  color: '#92400e',
  fontSize: 12,
  fontWeight: 900,
}

const metricsStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: 10,
}

const metricCardStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 18,
  border: '1px solid #e2e8f0',
  background: '#fff',
}

const metricLabelStyle: React.CSSProperties = {
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  fontSize: 12,
  fontWeight: 900,
}

const metricValueStyle: React.CSSProperties = {
  marginTop: 8,
  color: '#0f172a',
  fontSize: 22,
  fontWeight: 950,
}

const lockStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 16,
  background: '#fff7ed',
  color: '#92400e',
  fontWeight: 700,
  lineHeight: 1.6,
}

const linkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  background: '#fff',
  color: '#0f172a',
  padding: '8px 10px',
  textDecoration: 'none',
  fontWeight: 800,
}
