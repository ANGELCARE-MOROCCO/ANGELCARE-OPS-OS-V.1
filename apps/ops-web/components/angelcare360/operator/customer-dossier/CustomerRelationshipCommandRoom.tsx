'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState, type ReactNode } from 'react'
import {
  Archive,
  ArrowUpRight,
  BadgeDollarSign,
  Building2,
  CalendarClock,
  ChevronDown,
  ContactRound,
  Edit3,
  FileLock2,
  LifeBuoy,
  MoreHorizontal,
  Network,
  NotebookPen,
  Radar,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  UserPlus,
} from 'lucide-react'
import type { Wave2CustomerCommand, Wave2Evidence, Wave2Tone } from '../wave2/Wave2CommandTypes'
import CustomerDossierScene, { type CustomerDetailExtras } from './CustomerDossierScenes'
import CustomerDossierPortals, { type CustomerDossierCapabilities } from './CustomerDossierPortals'
import styles from './CustomerRelationshipCommandRoom.module.css'
import {
  DeadlineSignal,
  formatDate,
  formatDh,
  humanize,
  MetricCell,
  SourceIntegrity,
  StatusToken,
} from './CustomerDossierPrimitives'
import { CUSTOMER_CHAPTERS, type CustomerChapterId, type CustomerPortalState } from './CustomerDossierContract'

type Props = {
  command: Wave2CustomerCommand
  capabilities: CustomerDossierCapabilities
  initialChapter?: CustomerChapterId
}

const overviewLenses = ['Exécutif', 'Relation', 'Finance', 'Produit', 'Service', 'Renouvellement', 'Expansion', 'Audit'] as const

