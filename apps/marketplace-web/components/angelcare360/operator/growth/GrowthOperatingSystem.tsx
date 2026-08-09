'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Activity, AlertTriangle, ArrowRight, BadgeDollarSign, BarChart3, BriefcaseBusiness, Building2, CalendarClock,
  CheckCircle2, ChevronDown, CircleDollarSign, Compass, FileSignature, Filter, Gauge, Globe2, HeartHandshake,
  Layers3, LineChart, MapPinned, MessageSquareWarning, Network, PackageCheck, Plus, RefreshCw, Search, ShieldCheck,
  Siren, Sparkles, Target, TrendingDown, TrendingUp, UserRound, UsersRound,
} from 'lucide-react'
import type {
  GrowthCustomerCaseRecord,
  GrowthMode,
  GrowthOfferRecord,
  GrowthOpportunityRecord,
  GrowthProspectRecord,
  GrowthWorkspaceSnapshot,
} from '@/types/angelcare360/operator/growth'
import { CASE_STATUS_LABELS, CASE_TYPE_LABELS, GROWTH_MODES, OFFER_STATUS_LABELS, OPPORTUNITY_STAGE_LABELS, OPPORTUNITY_STAGES } from './GrowthContract'
import GrowthPortal, { type GrowthEntityType, type GrowthPortalState } from './GrowthPortal'
import CustomerSovereignCommandRoom from './CustomerSovereignCommandRoom'
import CorporateControlLayer from './CorporateControlLayer'
import styles from './GrowthOperatingSystem.module.css'

const localModes: Record<GrowthMode, string[]> = {
  command: ['Aujourd’hui', '7 jours', '30 jours', 'Décisions'],
  markets: ['Atlas', 'Cibles', 'Qualification', 'Décideurs', 'Doublons'],
  pipeline: ['Exécution', 'Kanban', 'Forecast', 'Closing', 'À risque'],
  offers: ['Solution', 'Pricing', 'Négociation', 'Approbations', 'Versions'],
  contracts: ['Obligations', 'Signature', 'Abonnement', 'Activation', 'Blocages'],
  portfolio: ['Constellation', 'Stratégiques', 'À risque', 'Renouvellement', 'Expansion'],
  health: ['Risk Command', 'Tickets', 'Réclamations', 'Incidents', 'Interventions', 'Root causes'],
  performance: ['Conversion', 'Valeur', 'Rétention', 'Owners', 'Segments', 'Packages'],
}

export default function GrowthOperatingSystem({ snapshot, initialMode }: { snapshot: GrowthWorkspaceSnapshot; initialMode: GrowthMode }) {
  const router = useRouter()
  const [mode, setMode] = useState<GrowthMode>(initialMode)
  const [localMode, setLocalMode] = useState(localModes[initialMode][0])
  const [search, setSearch] = useState('')
  const [portal, setPortal] = useState<GrowthPortalState | null>(null)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setMode(initialMode)
    setLocalMode(localModes[initialMode][0])
    setSearch('')
    setPortal(null)
  }, [initialMode])

  const selectedClient = snapshot.clients.find((item) => text(item.id) === selectedClientId) || null
  const activeMode = GROWTH_MODES.find((item) => item.key === mode) || GROWTH_MODES[0]
  const operationalPressure = useMemo(() => deriveOperationalPressure(snapshot), [snapshot])

  const execute = async (operation: string, payload: Record<string, unknown>) => {
    const response = await fetch('/api/angelcare360/operator/growth', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ operation, payload }),
    })
    const body = await response.json().catch(() => ({})) as { ok?: boolean; error?: string }
    if (!response.ok || !body.ok) throw new Error(body.error || 'La commande Revenue Relationship a échoué.')
    setMessage('Commande persistée, synchronisée et auditée.')
    router.refresh()
    window.setTimeout(() => setMessage(null), 4200)
  }

  const open = (entity: GrowthEntityType, action: GrowthPortalState['mode'], record?: Record<string, unknown> | null) => setPortal({ entity, mode: action, record })

  return (
    <section className={styles.workspace}>
      <header className={styles.commandCrown}>
        <div className={styles.commandCrownIdentity}>
          <span>AngelCare 360 Operator · Revenue Relationship OS</span>
          <h1>{activeMode.label}</h1>
          <p>{activeMode.signal}. Une seule chaîne entre marché, offre, contrat, client, cas, renouvellement et valeur retenue.</p>
        </div>
        <div className={styles.commandCrownActions}>
          <button type="button" onClick={() => open('prospect', 'create')}><Target size={15}/>Compte cible</button>
          <button type="button" onClick={() => open('opportunity', 'create')}><BriefcaseBusiness size={15}/>Deal</button>
          <button type="button" onClick={() => open('case', 'create', { case_type: 'complaint' })}><MessageSquareWarning size={15}/>Cas client</button>
          <button type="button" data-primary onClick={() => open('offer', 'create')}><Sparkles size={15}/>Composer une offre</button>
        </div>
        <div className={styles.commandCrownPulse}>
          <div><span>Pipeline</span><strong>{metric(snapshot, 'pipeline')}</strong><small>{metricDetail(snapshot, 'pipeline')}</small></div>
          <div><span>MRR activé</span><strong>{metric(snapshot, 'mrr')}</strong><small>{metricDetail(snapshot, 'mrr')}</small></div>
          <div><span>Pression client</span><strong>{metric(snapshot, 'pressure')}</strong><small>{metricDetail(snapshot, 'pressure')}</small></div>
          <div data-state={snapshot.sourceState}><span>Qualité sources</span><strong>{human(snapshot.sourceState)}</strong><small>{snapshot.sources.filter((item) => item.state === 'complete').length}/{snapshot.sources.length} disponibles</small></div>
        </div>
      </header>

      <div className={styles.operatingContextBar}>
        <div className={styles.modeIdentity}>
          <span>{String(GROWTH_MODES.findIndex((item) => item.key === mode) + 1).padStart(2, '0')}</span>
          <div><strong>{activeMode.short}</strong><small>{activeMode.signal}</small></div>
        </div>
        <div className={styles.localModeRail} aria-label={`Modes ${activeMode.short}`}>
          {localModes[mode].map((item) => <button type="button" key={item} data-active={item === localMode} onClick={() => setLocalMode(item)}>{item}</button>)}
        </div>
        <label className={styles.globalSceneSearch}><Search size={15}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Compte, deal, offre, cas, contrat…"/></label>
        <button type="button" className={styles.filterButton}><Filter size={15}/>Filtres</button>
      </div>

      {message ? <div className={styles.successBanner}><CheckCircle2 size={17}/>{message}</div> : null}

      <main className={styles.sceneCanvas}>
        {mode === 'command' ? <RevenueCommandScene snapshot={snapshot} pressure={operationalPressure} open={open} openClient={setSelectedClientId}/> : null}
        {mode === 'markets' ? <MarketsScene snapshot={snapshot} search={search} localMode={localMode} open={open}/> : null}
        {mode === 'pipeline' ? <PipelineScene snapshot={snapshot} search={search} localMode={localMode} open={open}/> : null}
        {mode === 'offers' ? <OffersNegotiationScene snapshot={snapshot} search={search} localMode={localMode} open={open}/> : null}
        {mode === 'contracts' ? <ContractsActivationScene snapshot={snapshot} search={search} localMode={localMode} open={open}/> : null}
        {mode === 'portfolio' ? <PortfolioConstellationScene snapshot={snapshot} search={search} localMode={localMode} openClient={setSelectedClientId} open={open}/> : null}
        {mode === 'health' ? <RetentionRecoveryScene snapshot={snapshot} search={search} localMode={localMode} open={open} openClient={setSelectedClientId}/> : null}
        {mode === 'performance' ? <RevenuePerformanceScene snapshot={snapshot} localMode={localMode}/> : null}
        {['command','portfolio','performance'].includes(mode) ? <CorporateControlLayer snapshot={snapshot} open={open} emphasis={mode === 'performance' ? 'forecast' : mode === 'portfolio' ? 'strategy' : 'approvals'}/> : null}
      </main>

      <footer className={styles.contextualDock}>
        <div><span>Commande active</span><strong>{dockTitle(mode)}</strong><small>{dockSubtitle(mode)}</small></div>
        <div>{dockActions(mode, open)}</div>
      </footer>

      <GrowthPortal state={portal} snapshot={snapshot} onClose={() => setPortal(null)} onExecute={execute}/>
      {selectedClient ? <CustomerSovereignCommandRoom client={selectedClient} snapshot={snapshot} onClose={() => setSelectedClientId(null)} open={open} onRefresh={() => router.refresh()}/> : null}
    </section>
  )
}

