'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowLeft, ArrowRight, BadgeDollarSign, BookOpenCheck, Building2, CalendarClock,
  CheckCircle2, CircleDollarSign, ClipboardCheck, ContactRound, FileSearch, FileSignature, Gauge, HeartHandshake,
  Landmark, Layers3, Mail, MessageSquareWarning, Network, PackageCheck, Pencil, Plus, Receipt, RefreshCcw, Search,
  ShieldCheck, Siren, Sparkles, Target, TrendingUp, UserRoundCog, UsersRound, X,
} from 'lucide-react'
import OperatorOverlayPortal from '../OperatorOverlayPortal'
import CustomerProductControlPanel from '../product-kernel/CustomerProductControlPanel'
import TenantIdentityAccessCommand from '../tenant-access/TenantIdentityAccessCommand'
import CustomerCorrespondenceCommand from '../email-command/CustomerCorrespondenceCommand'
import CorporateControlLayer from './CorporateControlLayer'
import CustomerBrandGovernancePanel from '../branding/CustomerBrandGovernancePanel'
import type { GrowthWorkspaceSnapshot } from '@/types/angelcare360/operator/growth'
import { CASE_STATUS_LABELS, CASE_TYPE_LABELS, CUSTOMER_DOSSIER_SECTIONS } from './GrowthContract'
import type { GrowthEntityType, GrowthPortalState } from './GrowthPortal'
import styles from './GrowthOperatingSystem.module.css'

type Open = (entity: GrowthEntityType, mode: GrowthPortalState['mode'], record?: Record<string, unknown> | null) => void

type Props = {
  client: Record<string, unknown>
  snapshot: GrowthWorkspaceSnapshot
  onClose: () => void
  open: Open
  onRefresh: () => void
}

