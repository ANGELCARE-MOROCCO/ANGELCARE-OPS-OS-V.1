import type { Angelcare360TransportNotificationReadinessRecord } from '@/types/angelcare360/transport'
import Angelcare360TransportMutationForm from './Angelcare360TransportMutationForm'

type Angelcare360TransportNotificationsWorkspaceProps = {
  schoolId: string
  readiness: Angelcare360TransportNotificationReadinessRecord
}

export default function Angelcare360TransportNotificationsWorkspace({ schoolId, readiness }: Angelcare360TransportNotificationsWorkspaceProps) {
  return (
    <section style={shellStyle}>
      <section style={cardStyle}>
        <div style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>Notifications parents</div>
            <h2 style={titleStyle}>Verrouillage messagerie</h2>
            <p style={subtitleStyle}>
              {readiness.reason}
            </p>
          </div>
          <span style={statusStyle}>{readiness.overallStatus}</span>
        </div>
      </section>

      <Angelcare360TransportMutationForm
        title="Journaliser le blocage notifications"
        description="Cette action ne simule aucun envoi ; elle consigne uniquement la contrainte opérationnelle."
        entity="notification"
        operation="block"
        submitLabel="Enregistrer le blocage"
        schoolId={schoolId}
        fields={[
          { name: 'reason', label: 'Motif', kind: 'textarea', helperText: 'Facultatif, mais recommandé.' },
        ]}
      />
    </section>
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
  lineHeight: 1.6,
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

