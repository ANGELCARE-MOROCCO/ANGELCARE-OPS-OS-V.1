import Link from 'next/link'
import { ArrowUpRight, Building2, CircleDollarSign, Headphones, Rocket, ShieldCheck, TriangleAlert } from 'lucide-react'
import type { Angelcare360OperatorOverviewRecord } from '@/types/angelcare360/operator'
import Angelcare360OperatorActionQueue from './Angelcare360OperatorActionQueue'
import Angelcare360OperatorHealthPanel from './Angelcare360OperatorHealthPanel'
import Angelcare360OperatorLockedPanel from './Angelcare360OperatorLockedPanel'
import Angelcare360OperatorRightPanel from './Angelcare360OperatorRightPanel'
import Angelcare360OperatorTimeline from './Angelcare360OperatorTimeline'
import Angelcare360OperatorPageShell from './Angelcare360OperatorPageShell'
import styles from './Angelcare360OperatorExperience.module.css'

type Props = { overview: Angelcare360OperatorOverviewRecord }

export default function Angelcare360OperatorHub({ overview }: Props) {
  return (
    <Angelcare360OperatorPageShell
      badge="Commandement exécutif"
      statusLabel={`${overview.totalClients} comptes sous pilotage`}
      title="Le quartier général SaaS d’AngelCare 360"
      subtitle="Une situation unique pour protéger le revenu récurrent, accélérer les mises en service, anticiper les comptes à risque et commander la qualité de service du portefeuille écoles et crèches."
      primaryAction={<Link href="/angelcare-360-operator/clients" className={`${styles.actionButton} ${styles.actionPrimary}`}>Ouvrir le portefeuille <ArrowUpRight size={14} /></Link>}
      secondaryActions={<Link href="/angelcare-360-operator/audit" className={`${styles.actionButton} ${styles.actionSecondary}`}>Voir la preuve d’audit <ShieldCheck size={14} /></Link>}
      contextRow={
        <>
          <span className={styles.status + ' ' + styles.statusSuccess}>Actifs {overview.activeClients}</span>
          <span className={styles.status + ' ' + styles.statusInfo}>Pilotes {overview.pilotClients}</span>
          <span className={styles.status + ' ' + styles.statusWarning}>À risque {overview.atRiskClients}</span>
          <span className={styles.status + ' ' + styles.statusCritical}>Suspendus {overview.suspendedClients}</span>
        </>
      }
    >
      <section className={styles.cockpitGrid}>
        <div className={styles.revenueBand}>
          <article className={styles.revenueLead}>
            <div>
              <div className={styles.revenueEyebrow}>Revenu mensuel récurrent estimé</div>
              <div className={styles.revenueValue}>{formatDh(overview.mrrEstimateMad)}</div>
            </div>
            <div className={styles.revenueDetail}>Lecture calculée à partir des abonnements actifs disponibles. Cette estimation reste distincte de l’encaissement confirmé.</div>
          </article>
          <article className={styles.revenueCell}>
            <div className={styles.revenueCellLabel}>Projection annuelle</div>
            <div className={styles.revenueCellValue}>{formatDh(overview.arrEstimateMad)}</div>
            <div className={styles.revenueCellDetail}>ARR indicatif du portefeuille actif.</div>
          </article>
          <article className={styles.revenueCell}>
            <div className={styles.revenueCellLabel}>Encours non réglé</div>
            <div className={styles.revenueCellValue}>{formatDh(overview.unpaidBalanceMad)}</div>
            <div className={styles.revenueCellDetail}>{overview.overdueInvoices} facture(s) à surveiller.</div>
          </article>
          <article className={styles.revenueCell}>
            <div className={styles.revenueCellLabel}>Base facturable</div>
            <div className={styles.revenueCellValue}>{overview.activeSubscriptions}</div>
            <div className={styles.revenueCellDetail}>Abonnements actuellement actifs.</div>
          </article>
        </div>

        <article className={styles.networkField} aria-label="Constellation du portefeuille client">
          <div className={styles.networkOrbit} aria-hidden="true" />
          <div className={styles.networkCore}>
            <div>
              <div className={styles.networkCoreValue}>{overview.totalClients}</div>
              <div className={styles.networkCoreLabel}>Clients réseau</div>
            </div>
          </div>
          <div className={styles.networkNode}><div className={styles.networkNodeValue}>{overview.activeClients}</div><div className={styles.networkNodeLabel}>Actifs</div></div>
          <div className={styles.networkNode}><div className={styles.networkNodeValue}>{overview.pilotClients}</div><div className={styles.networkNodeLabel}>Pilotes</div></div>
          <div className={styles.networkNode}><div className={styles.networkNodeValue}>{overview.atRiskClients}</div><div className={styles.networkNodeLabel}>À risque</div></div>
          <div className={styles.networkNode}><div className={styles.networkNodeValue}>{overview.suspendedClients}</div><div className={styles.networkNodeLabel}>Suspendus</div></div>
        </article>
      </section>

      <section className={styles.surface}>
        <div className={styles.panelHeader}>
          <div>
            <div className={styles.panelEyebrow}>Accès mission</div>
            <h2 className={styles.panelTitle}>Lancer une intervention opérateur</h2>
            <p className={styles.panelDescription}>Chaque accès ouvre un espace réel de travail et conserve la séparation entre relation client, revenu, activation et service.</p>
          </div>
        </div>
        <div className={styles.quickLaunch}>
          {overview.quickActions.map((action, index) => action.href ? (
            <Link key={action.label} href={action.href} className={styles.quickLaunchLink}>
              <span>{index === 0 ? <Building2 size={18} /> : index === 1 ? <CircleDollarSign size={18} /> : index === 4 ? <Headphones size={18} /> : index === 5 ? <Rocket size={18} /> : <ArrowUpRight size={18} />}</span>
              <span className={styles.quickLaunchLabel}>{action.label}</span>
              <span className={styles.quickLaunchMeta}>Ouvrir la mission</span>
            </Link>
          ) : null)}
        </div>
      </section>

      <section className={styles.cockpitGrid}>
        <Angelcare360OperatorActionQueue
          title="Pression opérationnelle"
          items={[
            { title: `${overview.blockedOnboardingTasks} activation(s) bloquée(s)`, detail: 'Lever les dépendances qui retardent la mise en service.', tone: overview.blockedOnboardingTasks > 0 ? 'warning' : 'info' },
            { title: `${overview.urgentSupportTickets} ticket(s) urgent(s)`, detail: 'Réduire l’impact client et la pression de résolution.', tone: overview.urgentSupportTickets > 0 ? 'critical' : 'info' },
            { title: `${overview.upcomingRenewals} renouvellement(s) à préparer`, detail: 'Intervenir avant l’entrée dans la zone d’urgence commerciale.', tone: overview.upcomingRenewals > 0 ? 'warning' : 'info' },
            { title: `${overview.modulesRequiringConfiguration} capacité(s) à configurer`, detail: 'Aligner la promesse commerciale avec le service réellement actif.', tone: overview.modulesRequiringConfiguration > 0 ? 'warning' : 'info' },
          ]}
        />
        <Angelcare360OperatorHealthPanel health={overview.customerHealth} />
      </section>

      <section className={styles.cockpitGrid}>
        <Angelcare360OperatorTimeline
          title="Flux de service récent"
          items={overview.recentServiceEvents.map((event) => ({
            title: `${event.title} · ${event.event_type}`,
            detail: event.description || event.status,
            timestamp: event.occurred_at,
            tone: event.severity === 'critical' ? 'critical' : event.severity === 'warning' ? 'warning' : event.severity === 'info' ? 'info' : 'success',
          }))}
        />
        <Angelcare360OperatorRightPanel title="Intégrité opérationnelle" subtitle="Les capacités externes restent verrouillées tant que leur infrastructure n’est pas certifiée.">
          <Angelcare360OperatorLockedPanel
            title="Verrous respectés"
            message="Paiement en ligne, génération documentaire automatique, emails externes et relances automatisées ne produisent aucun faux succès."
            note="Les traitements manuels auditables restent disponibles dans les espaces financiers et service."
          />
          <div className={styles.actionGroup}>
            <div className={styles.actionGroupTitle}><TriangleAlert size={14} /> Vérification recommandée</div>
            <div className={styles.actionGroupDescription}>Consulter les événements d’audit avant toute décision affectant un tenant, un abonnement ou un paiement.</div>
          </div>
        </Angelcare360OperatorRightPanel>
      </section>

      <Angelcare360OperatorTimeline
        title="Preuve d’audit récente"
        items={overview.recentAuditEvents.map((event) => ({
          title: `${event.module} · ${event.action}`,
          detail: `${event.actor_role || '—'} · ${event.entity_type || '—'}`,
          timestamp: event.created_at,
          tone: event.severity === 'critical' ? 'critical' : event.severity === 'warning' ? 'warning' : event.severity === 'notice' ? 'success' : 'info',
        }))}
      />
    </Angelcare360OperatorPageShell>
  )
}

function formatDh(value: number) {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} Dh`
}