export default function CustomerSovereignCommandRoom({ client, snapshot, onClose, open, onRefresh }: Props) {
  const [section, setSection] = useState<(typeof CUSTOMER_DOSSIER_SECTIONS)[number][0]>('overview')
  const [query, setQuery] = useState('')
  const id = text(client.id)
  const context = useMemo(() => buildClientContext(id, snapshot), [id, snapshot])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  const headline = [
    `${context.subscriptions.length} abonnement(s)`, `${context.tenants.length} tenant(s)`,
    `${money(context.activeMrr)} MRR`, `${money(context.overdue)} exposés`, `${context.openCases.length} cas ouvert(s)`,
  ].join(' · ')

  return (
    <OperatorOverlayPortal>
      <div className={styles.customerRoomBackdrop} role="dialog" aria-modal="true" aria-label={`Dossier ${text(client.display_name)}`}>
      <section className={styles.customerRoom}>
        <header className={styles.customerCrown}>
          <div className={styles.customerCrownIdentity}>
            <button type="button" className={styles.crownBack} onClick={onClose}><ArrowLeft size={17}/>Portefeuille</button>
            <div className={styles.customerMonogram}>{initials(text(client.display_name))}</div>
            <div>
              <span>Customer Sovereign Command Room</span>
              <h1>{text(client.display_name) || 'Client sans nom'}</h1>
              <p>{text(client.client_type) || 'Institution'} · {text(client.city) || 'Ville non renseignée'} · {text(client.client_code) || 'Référence interne'}</p>
            </div>
          </div>
          <div className={styles.customerCrownActions}>
            <button type="button" onClick={() => open('client', 'edit', client)}><Pencil size={15}/>Modifier</button>
            <button type="button" onClick={() => open('contact', 'create', { client_id: id })}><UsersRound size={15}/>Contact</button>
            <button type="button" onClick={() => open('case', 'create', { client_id: id, case_type: 'support_ticket' })}><MessageSquareWarning size={15}/>Nouveau cas</button>
            <button type="button" data-primary onClick={() => open('intervention', 'create', { client_id: id, title: `Intervention · ${text(client.display_name)}` })}><Siren size={15}/>Intervenir</button>
            <button type="button" aria-label="Fermer" className={styles.crownClose} onClick={onClose}><X size={18}/></button>
          </div>
          <div className={styles.customerHeadline}>{headline}</div>
        </header>

        <div className={styles.customerTruthRibbon}>
          <TruthSignal label="Santé relation" value={human(text(client.health_status) || 'non mesurée')} detail={`Risque ${human(text(client.risk_level) || 'inconnu')}`} tone={riskTone(text(client.risk_level))}/>
          <TruthSignal label="Valeur active" value={money(context.activeMrr)} detail={`${context.subscriptions.filter((item) => text(item.status) === 'active').length} abonnement(s) actif(s)`} tone="good"/>
          <TruthSignal label="Exposition" value={money(context.overdue)} detail={`${context.openInvoices.length} facture(s) ouverte(s)`} tone={context.overdue ? 'critical' : 'good'}/>
          <TruthSignal label="Pression cas" value={String(context.openCases.length + context.legacyTickets.length + context.legacyIncidents.length)} detail={`${context.complaints.length} réclamation(s)`} tone={context.openCases.length ? 'warning' : 'good'}/>
          <TruthSignal label="Renouvellement" value={context.nextRenewal ? dateLabel(context.nextRenewal.renewal_date) : 'Non planifié'} detail={context.nextRenewal ? `${daysUntil(context.nextRenewal.renewal_date)} jours` : 'Créer une stratégie'} tone={context.nextRenewal && daysUntil(context.nextRenewal.renewal_date) < 120 ? 'warning' : 'neutral'}/>
          <TruthSignal label="Couverture influence" value={`${context.contacts.length} contact(s)`} detail={`${context.contacts.filter((item) => item.decision_authority === 'final_authority').length} autorité finale`} tone={context.contacts.length ? 'good' : 'critical'}/>
        </div>

        <div className={styles.customerRoomGrid}>
          <aside className={styles.customerSpine}>
            <div className={styles.spineTop}>
              <span>Dossier client</span>
              <strong>{String(CUSTOMER_DOSSIER_SECTIONS.findIndex(([key]) => key === section) + 1).padStart(2, '0')} / {CUSTOMER_DOSSIER_SECTIONS.length}</strong>
            </div>
            <nav>
              {CUSTOMER_DOSSIER_SECTIONS.map(([key, label], index) => (
                <button key={key} type="button" data-active={section === key} onClick={() => setSection(key)}>
                  <span>{String(index + 1).padStart(2, '0')}</span><strong>{label}</strong><ArrowRight size={14}/>
                </button>
              ))}
            </nav>
            <div className={styles.spineContext}>
              <span>Contexte épinglé</span>
              <strong>{text(client.display_name)}</strong>
              <small>{context.tenants.length} tenant(s) · {context.contracts.length} contrat(s)</small>
            </div>
          </aside>

          <main className={styles.customerWorkingScene}>
            <header className={styles.customerSceneHeader}>
              <div><span>{CUSTOMER_DOSSIER_SECTIONS.find(([key]) => key === section)?.[1]}</span><h2>{sectionTitle(section)}</h2><p>{sectionPurpose(section)}</p></div>
              <label><Search size={15}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher dans le dossier…"/></label>
            </header>
            {section === 'overview' ? <OverviewScene client={client} context={context} snapshot={snapshot} open={open}/> : null}
            {section === 'identity' ? <IdentityScene client={client} context={context} open={open}/> : null}
            {section === 'influence' ? <InfluenceScene context={context} query={query} open={open}/> : null}
            {section === 'institutions' ? <InstitutionsScene context={context} query={query} open={open} clientId={id}/> : null}
            {section === 'strategy' ? <StrategyScene context={context} open={open} clientId={id}/> : null}
            {section === 'offers' ? <OffersScene context={context} query={query} open={open} clientId={id}/> : null}
            {section === 'contracts' ? <ContractsScene context={context} open={open}/> : null}
            {section === 'product' ? <div style={{display:'grid',gap:18}}><CustomerProductControlPanel clientId={id}/><TenantIdentityAccessCommand clientId={id} compact title="Administrateurs & accès client"/></div> : null}
            {section === 'finance' ? <FinanceScene context={context} open={open}/> : null}
            {section === 'correspondence' ? <CustomerCorrespondenceCommand clientId={id}/> : null}
            {section === 'cases' ? <CasesScene context={context} query={query} open={open} clientId={id}/> : null}
            {section === 'service' ? <ServiceScene context={context} open={open} clientId={id}/> : null}
            {section === 'renewal' ? <RenewalScene context={context} open={open} clientId={id}/> : null}
            {section === 'audit' ? <AuditScene context={context}/> : null}
            {corporateEmphasis(section) ? <CorporateControlLayer snapshot={snapshot} open={open} clientId={id} compact emphasis={corporateEmphasis(section) || undefined}/> : null}
          </main>

          <aside className={styles.customerIntelligenceRail}>
            <section className={styles.priorityCard}>
              <span>Management priority</span>
              <strong>{priorityTitle(context)}</strong>
              <p>{priorityReason(context)}</p>
              <button type="button" onClick={() => open('intervention', 'create', { client_id: id, title: priorityTitle(context) })}>Créer la mission<ArrowRight size={14}/></button>
            </section>
            <RailBlock title="Décisions requises" icon={<ClipboardCheck size={16}/>}>
              <RailItem label="Owner" value={text(client.account_manager_id) ? 'Attribué' : 'À attribuer'} tone={text(client.account_manager_id) ? 'good' : 'warning'}/>
              <RailItem label="Renouvellement" value={context.nextRenewal ? dateLabel(context.nextRenewal.renewal_date) : 'Non planifié'} tone={context.nextRenewal ? 'neutral' : 'warning'}/>
              <RailItem label="Cas critiques" value={String(context.openCases.filter((item) => item.severity === 'critical').length)} tone={context.openCases.some((item) => item.severity === 'critical') ? 'critical' : 'good'}/>
            </RailBlock>
            <RailBlock title="Relationship radar" icon={<Network size={16}/>}>
              <RailItem label="Contacts" value={String(context.contacts.length)} tone={context.contacts.length ? 'good' : 'warning'}/>
              <RailItem label="Institutions" value={String(context.institutions.length)} tone={context.institutions.length ? 'good' : 'neutral'}/>
              <RailItem label="Interactions 90j" value={String(context.interactions.filter((item) => daysSince(item.occurred_at) <= 90).length)} tone="neutral"/>
            </RailBlock>
            <RailBlock title="Derniers signaux" icon={<Activity size={16}/>}>
              {context.timeline.slice(0, 5).map((item, index) => <div className={styles.railTimeline} key={`${item.kind}-${index}`}><i data-tone={item.tone}/><div><strong>{item.title}</strong><span>{item.detail}</span></div></div>)}
              {!context.timeline.length ? <p className={styles.railEmpty}>Aucun signal récent.</p> : null}
            </RailBlock>
          </aside>
        </div>

        <footer className={styles.customerCommandDock}>
          <div><span>Commande contextuelle</span><strong>{dockLabel(section)}</strong></div>
          <div>{dockActions(section, id, client, open, onRefresh)}</div>
        </footer>
      </section>
      </div>
    </OperatorOverlayPortal>
  )
}

type Context = ReturnType<typeof buildClientContext>

