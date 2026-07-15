import Link from 'next/link'
import type { Angelcare360OperatorOverviewRecord } from '@/types/angelcare360/operator'
import Angelcare360OperatorActionQueue from './Angelcare360OperatorActionQueue'
import Angelcare360OperatorHealthPanel from './Angelcare360OperatorHealthPanel'
import Angelcare360OperatorKpiCard from './Angelcare360OperatorKpiCard'
import Angelcare360OperatorLockedPanel from './Angelcare360OperatorLockedPanel'
import Angelcare360OperatorRightPanel from './Angelcare360OperatorRightPanel'
import Angelcare360OperatorTimeline from './Angelcare360OperatorTimeline'
import Angelcare360OperatorPageShell from './Angelcare360OperatorPageShell'

type Props = {
  overview: Angelcare360OperatorOverviewRecord
}

export default function Angelcare360OperatorHub({ overview }: Props) {
  return (
    <Angelcare360OperatorPageShell
      badge="Backoffice opérateur"
      statusLabel={`${overview.totalClients} client(s) pilotés`}
      title="Gestion clients, abonnements, facturation SaaS et pilotage service"
      subtitle="Cockpit interne AngelCare pour le suivi des clients écoles/crèches, des abonnements, des paiements, des activations de modules et du service."
      primaryAction={<Link href="/angelcare-360-operator/clients" style={actionLinkStyle}>Voir les clients</Link>}
      secondaryActions={<Link href="/angelcare-360-operator/audit" style={secondaryLinkStyle}>Audit interne</Link>}
      contextRow={
        <>
          <span style={contextPillStyle}>Actifs: {overview.activeClients}</span>
          <span style={contextPillStyle}>Pilote: {overview.pilotClients}</span>
          <span style={contextPillStyle}>À risque: {overview.atRiskClients}</span>
          <span style={contextPillStyle}>Suspendus: {overview.suspendedClients}</span>
          <span style={contextPillStyle}>Encours: {overview.overdueInvoices}</span>
        </>
      }
    >
      <section style={kpiGridStyle}>
        {[
          ['Clients actifs', overview.activeClients.toString(), 'Abonnements et tenant opérationnels'],
          ['Clients pilote', overview.pilotClients.toString(), 'Phase commerciale / préproduction'],
          ['Clients à risque', overview.atRiskClients.toString(), 'Renouvellement ou recouvrement à surveiller'],
          ['Clients suspendus', overview.suspendedClients.toString(), 'Accès ou paiement à régulariser'],
          ['Abonnements actifs', overview.activeSubscriptions.toString(), 'Base facturable en production'],
          ['MRR estimé', `${overview.mrrEstimateMad.toLocaleString('fr-FR')} MAD`, 'Estimation mensuelle transparente'],
          ['ARR estimé', `${overview.arrEstimateMad.toLocaleString('fr-FR')} MAD`, 'Projection annuelle indicatrice'],
          ['Impayés', `${overview.overdueInvoices.toLocaleString('fr-FR')} facture(s)`, 'Encours en retard ou à relancer'],
        ].map(([label, value, detail]) => (
          <Angelcare360OperatorKpiCard key={String(label)} label={String(label)} value={String(value)} detail={String(detail)} />
        ))}
      </section>

      <section style={splitGridStyle}>
        <Angelcare360OperatorHealthPanel health={overview.customerHealth} />
        <Angelcare360OperatorRightPanel title="Actions rapides" subtitle="Les actions ouvrent des pages réelles ou des panneaux de travail.">
          <div style={quickActionGridStyle}>
            {overview.quickActions.map((action) => (
              action.href ? (
                <Link key={action.label} href={action.href} style={quickActionLinkStyle}>
                  {action.label}
                </Link>
              ) : (
                <button key={action.label} type="button" disabled title={action.disabledReason} style={disabledQuickActionStyle}>
                  {action.label}
                </button>
              )
            ))}
          </div>
          <Angelcare360OperatorLockedPanel
            title="Fonctions verrouillées"
            message="Le paiement en ligne, la facture PDF automatique, les emails automatiques et les relances externes restent verrouillés tant que l’infrastructure dédiée n’est pas validée."
            note="Suivi manuel disponible dans les pages de facturation et de support."
          />
        </Angelcare360OperatorRightPanel>
      </section>

      <section style={splitGridStyle}>
        <Angelcare360OperatorActionQueue
          title="File opérationnelle"
          items={[
            { title: `${overview.blockedOnboardingTasks} tâche(s) onboarding bloquée(s)`, detail: 'À reprendre en priorité pour sécuriser les mises en service.', tone: overview.blockedOnboardingTasks > 0 ? 'warning' : 'info' },
            { title: `${overview.urgentSupportTickets} ticket(s) urgent(s)`, detail: 'Le support doit traiter les urgences client en premier.', tone: overview.urgentSupportTickets > 0 ? 'critical' : 'info' },
            { title: `${overview.upcomingRenewals} renouvellement(s) à suivre`, detail: 'Le pipeline commercial doit être suivi avant l’échéance.', tone: overview.upcomingRenewals > 0 ? 'warning' : 'info' },
            { title: `${overview.modulesRequiringConfiguration} module(s) à configurer`, detail: 'Les modules verrouillés restent visibles jusqu’à configuration.', tone: overview.modulesRequiringConfiguration > 0 ? 'warning' : 'info' },
          ]}
        />
        <Angelcare360OperatorTimeline
          title="Événements de service récents"
          items={overview.recentServiceEvents.map((event) => ({
            title: `${event.title} · ${event.event_type}`,
            detail: event.description || event.status,
            timestamp: event.occurred_at,
            tone: event.severity === 'critical' ? 'critical' : event.severity === 'warning' ? 'warning' : event.severity === 'info' ? 'info' : 'success',
          }))}
        />
      </section>

      <section style={splitGridStyle}>
        <Angelcare360OperatorTimeline
          title="Audit interne récent"
          items={overview.recentAuditEvents.map((event) => ({
            title: `${event.module} · ${event.action}`,
            detail: `${event.actor_role || '—'} · ${event.entity_type || '—'}`,
            timestamp: event.created_at,
            tone: event.severity === 'critical' ? 'critical' : event.severity === 'warning' ? 'warning' : event.severity === 'notice' ? 'success' : 'info',
          }))}
        />
      </section>
    </Angelcare360OperatorPageShell>
  )
}

const kpiGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
}

const splitGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 16,
}

const quickActionGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 10,
  marginBottom: 14,
}

const quickActionLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 14,
  padding: '10px 12px',
  background: '#0f172a',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 800,
}

const disabledQuickActionStyle: React.CSSProperties = {
  borderRadius: 14,
  padding: '10px 12px',
  border: '1px dashed #cbd5e1',
  background: '#f8fafc',
  color: '#94a3b8',
  fontWeight: 800,
}

const actionLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  background: '#0f172a',
  color: '#fff',
  textDecoration: 'none',
  padding: '10px 14px',
  fontWeight: 800,
}

const secondaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  padding: '10px 14px',
  fontWeight: 800,
  border: '1px solid #dbe4ef',
}

const contextPillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '7px 11px',
  background: '#fff',
  border: '1px solid #dbe4ef',
  color: '#0f172a',
  fontSize: 12,
  fontWeight: 800,
  boxShadow: '0 10px 24px rgba(15,23,42,.04)',
}
