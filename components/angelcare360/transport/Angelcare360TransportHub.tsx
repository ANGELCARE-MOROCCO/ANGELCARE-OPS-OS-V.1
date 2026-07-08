import Link from 'next/link'
import type { Angelcare360TransportOverviewRecord } from '@/types/angelcare360/transport'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360TransportRiskPanel from './Angelcare360TransportRiskPanel'

type Angelcare360TransportHubProps = {
  overview: Angelcare360TransportOverviewRecord
}

export default function Angelcare360TransportHub({ overview }: Angelcare360TransportHubProps) {
  const metrics = [
    ['Circuits actifs', overview.activeRouteCount],
    ['Arrêts', overview.stopCount],
    ['Véhicules', overview.vehicleCount],
    ['Véhicules actifs', overview.activeVehicleCount],
    ['Affectations', overview.assignmentCount],
    ['Affectations actives', overview.activeAssignmentCount],
    ['Alertes capacité', overview.capacityWarningCount],
    ['Contacts manquants', overview.emergencyCoverageMissingCount],
  ]

  return (
    <section style={shellStyle}>
      <section style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>Transport & Sécurité</div>
          <h2 style={titleStyle}>Cockpit transport contrôlé</h2>
          <p style={subtitleStyle}>
            Les circuits, arrêts, véhicules et affectations élèves sont pilotés côté serveur. Le GPS, le temps réel et les notifications parents restent verrouillés sans fournisseur réel.
          </p>
        </div>
        <div style={actionRowStyle}>
          <Link href="/angelcare-360-command-center/transport/circuits" style={primaryLinkStyle}>Ouvrir les circuits</Link>
          <Link href="/angelcare-360-command-center/transport/ramassage" style={secondaryLinkStyle}>Ramassage</Link>
          <Link href="/angelcare-360-command-center/transport/depot" style={secondaryLinkStyle}>Dépôt</Link>
          <Link href="/angelcare-360-command-center/transport/securite" style={secondaryLinkStyle}>Sécurité</Link>
        </div>
      </section>

      <section style={quickActionGridStyle}>
        <Link href="/angelcare-360-command-center/transport/vehicules" style={quickActionStyle}>Véhicules</Link>
        <Link href="/angelcare-360-command-center/transport/affectations" style={quickActionStyle}>Affectations élèves</Link>
        <span style={lockedActionStyle}>Notifications parents désactivées</span>
        <span style={lockedActionStyle}>GPS / temps réel désactivés</span>
      </section>

      <section style={kpiGridStyle}>
        {metrics.map(([label, value]) => (
          <article key={String(label)} style={kpiCardStyle}>
            <div style={kpiLabelStyle}>{label}</div>
            <div style={kpiValueStyle}>{String(value)}</div>
          </article>
        ))}
      </section>

      <section style={snapshotGridStyle}>
        <article style={snapshotCardStyle}>
          <div style={snapshotLabelStyle}>Établissement</div>
          <h3 style={snapshotTitleStyle}>{overview.schoolName}</h3>
          <p style={snapshotTextStyle}>Année active: {overview.activeAcademicYearLabel || 'Non résolue'}</p>
        </article>
        <article style={snapshotCardStyle}>
          <div style={snapshotLabelStyle}>Sécurité</div>
          <h3 style={snapshotTitleStyle}>{overview.safety.overallStatus === 'ready' ? 'Prêt' : 'Contrôle requis'}</h3>
          <p style={snapshotTextStyle}>
            {overview.safety.missingDriverCount} circuit(s) sans chauffeur, {overview.safety.routeWithoutStopsCount} circuit(s) sans arrêt et {overview.safety.capacityWarningCount} alerte(s) de capacité.
          </p>
        </article>
        <article style={snapshotCardStyle}>
          <div style={snapshotLabelStyle}>Verrouillages</div>
          <h3 style={snapshotTitleStyle}>GPS et notifications verrouillés</h3>
          <p style={snapshotTextStyle}>Le suivi GPS, le temps réel et l’envoi parents ne sont pas simulés.</p>
        </article>
        <article style={snapshotCardStyle}>
          <div style={snapshotLabelStyle}>Audit</div>
          <h3 style={snapshotTitleStyle}>Événements récents</h3>
          {overview.latestAuditEvents.length > 0 ? (
            <ul style={auditListStyle}>
              {overview.latestAuditEvents.slice(0, 4).map((event) => (
                <li key={event.id} style={auditItemStyle}>{event.module} · {event.action}</li>
              ))}
            </ul>
          ) : (
            <Angelcare360EmptyState title="Aucun événement récent" description="Les mutations transport apparaîtront ici après les premières opérations." />
          )}
        </article>
      </section>

      <Angelcare360TransportRiskPanel risks={overview.risks} blockedReasons={overview.safety.checkpoints.map((checkpoint) => checkpoint.reason)} />
    </section>
  )
}

const shellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
}

const heroStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
  padding: 20,
  borderRadius: 26,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
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
  fontSize: 28,
  fontWeight: 950,
}

const subtitleStyle: React.CSSProperties = {
  margin: '10px 0 0',
  color: '#475569',
  lineHeight: 1.65,
  fontWeight: 600,
  maxWidth: 900,
}

const actionRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const quickActionGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
}

const primaryLinkStyle: React.CSSProperties = {
  border: '1px solid #0f172a',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#0f172a',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 800,
}

const secondaryLinkStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 800,
}

const quickActionStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 16,
  border: '1px solid #dbe4ef',
  background: '#fff',
  color: '#0f172a',
  padding: '12px 14px',
  textDecoration: 'none',
  fontWeight: 850,
}

const lockedActionStyle: React.CSSProperties = {
  ...quickActionStyle,
  color: '#94a3b8',
  background: '#f8fafc',
  cursor: 'not-allowed',
}

const kpiGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 12,
}

const kpiCardStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
  padding: 16,
  borderRadius: 20,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 16px 40px rgba(15,23,42,.04)',
}

const kpiLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.7,
  fontWeight: 900,
}

const kpiValueStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 26,
  fontWeight: 950,
}

const snapshotGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 12,
}

const snapshotCardStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
  padding: 18,
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const snapshotLabelStyle: React.CSSProperties = {
  color: '#0284c7',
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  fontSize: 12,
  fontWeight: 900,
}

const snapshotTitleStyle: React.CSSProperties = {
  margin: 0,
  color: '#0f172a',
  fontSize: 18,
  fontWeight: 900,
}

const snapshotTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#475569',
  lineHeight: 1.65,
  fontWeight: 600,
}

const auditListStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: 'grid',
  gap: 8,
}

const auditItemStyle: React.CSSProperties = {
  color: '#334155',
  fontWeight: 600,
}