function OverviewScene({ client, context, snapshot, open }: { client: Record<string, unknown>; context: Context; snapshot: GrowthWorkspaceSnapshot; open: Open }) {
  const pillars = [
    { label: 'Commercial', value: money(context.pipeline), detail: `${context.opportunities.length} opportunité(s)`, icon: <Target/> },
    { label: 'Produit', value: `${context.tenants.length} tenant(s)`, detail: `${context.subscriptions.length} abonnement(s)`, icon: <PackageCheck/> },
    { label: 'Finance', value: money(context.overdue), detail: `${context.openInvoices.length} exposition(s)`, icon: <CircleDollarSign/> },
    { label: 'Service', value: String(context.openCases.length + context.legacyTickets.length), detail: 'Cas et tickets ouverts', icon: <HeartHandshake/> },
  ]
  return <div className={styles.overviewScene}>
    <section className={styles.relationshipTwin}>
      <div className={styles.twinCore}><div className={styles.twinOrbit}><span>{initials(text(client.display_name))}</span></div><div><span>Relationship core</span><h3>{text(client.display_name)}</h3><p>Une seule représentation connectée aux institutions, contacts, contrats, tenants, finances et cas clients.</p></div></div>
      <div className={styles.twinPillars}>{pillars.map((item) => <button type="button" key={item.label} onClick={() => item.label === 'Service' ? open('case', 'create', { client_id: client.id }) : undefined}><span>{item.icon}</span><div><small>{item.label}</small><strong>{item.value}</strong><em>{item.detail}</em></div></button>)}</div>
      <div className={styles.relationshipFlow}>
        {['Opportunité','Offre','Contrat','Abonnement','Tenant','Adoption','Renouvellement','Expansion'].map((step, index) => <div key={step} data-active={relationshipStep(context) >= index}><span>{String(index + 1).padStart(2, '0')}</span><strong>{step}</strong></div>)}
      </div>
    </section>
    <section className={styles.overviewLower}>
      <div className={styles.healthDecomposition}><SectionTitle eyebrow="Explainable health" title="Santé relationnelle"/><div className={styles.healthWheel}><div><strong>{healthScore(client, context)}</strong><span>/100</span></div></div><div className={styles.healthFactors}><HealthFactor label="Finance" score={context.overdue ? 42 : 88}/><HealthFactor label="Produit" score={context.tenants.length ? 82 : 38}/><HealthFactor label="Service" score={context.openCases.length ? 54 : 90}/><HealthFactor label="Relation" score={Math.min(95, 35 + context.contacts.length * 12)}/></div></div>
      <div className={styles.missionBoard}><SectionTitle eyebrow="Active missions" title="Interventions & engagements"/>{context.interventions.slice(0, 5).map((item) => <button key={item.id} type="button" onClick={() => open('intervention', 'edit', item as unknown as Record<string, unknown>)}><i data-priority={item.priority}/><div><strong>{item.title}</strong><span>{human(item.status)} · {dateLabel(item.due_date)}</span></div><ArrowRight size={14}/></button>)}{!context.interventions.length ? <EmptyState title="Aucune mission active" detail="Créer une intervention à partir d’un risque ou d’une priorité."/> : null}</div>
      <div className={styles.eventChronology}><SectionTitle eyebrow="Significant chronology" title="Événements récents"/>{context.timeline.slice(0, 7).map((item, index) => <div key={`${item.kind}-${index}`}><i data-tone={item.tone}/><div><strong>{item.title}</strong><span>{item.detail}</span></div><time>{item.date}</time></div>)}</div>
    </section>
  </div>
}

function IdentityScene({ client, context, open }: { client: Record<string, unknown>; context: Context; open: Open }) {
  const fields: Array<[string, unknown]> = [['Nom commercial', client.display_name], ['Raison sociale', client.legal_name], ['Code client', client.client_code], ['Type', client.client_type], ['Ville', client.city], ['Pays', client.country], ['Cycle', client.lifecycle_stage], ['Risque', client.risk_level]]
  return <div className={styles.identityScene}><section className={styles.institutionalProfile}><SectionTitle eyebrow="Institutional profile" title="Identité, propriété & gouvernance"/><div className={styles.profileGrid}>{fields.map(([label, value]) => <div key={label}><span>{label}</span><strong>{human(text(value) || 'Non renseigné')}</strong></div>)}</div><div className={styles.profileActions}><button type="button" data-primary onClick={() => open('client', 'edit', client)}><Pencil size={15}/>Modifier le dossier</button><button type="button" onClick={() => open('interaction', 'create', { client_id: client.id, interaction_type: 'governance_review', subject: 'Revue de gouvernance' })}><ClipboardCheck size={15}/>Revue gouvernance</button></div></section><section className={styles.governanceMatrix}><SectionTitle eyebrow="Authority architecture" title="Gouvernance de la relation"/><GovernanceRow label="Account owner" value={text(client.account_manager_id) || 'Non attribué'} state={text(client.account_manager_id) ? 'good' : 'warning'}/><GovernanceRow label="Sponsor exécutif" value={text(client.executive_sponsor_id) || 'Non attribué'} state={text(client.executive_sponsor_id) ? 'good' : 'warning'}/><GovernanceRow label="Contact principal" value={context.contacts.find((item) => item.is_primary)?.full_name || 'Non défini'} state={context.contacts.some((item) => item.is_primary) ? 'good' : 'warning'}/><GovernanceRow label="Autorité contractuelle" value={context.contacts.find((item) => item.role_type === 'contract_authority')?.full_name || 'Manquante'} state={context.contacts.some((item) => item.role_type === 'contract_authority') ? 'good' : 'critical'}/></section><CustomerBrandGovernancePanel clientId={text(client.id)}/></div>
}

function InfluenceScene({ context, query, open }: { context: Context; query: string; open: Open }) {
  const rows = context.contacts.filter((item) => !query || [item.full_name, item.job_title, item.role_type, item.institution_name].some((value) => text(value).toLowerCase().includes(query.toLowerCase())))
  return <div className={styles.influenceScene}><section className={styles.influenceMap}><SectionTitle eyebrow="Stakeholder influence network" title="Décideurs, champions & opposants"/><div className={styles.influenceCanvas}>{rows.map((contact, index) => <button type="button" key={contact.id} className={styles.influenceNode} data-position={contact.position} style={{ '--node-x': `${18 + (index % 3) * 32}%`, '--node-y': `${18 + Math.floor(index / 3) * 32}%` } as React.CSSProperties} onClick={() => open('contact', 'edit', contact as unknown as Record<string, unknown>)}><span>{initials(contact.full_name)}</span><strong>{contact.full_name}</strong><small>{human(contact.role_type)} · {human(contact.decision_authority)}</small><em>{human(contact.relationship_strength)}</em></button>)}{!rows.length ? <EmptyState title="Carte d’influence vide" detail="Ajoutez les décideurs, utilisateurs champions et autorités financières."/> : null}</div></section><aside className={styles.influenceCoverage}><SectionTitle eyebrow="Coverage audit" title="Rôles critiques"/>{['final_authority','contract_authority','finance_authority','operational_admin','renewal_decision_maker','champion'].map((role) => { const contact = rows.find((item) => item.decision_authority === role || item.role_type === role || item.position === role); return <div key={role} data-found={Boolean(contact)}><span>{human(role)}</span><strong>{contact?.full_name || 'Manquant'}</strong><button type="button" onClick={() => open('contact', 'create', { client_id: context.clientId, role_type: role })}>{contact ? <Pencil size={13}/> : <Plus size={13}/>}</button></div>})}</aside></div>
}