type Open = (entity: GrowthEntityType, action: GrowthPortalState['mode'], record?: Record<string, unknown> | null) => void

function RevenueCommandScene({ snapshot, pressure, open, openClient }: { snapshot: GrowthWorkspaceSnapshot; pressure: ReturnType<typeof deriveOperationalPressure>; open: Open; openClient: (id: string) => void }) {
  const stages = ['Prospects','Qualifiés','Deals','Offres','Contrats','Activés','Renouvelés','Expansion']
  const stageValues = [snapshot.prospects.length, snapshot.prospects.filter((item) => item.qualification_stage === 'qualified').length, snapshot.opportunities.length, snapshot.offers.length, snapshot.contracts.length, snapshot.subscriptions.filter((item) => text(item.status) === 'active').length, snapshot.renewals.filter((item) => text(item.status) === 'renewed').length, snapshot.expansion.length]
  const max = Math.max(...stageValues, 1)
  return <div className={styles.revenueCommandScene}>
    <section className={styles.valueMovementField}>
      <div className={styles.sceneTitleRow}><SceneTitle eyebrow="Revenue movement command field" title="Du marché à la valeur retenue" detail="Chaque signal ouvre le deal, le client ou le cas qui exige une décision."/><span className={styles.liveIndicator}><i/>LIVE</span></div>
      <div className={styles.valueFlow}>
        {stages.map((stage, index) => <div key={stage} className={styles.valueFlowNode} data-pressure={stageValues[index] === 0 ? 'empty' : 'active'}><div><span>{String(index + 1).padStart(2, '0')}</span><strong>{stageValues[index]}</strong></div><h3>{stage}</h3><b><i style={{ width: `${Math.max(7, stageValues[index] / max * 100)}%` }}/></b>{index < stages.length - 1 ? <ArrowRight size={18}/> : null}</div>)}
      </div>
      <div className={styles.commandQuadrants}>
        <section className={styles.forecastField}><SectionHeading icon={<LineChart size={17}/>} eyebrow="Forecast confidence" title="Prévision et confiance"/><ForecastLine label="Pipeline brut" value={metric(snapshot, 'pipeline')} confidence={100}/><ForecastLine label="Pondéré" value={metric(snapshot, 'weighted')} confidence={72}/><ForecastLine label="MRR activé" value={metric(snapshot, 'mrr')} confidence={92}/><ForecastLine label="Expansion" value={metric(snapshot, 'expansion')} confidence={58}/></section>
        <section className={styles.decisionQueue}><SectionHeading icon={<ShieldCheck size={17}/>} eyebrow="Executive decision queue" title="Décisions requises"/>{pressure.decisions.map((item) => <button type="button" key={item.key} onClick={() => item.clientId ? openClient(item.clientId) : item.entity ? open(item.entity, 'inspect', item.record) : undefined}><i data-tone={item.tone}/><div><strong>{item.title}</strong><span>{item.detail}</span></div><ArrowRight size={14}/></button>)}</section>
        <section className={styles.riskConcentration}><SectionHeading icon={<AlertTriangle size={17}/>} eyebrow="Risk concentration" title="Valeur exposée"/>{pressure.risks.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong><b><i data-tone={item.tone} style={{ width: `${item.width}%` }}/></b></div>)}</section>
        <section className={styles.ownerMatrix}><SectionHeading icon={<UsersRound size={17}/>} eyebrow="Accountability" title="Discipline d’exécution"/><SignalRow label="Deals sans next action" value={String(snapshot.opportunities.filter((item) => !item.next_event).length)} tone="warning"/><SignalRow label="Clients sans owner" value={String(snapshot.clients.filter((item) => !item.account_manager_id).length)} tone="warning"/><SignalRow label="Cas critiques ouverts" value={String(snapshot.cases.filter((item) => item.severity === 'critical' && !['resolved','closed'].includes(item.status)).length)} tone="critical"/><SignalRow label="Offres expirées" value={String(snapshot.offers.filter((item) => item.validity_date && new Date(item.validity_date) < new Date() && !['accepted','converted'].includes(item.status)).length)} tone="neutral"/></section>
      </div>
    </section>
  </div>
}

