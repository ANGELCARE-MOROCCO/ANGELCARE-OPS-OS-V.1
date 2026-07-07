import Link from 'next/link'
import type { Angelcare360PayrollRecordDetailRecord } from '@/types/angelcare360/payroll'
import Angelcare360PayrollDataTable from './Angelcare360PayrollDataTable'

type Angelcare360PayrollRecordDetailProps = {
  record: Angelcare360PayrollRecordDetailRecord
}

export default function Angelcare360PayrollRecordDetail({ record }: Angelcare360PayrollRecordDetailProps) {
  return (
    <section style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>Dossier de paie</div>
          <h2 style={titleStyle}>{record.payroll_number}</h2>
          <p style={subtitleStyle}>
            {record.staff_full_name || record.staff_code || 'Personnel'} · {record.period_label || 'Période non résolue'}
          </p>
        </div>
        <div style={badgeRowStyle}>
          <span style={badgeStyle}>{record.status}</span>
          <span style={badgeStyle}>{record.payment_status}</span>
        </div>
      </div>

      <div style={metricsStyle}>
        <Metric label="Base" value={record.base_salary} />
        <Metric label="Brut" value={record.gross_amount} />
        <Metric label="Retenues" value={record.deductions_total} />
        <Metric label="Primes" value={record.bonuses_total} />
        <Metric label="Net" value={record.net_amount} />
      </div>

      <div style={gridStyle}>
        <Info label="Date de paiement" value={record.payment_date || '—'} />
        <Info label="Moyen de paiement" value={record.payment_method || '—'} />
        <Info label="Référence" value={record.payment_reference || '—'} />
        <Info label="Validation" value={record.validated_at || '—'} />
      </div>

      {record.blocked_reason ? <div style={lockStyle}>{record.blocked_reason}</div> : null}

      {record.items && record.items.length > 0 ? (
        <Angelcare360PayrollDataTable
          title="Éléments du dossier"
          description="Base salariale, primes, retenues, avances, ajustements et remboursements."
          rows={record.items}
          emptyTitle="Aucun élément"
          emptyDescription="Aucun élément n’est rattaché à ce dossier."
          columns={[
            { key: 'type', label: 'Type', render: (row) => row.item_type },
            { key: 'label', label: 'Libellé', render: (row) => row.label },
            { key: 'amount', label: 'Montant', align: 'right', render: (row) => `${row.amount}` },
            { key: 'status', label: 'Statut', render: (row) => row.status },
            { key: 'action', label: 'Détail', render: (row) => <Link href={row.detail_href || '#'} style={linkStyle}>Ouvrir</Link> },
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <article style={infoCardStyle}>
      <div style={infoLabelStyle}>{label}</div>
      <div style={infoValueStyle}>{value}</div>
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

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 10,
}

const infoCardStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 18,
  border: '1px solid #e2e8f0',
  background: '#fff',
}

const infoLabelStyle: React.CSSProperties = {
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  fontSize: 12,
  fontWeight: 900,
}

const infoValueStyle: React.CSSProperties = {
  marginTop: 8,
  color: '#0f172a',
  fontWeight: 800,
  lineHeight: 1.6,
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