function InstitutionsScene({ context, query, open, clientId }: { context: Context; query: string; open: Open; clientId: string }) {
  const rows = context.institutions.filter((item) => !query || [item.name, item.city, item.institution_type].some((value) => text(value).toLowerCase().includes(query.toLowerCase())))
  return <div className={styles.institutionsScene}><section className={styles.footprintMap}><div className={styles.footprintHeader}><SectionTitle eyebrow="Institution footprint" title="Empreinte opérationnelle du client"/><button type="button" data-primary onClick={() => open('institution', 'create', { client_id: clientId })}><Plus size={15}/>Institution</button></div><div className={styles.institutionGrid}>{rows.map((item) => <button type="button" key={item.id} onClick={() => open('institution', 'edit', item as unknown as Record<string, unknown>)}><div className={styles.institutionIcon}><Building2 size={19}/></div><div><span>{human(item.institution_type)}</span><strong>{item.name}</strong><small>{item.city || 'Ville inconnue'} · {item.estimated_students || 0} élèves</small></div><div className={styles.institutionStatus} data-state={item.status}>{human(item.status)}</div><dl><div><dt>Tenant</dt><dd>{item.tenant_id ? 'Lié' : 'Non lié'}</dd></div><div><dt>Onboarding</dt><dd>{human(item.onboarding_state || 'non démarré')}</dd></div><div><dt>Service</dt><dd>{human(item.service_health || 'non mesuré')}</dd></div></dl></button>)}{!rows.length ? <EmptyState title="Aucune institution structurée" detail="Créez les écoles, campus et sites du client, puis liez-les aux tenants."/> : null}</div></section></div>
}

function StrategyScene({ context, open, clientId }: { context: Context; open: Open; clientId: string }) {
  return <div className={styles.strategyScene}><section className={styles.accountPlan}><SectionTitle eyebrow="Strategic account plan" title="Position commerciale & prochain mouvement"/><div className={styles.strategyQuadrants}><StrategyBlock title="Objectifs du client" items={context.opportunities.map((item) => item.objective || item.name).slice(0, 4)}/><StrategyBlock title="Risques" items={[...context.opportunities.flatMap((item) => item.risks), ...context.openCases.map((item) => item.subject)].slice(0, 5)}/><StrategyBlock title="Opportunités d’expansion" items={context.expansion.map((item) => item.title).slice(0, 5)}/><StrategyBlock title="Engagements suivants" items={context.interactions.map((item) => item.next_action || item.subject).filter(Boolean).slice(0, 5)}/></div><div className={styles.strategyActions}><button type="button" onClick={() => open('opportunity', 'create', { client_id: clientId })}><Target size={15}/>Nouvelle opportunité</button><button type="button" onClick={() => open('interaction', 'create', { client_id: clientId, interaction_type: 'executive_review', subject: 'Revue stratégique du compte' })}><CalendarClock size={15}/>Planifier revue</button><button type="button" data-primary onClick={() => open('expansion', 'create', { client_id: clientId })}><TrendingUp size={15}/>Configurer expansion</button></div></section></div>
}

function OffersScene({ context, query, open, clientId }: { context: Context; query: string; open: Open; clientId: string }) {
  const rows = context.offers.filter((item) => !query || [item.name, item.offer_code, item.status].some((value) => text(value).toLowerCase().includes(query.toLowerCase())))
  return <div className={styles.customerOffersScene}><section className={styles.offerTimeline}><div className={styles.footprintHeader}><SectionTitle eyebrow="Offer & negotiation history" title="Valeur proposée et concessions"/><button type="button" data-primary onClick={() => open('offer', 'create', { client_id: clientId })}><Sparkles size={15}/>Composer une offre</button></div>{rows.map((offer) => <article key={offer.id}><div className={styles.offerVersionRail}><span>{offer.offer_code}</span><strong>{human(offer.status)}</strong><small>{dateLabel(offer.updated_at)}</small></div><div className={styles.offerBody}><div><span>Proposition</span><h3>{offer.name}</h3><p>{text(offer.value_case?.summary) || 'Valeur client à documenter.'}</p></div><div className={styles.offerEconomics}><strong>{money(offer.monthly_price_mad)}<small>/mois</small></strong><span>{money(offer.contract_value_mad)} contrat</span></div><div className={styles.offerActions}><button type="button" onClick={() => open('offer', 'inspect', offer as unknown as Record<string, unknown>)}>Inspecter</button><button type="button" onClick={() => open('offer', 'edit', offer as unknown as Record<string, unknown>)}>Réviser</button><button type="button" onClick={() => open('negotiation', 'create', { client_id: clientId, offer_id: offer.id, opportunity_id: offer.opportunity_id })}>Négociation</button></div></div><div className={styles.negotiationTrail}>{context.negotiations.filter((item) => item.offer_id === offer.id).slice(0, 4).map((item) => <div key={item.id}><i/><strong>{human(item.event_type)}</strong><span>{item.objection || item.outcome || item.customer_position || 'Événement commercial'}</span><time>{dateLabel(item.occurred_at)}</time></div>)}</div></article>)}{!rows.length ? <EmptyState title="Aucune offre client" detail="Composez une offre à partir du catalogue Product Studio."/> : null}</section></div>
}

function ContractsScene({ context, open }: { context: Context; open: Open }) {
  return <div className={styles.contractScene}><section className={styles.obligationArchitecture}><SectionTitle eyebrow="Obligation architecture" title="Contrats, abonnements & activation"/>{context.contracts.map((contract) => { const sub = context.subscriptions.find((item) => text(item.id) === text(contract.subscription_id)); return <article key={text(contract.id)}><div className={styles.contractIdentity}><FileSignature size={20}/><div><span>{text(contract.contract_code) || 'Contrat'}</span><strong>{human(text(contract.status))}</strong><small>{dateLabel(contract.start_date)} → {dateLabel(contract.end_date)}</small></div></div><div className={styles.contractPlanes}><div><span>Contrat</span><strong>{text(contract.signed_at) ? 'Signé' : 'Signature requise'}</strong><small>{text(contract.notes)}</small></div><ArrowRight/><div><span>Abonnement</span><strong>{sub ? text(sub.subscription_code) : 'Non compilé'}</strong><small>{sub ? `${money(sub.billing_amount_mad)} · ${text(sub.billing_cycle)}` : 'Créer depuis le contrat'}</small></div><ArrowRight/><div><span>Activation</span><strong>{sub && text(sub.status) === 'active' ? 'Service actif' : 'Bloquée'}</strong><small>{context.tenants.some((tenant) => text(tenant.id) === text(sub?.tenant_id)) ? 'Tenant lié' : 'Tenant requis'}</small></div></div><div className={styles.contractActions}><button type="button" onClick={() => open('contract', 'inspect', contract)}>Inspecter</button>{!sub ? <button type="button" data-primary onClick={() => open('contract', 'activate', { ...contract, client_id: context.clientId })}>Activer abonnement</button> : null}</div></article>})}{!context.contracts.length ? <EmptyState title="Aucun contrat actif" detail="Convertissez une offre acceptée en contrat puis compilez l’abonnement."/> : null}</section></div>
}