function MarketsScene({ snapshot, search, localMode, open }: { snapshot: GrowthWorkspaceSnapshot; search: string; localMode: string; open: Open }) {
  const prospects = filterProspects(snapshot.prospects, search).filter((item) => localMode === 'Qualification' ? !['qualified','converted'].includes(item.qualification_stage) : true)
  const territories = groupBy(prospects, (item) => item.city || item.region || 'Non localisé')
  return <div className={styles.marketsScene}>
    <section className={styles.marketAtlas}>
      <div className={styles.sceneTitleRow}><SceneTitle eyebrow="Market & account intelligence atlas" title="Cibles, territoires et préparation d’achat" detail="Une organisation unique, enrichie et qualifiée avant toute création de deal."/><button type="button" data-primary onClick={() => open('prospect','create')}><Plus size={15}/>Compte cible</button></div>
      <div className={styles.atlasGrid}>
        <aside className={styles.territoryRail}>
          <SectionHeading icon={<MapPinned size={17}/>} eyebrow="Territories" title="Concentration cible"/>
          {[...territories.entries()].map(([territory, rows]) => <button type="button" key={territory}><span>{territory}</span><strong>{rows.length}</strong><small>{money(rows.reduce((sum, item) => sum + number(item.potential_mrr_mad), 0))} MRR potentiel</small></button>)}
        </aside>
        <div className={styles.targetAccountCanvas}>
          {prospects.map((prospect) => {
            const contacts = snapshot.contacts.filter((item) => item.prospect_id === prospect.id)
            const institutions = snapshot.institutions.filter((item) => item.prospect_id === prospect.id)
            const score = prospectScore(prospect, contacts.length)
            return <article key={prospect.id} className={styles.targetAccountCard}>
              <div className={styles.accountCardHeader}><div className={styles.accountSymbol}>{initials(prospect.organization_name)}</div><div><span>{human(prospect.organization_type)}</span><h3>{prospect.organization_name}</h3><p>{prospect.city || 'Localisation inconnue'} · {prospect.estimated_students || 0} élèves estimés</p></div><div className={styles.fitScore}><strong>{score}</strong><span>fit</span></div></div>
              <div className={styles.qualificationArchitecture}><QualificationStep label="Identité" state={prospect.organization_name ? 'done' : 'missing'}/><QualificationStep label="Douleur" state={prospect.pain_points.length ? 'done' : 'missing'}/><QualificationStep label="Contacts" state={contacts.length ? 'done' : 'missing'}/><QualificationStep label="Produit" state={Object.keys(prospect.product_fit || {}).length ? 'done' : 'missing'}/><QualificationStep label="Prochaine action" state={prospect.next_action ? 'done' : 'missing'}/></div>
              <div className={styles.targetAccountSignals}><span><Building2 size={14}/>{institutions.length} institution(s)</span><span><UsersRound size={14}/>{contacts.length} contact(s)</span><span><BadgeDollarSign size={14}/>{money(prospect.potential_mrr_mad)} potentiel</span></div>
              <div className={styles.targetAccountActions}><button type="button" onClick={() => open('prospect','inspect', prospect as unknown as Record<string,unknown>)}>Command room</button><button type="button" onClick={() => open('prospect','edit', prospect as unknown as Record<string,unknown>)}>Enrichir</button><button type="button" data-primary onClick={() => open('opportunity','create',{ prospect_id: prospect.id, name: `Opportunité · ${prospect.organization_name}` })}>Créer deal</button></div>
            </article>
          })}
          {!prospects.length ? <SceneEmpty icon={<Compass/>} title="Aucun compte dans cette vue" detail="Créez une cible ou changez le filtre local."/> : null}
        </div>
        <aside className={styles.marketIntelligenceRail}>
          <SectionHeading icon={<Gauge size={17}/>} eyebrow="Qualification intelligence" title="Gaps prioritaires"/>
          <SignalRow label="Sans décideur" value={String(prospects.filter((prospect) => !snapshot.contacts.some((contact) => contact.prospect_id === prospect.id && contact.decision_authority === 'final_authority')).length)} tone="critical"/>
          <SignalRow label="Sans next action" value={String(prospects.filter((item) => !item.next_action).length)} tone="warning"/>
          <SignalRow label="Sans fit produit" value={String(prospects.filter((item) => !Object.keys(item.product_fit || {}).length).length)} tone="warning"/>
          <SignalRow label="Doublons potentiels" value={String(findPotentialDuplicates(prospects).length)} tone="neutral"/>
          <div className={styles.intelligenceRecommendation}><Sparkles size={17}/><strong>Prochaine meilleure action</strong><p>Compléter l’autorité économique et le package fit avant d’augmenter la probabilité du deal.</p></div>
        </aside>
      </div>
    </section>
  </div>
}

function PipelineScene({ snapshot, search, localMode, open }: { snapshot: GrowthWorkspaceSnapshot; search: string; localMode: string; open: Open }) {
  const opportunities = snapshot.opportunities.filter((item) => !search || [item.name, accountName(item, snapshot), item.stage].some((value) => value.toLowerCase().includes(search.toLowerCase())))
  return <div className={styles.pipelineScene}>
    <section className={styles.dealTheatre}>
      <div className={styles.sceneTitleRow}><SceneTitle eyebrow="Deal execution theatre" title="Missions commerciales, progression et forecast" detail="Chaque deal expose son compte, sa valeur, ses décideurs, son prochain événement et ses obstacles."/><button type="button" data-primary onClick={() => open('opportunity','create')}><Plus size={15}/>Nouveau deal</button></div>
      <div className={styles.pipelineControlDeck}>
        <div><span>Deals actifs</span><strong>{opportunities.filter((item) => !['won','lost'].includes(item.status)).length}</strong><small>{localMode}</small></div>
        <div><span>Valeur pondérée</span><strong>{money(opportunities.reduce((sum, item) => sum + number(item.expected_arr_mad) * number(item.probability) / 100, 0))}</strong><small>ARR pondéré</small></div>
        <div><span>Closing 30j</span><strong>{opportunities.filter((item) => item.expected_close_date && daysUntil(item.expected_close_date) <= 30).length}</strong><small>échéances</small></div>
        <div><span>Sans next event</span><strong>{opportunities.filter((item) => !item.next_event).length}</strong><small>discipline requise</small></div>
      </div>
      <div className={styles.pipelineBoard}>
        {OPPORTUNITY_STAGES.filter((stage) => !['won','lost'].includes(stage)).map((stage) => {
          const rows = opportunities.filter((item) => item.stage === stage)
          return <div key={stage} className={styles.pipelineLane}>
            <header><div><span>{OPPORTUNITY_STAGE_LABELS[stage]}</span><strong>{rows.length}</strong></div><small>{money(rows.reduce((sum, item) => sum + number(item.expected_arr_mad), 0))}</small></header>
            <div className={styles.pipelineLaneBody}>{rows.map((item) => {
              const stakeholders = snapshot.stakeholders.filter((stakeholder) => stakeholder.opportunity_id === item.id)
              const latestOffer = snapshot.offers.find((offer) => offer.opportunity_id === item.id)
              return <button type="button" key={item.id} className={styles.dealCard} onClick={() => open('opportunity','inspect', item as unknown as Record<string,unknown>)}>
                <div className={styles.dealCardTop}><span>{item.opportunity_code}</span><b>{item.probability}%</b></div>
                <h3>{item.name}</h3><p>{accountName(item, snapshot)}</p>
                <div className={styles.dealEconomics}><strong>{money(item.expected_arr_mad)}</strong><span>ARR</span></div>
                <div className={styles.dealSignals}><span data-ok={stakeholders.length > 0}><UsersRound size={13}/>{stakeholders.length}</span><span data-ok={Boolean(latestOffer)}><FileSignature size={13}/>{latestOffer ? human(latestOffer.status) : 'Sans offre'}</span><span data-ok={Boolean(item.next_event)}><CalendarClock size={13}/>{item.next_event || 'Next action manquante'}</span></div>
                <div className={styles.dealCardFooter}><time>{dateLabel(item.expected_close_date)}</time><ArrowRight size={14}/></div>
              </button>
            })}</div>
          </div>
        })}
      </div>
    </section>
  </div>
}

