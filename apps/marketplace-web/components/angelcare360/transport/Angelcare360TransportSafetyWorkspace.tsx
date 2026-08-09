import type { Angelcare360TransportSafetyReadinessRecord } from '@/types/angelcare360/transport'
import Angelcare360TransportMutationForm from './Angelcare360TransportMutationForm'

type Angelcare360TransportSafetyWorkspaceProps = {
  schoolId: string
  safety: Angelcare360TransportSafetyReadinessRecord
}

export default function Angelcare360TransportSafetyWorkspace({ schoolId, safety }: Angelcare360TransportSafetyWorkspaceProps) {
  return (
    <section style={shellStyle}>
      <section style={cardStyle}>
        <div style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>Sécurité transport</div>
            <h2 style={titleStyle}>Readiness opérationnelle</h2>
            <p style={subtitleStyle}>Les contrôles confirment la disponibilité des circuits, véhicules, chauffeurs et contacts d’urgence.</p>
          </div>
          <span style={statusStyle}>{safety.overallStatus}</span>
        </div>

        <div style={metricGridStyle}>
          <Metric label="Circuits" value={safety.routeCount} />
          <Metric label="Véhicules actifs" value={safety.activeVehicleCount} />
          <Metric label="Affectations actives" value={safety.activeAssignmentCount} />
          <Metric label="Capacité" value={safety.capacityWarningCount} />
          <Metric label="Contacts manquants" value={safety.emergencyCoverageMissingCount} />
        </div>
      </section>

      <section style={cardStyle}>
        <div style={eyebrowStyle}>Contrôles</div>
        <div style={checkGridStyle}>
          {safety.checkpoints.map((checkpoint) => (
            <article key={checkpoint.key} style={checkCardStyle}>
              <div style={checkLabelStyle}>{checkpoint.label}</div>
              <div style={checkStatusStyle}>{checkpoint.status}</div>
              <p style={checkReasonStyle}>{checkpoint.reason}</p>
            </article>
          ))}
        </div>
      </section>

      <div style={formGridStyle}>
        <Angelcare360TransportMutationForm
          title="Consigner le blocage GPS"
          description="Aucun fournisseur de cartographie n’est configuré. Cette action journalise le blocage sans simuler le suivi."
          entity="gps"
          operation="block"
          submitLabel="Journaliser le blocage GPS"
          schoolId={schoolId}
          fields={[
            { name: 'reason', label: 'Motif', kind: 'textarea', helperText: 'Facultatif, mais recommandé.' },
          ]}
        />
        <Angelcare360TransportMutationForm
          title="Consigner le blocage notifications"
          description="Aucune messagerie n’est active pour notifier automatiquement les parents."
          entity="notification"
          operation="block"
          submitLabel="Journaliser le blocage notifications"
          schoolId={schoolId}
          fields={[
            { name: 'reason', label: 'Motif', kind: 'textarea', helperText: 'Facultatif, mais recommandé.' },
          ]}
        />
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <article style={metricCardStyle}>
      <div style={metricLabelStyle}>{label}</div>
      <div style={metricValueStyle}>{String(value ?? '—')}</div>
    </article>
  )
}

const shellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
}

const cardStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
  padding: 18,
  borderRadius: 24,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: 12,
}

const eyebrowStyle: React.CSSProperties = {
  color: '#0284c7',
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
  margin: '10px 0 0',
  color: '#475569',
  fontWeight: 700,
}

const statusStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '6px 10px',
  background: '#f0f9ff',
  color: '#0369a1',
  fontSize: 12,
  fontWeight: 900,
}

const metricGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
}

const metricCardStyle: React.CSSProperties = {
  display: 'grid',
  gap: 6,
  padding: 14,
  borderRadius: 18,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
}

const metricLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.7,
  fontWeight: 900,
}

const metricValueStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 22,
  fontWeight: 950,
}

const checkGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
}

const checkCardStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
  padding: 14,
  borderRadius: 18,
  border: '1px solid #e2e8f0',
  background: '#fff',
}

const checkLabelStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 900,
}

const checkStatusStyle: React.CSSProperties = {
  color: '#0369a1',
  fontSize: 12,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
}

const checkReasonStyle: React.CSSProperties = {
  margin: 0,
  color: '#475569',
  lineHeight: 1.55,
  fontWeight: 600,
}

const formGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
}