function FinanceScene({ context, open }: { context: Context; open: Open }) {
  return <div className={styles.financeScene}><section className={styles.financeCommand}><SectionTitle eyebrow="Financial relationship command" title="Facturation, encaissement & exposition"/><div className={styles.financeOverview}><FinancialBlock label="MRR" value={money(context.activeMrr)} detail="Valeur récurrente active" tone="good"/><FinancialBlock label="Facturé" value={money(context.invoices.reduce((sum, item) => sum + number(item.total_mad), 0))} detail={`${context.invoices.length} facture(s)`}/><FinancialBlock label="Encaissé" value={money(context.payments.reduce((sum, item) => sum + number(item.amount_mad), 0))} detail={`${context.payments.length} paiement(s)`} tone="good"/><FinancialBlock label="Exposé" value={money(context.overdue)} detail={`${context.openInvoices.length} solde(s) ouvert(s)`} tone={context.overdue ? 'critical' : 'good'}/></div><div className={styles.invoiceLedger}>{context.invoices.slice(0, 12).map((invoice) => <button type="button" key={text(invoice.id)} onClick={() => open('interaction', 'create', { client_id: context.clientId, interaction_type: 'financial_follow_up', subject: `Suivi facture ${text(invoice.invoice_number)}` })}><Receipt size={17}/><div><strong>{text(invoice.invoice_number) || 'Facture'}</strong><span>{dateLabel(invoice.due_date)} · {human(text(invoice.status))}</span></div><b>{money(invoice.total_mad)}</b><em data-due={number(invoice.balance_due_mad) > 0}>{money(invoice.balance_due_mad)} dû</em></button>)}</div></section></div>
}

function CasesScene({ context, query, open, clientId }: { context: Context; query: string; open: Open; clientId: string }) {
  const combined = [
    ...context.cases.map((item) => ({ id: item.id, type: item.case_type, subject: item.subject, status: item.status, severity: item.severity, priority: item.priority, due: item.due_at, record: item as unknown as Record<string, unknown>, source: 'case' })),
    ...context.legacyTickets.map((item) => ({ id: text(item.id), type: 'support_ticket', subject: text(item.subject) || text(item.title) || 'Ticket support', status: text(item.status), severity: text(item.severity) || 'medium', priority: text(item.priority) || 'normal', due: item.due_at, record: item, source: 'legacy' })),
    ...context.legacyIncidents.map((item) => ({ id: text(item.id), type: 'incident', subject: text(item.title) || text(item.subject) || 'Incident', status: text(item.status), severity: text(item.severity) || 'high', priority: text(item.priority) || 'urgent', due: item.due_at, record: item, source: 'incident' })),
  ].filter((item) => !query || [item.subject, item.type, item.status].some((value) => value.toLowerCase().includes(query.toLowerCase())))
  return <div className={styles.caseCommandScene}><section className={styles.caseBoard}><div className={styles.footprintHeader}><SectionTitle eyebrow="Customer case command" title="Support, réclamations & incidents"/><div><button type="button" onClick={() => open('case', 'create', { client_id: clientId, case_type: 'complaint' })}><MessageSquareWarning size={15}/>Réclamation</button><button type="button" data-primary onClick={() => open('case', 'create', { client_id: clientId, case_type: 'support_ticket' })}><Plus size={15}/>Nouveau cas</button></div></div><div className={styles.casePressureStrip}>{['critical','high','medium','low'].map((severity) => <div key={severity} data-severity={severity}><span>{human(severity)}</span><strong>{combined.filter((item) => item.severity === severity && !['resolved','closed','archived'].includes(item.status)).length}</strong></div>)}</div><div className={styles.caseColumns}>{['received','triage','investigation','waiting_customer','escalated','resolved'].map((status) => <div key={status} className={styles.caseColumn}><header><span>{CASE_STATUS_LABELS[status] || human(status)}</span><strong>{combined.filter((item) => normalizedCaseStatus(item.status) === status).length}</strong></header>{combined.filter((item) => normalizedCaseStatus(item.status) === status).slice(0, 8).map((item) => <button type="button" key={`${item.source}-${item.id}`} onClick={() => item.source === 'case' ? open('case', 'inspect', item.record) : open('case', 'create', { client_id: clientId, case_type: item.type, subject: item.subject, source_ticket_id: item.source === 'legacy' ? item.id : null, source_incident_id: item.source === 'incident' ? item.id : null })}><div className={styles.caseCardTop}><span>{CASE_TYPE_LABELS[item.type] || human(item.type)}</span><i data-severity={item.severity}/></div><strong>{item.subject}</strong><small>{human(item.priority)} · {item.due ? dateLabel(item.due) : 'Sans échéance'}</small><div className={styles.caseCardFooter}><em>{human(item.status)}</em><ArrowRight size={13}/></div></button>)}</div>)}</div></section></div>
}