function OffersNegotiationScene({ snapshot, search, localMode, open }: { snapshot: GrowthWorkspaceSnapshot; search: string; localMode: string; open: Open }) {
  const offers = snapshot.offers.filter((item) => !search || [item.name, item.offer_code, accountName(item, snapshot), item.status].some((value) => value.toLowerCase().includes(search.toLowerCase())))
  const selected = offers[0]
  return <div className={styles.offersScene}>
    <section className={styles.solutionLab}>
      <div className={styles.sceneTitleRow}><SceneTitle eyebrow="Solution & commercial engineering laboratory" title="Offres, valeur, pricing et négociation" detail="Le Product Studio alimente la configuration; les versions et concessions ne détruisent jamais l’historique."/><button type="button" data-primary onClick={() => open('offer','create')}><Sparkles size={15}/>Composer une offre</button></div>
      <div className={styles.offerLabGrid}>
        <aside className={styles.offerPortfolioRail}>
          <div className={styles.railFilter}><Search size={14}/><span>{localMode}</span><ChevronDown size={14}/></div>
          {offers.map((offer) => <button type="button" key={offer.id} data-active={selected?.id === offer.id} onClick={() => open('offer','inspect', offer as unknown as Record<string,unknown>)}><span>{offer.offer_code}</span><strong>{offer.name}</strong><small>{accountName(offer, snapshot)} · {human(offer.status)}</small><b>{money(offer.contract_value_mad)}</b></button>)}
        </aside>
        <div className={styles.offerEngineeringCanvas}>
          {selected ? <>
            <header><div><span>{selected.offer_code} · {human(selected.status)}</span><h2>{selected.name}</h2><p>{accountName(selected, snapshot)}</p></div><div><strong>{money(selected.monthly_price_mad)}</strong><span>MRR proposé</span></div></header>
            <div className={styles.offerArchitecture}>
              <OfferPlane icon={<Target/>} label="Problème client" title={text(selected.value_case?.summary) || 'Valeur à documenter'} detail="Objectifs, douleurs, résultats attendus"/>
              <OfferPlane icon={<PackageCheck/>} label="Solution" title={productName(selected.package_version_id, snapshot)} detail={`${selectedAddons(selected).length} add-on(s) · snapshot préservé`}/>
              <OfferPlane icon={<CircleDollarSign/>} label="Économie" title={money(selected.contract_value_mad)} detail={`${money(selected.discount_mad)} de remise · ${selected.contract_duration_months} mois`}/>
              <OfferPlane icon={<ShieldCheck/>} label="Autorité" title={human(selected.approval_status)} detail="Pricing, management et compatibilité"/>
            </div>
            <div className={styles.negotiationTheatre}>
              <SectionHeading icon={<Network size={17}/>} eyebrow="Negotiation theatre" title="Positions, objections et limites"/>
              <div className={styles.negotiationTimeline}>{snapshot.negotiations.filter((item) => item.offer_id === selected.id).map((event) => <button type="button" key={event.id} onClick={() => open('negotiation','edit', event as unknown as Record<string,unknown>)}><i/><div><span>{human(event.event_type)}</span><strong>{event.objection || event.customer_position || event.outcome || 'Événement de négociation'}</strong><small>{dateLabel(event.occurred_at)} · impact {money(event.financial_impact_mad)}</small></div></button>)}<button type="button" data-create onClick={() => open('negotiation','create',{ offer_id: selected.id, opportunity_id: selected.opportunity_id, client_id: selected.client_id })}><Plus size={16}/>Ajouter un événement</button></div>
            </div>
          </> : <SceneEmpty icon={<Sparkles/>} title="Aucune offre" detail="Composez une offre synchronisée avec le Product Studio."/>}
        </div>
        <aside className={styles.offerReadinessRail}>
          <SectionHeading icon={<ShieldCheck size={17}/>} eyebrow="Release readiness" title="Préparation commerciale"/>
          <ReadinessItem label="Package publié" ok={Boolean(selected?.package_version_id)} detail={selected ? productName(selected.package_version_id, snapshot) : '—'}/>
          <ReadinessItem label="Valeur client" ok={Boolean(selected && Object.keys(selected.value_case || {}).length)} detail="Narratif et bénéfices"/>
          <ReadinessItem label="Pricing" ok={Boolean(selected && number(selected.monthly_price_mad) > 0)} detail="Mensuel, annuel, setup"/>
          <ReadinessItem label="Validité" ok={Boolean(selected?.validity_date)} detail={dateLabel(selected?.validity_date)}/>
          <ReadinessItem label="Approbation" ok={selected?.approval_status === 'approved'} detail={human(selected?.approval_status || 'pending')}/>
          {selected ? <div className={styles.offerRailActions}><button onClick={() => open('offer','edit', selected as unknown as Record<string,unknown>)}>Réviser</button><button onClick={() => open('offer','transition', selected as unknown as Record<string,unknown>)}>Changer statut</button><button data-primary onClick={() => open('offer','convert', selected as unknown as Record<string,unknown>)}>Convertir contrat</button></div> : null}
        </aside>
      </div>
    </section>
  </div>
}

function ContractsActivationScene({ snapshot, search, localMode, open }: { snapshot: GrowthWorkspaceSnapshot; search: string; localMode: string; open: Open }) {
  const contracts = snapshot.contracts.filter((item) => !search || [item.contract_code, item.status, clientName(item.client_id, snapshot)].some((value) => text(value).toLowerCase().includes(search.toLowerCase())))
  return <div className={styles.contractsScene}>
    <section className={styles.activationArchitecture}>
      <div className={styles.sceneTitleRow}><SceneTitle eyebrow="Commercial obligation & activation architecture" title="Du contrat signé au service réellement actif" detail="Le système conserve le snapshot vendu et expose les blocages de souscription, tenant, facturation et entitlement."/><span className={styles.modeBadge}>{localMode}</span></div>
      <div className={styles.activationRunwayHeader}><span>Contrat</span><ArrowRight/><span>Signature</span><ArrowRight/><span>Abonnement</span><ArrowRight/><span>Tenant</span><ArrowRight/><span>Entitlements</span><ArrowRight/><span>Go-live</span></div>
      <div className={styles.contractActivationList}>
        {contracts.map((contract) => {
          const client = snapshot.clients.find((item) => text(item.id) === text(contract.client_id))
          const subscription = snapshot.subscriptions.find((item) => text(item.id) === text(contract.subscription_id))
          const tenant = snapshot.tenants.find((item) => text(item.id) === text(subscription?.tenant_id))
          const signed = Boolean(contract.signed_at)
          const readiness = [true, signed, Boolean(subscription), Boolean(tenant), Boolean(subscription?.package_version_id), text(subscription?.status) === 'active']
          return <article key={text(contract.id)} className={styles.contractActivationCard}>
            <div className={styles.contractAccount}><div>{initials(text(client?.display_name))}</div><span>{text(client?.display_name) || 'Client non résolu'}</span><strong>{text(contract.contract_code)}</strong></div>
            <div className={styles.activationSteps}>{['Contract','Signature','Subscription','Tenant','Entitlement','Live'].map((step, index) => <div key={step} data-state={readiness[index] ? 'done' : index === readiness.findIndex((value) => !value) ? 'blocked' : 'future'}><i>{readiness[index] ? <CheckCircle2 size={14}/> : <span>{index + 1}</span>}</i><strong>{step}</strong></div>)}</div>
            <div className={styles.contractEconomics}><span>Valeur</span><strong>{money(subscription?.billing_amount_mad || 0)}</strong><small>{text(subscription?.billing_cycle) || 'Cycle non défini'}</small></div>
            <div className={styles.contractBlocker}><span>Blocage actuel</span><strong>{contractBlocker(readiness)}</strong><small>{human(text(contract.status))}</small></div>
            <div className={styles.contractActivationActions}><button onClick={() => open('contract','inspect', contract)}>Inspecter</button>{!subscription ? <button data-primary onClick={() => open('contract','activate',{ ...contract, client_id: contract.client_id })}>Activer</button> : <button onClick={() => open('subscription','inspect', subscription)}>Abonnement</button>}</div>
          </article>
        })}
        {!contracts.length ? <SceneEmpty icon={<FileSignature/>} title="Aucun contrat" detail="Convertissez une offre acceptée pour ouvrir l’architecture d’activation."/> : null}
      </div>
    </section>
  </div>
}

