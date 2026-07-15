import Link from 'next/link'
import type { Angelcare360PayrollOverviewRecord } from '@/types/angelcare360/payroll'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360PayrollRiskPanel from './Angelcare360PayrollRiskPanel'
import Angelcare360PayrollReadinessPanel from './Angelcare360PayrollReadinessPanel'

type Angelcare360PayrollHubProps = {
  overview: Angelcare360PayrollOverviewRecord
}

export default function Angelcare360PayrollHub({ overview }: Angelcare360PayrollHubProps) {
  const metrics = [
    ['Périodes', overview.payrollPeriodCount],
    ['Dossiers', overview.payrollRecordCount],
    ['En vérification', overview.pendingReviewCount],
    ['Validés', overview.validatedCount],
    ['Payés', overview.paidCount],
    ['Bloqués', overview.blockedCount],
    ['Brut', overview.grossTotal],
    ['Net', overview.netTotal],
  ]

  return (
    <section style={shellStyle}>
      <section style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>Paie & Rémunérations</div>
          <h2 style={titleStyle}>Cockpit paie contrôlé</h2>
          <p style={subtitleStyle}>
            La paie prépare les périodes, les dossiers, les éléments de rémunération et les états de validation sans prétendre automatiser le virement bancaire ni la conformité légale.
          </p>
        </div>
        <div style={actionRowStyle}>
          <Link href="/angelcare-360-command-center/paie/periodes" style={linkStyle}>Ouvrir les périodes</Link>
          <Link href="/angelcare-360-command-center/paie/validation" style={linkStyle}>Ouvrir la validation</Link>
          <Link href="/angelcare-360-command-center/paie/conformite" style={primaryLinkStyle}>Conformité</Link>
        </div>
      </section>

      <section style={kpiGridStyle}>
        {metrics.map(([label, value]) => (
          <article key={String(label)} style={kpiCardStyle}>
            <div style={kpiLabelStyle}>{label}</div>
            <div style={kpiValueStyle}>{String(value)}</div>
          </article>
        ))}
      </section>

      <Angelcare360PayrollReadinessPanel readiness={overview.readiness} />

      <section style={snapshotGridStyle}>
        <article style={snapshotCardStyle}>
          <div style={snapshotLabelStyle}>Établissement</div>
          <h3 style={snapshotTitleStyle}>{overview.schoolName}</h3>
          <p style={snapshotTextStyle}>Année active: {overview.activeAcademicYearLabel || 'Non résolue'}</p>
          <p style={snapshotTextStyle}>Période active: {overview.activePayrollPeriodLabel || 'Non résolue'}</p>
        </article>
        <article style={snapshotCardStyle}>
          <div style={snapshotLabelStyle}>Personnel</div>
          <h3 style={snapshotTitleStyle}>Base paie du personnel</h3>
          <p style={snapshotTextStyle}>
            {overview.staffCount} membre(s) du personnel, {overview.teacherCount} enseignant(s) et {overview.payrollRecordCount} dossier(s) de paie.
          </p>
        </article>
        <article style={snapshotCardStyle}>
          <div style={snapshotLabelStyle}>Paiements</div>
          <h3 style={snapshotTitleStyle}>Contrôle interne</h3>
          <p style={snapshotTextStyle}>
            {overview.paidCount} dossier(s) payé(s), {overview.pendingReviewCount} en vérification et {overview.blockedCount} bloqué(s).
          </p>
        </article>
        <article style={snapshotCardStyle}>
          <div style={snapshotLabelStyle}>Conformité</div>
          <h3 style={snapshotTitleStyle}>Verrouillage légal</h3>
          <p style={snapshotTextStyle}>
            CNSS, fiscalité, déclarations, virement et export restent verrouillés tant que les règles ne sont pas validées.
          </p>
        </article>
      </section>

      <section style={auditPanelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Audit récent</div>
            <h3 style={panelTitleStyle}>Événements paie récents</h3>
          </div>
          <Link href="/angelcare-360-command-center/paie/audit" style={inlineLinkStyle}>Voir l’audit</Link>
        </div>
        {overview.latestAuditEvents.length > 0 ? (
          <div style={auditListStyle}>
            {overview.latestAuditEvents.map((event) => (
              <article key={event.id} style={auditItemStyle}>
                <div>
                  <div style={auditTitleStyle}>{event.module} · {event.action}</div>
                  <div style={auditSubtitleStyle}>{event.actor_role || '—'} · {event.entity_type || '—'}</div>
                </div>
                <span style={severityStyle}>{event.severity}</span>
              </article>
            ))}
          </div>
        ) : (
          <Angelcare360EmptyState title="Aucun événement récent" description="Les opérations de paie apparaîtront ici après les premières opérations." />
        )}
      </section>

      <Angelcare360PayrollRiskPanel title="Risques paie" risks={overview.risks} disabledReasons={overview.compliance.checkpoints.map((check) => check.reason)} />
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
  border: '1px solid #e2e8f0',
  background: '#fff',
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
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

const linkStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 800,
  textDecoration: 'none',
}

const primaryLinkStyle: React.CSSProperties = {
  border: '1px solid #0f172a',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#0f172a',
  color: '#fff',
  fontWeight: 800,
  textDecoration: 'none',
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
  border: '1px solid #e2e8f0',
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
  border: '1px solid #e2e8f0',
  background: '#fff',
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const snapshotLabelStyle: React.CSSProperties = {
  color: '#d97706',
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

const auditPanelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
  padding: 18,
  borderRadius: 24,
  border: '1px solid #e2e8f0',
  background: '#fff',
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const panelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
}

const panelEyebrowStyle: React.CSSProperties = {
  color: '#d97706',
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  fontSize: 12,
  fontWeight: 900,
}

const panelTitleStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: '#0f172a',
  fontSize: 18,
  fontWeight: 950,
}

const inlineLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  background: '#fff',
  color: '#0f172a',
  padding: '10px 14px',
  textDecoration: 'none',
  fontWeight: 800,
}

const auditListStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
}

const auditItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'start',
  gap: 12,
  padding: '12px 14px',
  borderRadius: 16,
  background: '#f8fafc',
}

const auditTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 900,
}

const auditSubtitleStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 700,
  marginTop: 4,
}

const severityStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '5px 9px',
  background: '#fef3c7',
  color: '#92400e',
  fontSize: 11,
  fontWeight: 900,
}
