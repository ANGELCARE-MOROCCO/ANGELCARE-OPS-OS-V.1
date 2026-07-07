import Link from 'next/link'
import type { Angelcare360FinanceOverviewRecord } from '@/types/angelcare360/finance'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

type Angelcare360FinanceHubProps = {
  overview: Angelcare360FinanceOverviewRecord
}

export default function Angelcare360FinanceHub({ overview }: Angelcare360FinanceHubProps) {
  return (
    <div style={shellStyle}>
      <section style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>Finance & Paiements</div>
          <h2 style={titleStyle}>Vue d’ensemble du recouvrement scolaire</h2>
          <p style={subtitleStyle}>
            Les structures de frais, factures, paiements, reçus, remises et relances sont branchés sur le socle de données. Les actions à risque restent verrouillées si le contexte métier ne le permet pas.
          </p>
        </div>
        <div style={actionRowStyle}>
          <Link href="/angelcare-360-command-center/finance/factures" style={primaryLinkStyle}>Ouvrir les factures</Link>
          <Link href="/angelcare-360-command-center/finance/paiements" style={secondaryLinkStyle}>Voir les paiements</Link>
        </div>
      </section>

      <section style={kpiGridStyle}>
        {[
          ['Frais', overview.totalFeeStructures],
          ['Articles', overview.totalFeeItems],
          ['Factures', overview.totalInvoices],
          ['Paiements', overview.totalPayments],
          ['Reçus', overview.totalReceipts],
          ['Solde dû', overview.totalOutstanding],
        ].map(([label, value]) => (
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
          <p style={snapshotTextStyle}>Période active: {overview.activeTermLabel || 'Non résolue'}</p>
        </article>
        <article style={snapshotCardStyle}>
          <div style={snapshotLabelStyle}>Créances</div>
          <h3 style={snapshotTitleStyle}>Recouvrement en cours</h3>
          <p style={snapshotTextStyle}>
            {overview.overdueInvoices} facture(s) en retard, {overview.pendingPayments} paiement(s) en attente et {overview.blockedReminders} relance(s) bloquée(s).
          </p>
        </article>
        <article style={snapshotCardStyle}>
          <div style={snapshotLabelStyle}>Règles</div>
          <h3 style={snapshotTitleStyle}>Contrôle financier serveur</h3>
          <p style={snapshotTextStyle}>
            Les montants, la validation des statuts et l’audit sont calculés côté serveur. Les exports PDF et le paiement en ligne restent verrouillés.
          </p>
        </article>
        <article style={snapshotCardStyle}>
          <div style={snapshotLabelStyle}>Risques</div>
          <h3 style={snapshotTitleStyle}>Points de vigilance</h3>
          {overview.risks.length > 0 ? (
            <ul style={riskListStyle}>
              {overview.risks.map((risk) => (
                <li key={risk} style={riskItemStyle}>{risk}</li>
              ))}
            </ul>
          ) : (
            <Angelcare360EmptyState title="Aucun risque bloquant" description="Le socle finance peut être consulté sans blocage structurel identifié." />
          )}
        </article>
      </section>

      <section style={auditPanelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Audit récent</div>
            <h3 style={panelTitleStyle}>Événements financiers récents</h3>
          </div>
          <Link href="/angelcare-360-command-center/finance/audit" style={inlineLinkStyle}>Voir l’audit</Link>
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
          <Angelcare360EmptyState title="Aucun événement récent" description="Les mutations financières apparaîtront ici après les premières opérations." />
        )}
      </section>
    </div>
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
  color: '#16a34a',
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

const primaryLinkStyle: React.CSSProperties = {
  border: '1px solid #0f172a',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#0f172a',
  color: '#fff',
  fontWeight: 800,
  textDecoration: 'none',
}

const secondaryLinkStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#fff',
  color: '#0f172a',
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
  color: '#16a34a',
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

const riskListStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: 'grid',
  gap: 8,
}

const riskItemStyle: React.CSSProperties = {
  color: '#334155',
  lineHeight: 1.5,
  fontWeight: 600,
}

const auditPanelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
  padding: 18,
  borderRadius: 24,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const panelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'start',
  gap: 12,
}

const panelEyebrowStyle: React.CSSProperties = {
  color: '#16a34a',
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  fontSize: 12,
  fontWeight: 900,
}

const panelTitleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#0f172a',
  fontSize: 20,
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
  gap: 12,
  padding: 14,
  borderRadius: 18,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
}

const auditTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 14,
  fontWeight: 900,
}

const auditSubtitleStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 600,
}

const severityStyle: React.CSSProperties = {
  flexShrink: 0,
  borderRadius: 999,
  padding: '6px 10px',
  background: '#dcfce7',
  color: '#166534',
  fontSize: 11,
  fontWeight: 900,
  alignSelf: 'center',
}