function PortfolioConstellationScene({ snapshot, search, localMode, openClient, open }: { snapshot: GrowthWorkspaceSnapshot; search: string; localMode: string; openClient: (id: string) => void; open: Open }) {
  const clients = snapshot.clients.filter((item) => !search || [item.display_name, item.legal_name, item.city, item.client_type].some((value) => text(value).toLowerCase().includes(search.toLowerCase())))
  return <div className={styles.portfolioScene}>
    <section className={styles.customerConstellation}>
      <div className={styles.sceneTitleRow}><SceneTitle eyebrow="Customer portfolio constellation" title="Valeur, relation, service et horizon" detail="Chaque compte ouvre un dossier souverain complet sans quitter le contexte commercial."/><button type="button" data-primary onClick={() => open('client','create')}><Plus size={15}/>Nouveau client</button></div>
      <div className={styles.portfolioLensStrip}><span>{localMode}</span><div><b>{clients.length}</b> comptes</div><div><b>{money(snapshot.subscriptions.filter((item) => text(item.status) === 'active').reduce((sum, item) => sum + number(item.billing_amount_mad), 0))}</b> MRR</div><div><b>{snapshot.cases.filter((item) => !['resolved','closed'].includes(item.status)).length}</b> cas ouverts</div><div><b>{snapshot.renewals.filter((item) => daysUntil(item.renewal_date) < 180).length}</b> renouvellements 180j</div></div>
      <div className={styles.constellationGrid}>
        {clients.map((client, index) => {
          const context = clientSummary(client, snapshot)
          return <button type="button" key={text(client.id)} className={styles.customerConstellationNode} data-risk={context.risk} style={{ '--orbit': `${index % 4}` } as React.CSSProperties} onClick={() => openClient(text(client.id))}>
            <div className={styles.customerNodeHeader}><div>{initials(text(client.display_name))}</div><span>{human(text(client.client_type))}</span><i data-risk={context.risk}/></div>
            <h3>{text(client.display_name)}</h3><p>{text(client.city) || 'Ville non renseignée'} · {context.institutions} institution(s)</p>
            <div className={styles.customerNodeValue}><strong>{money(context.mrr)}</strong><span>MRR</span><b>{money(context.overdue)} exposés</b></div>
            <div className={styles.customerNodeSignals}><span><PackageCheck size={13}/>{context.tenants} tenant(s)</span><span><MessageSquareWarning size={13}/>{context.cases} cas</span><span><CalendarClock size={13}/>{context.renewalDays === 9999 ? '—' : `${context.renewalDays}j`}</span></div>
            <div className={styles.customerNodeHealth}><b><i style={{ width: `${context.health}%` }}/></b><strong>{context.health}/100</strong></div>
            <div className={styles.customerNodeFooter}><span>{context.priority}</span><ArrowRight size={14}/></div>
          </button>
        })}
        {!clients.length ? <SceneEmpty icon={<Building2/>} title="Aucun client dans cette vue" detail="Créez un client ou changez le filtre portefeuille."/> : null}
      </div>
    </section>
  </div>
}

function RetentionRecoveryScene({ snapshot, search, localMode, open, openClient }: { snapshot: GrowthWorkspaceSnapshot; search: string; localMode: string; open: Open; openClient: (id: string) => void }) {
  const normalizedCases = unifiedCases(snapshot).filter((item) => !search || [item.subject, item.type, item.status, item.clientName].some((value) => value.toLowerCase().includes(search.toLowerCase())))
  const filtered = localMode === 'Réclamations' ? normalizedCases.filter((item) => item.type.includes('complaint')) : localMode === 'Tickets' ? normalizedCases.filter((item) => item.type === 'support_ticket') : localMode === 'Incidents' ? normalizedCases.filter((item) => item.type === 'incident') : normalizedCases
  return <div className={styles.retentionScene}>
    <section className={styles.recoveryCommandSystem}>
      <div className={styles.sceneTitleRow}><SceneTitle eyebrow="Customer risk, case pressure & recovery command" title="Rétention, support, réclamations et rétablissement" detail="Les cas sont reliés au client, tenant, produit, finance, renouvellement et mission de recovery."/><div><button type="button" onClick={() => open('case','create',{ case_type: 'complaint' })}><MessageSquareWarning size={15}/>Réclamation</button><button type="button" data-primary onClick={() => open('case','create')}><Plus size={15}/>Nouveau cas</button></div></div>
      <div className={styles.caseCommandPulse}>
        <PulseBlock label="Ouverts" value={String(filtered.filter((item) => !['resolved','closed'].includes(item.status)).length)} detail="cas actifs" tone="neutral"/>
        <PulseBlock label="SLA risk" value={String(filtered.filter((item) => item.due && new Date(item.due) < new Date() && !['resolved','closed'].includes(item.status)).length)} detail="échéances dépassées" tone="critical"/>
        <PulseBlock label="Réclamations" value={String(filtered.filter((item) => item.type.includes('complaint')).length)} detail="pression confiance" tone="warning"/>
        <PulseBlock label="Critiques" value={String(filtered.filter((item) => item.severity === 'critical').length)} detail="intervention direction" tone="critical"/>
        <PulseBlock label="Récupérés" value={String(snapshot.interventions.filter((item) => ['resolved','closed'].includes(item.status)).length)} detail="outcomes vérifiés" tone="good"/>
      </div>
      <div className={styles.recoveryGrid}>
        <div className={styles.caseOperationsBoard}>
          {['received','triage','investigation','waiting_customer','escalated','resolved'].map((status) => <div key={status} className={styles.recoveryLane}><header><span>{CASE_STATUS_LABELS[status] || human(status)}</span><strong>{filtered.filter((item) => normalizeStatus(item.status) === status).length}</strong></header>{filtered.filter((item) => normalizeStatus(item.status) === status).slice(0, 7).map((item) => <button type="button" key={item.key} onClick={() => item.record && item.source === 'case' ? open('case','inspect', item.record) : item.clientId ? openClient(item.clientId) : undefined}><div><span>{CASE_TYPE_LABELS[item.type] || human(item.type)}</span><i data-severity={item.severity}/></div><strong>{item.subject}</strong><small>{item.clientName}</small><footer><em>{item.due ? dateLabel(item.due) : 'Sans SLA'}</em><ArrowRight size={13}/></footer></button>)}</div>)}
        </div>
        <aside className={styles.rootCauseRail}>
          <SectionHeading icon={<Network size={17}/>} eyebrow="Root cause concentration" title="Où la pression se forme"/>
          {groupBy(filtered, (item) => item.module || item.type).entries ? [...groupBy(filtered, (item) => item.module || item.type).entries()].slice(0, 8).map(([label, rows]) => <div key={label}><span>{human(label)}</span><strong>{rows.length}</strong><b><i style={{ width: `${Math.min(100, rows.length / Math.max(filtered.length, 1) * 100)}%` }}/></b></div>) : null}
          <div className={styles.recoveryMissionCTA}><HeartHandshake size={18}/><strong>Mission de recovery</strong><p>Transformez un cas critique en plan d’action avec owner, sponsor, échéance, communication et outcome.</p><button type="button" onClick={() => open('intervention','create')}>Lancer une mission</button></div>
        </aside>
      </div>
    </section>
  </div>
}