export default function CustomerRelationshipCommandRoom({ command, capabilities, initialChapter = 'overview' }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [chapter, setChapter] = useState<CustomerChapterId>(initialChapter)
  const [lens, setLens] = useState<(typeof overviewLenses)[number]>('Exécutif')
  const [portal, setPortal] = useState<CustomerPortalState>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const details = command.client as typeof command.client & CustomerDetailExtras
  const activeIncidents = command.incidents.filter((item) => !['resolved', 'archived'].includes(String(item.status)))
  const activeTickets = command.tickets.filter((item) => !['resolved', 'closed', 'archived'].includes(String(item.status)))
  const recurringValue = command.subscriptions.filter((item) => item.status === 'active').reduce((sum, item) => sum + Number(item.billing_amount_mad || 0), 0)
  const financialExposure = Number(details.balance_due_mad || command.invoices.reduce((sum, item) => sum + Number(item.balance_due_mad || 0), 0))
  const primaryTenant = command.tenants[0]
  const primarySubscription = command.subscriptions[0]
  const primaryRenewal = command.renewals[0]
  const selectedChapter = CUSTOMER_CHAPTERS.find((item) => item.id === chapter) || CUSTOMER_CHAPTERS[0]

  const lifecycle = useMemo(() => {
    const stages = ['Prospect', 'Qualifié', 'Contracté', 'Onboarding', 'Implémentation', 'Opérationnel', 'Expansion', 'Renouvellement']
    return stages.map((label, index) => ({ ...command.lifecycle[index], label, index: index + 1 }))
  }, [command.lifecycle])

  function selectChapter(next: CustomerChapterId) {
    setChapter(next)
    setMoreOpen(false)
    const query = next === 'overview' ? '' : `?section=${next}`
    router.replace(`${pathname}${query}`, { scroll: false })
    window.requestAnimationFrame(() => document.getElementById('customer-working-scene')?.focus({ preventScroll: true }))
  }

  function openEvidence(ids: string[]) {
    const available = ids.map((id) => command.evidence.find((item) => item.id === id)).find(Boolean)
    setPortal({ kind: 'evidence', evidenceId: available?.id || command.evidence[0]?.id })
  }


  const headerSummary = [
    humanize(command.client.status),
    `${command.tenants.length} tenant${command.tenants.length > 1 ? 's' : ''}`,
    `${command.subscriptions.length} abonnement${command.subscriptions.length > 1 ? 's' : ''}`,
    `${formatDh(financialExposure)} exposés`,
    primaryRenewal ? `renouvellement ${formatDate(primaryRenewal.renewal_date)}` : 'renouvellement non formalisé',
  ].join(' · ')

  return (
    <main className={styles.customerCommandRoom}>
      <SourceIntegrity sources={command.sources} sourceState={command.sourceState} />

      <section className={styles.customerCommandHeader}>
        <div className={styles.identityZone}>
          <span className={styles.headerEyebrow}>AngelCare 360 Operator · Customer Relationship Command Room</span>
          <div className={styles.titleRow}>
            <div>
              <h1>{command.client.display_name}</h1>
              <p>{humanize(command.client.client_type)} · {command.client.city || 'Ville non renseignée'} · {command.client.country || 'Maroc'} · {command.client.client_code}</p>
            </div>
            <StatusToken value={command.client.status} tone={command.tone} />
          </div>
          <p className={styles.relationshipSummary}>{headerSummary}</p>
          <div className={styles.headerMeta}>
            <span><strong>Phase</strong>{humanize(command.client.lifecycle_stage)}</span>
            <span><strong>Owner</strong>{command.owner}</span>
            <span><strong>Sponsor</strong>{command.sponsor}</span>
            <span><strong>Dernier signal</strong>{command.lastMeaningfulEvent}</span>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button type="button" className={styles.primaryHeaderAction} onClick={() => setPortal({ kind: 'intervention' })}><Sparkles size={16} /> Créer une intervention</button>
          <button type="button" onClick={() => setPortal({ kind: 'edit-customer' })}><Edit3 size={15} /> Modifier</button>
          <button type="button" onClick={() => setPortal({ kind: 'edit-contact' })}><UserPlus size={15} /> Contact</button>
          <div className={styles.moreAction}>
            <button type="button" aria-expanded={moreOpen} onClick={() => setMoreOpen((value) => !value)}><MoreHorizontal size={17} /> Plus <ChevronDown size={13} /></button>
            {moreOpen ? (
              <div className={styles.moreMenu}>
                <button type="button" onClick={() => setPortal({ kind: 'confidential-note' })}><NotebookPen size={15} /> Note confidentielle</button>
                <button type="button" onClick={() => setPortal({ kind: 'lifecycle' })}><RefreshCcw size={15} /> Transition relationnelle</button>
                <button type="button" data-danger onClick={() => setPortal({ kind: 'archive' })}><Archive size={15} /> Archiver le client</button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className={styles.intelligenceRibbon} aria-label="Intelligence client">
        <MetricCell label="Santé relationnelle" value={`${command.healthScore}/100`} detail="Décomposition explicable" tone={command.healthScore < 60 ? 'critical' : command.healthScore < 80 ? 'warning' : 'success'} onClick={() => selectChapter('overview')} />
        <MetricCell label="Valeur active" value={formatDh(recurringValue)} detail="Valeur mensuelle dérivée" tone={recurringValue > 0 ? 'commercial' : 'neutral'} onClick={() => selectChapter('commercial')} />
        <MetricCell label="Exposition financière" value={formatDh(financialExposure)} detail={`${command.invoices.filter((item) => item.status === 'overdue').length} facture(s) en retard`} tone={financialExposure > 0 ? 'critical' : 'success'} onClick={() => selectChapter('finance')} />
        <MetricCell label="Tenant & produit" value={`${command.tenants.length} / ${command.subscriptions.length}`} detail="Tenants / abonnements" tone={command.tenants.length ? 'info' : 'warning'} onClick={() => selectChapter('product')} />
        <MetricCell label="Pression service" value={`${activeTickets.length} ticket(s) · ${activeIncidents.length} incident(s)`} detail="Signaux actifs" tone={activeIncidents.length ? 'critical' : activeTickets.length ? 'warning' : 'success'} onClick={() => selectChapter('service')} />
        <MetricCell label="Horizon renouvellement" value={primaryRenewal ? formatDate(primaryRenewal.renewal_date) : 'Non formalisé'} detail={primaryRenewal ? humanize(primaryRenewal.status) : 'Source absente'} tone={primaryRenewal?.status === 'at_risk' ? 'critical' : primaryRenewal ? 'commercial' : 'neutral'} onClick={() => selectChapter('renewal')} />
        <MetricCell label="Ownership" value={command.owner} detail={command.sponsor} tone={command.owner.toLowerCase().includes('non attribué') ? 'warning' : 'success'} onClick={() => selectChapter('identity')} />
      </section>

      <nav className={styles.dossierNavigation} aria-label="Chapitres du dossier client">
        {CUSTOMER_CHAPTERS.map((item) => (
          <button key={item.id} type="button" data-active={chapter === item.id} onClick={() => selectChapter(item.id)}>
            <span>{String(CUSTOMER_CHAPTERS.indexOf(item) + 1).padStart(2, '0')}</span>{item.label}
          </button>
        ))}
      </nav>

      {chapter === 'overview' ? (
        <div className={styles.managementLensBar}>
          <span>Lecture de management</span>
          {overviewLenses.map((item) => <button key={item} type="button" data-active={lens === item} onClick={() => setLens(item)}>{item}</button>)}
        </div>
      ) : null}

      <div className={styles.commandCanvas}>
        <aside className={styles.relationshipSpine}>
          <header><span>Relationship spine</span><h2>Cycle client</h2><p>La phase actuelle, la transition suivante et les preuves attendues.</p></header>
          <div className={styles.lifecycleSpine}>
            {lifecycle.map((step) => (
              <button key={`${step.label}-${step.index}`} type="button" data-state={step.state || 'upcoming'} onClick={() => setPortal({ kind: 'lifecycle' })}>
                <span>{String(step.index).padStart(2, '0')}</span>
                <div><strong>{step.label}</strong><p>{step.detail || 'Étape du cycle relationnel.'}</p></div>
              </button>
            ))}
          </div>
          <div className={styles.spineSignals}>
            <button type="button" onClick={() => selectChapter('contacts')}><ContactRound size={16} /><span>Contact principal</span><strong>{command.client.primary_contact_name || 'À configurer'}</strong></button>
            <button type="button" onClick={() => selectChapter('institutions')}><Building2 size={16} /><span>Institutions</span><strong>{command.tenants.length || 'Aucune'}</strong></button>
            <button type="button" onClick={() => selectChapter('service')}><Radar size={16} /><span>Missions actives</span><strong>{command.tasks.filter((task) => !['done', 'cancelled'].includes(String(task.status))).length}</strong></button>
          </div>
        </aside>

        <section id="customer-working-scene" tabIndex={-1} className={styles.workingScene} aria-label={selectedChapter.label}>
          <div className={styles.sceneContextHeader}>
            <div><span>Dossier actif</span><h2>{selectedChapter.label}</h2><p>{chapter === 'overview' ? `Lecture ${lens.toLowerCase()} du dossier client.` : 'Espace de configuration, d’investigation et d’exécution dédié.'}</p></div>
            <span className={styles.sceneState}>{command.sourceState === 'complete' ? 'Données complètes' : command.sourceState === 'partial' ? 'Données partielles' : 'Source indisponible'}</span>
          </div>
          <CustomerDossierScene command={command} chapter={chapter} onPortal={setPortal} onEvidence={openEvidence} />
        </section>

        <aside className={styles.intelligenceRail}>
          <header><span>Customer intelligence rail</span><h2>Situation de management</h2><p>Priorité, responsabilité, échéance et preuves à un seul endroit.</p></header>
          <div className={styles.priorityCommand} data-tone={command.tone}>
            <span>Priorité actuelle</span>
            <strong>{command.primaryRecommendation}</strong>
            <button type="button" onClick={() => setPortal({ kind: 'intervention' })}>Ouvrir la mission <ArrowUpRight size={13} /></button>
          </div>
          <div className={styles.railDefinition}>
            <div><span>Owner</span><strong>{command.owner}</strong></div>
            <div><span>Sponsor</span><strong>{command.sponsor}</strong></div>
            <div><span>Risque</span><StatusToken value={command.riskLabel} /></div>
            <div><span>Prochaine échéance</span><strong>{command.nextDeadline}</strong></div>
          </div>
          <DeadlineSignal label="Renouvellement" date={primaryRenewal?.renewal_date} tone={primaryRenewal?.status === 'at_risk' ? 'critical' : 'commercial'} />
          <div className={styles.railSignals}>
            <button type="button" onClick={() => selectChapter('finance')} data-alert={financialExposure > 0}><BadgeDollarSign size={16} /><div><span>Exposition</span><strong>{formatDh(financialExposure)}</strong></div></button>
            <button type="button" onClick={() => selectChapter('service')} data-alert={activeIncidents.length > 0}><ShieldAlert size={16} /><div><span>Service</span><strong>{activeTickets.length + activeIncidents.length} signal(s)</strong></div></button>
            <button type="button" onClick={() => selectChapter('product')}><Network size={16} /><div><span>Produit</span><strong>{command.tenants.length} tenant(s)</strong></div></button>
          </div>
          <div className={styles.missingEvidence}>
            <span>Preuves & données</span>
            <strong>{command.evidence.length} preuve(s) reliée(s)</strong>
            <p>{command.sources.filter((source) => source.state === 'unavailable').length ? 'Certaines sources sont indisponibles; les valeurs correspondantes ne sont pas remplacées par zéro.' : 'Les sources utilisées sont déclarées et traçables.'}</p>
            <button type="button" onClick={() => setPortal({ kind: 'evidence', evidenceId: command.evidence[0]?.id })}>Explorer les preuves</button>
          </div>
          <div className={styles.latestEvent}>
            <span>Dernier signal</span>
            <strong>{command.lastMeaningfulEvent}</strong>
            <p>{command.timeline[0]?.detail || 'Aucun détail supplémentaire disponible.'}</p>
          </div>
        </aside>
      </div>

      <CustomerActionDock
        chapter={chapter}
        primaryTenant={primaryTenant?.id}
        primarySubscription={primarySubscription?.id}
        primaryRenewal={primaryRenewal?.id}
        onPortal={setPortal}
        onChapter={selectChapter}
      />

      <CustomerDossierPortals command={command} portal={portal} capabilities={capabilities} onClose={() => setPortal(null)} />
    </main>
  )
}

function CustomerActionDock({
  chapter,
  primaryTenant,
  primarySubscription,
  primaryRenewal,
  onPortal,
  onChapter,
}: {
  chapter: CustomerChapterId
  primaryTenant?: string
  primarySubscription?: string
  primaryRenewal?: string
  onPortal: (portal: CustomerPortalState) => void
  onChapter: (chapter: CustomerChapterId) => void
}) {
  const actions: Array<{ label: string; icon: ReactNode; primary?: boolean; href?: string; onClick?: () => void; tone?: 'danger' }> = []
  if (chapter === 'finance') {
    actions.push({ label: 'Ouvrir le compte de facturation', icon: <BadgeDollarSign size={15} />, primary: true, href: '/angelcare-360-operator/billing/accounts' })
    actions.push({ label: 'Examiner les factures', icon: <FileLock2 size={15} />, href: '/angelcare-360-operator/billing/invoices' })
    actions.push({ label: 'Tracer une intervention', icon: <Sparkles size={15} />, onClick: () => onPortal({ kind: 'intervention' }) })
    actions.push({ label: 'Note financière', icon: <NotebookPen size={15} />, onClick: () => onPortal({ kind: 'confidential-note' }) })
  } else if (chapter === 'service') {
    actions.push({ label: 'Créer un ticket', icon: <LifeBuoy size={15} />, primary: true, onClick: () => onPortal({ kind: 'support-ticket' }) })
    actions.push({ label: 'Créer une mission', icon: <Sparkles size={15} />, onClick: () => onPortal({ kind: 'intervention' }) })
    actions.push({ label: 'Voir les incidents', icon: <ShieldAlert size={15} />, href: '/angelcare-360-operator/incidents' })
    actions.push({ label: 'Note de service', icon: <NotebookPen size={15} />, onClick: () => onPortal({ kind: 'confidential-note' }) })
  } else if (chapter === 'identity' || chapter === 'contacts') {
    actions.push({ label: chapter === 'identity' ? 'Modifier le client' : 'Configurer le contact', icon: <Edit3 size={15} />, primary: true, onClick: () => onPortal({ kind: chapter === 'identity' ? 'edit-customer' : 'edit-contact' }) })
    actions.push({ label: 'Gouverner la transition', icon: <RefreshCcw size={15} />, onClick: () => onPortal({ kind: 'lifecycle' }) })
    actions.push({ label: 'Note confidentielle', icon: <NotebookPen size={15} />, onClick: () => onPortal({ kind: 'confidential-note' }) })
    actions.push({ label: 'Archiver', icon: <Archive size={15} />, tone: 'danger', onClick: () => onPortal({ kind: 'archive' }) })
  } else if (chapter === 'product') {
    actions.push({ label: 'Ouvrir le Tenant Twin', icon: <Network size={15} />, primary: true, href: primaryTenant ? `/angelcare-360-operator/tenants/${primaryTenant}` : undefined, onClick: primaryTenant ? undefined : () => onPortal({ kind: 'locked', lockedTitle: 'Tenant indisponible', lockedReason: 'Aucun tenant n’est relié à ce client.' }) })
    actions.push({ label: 'Ouvrir l’abonnement', icon: <BadgeDollarSign size={15} />, href: primarySubscription ? `/angelcare-360-operator/subscriptions/${primarySubscription}` : undefined, onClick: primarySubscription ? undefined : () => onPortal({ kind: 'locked', lockedTitle: 'Abonnement indisponible', lockedReason: 'Aucun abonnement n’est relié à ce client.' }) })
    actions.push({ label: 'Mission configuration', icon: <Sparkles size={15} />, onClick: () => onPortal({ kind: 'intervention' }) })
  } else if (chapter === 'renewal') {
    actions.push({ label: 'Piloter le renouvellement', icon: <CalendarClock size={15} />, primary: true, href: primaryRenewal ? `/angelcare-360-operator/renewals/${primaryRenewal}` : undefined, onClick: primaryRenewal ? undefined : () => onPortal({ kind: 'intervention' }) })
    actions.push({ label: 'Créer une mission de rétention', icon: <Sparkles size={15} />, onClick: () => onPortal({ kind: 'intervention' }) })
    actions.push({ label: 'Examiner la finance', icon: <BadgeDollarSign size={15} />, onClick: () => onChapter('finance') })
  } else {
    actions.push({ label: 'Créer une intervention client', icon: <Sparkles size={15} />, primary: true, onClick: () => onPortal({ kind: 'intervention' }) })
    actions.push({ label: 'Ouvrir le tenant', icon: <Network size={15} />, href: primaryTenant ? `/angelcare-360-operator/tenants/${primaryTenant}` : undefined, onClick: primaryTenant ? undefined : () => onPortal({ kind: 'locked', lockedTitle: 'Tenant indisponible', lockedReason: 'Aucun tenant n’est relié à ce client.' }) })
    actions.push({ label: 'Finance', icon: <BadgeDollarSign size={15} />, onClick: () => onChapter('finance') })
    actions.push({ label: 'Note confidentielle', icon: <NotebookPen size={15} />, onClick: () => onPortal({ kind: 'confidential-note' }) })
  }
  return (
    <div className={styles.customerActionDock}>
      <span className={styles.dockContext}>Commandes · {CUSTOMER_CHAPTERS.find((item) => item.id === chapter)?.label}</span>
      <div>
        {actions.map((action) => action.href ? (
          <Link key={action.label} href={action.href} data-primary={action.primary} data-tone={action.tone}>{action.icon}{action.label}<ArrowUpRight size={13} /></Link>
        ) : (
          <button key={action.label} type="button" data-primary={action.primary} data-tone={action.tone} onClick={action.onClick}>{action.icon}{action.label}</button>
        ))}
      </div>
    </div>
  )
}