function ServiceScene({ context, open, clientId }: { context: Context; open: Open; clientId: string }) {
  const phases = ['Contractualisation','Préparation','Provisioning','Configuration','Formation','Go-live','Adoption','Stabilisation']
  const onboarding = context.onboarding[0]
  const current = onboarding ? Math.max(0, phases.findIndex((phase) => human(text(onboarding.status)).toLowerCase().includes(phase.toLowerCase().split(' ')[0]))) : -1
  return <div className={styles.serviceScene}><section className={styles.serviceRunway}><SectionTitle eyebrow="Customer delivery system" title="Onboarding, implémentation & expérience"/><div className={styles.runway}>{phases.map((phase, index) => <div key={phase} data-state={index < current ? 'done' : index === current ? 'active' : 'future'}><span>{String(index + 1).padStart(2, '0')}</span><strong>{phase}</strong><small>{index < current ? 'Validé' : index === current ? 'En cours' : 'À venir'}</small></div>)}</div><div className={styles.servicePanels}><div><span>Service pressure</span><strong>{context.openCases.length + context.legacyTickets.length}</strong><small>cas et tickets actifs</small></div><div><span>Incidents</span><strong>{context.legacyIncidents.length}</strong><small>exposition opérationnelle</small></div><div><span>Adoption</span><strong>{context.tenants.length ? 'Mesurable' : 'À instrumenter'}</strong><small>{context.tenants.length} tenant(s)</small></div><button type="button" onClick={() => open('interaction', 'create', { client_id: clientId, interaction_type: 'service_review', subject: 'Revue service & expérience' })}><CalendarClock size={16}/>Planifier une revue service</button></div></section></div>
}

function RenewalScene({ context, open, clientId }: { context: Context; open: Open; clientId: string }) {
  const renewal = context.nextRenewal
  return <div className={styles.renewalScene}><section className={styles.renewalHorizon}><SectionTitle eyebrow="Renewal horizon room" title="Renouvellement, rétention & expansion"/><div className={styles.renewalClock}><div><span>Échéance</span><strong>{renewal ? daysUntil(renewal.renewal_date) : '—'}</strong><small>jours restants</small></div><div className={styles.renewalArc} style={{ '--progress': `${renewal ? Math.max(0, Math.min(100, 100 - daysUntil(renewal.renewal_date) / 3.65)) : 0}%` } as React.CSSProperties}/></div><div className={styles.renewalReadiness}><ReadinessRow label="Relation" score={Math.min(100, 30 + context.contacts.length * 14)}/><ReadinessRow label="Produit" score={context.tenants.length ? 82 : 25}/><ReadinessRow label="Finance" score={context.overdue ? 38 : 90}/><ReadinessRow label="Service" score={context.openCases.length ? 52 : 92}/></div><div className={styles.expansionCards}>{context.expansion.map((item) => <button type="button" key={item.id} onClick={() => open('expansion', 'edit', item as unknown as Record<string, unknown>)}><TrendingUp size={17}/><span>{human(item.opportunity_type)}</span><strong>{item.title}</strong><small>{money(item.expected_mrr_mad)} MRR potentiel</small></button>)}<button type="button" data-create onClick={() => open('expansion', 'create', { client_id: clientId })}><Plus size={18}/><strong>Nouvelle expansion</strong><small>Package, module, capacité ou institution</small></button></div></section></div>
}

function AuditScene({ context }: { context: Context }) {
  return <div className={styles.auditScene}><section className={styles.evidenceArchitecture}><SectionTitle eyebrow="Forensic evidence" title="Documents, chronologie & preuve"/><div className={styles.auditColumns}><div><h3>Documents & obligations</h3>{context.contracts.map((item) => <div key={text(item.id)}><FileSignature size={16}/><span>{text(item.contract_code)}</span><strong>{human(text(item.status))}</strong></div>)}{context.offers.map((item) => <div key={item.id}><FileSearch size={16}/><span>{item.offer_code}</span><strong>{human(item.status)}</strong></div>)}</div><div><h3>Interactions</h3>{context.interactions.slice(0, 12).map((item) => <div key={item.id}><ContactRound size={16}/><span>{item.subject}</span><strong>{dateLabel(item.occurred_at)}</strong></div>)}</div><div><h3>Case chronology</h3>{context.caseEvents.slice(0, 12).map((item) => <div key={item.id}><BookOpenCheck size={16}/><span>{item.summary}</span><strong>{dateLabel(item.occurred_at)}</strong></div>)}</div></div></section></div>
}

function buildClientContext(clientId: string, snapshot: GrowthWorkspaceSnapshot) {
  const clients = snapshot.clients.filter((item) => text(item.id) === clientId)
  const contacts = snapshot.contacts.filter((item) => text(item.client_id) === clientId)
  const institutions = snapshot.institutions.filter((item) => text(item.client_id) === clientId)
  const opportunities = snapshot.opportunities.filter((item) => text(item.client_id) === clientId)
  const offers = snapshot.offers.filter((item) => text(item.client_id) === clientId || opportunities.some((opp) => opp.id === item.opportunity_id))
  const negotiations = snapshot.negotiations.filter((item) => text(item.client_id) === clientId || offers.some((offer) => offer.id === item.offer_id))
  const interactions = snapshot.interactions.filter((item) => text(item.client_id) === clientId)
  const expansion = snapshot.expansion.filter((item) => text(item.client_id) === clientId)
  const interventions = snapshot.interventions.filter((item) => text(item.client_id) === clientId)
  const cases = snapshot.cases.filter((item) => text(item.client_id) === clientId)
  const caseIds = new Set(cases.map((item) => item.id))
  const caseEvents = snapshot.caseEvents.filter((item) => caseIds.has(item.case_id))
  const contracts = snapshot.contracts.filter((item) => text(item.client_id) === clientId)
  const renewals = snapshot.renewals.filter((item) => text(item.client_id) === clientId)
  const subscriptions = snapshot.subscriptions.filter((item) => text(item.client_id) === clientId)
  const tenants = snapshot.tenants.filter((item) => text(item.client_id) === clientId)
  const invoices = snapshot.invoices.filter((item) => text(item.client_id) === clientId)
  const payments = snapshot.payments.filter((item) => text(item.client_id) === clientId)
  const legacyTickets = snapshot.tickets.filter((item) => text(item.client_id) === clientId)
  const legacyIncidents = snapshot.incidents.filter((item) => text(item.client_id) === clientId)
  const onboarding = snapshot.onboarding.filter((item) => text(item.client_id) === clientId)
  const activeMrr = subscriptions.filter((item) => text(item.status) === 'active').reduce((sum, item) => sum + number(item.billing_amount_mad), 0)
  const openInvoices = invoices.filter((item) => number(item.balance_due_mad) > 0)
  const overdue = openInvoices.reduce((sum, item) => sum + number(item.balance_due_mad), 0)
  const openCases = cases.filter((item) => !['resolved','closed','archived'].includes(item.status))
  const complaints = cases.filter((item) => ['complaint','billing_complaint','relationship_complaint'].includes(item.case_type))
  const nextRenewal = [...renewals].sort((a, b) => daysUntil(a.renewal_date) - daysUntil(b.renewal_date))[0]
  const pipeline = opportunities.filter((item) => !['won','lost','archived'].includes(item.status)).reduce((sum, item) => sum + number(item.expected_arr_mad), 0)
  const timeline = [
    ...interactions.map((item) => ({ kind: 'interaction', title: item.subject, detail: item.outcome || item.summary || human(item.interaction_type), date: dateLabel(item.occurred_at), ts: new Date(item.occurred_at).getTime(), tone: 'neutral' })),
    ...cases.map((item) => ({ kind: 'case', title: item.subject, detail: `${CASE_TYPE_LABELS[item.case_type] || human(item.case_type)} · ${CASE_STATUS_LABELS[item.status] || human(item.status)}`, date: dateLabel(item.updated_at), ts: new Date(item.updated_at).getTime(), tone: item.severity === 'critical' ? 'critical' : item.severity === 'high' ? 'warning' : 'neutral' })),
    ...payments.map((item) => ({ kind: 'payment', title: text(item.payment_reference) || 'Paiement', detail: money(item.amount_mad), date: dateLabel(item.paid_at || item.created_at), ts: new Date(text(item.paid_at || item.created_at)).getTime(), tone: 'good' })),
    ...offers.map((item) => ({ kind: 'offer', title: item.name, detail: `${item.offer_code} · ${human(item.status)}`, date: dateLabel(item.updated_at), ts: new Date(item.updated_at).getTime(), tone: item.status === 'accepted' ? 'good' : 'neutral' })),
  ].sort((a, b) => b.ts - a.ts)
  return { clientId, clients, contacts, institutions, opportunities, offers, negotiations, interactions, expansion, interventions, cases, caseEvents, contracts, renewals, subscriptions, tenants, invoices, payments, legacyTickets, legacyIncidents, onboarding, activeMrr, openInvoices, overdue, openCases, complaints, nextRenewal, pipeline, timeline }
}