function RevenuePerformanceScene({ snapshot, localMode }: { snapshot: GrowthWorkspaceSnapshot; localMode: string }) {
  const pipeline = numberMetric(snapshot, 'pipeline')
  const weighted = numberMetric(snapshot, 'weighted')
  const activated = numberMetric(snapshot, 'mrr')
  const collected = snapshot.payments.reduce((sum, item) => sum + number(item.amount_mad), 0)
  const renewed = snapshot.renewals.filter((item) => text(item.status) === 'renewed').reduce((sum, item) => sum + number(item.renewed_value_mad || item.value_mad), 0)
  const expanded = snapshot.expansion.filter((item) => ['won','activated','closed'].includes(item.status)).reduce((sum, item) => sum + number(item.expected_mrr_mad), 0)
  const losses = snapshot.opportunities.filter((item) => item.status === 'lost').reduce((sum, item) => sum + number(item.expected_arr_mad), 0)
  return <div className={styles.performanceScene}>
    <section className={styles.revenueObservatory}>
      <div className={styles.sceneTitleRow}><SceneTitle eyebrow="Revenue conversion & customer value observatory" title="La performance qui devient du revenu retenu" detail="Pipeline, contrat, activation, collecte, renouvellement et expansion restent distincts et drillables."/><span className={styles.modeBadge}>{localMode}</span></div>
      <div className={styles.revenueRiver}>
        <RiverNode label="Pipeline" value={pipeline} max={Math.max(pipeline, 1)} tone="indigo"/>
        <RiverNode label="Pondéré" value={weighted} max={Math.max(pipeline, 1)} tone="blue"/>
        <RiverNode label="MRR activé" value={activated} max={Math.max(pipeline, activated, 1)} tone="green"/>
        <RiverNode label="Encaissé" value={collected} max={Math.max(pipeline, collected, 1)} tone="green"/>
        <RiverNode label="Renouvelé" value={renewed} max={Math.max(pipeline, renewed, 1)} tone="teal"/>
        <RiverNode label="Expansion" value={expanded} max={Math.max(pipeline, expanded, 1)} tone="violet"/>
        <RiverNode label="Perdu" value={losses} max={Math.max(pipeline, losses, 1)} tone="red"/>
      </div>
      <div className={styles.performanceMatrix}>
        <section className={styles.conversionObservatory}><SectionHeading icon={<BarChart3 size={17}/>} eyebrow="Conversion" title="Taux de passage"/><ConversionRow label="Prospect → qualifié" value={ratio(snapshot.prospects.filter((item) => item.qualification_stage === 'qualified').length, snapshot.prospects.length)}/><ConversionRow label="Deal → offre" value={ratio(snapshot.offers.length, snapshot.opportunities.length)}/><ConversionRow label="Offre → acceptée" value={ratio(snapshot.offers.filter((item) => ['accepted','converted'].includes(item.status)).length, snapshot.offers.length)}/><ConversionRow label="Contrat → activation" value={ratio(snapshot.subscriptions.filter((item) => text(item.status) === 'active').length, snapshot.contracts.length)}/></section>
        <section className={styles.retentionObservatory}><SectionHeading icon={<HeartHandshake size={17}/>} eyebrow="Retention" title="Valeur protégée"/><SignalRow label="Renouvellements à risque" value={String(snapshot.renewals.filter((item) => ['at_risk','lost'].includes(text(item.status))).length)} tone="warning"/><SignalRow label="Cas critiques" value={String(snapshot.cases.filter((item) => item.severity === 'critical' && !['resolved','closed'].includes(item.status)).length)} tone="critical"/><SignalRow label="Clients sans owner" value={String(snapshot.clients.filter((item) => !item.account_manager_id).length)} tone="warning"/><SignalRow label="Expansion identifiée" value={money(snapshot.expansion.reduce((sum, item) => sum + number(item.expected_mrr_mad), 0))} tone="good"/></section>
        <section className={styles.packagePerformance}><SectionHeading icon={<PackageCheck size={17}/>} eyebrow="Product performance" title="Packages dans les offres"/>{groupBy(snapshot.offers, (item) => productName(item.package_version_id, snapshot)).entries ? [...groupBy(snapshot.offers, (item) => productName(item.package_version_id, snapshot)).entries()].slice(0, 7).map(([name, rows]) => <div key={name}><span>{name}</span><strong>{rows.length}</strong><small>{money(rows.reduce((sum, item) => sum + number(item.contract_value_mad), 0))}</small></div>) : null}</section>
        <section className={styles.executionObservatory}><SectionHeading icon={<Activity size={17}/>} eyebrow="Execution" title="Discipline opérationnelle"/><SignalRow label="Deals sans next event" value={String(snapshot.opportunities.filter((item) => !item.next_event).length)} tone="warning"/><SignalRow label="Prospects non qualifiés" value={String(snapshot.prospects.filter((item) => !['qualified','converted'].includes(item.qualification_stage)).length)} tone="neutral"/><SignalRow label="Offres sans approbation" value={String(snapshot.offers.filter((item) => item.approval_status !== 'approved').length)} tone="warning"/><SignalRow label="Contrats sans abonnement" value={String(snapshot.contracts.filter((item) => !item.subscription_id).length)} tone="critical"/></section>
      </div>
    </section>
  </div>
}

