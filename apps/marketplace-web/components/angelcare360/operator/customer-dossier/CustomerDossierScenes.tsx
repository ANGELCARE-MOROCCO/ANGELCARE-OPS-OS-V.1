'use client'

import Link from 'next/link'
import {
  Activity,
  BadgeCheck,
  Banknote,
  Building2,
  CalendarClock,
  CircleDollarSign,
  ContactRound,
  FileCheck2,
  FileText,
  Gauge,
  LifeBuoy,
  Network,
  PackageCheck,
  ReceiptText,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react'
import type {
  Angelcare360OperatorAuditLogRecord,
  Angelcare360OperatorOnboardingTaskRecord,
} from '@/types/angelcare360/operator'
import type { Angelcare360PaymentGateRecord } from '@/types/angelcare360/payment-gates'
import type { Wave2CustomerCommand, Wave2Evidence } from '../wave2/Wave2CommandTypes'
import styles from './CustomerRelationshipCommandRoom.module.css'
import {
  ChapterSection,
  EmptyInstrument,
  EvidenceList,
  FactorArchitecture,
  formatDate,
  formatDateTime,
  formatDh,
  humanize,
  LockedCapability,
  ManagementSignal,
  RelationshipArchitecture,
  StatusToken,
  TimelineArchitecture,
} from './CustomerDossierPrimitives'
import type { CustomerChapterId, CustomerPortalState } from './CustomerDossierContract'
import CustomerProductControlPanel from '../product-kernel/CustomerProductControlPanel'

export type CustomerDetailExtras = {
  onboardingTasks?: Angelcare360OperatorOnboardingTaskRecord[]
  auditLogs?: Angelcare360OperatorAuditLogRecord[]
  paymentGates?: Angelcare360PaymentGateRecord[]
  balance_due_mad?: number | string
}

type SceneProps = {
  command: Wave2CustomerCommand
  chapter: CustomerChapterId
  onPortal: (portal: CustomerPortalState) => void
  onEvidence: (ids: string[]) => void
}

export default function CustomerDossierScene(props: SceneProps) {
  switch (props.chapter) {
    case 'identity': return <IdentityScene {...props} />
    case 'contacts': return <ContactsScene {...props} />
    case 'institutions': return <InstitutionsScene {...props} />
    case 'product': return <ProductScene {...props} />
    case 'commercial': return <CommercialScene {...props} />
    case 'finance': return <FinanceScene {...props} />
    case 'service': return <ServiceScene {...props} />
    case 'renewal': return <RenewalScene {...props} />
    case 'documents': return <DocumentsScene {...props} />
    default: return <OverviewScene {...props} />
  }
}

function OverviewScene({ command, onPortal, onEvidence }: SceneProps) {
  return (
    <div className={styles.sceneStack}>
      <ChapterSection
        eyebrow="Customer operational twin"
        title="Jumeau vivant de la relation AngelCare–client"
        description="Une seule lecture relie valeur, produit, service, finance, rétention et responsabilité managériale."
        action={<button type="button" className={styles.ghostAction} onClick={() => onPortal({ kind: 'intervention' })}><Sparkles size={15} /> Créer une intervention</button>}
      >
        <FactorArchitecture factors={command.factors} onEvidence={onEvidence} />
      </ChapterSection>

      <ChapterSection eyebrow="Operational graph" title="Architecture complète de la relation" description="Chaque objet ouvre son contexte opérationnel sans perdre le dossier client.">
        <RelationshipArchitecture nodes={command.relationships} onOpenEvidence={onEvidence} />
      </ChapterSection>

      <div className={styles.dualScene}>
        <ChapterSection eyebrow="Management history" title="Chronologie probante" description="Les événements significatifs restent liés à leurs preuves.">
          <TimelineArchitecture events={command.timeline.slice(0, 8)} onEvidence={onEvidence} />
        </ChapterSection>
        <ChapterSection eyebrow="Management posture" title="Interventions recommandées" description="Des actions déterministes basées sur les signaux disponibles.">
          <div className={styles.managementStack}>
            <ManagementSignal title={command.primaryRecommendation} detail="Ouvrir une mission structurée, désigner un owner et vérifier le résultat." tone={command.tone} />
            {command.riskLabel !== 'low' ? <ManagementSignal title={`Risque ${humanize(command.riskLabel)}`} detail="Le risque doit être explicitement possédé et relié à une échéance." tone="critical" /> : null}
            {command.owner.toLowerCase().includes('non attribué') ? <ManagementSignal title="Owner relationnel absent" detail="La responsabilité n’est pas déterminée par le backend actuel; l’affectation reste verrouillée." /> : <ManagementSignal icon="check" title="Responsabilité visible" detail={command.owner} tone="success" />}
          </div>
        </ChapterSection>
      </div>
    </div>
  )
}

function IdentityScene({ command, onPortal }: SceneProps) {
  const client = command.client
  const rows = [
    ['Nom commercial', client.display_name],
    ['Raison légale', client.legal_name || 'Non renseignée'],
    ['Type de client', humanize(client.client_type)],
    ['Référence', client.client_code],
    ['Ville', client.city || 'Non renseignée'],
    ['Pays', client.country || 'Maroc'],
    ['Adresse', client.address || 'Non renseignée'],
    ['Source', client.source || 'Non renseignée'],
    ['Création du dossier', formatDate(client.created_at)],
    ['Dernière mise à jour', formatDateTime(client.updated_at)],
  ]
  return (
    <div className={styles.sceneStack}>
      <ChapterSection eyebrow="Institutional identity" title="Identité, classification et autorité relationnelle" description="Les éléments structurants du dossier doivent rester éditables, lisibles et audités." action={<button type="button" className={styles.primaryInlineAction} onClick={() => onPortal({ kind: 'edit-customer' })}>Modifier le client</button>}>
        <div className={styles.definitionGrid}>
          {rows.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
        </div>
      </ChapterSection>
      <div className={styles.dualScene}>
        <ChapterSection eyebrow="Governance" title="Responsabilité de la relation" description="Les propriétaires et sponsors doivent être humanisés par un annuaire opérateur sécurisé.">
          <div className={styles.ownerArchitecture}>
            <div><UserRoundCheck size={20} /><span>Account owner</span><strong>{command.owner}</strong></div>
            <div><BadgeCheck size={20} /><span>Executive sponsor</span><strong>{command.sponsor}</strong></div>
          </div>
          <LockedCapability title="Affectation owner & sponsor verrouillée" detail="Le backend signé stocke des identifiants d’utilisateurs, mais ne fournit pas encore d’annuaire humanisé sûr pour ce dossier. Aucun champ UUID n’est exposé." />
        </ChapterSection>
        <ChapterSection eyebrow="Lifecycle control" title="État et phase relationnelle" description="Toute transition importante doit conserver une raison et une preuve.">
          <div className={styles.stateArchitecture}>
            <div><span>État du client</span><StatusToken value={client.status} /></div>
            <div><span>Phase relationnelle</span><StatusToken value={client.lifecycle_stage} /></div>
            <div><span>Santé déclarée</span><StatusToken value={client.health_status || 'non renseignée'} /></div>
            <div><span>Niveau de risque</span><StatusToken value={client.risk_level || command.riskLabel} /></div>
          </div>
          <button type="button" className={styles.secondaryInlineAction} onClick={() => onPortal({ kind: 'lifecycle' })}><RefreshCcw size={15} /> Gouverner la transition</button>
        </ChapterSection>
      </div>
    </div>
  )
}

function ContactsScene({ command, onPortal }: SceneProps) {
  const client = command.client
  const hasContact = Boolean(client.primary_contact_name || client.primary_contact_email || client.primary_contact_phone)
  return (
    <div className={styles.sceneStack}>
      <ChapterSection eyebrow="Decision-maker architecture" title="Contact principal et influence relationnelle" description="Le contact principal est éditable avec les champs réellement persistés par l’API client." action={<button type="button" className={styles.primaryInlineAction} onClick={() => onPortal({ kind: 'edit-contact' })}>{hasContact ? 'Configurer le contact' : 'Ajouter le contact principal'}</button>}>
        {hasContact ? (
          <div className={styles.contactCommandCard}>
            <div className={styles.contactAvatar}><ContactRound size={28} /></div>
            <div className={styles.contactIdentity}>
              <span>Contact principal</span>
              <h3>{client.primary_contact_name || 'Nom non renseigné'}</h3>
              <p>{client.primary_contact_email || 'Email non renseigné'}</p>
              <p>{client.primary_contact_phone || 'Téléphone non renseigné'}</p>
            </div>
            <div className={styles.contactSignals}>
              <span>Autorité décisionnelle</span><strong>À qualifier</strong>
              <span>Dernière interaction</span><strong>{command.lastMeaningfulEvent}</strong>
            </div>
          </div>
        ) : <EmptyInstrument title="Aucun contact principal" detail="Ajoutez le premier point de responsabilité client afin de sécuriser la relation, la facturation et le renouvellement." />}
      </ChapterSection>
      <ChapterSection eyebrow="Influence map" title="Registre multi-contacts et décideurs" description="La relation globale exige plusieurs rôles: finance, opérationnel, contrat, renouvellement et direction.">
        <LockedCapability title="Registre multi-contacts non présent dans le backend signé" detail="Cette page n’invente pas de contacts secondaires. Une table relationnelle, des permissions et un audit dédiés sont requis avant activation." />
        <div className={styles.futureRoleGrid}>
          {['Décideur exécutif', 'Autorité contractuelle', 'Contact finance', 'Administrateur tenant', 'Responsable renouvellement', 'Sponsor opérationnel'].map((role) => <div key={role}><UsersRound size={17} /><span>{role}</span><strong>À configurer</strong></div>)}
        </div>
      </ChapterSection>
    </div>
  )
}

function InstitutionsScene({ command }: SceneProps) {
  return (
    <div className={styles.sceneStack}>
      <ChapterSection eyebrow="Institution topology" title="Institutions et environnements servis" description="Le backend signé ne fournit pas un registre autonome d’institutions Operator; les tenants existants constituent les points d’exploitation vérifiables.">
        {command.tenants.length ? (
          <div className={styles.institutionGrid}>
            {command.tenants.map((tenant) => (
              <Link key={tenant.id} href={`/angelcare-360-operator/tenants/${tenant.id}`} className={styles.institutionCard}>
                <span className={styles.institutionIcon}><Building2 size={21} /></span>
                <div><span>Environnement institutionnel</span><h3>{tenant.tenant_slug}</h3><p>{humanize(tenant.environment)} · {tenant.command_center_url || 'URL non renseignée'}</p></div>
                <div className={styles.institutionMeta}><StatusToken value={tenant.status} /><strong>{humanize(tenant.provisioning_status)}</strong></div>
              </Link>
            ))}
          </div>
        ) : <EmptyInstrument title="Aucune institution opérationnelle" detail="Aucun tenant n’est encore relié à ce client. Le provisioning doit être effectué depuis Tenants & Produit." />}
      </ChapterSection>
      <ChapterSection eyebrow="Institution registry" title="Gouvernance multi-sites" description="La création d’une institution indépendante doit rester cohérente avec les écoles, sites, tenants et responsables.">
        <LockedCapability title="Création d’institution verrouillée" detail="Aucune API Operator d’institution n’existe dans le contrat signé. Le dossier expose seulement les environnements réellement persistés." />
      </ChapterSection>
    </div>
  )
}

function ProductScene({ command }: SceneProps) {
  return (
    <div className={styles.sceneStack}>
      <CustomerProductControlPanel clientId={command.client.id} />
    </div>
  )
}

function CommercialScene({ command, onEvidence }: SceneProps) {
  const commercialNodes = command.relationships.filter((node) => ['subscription', 'contract', 'renewal'].includes(node.kind))
  return (
    <div className={styles.sceneStack}>
      <ChapterSection eyebrow="Commercial architecture" title="Abonnements, contrats et valeur engagée" description="Les engagements commerciaux doivent rester reliés à leur exécution et à leur renouvellement.">
        <RelationshipArchitecture nodes={commercialNodes} onOpenEvidence={onEvidence} />
      </ChapterSection>
      <div className={styles.dualScene}>
        <ChapterSection eyebrow="Contract register" title="Contrats actifs et historiques" description="Échéance, signature et document source.">
          <div className={styles.recordTable}>
            <div className={styles.recordTableHead}><span>Contrat</span><span>État</span><span>Échéance</span></div>
            {command.contracts.map((contract) => <div key={contract.id}><strong>{contract.contract_code}</strong><StatusToken value={contract.status} /><span>{formatDate(contract.end_date || contract.renewal_date)}</span></div>)}
            {!command.contracts.length ? <EmptyInstrument title="Aucun contrat" detail="Aucun contrat n’est disponible dans le dossier." /> : null}
          </div>
        </ChapterSection>
        <ChapterSection eyebrow="Commercial position" title="Situation de valeur" description="Valeur active, remises et horizon.">
          <div className={styles.commercialSummary}>
            <div><CircleDollarSign size={18} /><span>Valeur récurrente</span><strong>{formatDh(command.subscriptions.filter((s) => s.status === 'active').reduce((sum, s) => sum + Number(s.billing_amount_mad || 0), 0))}</strong></div>
            <div><ReceiptText size={18} /><span>Remises actives</span><strong>{formatDh(command.subscriptions.reduce((sum, s) => sum + Number(s.discount_amount_mad || 0), 0))}</strong></div>
            <div><CalendarClock size={18} /><span>Prochaine échéance</span><strong>{command.nextDeadline}</strong></div>
          </div>
        </ChapterSection>
      </div>
    </div>
  )
}

function FinanceScene({ command, onEvidence }: SceneProps) {
  const extras = command.client as typeof command.client & CustomerDetailExtras
  const totalInvoiced = command.invoices.reduce((sum, item) => sum + Number(item.total_mad || 0), 0)
  const totalPaid = command.payments.filter((item) => item.status === 'confirmed').reduce((sum, item) => sum + Number(item.amount_mad || 0), 0)
  const overdue = command.invoices.filter((item) => item.status === 'overdue').reduce((sum, item) => sum + Number(item.balance_due_mad || 0), 0)
  return (
    <div className={styles.sceneStack}>
      <ChapterSection eyebrow="Financial command" title="Position financière consolidée" description="Chaque valeur mène à sa facture, son paiement ou son contrôle d’accès.">
        <div className={styles.financeCommandBand}>
          <div><span>Facturé</span><strong>{formatDh(totalInvoiced)}</strong></div>
          <div><span>Payé confirmé</span><strong>{formatDh(totalPaid)}</strong></div>
          <div data-alert={overdue > 0}><span>En retard</span><strong>{formatDh(overdue)}</strong></div>
          <div data-alert={Number(extras.balance_due_mad || 0) > 0}><span>Exposition totale</span><strong>{formatDh(extras.balance_due_mad)}</strong></div>
        </div>
      </ChapterSection>
      <div className={styles.dualScene}>
        <ChapterSection eyebrow="Invoice register" title="Factures récentes" description="État, échéance et solde restant.">
          <div className={styles.recordTable}>
            <div className={styles.recordTableHead}><span>Facture</span><span>État</span><span>Solde</span></div>
            {command.invoices.map((invoice) => <Link key={invoice.id} href="/angelcare-360-operator/billing/invoices"><strong>{invoice.invoice_number}</strong><StatusToken value={invoice.status} /><span>{formatDh(invoice.balance_due_mad)}</span></Link>)}
            {!command.invoices.length ? <EmptyInstrument title="Aucune facture" detail="Aucun document de facturation n’est disponible." /> : null}
          </div>
        </ChapterSection>
        <ChapterSection eyebrow="Payment register" title="Paiements récents" description="Référence, date, méthode et confirmation.">
          <div className={styles.recordTable}>
            <div className={styles.recordTableHead}><span>Paiement</span><span>État</span><span>Montant</span></div>
            {command.payments.map((payment) => <Link key={payment.id} href="/angelcare-360-operator/billing/payments"><strong>{payment.payment_reference}</strong><StatusToken value={payment.status} /><span>{formatDh(payment.amount_mad)}</span></Link>)}
            {!command.payments.length ? <EmptyInstrument title="Aucun paiement" detail="Aucun encaissement n’est disponible." /> : null}
          </div>
        </ChapterSection>
      </div>
      <ChapterSection eyebrow="Payment gates" title="Restrictions et contrôles de paiement" description="Les gates actives exposent leur montant, leur raison et leur caractère bloquant.">
        {(extras.paymentGates || []).length ? <div className={styles.gateGrid}>{(extras.paymentGates || []).map((gate) => <div key={gate.id} data-blocking={gate.blocking}><ShieldAlert size={18} /><div><span>{gate.gate_code}</span><strong>{formatDh(gate.amount_due_mad)}</strong><p>{gate.reason}</p></div><StatusToken value={gate.status} /></div>)}</div> : <EmptyInstrument title="Aucun payment gate actif" detail="Aucune restriction financière active n’est remontée pour ce client." />}
      </ChapterSection>
      <ChapterSection eyebrow="Financial evidence" title="Preuves financières" description="Factures, paiements et engagements disponibles.">
        <EvidenceList evidence={command.evidence.filter((item) => item.type === 'financial')} onSelect={(id) => onEvidence([id])} />
      </ChapterSection>
    </div>
  )
}

function ServiceScene({ command, onPortal }: SceneProps) {
  const extras = command.client as typeof command.client & CustomerDetailExtras
  return (
    <div className={styles.sceneStack}>
      <ChapterSection eyebrow="Service pressure" title="Assistance, incidents et expérience client" description="Le support devient une chaîne de résolution et non une simple liste." action={<button type="button" className={styles.primaryInlineAction} onClick={() => onPortal({ kind: 'support-ticket' })}>Créer un ticket</button>}>
        <div className={styles.serviceCommandBand}>
          <div><LifeBuoy size={19} /><span>Tickets ouverts</span><strong>{command.tickets.filter((ticket) => !['resolved', 'closed', 'archived'].includes(String(ticket.status))).length}</strong></div>
          <div><ShieldAlert size={19} /><span>Incidents actifs</span><strong>{command.incidents.filter((incident) => !['resolved', 'archived'].includes(String(incident.status))).length}</strong></div>
          <div><Activity size={19} /><span>Actions actives</span><strong>{command.tasks.filter((task) => !['done', 'cancelled'].includes(String(task.status))).length}</strong></div>
          <div><Gauge size={19} /><span>Onboarding ouvert</span><strong>{(extras.onboardingTasks || []).filter((task) => !['done', 'cancelled'].includes(String(task.status))).length}</strong></div>
        </div>
      </ChapterSection>
      <div className={styles.dualScene}>
        <ChapterSection eyebrow="Support register" title="Tickets support" description="Sujet, priorité, état et responsabilité.">
          <div className={styles.compactRecordList}>
            {command.tickets.map((ticket) => <Link key={ticket.id} href="/angelcare-360-operator/support"><span><LifeBuoy size={16} /></span><div><strong>{ticket.subject}</strong><small>{humanize(ticket.category)} · {humanize(ticket.priority)}</small></div><StatusToken value={ticket.status} /></Link>)}
            {!command.tickets.length ? <EmptyInstrument title="Aucun ticket" detail="Aucune demande support n’est enregistrée." /> : null}
          </div>
        </ChapterSection>
        <ChapterSection eyebrow="Incident register" title="Incidents" description="Impact, sévérité, état et chronologie.">
          <div className={styles.compactRecordList}>
            {command.incidents.map((incident) => <Link key={incident.id} href={`/angelcare-360-operator/incidents/${incident.id}`}><span><ShieldAlert size={16} /></span><div><strong>{incident.title}</strong><small>Début {formatDateTime(incident.started_at)}</small></div><StatusToken value={incident.status} tone={incident.severity === 'critical' ? 'critical' : undefined} /></Link>)}
            {!command.incidents.length ? <EmptyInstrument title="Aucun incident" detail="Aucun incident client n’est enregistré." /> : null}
          </div>
        </ChapterSection>
      </div>
      <ChapterSection eyebrow="Execution field" title="Actions, onboarding et rétablissement" description="Les engagements opérationnels restent reliés au résultat attendu.">
        <div className={styles.executionGrid}>
          {command.tasks.map((task) => <div key={task.id}><span><Activity size={16} /></span><div><strong>{task.title}</strong><p>{task.description || 'Aucune description.'}</p><small>Échéance {formatDate(task.due_date)} · {humanize(task.priority)}</small></div><StatusToken value={task.status} /></div>)}
          {(extras.onboardingTasks || []).map((task) => <div key={task.id}><span><Gauge size={16} /></span><div><strong>{task.title}</strong><p>{task.description || 'Étape d’onboarding.'}</p><small>Échéance {formatDate(task.due_date)} · {humanize(task.priority)}</small></div><StatusToken value={task.status} /></div>)}
          {!command.tasks.length && !(extras.onboardingTasks || []).length ? <EmptyInstrument title="Aucune mission active" detail="Créez une intervention client pour formaliser l’objectif, l’échéance et la preuve." /> : null}
        </div>
      </ChapterSection>
    </div>
  )
}

function RenewalScene({ command, onPortal }: SceneProps) {
  return (
    <div className={styles.sceneStack}>
      <ChapterSection eyebrow="Retention horizon" title="Renouvellement, négociation et expansion" description="La stratégie doit réunir santé, adoption, paiement, service et valeur." action={command.renewals[0] ? <Link className={styles.primaryInlineAction} href={`/angelcare-360-operator/renewals/${command.renewals[0].id}`}>Ouvrir la stratégie</Link> : <button type="button" className={styles.primaryInlineAction} onClick={() => onPortal({ kind: 'intervention' })}>Créer une mission de renouvellement</button>}>
        <div className={styles.renewalHorizon}>
          <CalendarClock size={28} />
          <div><span>Prochaine échéance</span><h3>{command.nextDeadline}</h3><p>{command.renewals.length ? `${command.renewals.length} renouvellement(s) dans le dossier.` : 'Aucun renouvellement formalisé.'}</p></div>
          <div><span>Valeur active</span><strong>{formatDh(command.financialValueDh)}</strong></div>
        </div>
      </ChapterSection>
      <div className={styles.dualScene}>
        <ChapterSection eyebrow="Renewal register" title="Missions de renouvellement" description="État, probabilité déclarée et valeur attendue.">
          <div className={styles.compactRecordList}>
            {command.renewals.map((renewal) => <Link key={renewal.id} href={`/angelcare-360-operator/renewals/${renewal.id}`}><span><RefreshCcw size={16} /></span><div><strong>{formatDate(renewal.renewal_date)}</strong><small>Probabilité {renewal.probability ?? 'indisponible'}% · {formatDh(renewal.expected_amount_mad)}</small></div><StatusToken value={renewal.status} /></Link>)}
            {!command.renewals.length ? <EmptyInstrument title="Aucun renouvellement formalisé" detail="Créez une mission d’intervention; le backend signé ne fournit pas une opération de création de renouvellement depuis ce dossier." /> : null}
          </div>
        </ChapterSection>
        <ChapterSection eyebrow="Growth readiness" title="Facteurs de rétention et croissance" description="Les signaux restent explicables et liés à leurs preuves.">
          <FactorArchitecture factors={command.factors.filter((factor) => ['renewal', 'adoption', 'relationship', 'finance', 'service'].includes(factor.id))} onEvidence={() => undefined} />
        </ChapterSection>
      </div>
      <ChapterSection eyebrow="Expansion architecture" title="Opportunités d’expansion" description="L’expansion peut porter sur un site, un tenant, un package ou une capacité supplémentaire.">
        <LockedCapability title="Moteur d’opportunités d’expansion non persisté" detail="Le backend signé ne fournit pas encore un registre commercial d’opportunités lié au Customer Dossier. Une mission de service peut documenter l’évaluation sans simuler un pipeline." />
      </ChapterSection>
    </div>
  )
}

function DocumentsScene({ command, onEvidence }: SceneProps) {
  const extras = command.client as typeof command.client & CustomerDetailExtras
  const auditEvidence: Wave2Evidence[] = command.evidence.filter((item) => ['audit', 'contract', 'communication'].includes(item.type))
  return (
    <div className={styles.sceneStack}>
      <ChapterSection eyebrow="Document vault" title="Documents, preuves et engagements" description="Le dossier distingue les documents contractuels, les notes internes et les preuves opérationnelles.">
        <div className={styles.documentGrid}>
          {command.contracts.map((contract) => <div key={contract.id}><span><FileCheck2 size={20} /></span><div><strong>{contract.contract_code}</strong><p>{humanize(contract.status)} · {formatDate(contract.start_date)} → {formatDate(contract.end_date)}</p></div>{contract.document_url ? <a href={contract.document_url} target="_blank" rel="noreferrer">Ouvrir</a> : <small>Document indisponible</small>}</div>)}
          {command.notes.map((note) => <button key={note.id} type="button" onClick={() => onEvidence([`note-${note.id}`])}><span><FileText size={20} /></span><div><strong>{humanize(note.note_type)}</strong><p>{note.body}</p></div><StatusToken value={note.visibility} /></button>)}
          {!command.contracts.length && !command.notes.length ? <EmptyInstrument title="Aucun document ou note" detail="Ajoutez une note confidentielle ou rattachez un contrat depuis les espaces dédiés." /> : null}
        </div>
      </ChapterSection>
      <ChapterSection eyebrow="Forensic audit" title="Traçabilité des changements" description="Acteur, module, action, sévérité et date restent visibles sans exposer d’identifiants techniques comme libellés.">
        {(extras.auditLogs || []).length ? (
          <div className={styles.auditGrid}>
            {(extras.auditLogs || []).map((event) => <div key={event.id}><span><ShieldAlert size={16} /></span><div><strong>{humanize(event.action)}</strong><p>{humanize(event.module)} · {humanize(event.entity_type)}</p><small>{formatDateTime(event.created_at)} · {event.actor_role ? humanize(event.actor_role) : 'Acteur authentifié'}</small></div><StatusToken value={event.severity} /></div>)}
          </div>
        ) : <EmptyInstrument title="Aucun audit disponible" detail="Aucun événement auditable n’a été remonté par la source actuelle." />}
      </ChapterSection>
      <ChapterSection eyebrow="Evidence explorer" title="Preuves reliées au dossier" description="Chaque preuve conserve sa source et son état de vérification.">
        <EvidenceList evidence={auditEvidence.length ? auditEvidence : command.evidence.slice(0, 8)} onSelect={(id) => onEvidence([id])} />
      </ChapterSection>
    </div>
  )
}
