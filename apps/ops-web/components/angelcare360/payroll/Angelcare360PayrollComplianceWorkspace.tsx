import type { Angelcare360PayrollComplianceReadinessRecord } from '@/types/angelcare360/payroll'

type Props = {
  compliance: Angelcare360PayrollComplianceReadinessRecord
}

export default function Angelcare360PayrollComplianceWorkspace({ compliance }: Props) {
  return (
    <section style={panelStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>Conformité</div>
          <h2 style={titleStyle}>Verrouillage réglementaire</h2>
        </div>
        <div style={badgeStyle}>{compliance.overallStatus}</div>
      </div>

      <div style={gridStyle}>
        {compliance.checkpoints.map((checkpoint) => (
          <article key={checkpoint.key} style={checkpointStyle}>
            <div style={checkpointLabelStyle}>{checkpoint.label}</div>
            <div style={checkpointStatusStyle}>{checkpoint.status}</div>
            <div style={checkpointReasonStyle}>{checkpoint.reason}</div>
          </article>
        ))}
      </div>
    </section>
  )
}

const panelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
  padding: 18,
  borderRadius: 24,
  border: '1px solid #e2e8f0',
  background: '#fff',
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
}

const eyebrowStyle: React.CSSProperties = {
  color: '#d97706',
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  fontSize: 12,
  fontWeight: 900,
}

const titleStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: '#0f172a',
  fontSize: 18,
  fontWeight: 950,
}

const badgeStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '6px 10px',
  background: '#fff7ed',
  color: '#92400e',
  fontSize: 12,
  fontWeight: 900,
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 10,
}

const checkpointStyle: React.CSSProperties = {
  display: 'grid',
  gap: 6,
  padding: 14,
  borderRadius: 18,
  border: '1px solid #fde68a',
  background: '#fffbeb',
}

const checkpointLabelStyle: React.CSSProperties = {
  color: '#92400e',
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  fontSize: 12,
  fontWeight: 900,
}

const checkpointStatusStyle: React.CSSProperties = {
  color: '#78350f',
  fontWeight: 800,
}

const checkpointReasonStyle: React.CSSProperties = {
  color: '#92400e',
  lineHeight: 1.6,
  fontWeight: 600,
}