function deriveOperationalPressure(snapshot: GrowthWorkspaceSnapshot) {
  const decisions: Array<{ key: string; title: string; detail: string; tone: string; clientId?: string; entity?: GrowthEntityType; record?: Record<string, unknown> }> = []
  snapshot.cases.filter((item) => item.severity === 'critical' && !['resolved','closed'].includes(item.status)).slice(0, 3).forEach((item) => decisions.push({ key: `case-${item.id}`, title: item.subject, detail: `${CASE_TYPE_LABELS[item.case_type]} · ${clientName(item.client_id, snapshot)}`, tone: 'critical', clientId: item.client_id }))
  snapshot.opportunities.filter((item) => ['negotiation','decision','contracting'].includes(item.stage)).slice(0, 3).forEach((item) => decisions.push({ key: `opp-${item.id}`, title: item.name, detail: `${OPPORTUNITY_STAGE_LABELS[item.stage]} · ${money(item.expected_arr_mad)}`, tone: 'warning', entity: 'opportunity', record: item as unknown as Record<string, unknown> }))
  snapshot.contracts.filter((item) => !item.subscription_id).slice(0, 2).forEach((item) => decisions.push({ key: `contract-${text(item.id)}`, title: `Activer ${text(item.contract_code)}`, detail: `${clientName(item.client_id, snapshot)} · abonnement manquant`, tone: 'warning', entity: 'contract', record: item }))
  snapshot.clients.filter((item) => !item.account_manager_id).slice(0, 2).forEach((item) => decisions.push({ key: `client-${text(item.id)}`, title: `Attribuer ${text(item.display_name)}`, detail: 'Compte sans owner', tone: 'neutral', clientId: text(item.id) }))
  if (!decisions.length) decisions.push({ key: 'stable', title: 'Aucune décision critique immédiate', detail: 'Maintenir la cadence et préparer l’expansion.', tone: 'good' })
  const pipeline = numberMetric(snapshot, 'pipeline')
  const overdue = numberMetric(snapshot, 'overdue')
  const cases = snapshot.cases.filter((item) => !['resolved','closed'].includes(item.status)).length
  const renewals = snapshot.renewals.filter((item) => ['at_risk','lost'].includes(text(item.status))).length
  const risks = [
    { label: 'Pipeline à risque', value: money(snapshot.opportunities.filter((item) => item.risks.length).reduce((sum, item) => sum + number(item.expected_arr_mad), 0)), width: pipeline ? 68 : 0, tone: 'warning' },
    { label: 'Exposition financière', value: money(overdue), width: overdue ? 74 : 4, tone: overdue ? 'critical' : 'good' },
    { label: 'Cas ouverts', value: String(cases), width: Math.min(100, cases * 12), tone: cases ? 'warning' : 'good' },
    { label: 'Renouvellements exposés', value: String(renewals), width: Math.min(100, renewals * 18), tone: renewals ? 'warning' : 'good' },
  ]
  return { decisions, risks }
}

function unifiedCases(snapshot: GrowthWorkspaceSnapshot) {
  return [
    ...snapshot.cases.map((item) => ({ key: `case-${item.id}`, source: 'case', type: item.case_type, subject: item.subject, status: item.status, severity: item.severity, due: item.due_at || '', clientId: item.client_id, clientName: clientName(item.client_id, snapshot), module: item.related_module_key || '', record: item as unknown as Record<string,unknown> })),
    ...snapshot.tickets.map((item) => ({ key: `ticket-${text(item.id)}`, source: 'ticket', type: 'support_ticket', subject: text(item.subject) || text(item.title) || 'Ticket support', status: text(item.status), severity: text(item.severity) || 'medium', due: text(item.due_at), clientId: text(item.client_id), clientName: clientName(item.client_id, snapshot), module: text(item.module_key), record: item })),
    ...snapshot.incidents.map((item) => ({ key: `incident-${text(item.id)}`, source: 'incident', type: 'incident', subject: text(item.title) || text(item.subject) || 'Incident', status: text(item.status), severity: text(item.severity) || 'high', due: text(item.due_at), clientId: text(item.client_id), clientName: clientName(item.client_id, snapshot), module: text(item.module_key), record: item })),
  ]
}

function clientSummary(client: Record<string, unknown>, snapshot: GrowthWorkspaceSnapshot) {
  const id = text(client.id)
  const subscriptions = snapshot.subscriptions.filter((item) => text(item.client_id) === id)
  const mrr = subscriptions.filter((item) => text(item.status) === 'active').reduce((sum, item) => sum + number(item.billing_amount_mad), 0)
  const invoices = snapshot.invoices.filter((item) => text(item.client_id) === id)
  const overdue = invoices.reduce((sum, item) => sum + number(item.balance_due_mad), 0)
  const cases = unifiedCases(snapshot).filter((item) => item.clientId === id && !['resolved','closed'].includes(item.status)).length
  const renewals = snapshot.renewals.filter((item) => text(item.client_id) === id)
  const renewalDays = Math.min(...renewals.map((item) => daysUntil(item.renewal_date)), 9999)
  const tenants = snapshot.tenants.filter((item) => text(item.client_id) === id).length
  const institutions = snapshot.institutions.filter((item) => text(item.client_id) === id).length
  let health = 82
  if (overdue) health -= 18
  if (cases) health -= Math.min(25, cases * 5)
  if (!tenants) health -= 12
  const risk = health < 45 ? 'critical' : health < 65 ? 'high' : health < 80 ? 'watch' : 'healthy'
  const priority = overdue ? 'Sécuriser finance' : cases ? 'Résoudre pression client' : renewalDays < 120 ? 'Préparer renouvellement' : 'Développer le compte'
  return { mrr, overdue, cases, renewalDays, tenants, institutions, health: Math.max(0, health), risk, priority }
}