function TruthSignal({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) { return <div className={styles.truthSignal} data-tone={tone}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div> }
function RailBlock({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) { return <section className={styles.railBlock}><header><span>{icon}</span><strong>{title}</strong></header>{children}</section> }
function RailItem({ label, value, tone }: { label: string; value: string; tone: string }) { return <div className={styles.railItem} data-tone={tone}><span>{label}</span><strong>{value}</strong></div> }
function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) { return <div className={styles.sectionTitle}><span>{eyebrow}</span><h3>{title}</h3></div> }
function HealthFactor({ label, score }: { label: string; score: number }) { return <div><span>{label}</span><b><i style={{ width: `${score}%` }}/></b><strong>{score}</strong></div> }
function GovernanceRow({ label, value, state }: { label: string; value: string; state: string }) { return <div className={styles.governanceRow} data-state={state}><span>{label}</span><strong>{value}</strong><i/></div> }
function StrategyBlock({ title, items }: { title: string; items: Array<string | null | undefined> }) { const valid = items.filter(Boolean) as string[]; return <div className={styles.strategyBlock}><h4>{title}</h4>{valid.map((item, index) => <div key={`${item}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong></div>)}{!valid.length ? <p>Aucune donnée structurée.</p> : null}</div> }
function FinancialBlock({ label, value, detail, tone = 'neutral' }: { label: string; value: string; detail: string; tone?: string }) { return <div data-tone={tone}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div> }
function ReadinessRow({ label, score }: { label: string; score: number }) { return <div><span>{label}</span><b><i style={{ width: `${score}%` }}/></b><strong>{score}/100</strong></div> }
function EmptyState({ title, detail }: { title: string; detail: string }) { return <div className={styles.customerEmpty}><Sparkles size={20}/><strong>{title}</strong><span>{detail}</span></div> }

function corporateEmphasis(section: string): 'strategy' | 'relationship' | 'forecast' | 'approvals' | 'change-orders' | 'outcomes' | 'health' | 'support' | null {
  return ({ overview: 'health', influence: 'relationship', strategy: 'strategy', offers: 'approvals', contracts: 'change-orders', cases: 'support', service: 'outcomes', renewal: 'forecast' } as Record<string, 'strategy' | 'relationship' | 'forecast' | 'approvals' | 'change-orders' | 'outcomes' | 'health' | 'support'>)[section] || null
}

function sectionTitle(section: string) { return ({ overview: 'Situation complète du compte', identity: 'Institution & gouvernance', influence: 'Carte des décideurs', institutions: 'Topologie institutionnelle', strategy: 'Plan de compte stratégique', offers: 'Offres et négociations', contracts: 'Obligations et activation', product: 'Produit contracté et runtime', finance: 'Valeur, facturation et risque', correspondence: 'Emails, threads et engagements', cases: 'Customer Case Command', service: 'Livraison et expérience', renewal: 'Horizon de renouvellement', audit: 'Preuve et chronologie' } as Record<string, string>)[section] || 'Dossier client' }
function sectionPurpose(section: string) { return ({ overview: 'Scanner la relation, comprendre les risques et agir sans quitter le contexte.', identity: 'Maintenir une identité corporate exacte, une propriété claire et une gouvernance complète.', influence: 'Comprendre qui décide, qui influence et quel rôle manque avant la prochaine décision.', institutions: 'Relier écoles, campus, tenants, capacités et états opérationnels.', strategy: 'Gouverner objectifs, risques, concurrence, engagements et expansion.', offers: 'Préserver les versions, les positions de négociation et la valeur proposée.', contracts: 'Transformer les engagements signés en abonnements et service activé.', product: 'Comparer ce qui est vendu, compilé et réellement actif dans chaque tenant.', finance: 'Lire la valeur, les paiements, le retard et les concessions commerciales.', correspondence: 'Consolider inbound, outbound, automations, pièces jointes et engagements sans dupliquer Email OS.', cases: 'Trier, investiguer, escalader et résoudre tickets, plaintes et incidents.', service: 'Piloter onboarding, implémentation, formation, adoption et qualité.', renewal: 'Préparer rétention, renégociation, upgrade et expansion.', audit: 'Retrouver les obligations, documents, interactions et preuves.' } as Record<string, string>)[section] || '' }
function dockLabel(section: string) { return ({ overview: 'Protéger et développer la relation', identity: 'Maintenir la vérité institutionnelle', influence: 'Renforcer la couverture décisionnelle', institutions: 'Structurer l’empreinte client', strategy: 'Faire avancer le plan de compte', offers: 'Ingénierie et négociation de valeur', contracts: 'Compiler les engagements en service', product: 'Synchroniser contrat, entitlement et runtime', finance: 'Réduire l’exposition et sécuriser la valeur', correspondence: 'Répondre et gouverner la correspondance', cases: 'Résoudre et restaurer la confiance', service: 'Livrer l’expérience promise', renewal: 'Renouveler et étendre', audit: 'Préserver la preuve' } as Record<string, string>)[section] || 'Agir' }
function dockActions(section: string, clientId: string, client: Record<string, unknown>, open: Open, onRefresh: () => void) { const actions: Record<string, React.ReactNode> = { overview: <><button onClick={() => open('intervention','create',{ client_id: clientId })}><Siren size={15}/>Intervention</button><button onClick={() => open('interaction','create',{ client_id: clientId })}><CalendarClock size={15}/>Interaction</button></>, identity: <button onClick={() => open('client','edit',client)}><Pencil size={15}/>Modifier</button>, influence: <button onClick={() => open('contact','create',{ client_id: clientId })}><UsersRound size={15}/>Ajouter contact</button>, institutions: <button onClick={() => open('institution','create',{ client_id: clientId })}><Building2 size={15}/>Institution</button>, strategy: <button onClick={() => open('opportunity','create',{ client_id: clientId })}><Target size={15}/>Opportunité</button>, offers: <button onClick={() => open('offer','create',{ client_id: clientId })}><Sparkles size={15}/>Composer offre</button>, contracts: <button onClick={() => open('offer','create',{ client_id: clientId })}><FileSignature size={15}/>Nouvelle offre</button>, product: <button onClick={onRefresh}><RefreshCcw size={15}/>Actualiser produit</button>, finance: <button onClick={() => open('interaction','create',{ client_id: clientId, interaction_type: 'financial_follow_up' })}><BadgeDollarSign size={15}/>Suivi financier</button>, correspondence: <button onClick={() => window.location.assign('/angelcare-360-operator/email-command?view=conversations')}><Mail size={15}/>Email Command</button>, cases: <><button onClick={() => open('case','create',{ client_id: clientId, case_type: 'complaint' })}><MessageSquareWarning size={15}/>Réclamation</button><button onClick={() => open('case','create',{ client_id: clientId })}><Plus size={15}/>Cas</button></>, service: <button onClick={() => open('interaction','create',{ client_id: clientId, interaction_type: 'service_review' })}><HeartHandshake size={15}/>Revue service</button>, renewal: <button onClick={() => open('expansion','create',{ client_id: clientId })}><TrendingUp size={15}/>Expansion</button>, audit: <button onClick={() => open('interaction','create',{ client_id: clientId, interaction_type: 'audit_note' })}><BookOpenCheck size={15}/>Ajouter preuve</button> }; return actions[section] || null }

function relationshipStep(context: Context) { if (context.expansion.length) return 7; if (context.renewals.length) return 6; if (context.tenants.length) return 4; if (context.subscriptions.length) return 3; if (context.contracts.length) return 2; if (context.offers.length) return 1; return context.opportunities.length ? 0 : -1 }
function healthScore(client: Record<string, unknown>, context: Context) { let score = 70; if (context.overdue) score -= 18; if (context.openCases.length) score -= Math.min(22, context.openCases.length * 4); if (!context.contacts.length) score -= 12; if (context.tenants.length) score += 8; if (text(client.health_status) === 'healthy') score += 10; return Math.max(0, Math.min(100, score)) }
function priorityTitle(context: Context) { if (context.openCases.some((item) => item.severity === 'critical')) return 'Résoudre le cas critique avant toute expansion'; if (context.overdue) return 'Sécuriser l’exposition financière'; if (!context.contacts.some((item) => item.decision_authority === 'final_authority')) return 'Identifier l’autorité finale'; if (context.nextRenewal && daysUntil(context.nextRenewal.renewal_date) < 120) return 'Lancer la mission de renouvellement'; if (context.expansion.length) return 'Convertir l’expansion identifiée'; return 'Maintenir la cadence relationnelle' }
function priorityReason(context: Context) { if (context.openCases.some((item) => item.severity === 'critical')) return 'Un problème critique menace la confiance, la rétention et potentiellement le renouvellement.'; if (context.overdue) return `${money(context.overdue)} restent exposés dans la relation financière.`; if (!context.contacts.some((item) => item.decision_authority === 'final_authority')) return 'La carte d’influence ne contient aucune autorité finale identifiée.'; if (context.nextRenewal) return `La prochaine échéance est le ${dateLabel(context.nextRenewal.renewal_date)}.`; return 'Aucun risque majeur n’est dominant; maintenir un engagement régulier.' }
function riskTone(value: string) { return ['critical','high'].includes(value) ? 'critical' : value === 'medium' ? 'warning' : 'good' }
function normalizedCaseStatus(value: string) { if (['new','open','received'].includes(value)) return 'received'; if (['assigned','in_progress','investigation'].includes(value)) return 'investigation'; if (['waiting','waiting_customer'].includes(value)) return 'waiting_customer'; if (value === 'escalated') return 'escalated'; if (['resolved','closed'].includes(value)) return 'resolved'; return value }
function money(value: unknown) { return `${Math.round(number(value)).toLocaleString('fr-FR')} Dh` }
function number(value: unknown) { const parsed = Number(value || 0); return Number.isFinite(parsed) ? parsed : 0 }
function text(value: unknown) { return value === null || value === undefined ? '' : String(value) }
function human(value: string) { return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }
function dateLabel(value: unknown) { if (!value) return '—'; const date = new Date(text(value)); return Number.isNaN(date.getTime()) ? text(value) : date.toLocaleDateString('fr-FR') }
function daysUntil(value: unknown) { if (!value) return 9999; const date = new Date(text(value)); return Number.isNaN(date.getTime()) ? 9999 : Math.ceil((date.getTime() - Date.now()) / 86400000) }
function daysSince(value: unknown) { if (!value) return 9999; const date = new Date(text(value)); return Number.isNaN(date.getTime()) ? 9999 : Math.floor((Date.now() - date.getTime()) / 86400000) }
function initials(value: string) { return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'AC' }