function SceneTitle({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) { return <div className={styles.sceneTitle}><span>{eyebrow}</span><h2>{title}</h2><p>{detail}</p></div> }
function SectionHeading({ icon, eyebrow, title }: { icon: React.ReactNode; eyebrow: string; title: string }) { return <header className={styles.sectionHeading}><span>{icon}</span><div><small>{eyebrow}</small><strong>{title}</strong></div></header> }
function ForecastLine({ label, value, confidence }: { label: string; value: string; confidence: number }) { return <div className={styles.forecastLine}><div><span>{label}</span><strong>{value}</strong></div><b><i style={{ width: `${confidence}%` }}/></b><small>{confidence}% confiance</small></div> }
function SignalRow({ label, value, tone }: { label: string; value: string; tone: string }) { return <div className={styles.signalRow} data-tone={tone}><span>{label}</span><strong>{value}</strong><i/></div> }
function QualificationStep({ label, state }: { label: string; state: 'done' | 'missing' }) { return <div data-state={state}><i>{state === 'done' ? <CheckCircle2 size={12}/> : <AlertTriangle size={12}/>}</i><span>{label}</span></div> }
function OfferPlane({ icon, label, title, detail }: { icon: React.ReactNode; label: string; title: string; detail: string }) { return <div className={styles.offerPlane}><span>{icon}</span><small>{label}</small><strong>{title}</strong><p>{detail}</p></div> }
function ReadinessItem({ label, ok, detail }: { label: string; ok: boolean; detail: string }) { return <div className={styles.readinessItem} data-ok={ok}><i>{ok ? <CheckCircle2 size={13}/> : <AlertTriangle size={13}/>}</i><div><strong>{label}</strong><span>{detail}</span></div></div> }
function PulseBlock({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) { return <div data-tone={tone}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div> }
function RiverNode({ label, value, max, tone }: { label: string; value: number; max: number; tone: string }) { return <div className={styles.riverNode} data-tone={tone}><span>{label}</span><strong>{money(value)}</strong><b><i style={{ width: `${Math.max(4, value / max * 100)}%` }}/></b></div> }
function ConversionRow({ label, value }: { label: string; value: number }) { return <div className={styles.conversionRow}><div><span>{label}</span><strong>{value}%</strong></div><b><i style={{ width: `${value}%` }}/></b></div> }
function SceneEmpty({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) { return <div className={styles.sceneEmpty}><span>{icon}</span><strong>{title}</strong><p>{detail}</p></div> }

function dockTitle(mode: GrowthMode) { return ({ command: 'Commander le mouvement de valeur', markets: 'Qualifier les comptes avant le deal', pipeline: 'Faire avancer chaque mission commerciale', offers: 'Ingénierie de solution et négociation', contracts: 'Transformer les engagements en service actif', portfolio: 'Protéger et développer chaque relation', health: 'Résoudre les cas et restaurer la confiance', performance: 'Améliorer la conversion et la rétention' })[mode] }
function dockSubtitle(mode: GrowthMode) { return ({ command: 'Décisions, risques et horizon', markets: 'Compte, influence, fit et prochaine action', pipeline: 'Stage, owner, stakeholder, event et close', offers: 'Product Studio, valeur, pricing et concessions', contracts: 'Contrat, abonnement, tenant et activation', portfolio: 'Dossier souverain client en contexte', health: 'Support, plainte, incident et recovery mission', performance: 'Pipeline → valeur activée → revenu retenu' })[mode] }
function dockActions(mode: GrowthMode, open: Open) { const actions: Record<GrowthMode, React.ReactNode> = { command: <><button onClick={() => open('opportunity','create')}><BriefcaseBusiness size={15}/>Deal</button><button onClick={() => open('case','create')}><Siren size={15}/>Cas critique</button></>, markets: <><button onClick={() => open('prospect','create')}><Target size={15}/>Compte cible</button><button onClick={() => open('contact','create')}><UserRound size={15}/>Contact</button></>, pipeline: <><button onClick={() => open('opportunity','create')}><Plus size={15}/>Deal</button><button onClick={() => open('offer','create')}><Sparkles size={15}/>Offre</button></>, offers: <><button onClick={() => open('offer','create')}><Sparkles size={15}/>Composer</button><button onClick={() => open('negotiation','create')}><Network size={15}/>Négociation</button></>, contracts: <button onClick={() => open('offer','create')}><FileSignature size={15}/>Offre vers contrat</button>, portfolio: <><button onClick={() => open('client','create')}><Building2 size={15}/>Client</button><button onClick={() => open('expansion','create')}><TrendingUp size={15}/>Expansion</button></>, health: <><button onClick={() => open('case','create',{ case_type: 'complaint' })}><MessageSquareWarning size={15}/>Réclamation</button><button onClick={() => open('intervention','create')}><HeartHandshake size={15}/>Recovery</button></>, performance: <button onClick={() => open('opportunity','create')}><TrendingUp size={15}/>Créer du pipeline</button> }; return actions[mode] }

function metric(snapshot: GrowthWorkspaceSnapshot, key: string) { return snapshot.metrics.find((item) => item.key === key)?.value || '0' }
function metricDetail(snapshot: GrowthWorkspaceSnapshot, key: string) { return snapshot.metrics.find((item) => item.key === key)?.detail || '—' }
function numberMetric(snapshot: GrowthWorkspaceSnapshot, key: string) { const raw = metric(snapshot, key).replace(/[^0-9,-]/g, '').replace(/\s/g, '').replace(',', '.'); return number(raw) }
function filterProspects(rows: GrowthProspectRecord[], search: string) { if (!search) return rows; const needle = search.toLowerCase(); return rows.filter((item) => [item.organization_name, item.organization_type, item.city, item.region, item.status].some((value) => text(value).toLowerCase().includes(needle))) }
function prospectScore(prospect: GrowthProspectRecord, contacts: number) { let score = 35; if (prospect.pain_points.length) score += 15; if (Object.keys(prospect.product_fit || {}).length) score += 15; if (prospect.next_action) score += 10; if (prospect.estimated_students) score += 10; score += Math.min(15, contacts * 5); return Math.min(100, score) }
function findPotentialDuplicates(rows: GrowthProspectRecord[]) { const seen = new Map<string, GrowthProspectRecord[]>(); rows.forEach((item) => { const key = item.organization_name.toLowerCase().replace(/[^a-z0-9]/g, ''); seen.set(key, [...(seen.get(key) || []), item]) }); return [...seen.values()].filter((group) => group.length > 1) }
function groupBy<T>(rows: T[], getter: (row: T) => string) { const map = new Map<string, T[]>(); rows.forEach((row) => { const key = getter(row) || 'Non classé'; map.set(key, [...(map.get(key) || []), row]) }); return map }
function accountName(record: GrowthOpportunityRecord | GrowthOfferRecord | Record<string, unknown>, snapshot: GrowthWorkspaceSnapshot) { const client = snapshot.clients.find((item) => text(item.id) === text(record.client_id)); if (client) return text(client.display_name); const prospect = snapshot.prospects.find((item) => item.id === text(record.prospect_id)); return prospect?.organization_name || 'Compte non résolu' }
function clientName(id: unknown, snapshot: GrowthWorkspaceSnapshot) { return text(snapshot.clients.find((item) => text(item.id) === text(id))?.display_name) || 'Client non résolu' }
function productName(id: unknown, snapshot: GrowthWorkspaceSnapshot) { return snapshot.products.find((item) => item.id === text(id))?.name || 'Configuration personnalisée' }
function selectedAddons(offer: GrowthOfferRecord) { const value = offer.configuration_snapshot?.addons; return Array.isArray(value) ? value : [] }
function contractBlocker(readiness: boolean[]) { const labels = ['Contrat manquant','Signature requise','Abonnement requis','Tenant requis','Entitlements non compilés','Activation requise']; return labels[readiness.findIndex((value) => !value)] || 'Prêt / actif' }
function normalizeStatus(value: string) { if (['new','open','received'].includes(value)) return 'received'; if (value === 'triage') return 'triage'; if (['assigned','in_progress','investigation'].includes(value)) return 'investigation'; if (['waiting','waiting_customer'].includes(value)) return 'waiting_customer'; if (value === 'escalated') return 'escalated'; if (['resolved','closed'].includes(value)) return 'resolved'; return value }
function ratio(value: number, total: number) { return total ? Math.round(value / total * 100) : 0 }
function dateLabel(value: unknown) { if (!value) return '—'; const date = new Date(text(value)); return Number.isNaN(date.getTime()) ? text(value) : date.toLocaleDateString('fr-FR') }
function daysUntil(value: unknown) { if (!value) return 9999; const date = new Date(text(value)); return Number.isNaN(date.getTime()) ? 9999 : Math.ceil((date.getTime() - Date.now()) / 86400000) }
function money(value: unknown) { return `${Math.round(number(value)).toLocaleString('fr-FR')} Dh` }
function number(value: unknown) { const parsed = Number(value || 0); return Number.isFinite(parsed) ? parsed : 0 }
function text(value: unknown) { return value === null || value === undefined ? '' : String(value) }
function human(value: string) { return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }
function initials(value: string) { return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'AC' }
