import type { PartnerWorkspaceHydration, WorkspaceDomain } from './workspace-types.js'

export type PartnerViewKey = 'partner_overview' | 'handoff' | 'activation' | 'performance' | 'issues' | 'qbr' | 'growth' | 'renewal' | 'tender' | 'partner_timeline'

export const PARTNER_DOMAIN_LABELS: Record<WorkspaceDomain, { short: string; description: string }> = {
  account: { short: 'Partner', description: 'Identité, contrat, sites et services' },
  execute: { short: 'Operate', description: 'Handoff, onboarding, lancement et qualité' },
  deal: { short: 'Growth', description: 'Expansion, renouvellement et tenders' },
  intelligence: { short: 'Intelligence', description: 'Performance, santé et risques' },
  more: { short: 'More', description: 'Timeline, preuves et documents' },
}

export const PARTNER_NAV = [
  { view: 'partner_overview' as const, label: 'Partner 360', domain: 'account' as const, submodule: 'partner_activation', capability: 'extension.b2b.partner_activation' },
  { view: 'handoff' as const, label: 'Handoff', domain: 'execute' as const, submodule: 'operational_handoff', capability: 'extension.b2b.operational_handoff' },
  { view: 'activation' as const, label: 'Activation', domain: 'execute' as const, submodule: 'activation_management', capability: 'extension.b2b.partner_activation' },
  { view: 'issues' as const, label: 'Issue Command', domain: 'execute' as const, submodule: 'issue_management', capability: 'extension.b2b.partner_performance' },
  { view: 'qbr' as const, label: 'QBR', domain: 'execute' as const, submodule: 'partner_reviews', capability: 'extension.b2b.partner_performance' },
  { view: 'growth' as const, label: 'Expansion', domain: 'deal' as const, submodule: 'upsell', capability: 'extension.b2b.upsell_cross_sell' },
  { view: 'renewal' as const, label: 'Renewal', domain: 'deal' as const, submodule: 'renewals', capability: 'extension.b2b.renewal_management' },
  { view: 'tender' as const, label: 'Tender', domain: 'deal' as const, submodule: 'tender_management', capability: 'extension.b2b.tender_rfp_intelligence' },
  { view: 'performance' as const, label: 'Performance', domain: 'intelligence' as const, submodule: 'partner_performance', capability: 'extension.b2b.partner_performance' },
  { view: 'partner_timeline' as const, label: 'Timeline', domain: 'more' as const, submodule: 'partner_timeline', capability: 'extension.b2b.partner_activation' },
]

export function partnerDomainForView(view: PartnerViewKey): WorkspaceDomain {
  return PARTNER_NAV.find((item) => item.view === view)?.domain || 'account'
}

export function defaultPartnerView(domain: WorkspaceDomain): PartnerViewKey {
  if (domain === 'account') return 'partner_overview'
  if (domain === 'execute') return 'handoff'
  if (domain === 'deal') return 'growth'
  if (domain === 'intelligence') return 'performance'
  return 'partner_timeline'
}

type Helpers = { esc: (value: unknown) => string; money: (value: unknown) => string; dt: (value: unknown) => string }
function empty(title: string, text: string, action?: string, label?: string) { return `<section class="partner-empty"><div class="partner-empty-mark">AC</div><h2>${title}</h2><p>${text}</p>${action ? `<button data-action="${action}" class="b2b-primary">${label || 'Démarrer'}</button>` : ''}</section>` }
function metric(label: string, value: string, detail = '') { return `<article><span>${label}</span><strong>${value}</strong><small>${detail}</small></article>` }
function status(value: unknown) { return String(value || 'missing').replaceAll('_', ' ') }

export function renderPartnerWorkspace(view: PartnerViewKey, workspace: PartnerWorkspaceHydration, h: Helpers) {
  const { esc, money, dt } = h
  const partner = workspace.partner
  if (!partner && view !== 'handoff') return empty('Partner 360 non activé', 'Le dossier partenaire sera disponible après acceptation du handoff et activation autorisée.', view === 'partner_overview' ? 'generate-handoff' : undefined, 'Ouvrir le handoff')
  const safePartner: Record<string, any> = partner || {}
  const identity = workspace.identity || { sites: [], services: [], contacts: [], documents: [] }
  const operate = workspace.operate || { handoffs: [], onboardingPlans: [], onboardingTasks: [], activationPlans: [], activationGates: [], firstServices: [], hypercare: [], issues: [], correctiveActions: [], reviews: [] }
  const growth = workspace.growth || { signals: [], opportunities: [], expansionPlans: [], renewals: [], renewalMilestones: [], churnRisks: [], rescueCases: [] }
  const intelligence = workspace.intelligence || { performance: [], health: [], missingData: [] }
  const tenders = workspace.tenders || { tenders: [], requirements: [], compliance: [] }
  const health = intelligence.latestHealth
  const performance = intelligence.latestPerformance
  const onboarding = operate.onboardingPlans?.[0]
  const activation = operate.activeActivation || operate.activationPlans?.[0]
  const openIssues = operate.issues.filter((row: any) => row.status !== 'closed')
  const activeRenewal = growth.activeRenewal || growth.renewals?.[0]

  if (view === 'partner_overview') return `<section class="partner-command">
    <article class="partner-hero"><div><span class="partner-kicker">PARTNER 360 LIVE</span><h2>${esc(safePartner.commercial_name || safePartner.legal_name)}</h2><p>${esc(safePartner.vertical || 'B2B')} · ${esc(safePartner.city || 'Territoire à confirmer')}</p><div class="partner-badges"><span>${esc(status(safePartner.status))}</span><span>${esc(status(safePartner.activation_status))}</span><span>${esc(safePartner.contract_reference || 'Contrat à référencer')}</span></div></div><div class="partner-health-ring"><strong>${health?.score ?? safePartner.health_score ?? '—'}</strong><span>Health</span></div></article>
    <div class="partner-metrics">${metric('Sites', String(identity.sites.length), 'périmètre actif')}${metric('Services', String(identity.services.length), 'configurations')}${metric('Contacts', String(identity.contacts.length), 'opérationnels & finance')}${metric('Contrat', safePartner.contract_end_at ? dt(safePartner.contract_end_at) : 'À compléter', 'échéance')}</div>
    <div class="partner-two"><article class="partner-panel"><header><strong>Sites & branches</strong><button data-action="partner-site-create">Ajouter site</button></header><div class="partner-list">${identity.sites.slice(0,6).map((row:any)=>`<div><i class="state-${esc(row.status)}"></i><section><strong>${esc(row.name)}</strong><small>${esc(row.city || row.address || 'Localisation à confirmer')}</small></section><span>${esc(status(row.status))}</span></div>`).join('') || '<p>Aucun site configuré.</p>'}</div></article><article class="partner-panel"><header><strong>Services actifs</strong><button data-action="partner-service-configure">Configurer</button></header><div class="partner-list">${identity.services.slice(0,6).map((row:any)=>`<div><i class="state-${esc(row.status)}"></i><section><strong>${esc(row.service_line)}</strong><small>${esc(row.program || row.frequency || 'Configuration')}</small></section><span>${row.commercial_value ? money(row.commercial_value) : esc(status(row.status))}</span></div>`).join('') || '<p>Aucun service configuré.</p>'}</div></article></div>
    <article class="partner-panel"><header><strong>Contacts de gouvernance</strong><button data-action="partner-update">Mettre à jour</button></header><div class="partner-contact-grid">${identity.contacts.slice(0,8).map((row:any)=>`<div><span>${esc(String(row.full_name||'?').split(' ').map((x:string)=>x[0]).join('').slice(0,2))}</span><section><strong>${esc(row.full_name)}</strong><small>${esc(row.role || row.contact_type)}</small></section></div>`).join('') || '<p>Contacts partenaire à synchroniser depuis le dossier commercial.</p>'}</div></article>
  </section>`

  if (view === 'handoff') {
    const handoff = operate.activeHandoff || operate.handoffs?.[0]
    if (!handoff) return empty('Handoff opérationnel absent', 'Générez le handoff depuis les données réelles de closing avant l’onboarding.', 'generate-handoff', 'Générer le handoff')
    const blockers = handoff.blockers || []
    return `<section class="partner-command"><article class="partner-workspace-head"><div><span class="partner-kicker">OPERATIONAL HANDOFF</span><h2>Passage commercial → opérations</h2><p>Version ${esc(handoff.current_version)} · ${esc(status(handoff.status))}</p></div><div class="readiness-score"><strong>${handoff.readiness_score || 0}%</strong><span>Readiness</span></div></article>
      <div class="partner-gate-grid">${['legal_entity','scope','pricing','payment','contacts','launch'].map((key,index)=>`<div class="${blockers.some((x:string)=>x.includes(key))?'blocked':'passed'}"><span>${index+1}</span><strong>${esc(key.replaceAll('_',' '))}</strong><small>${blockers.some((x:string)=>x.includes(key))?'Correction requise':'Validé'}</small></div>`).join('')}</div>
      <article class="partner-panel"><header><strong>Blockers & conditions</strong><span>${blockers.length} blocker(s)</span></header><div class="partner-risk-list">${blockers.map((row:string)=>`<div><strong>${esc(row.replaceAll('_',' '))}</strong><small>Doit être corrigé avant acceptation opérationnelle.</small></div>`).join('') || '<div class="positive"><strong>Handoff prêt</strong><small>Aucun blocker critique.</small></div>'}</div></article>
      <div class="partner-action-bar"><button data-action="validate-handoff">Valider</button><button data-action="request-handoff-correction">Demander correction</button><button data-action="accept-handoff" class="b2b-primary">Accepter le handoff</button><button data-action="activate-partner">Activer Partner 360</button></div></section>`
  }

  if (view === 'activation') {
    const tasks = operate.onboardingTasks || []
    const gates = operate.activationGates || []
    const completed = tasks.filter((row:any)=>row.status==='completed').length
    return `<section class="partner-command"><article class="partner-workspace-head"><div><span class="partner-kicker">PARTNER ACTIVATION</span><h2>Onboarding & Launch Command</h2><p>${esc(status(onboarding?.stage || 'not_started'))} · lancement ${dt(activation?.launch_at)}</p></div><div class="readiness-score"><strong>${activation?.readiness_score || onboarding?.completion_percent || 0}%</strong><span>Launch</span></div></article>
      <div class="partner-metrics">${metric('Onboarding',`${completed}/${tasks.length}`,'tâches complétées')}${metric('Gates',`${gates.filter((x:any)=>x.status==='passed').length}/${gates.length}`,'contrôles passés')}${metric('First service',String(operate.firstServices.length),'mission(s)')}${metric('Hypercare',String(operate.hypercare.length),'checkpoints')}</div>
      <div class="partner-two"><article class="partner-panel"><header><strong>Tâches onboarding</strong><button data-action="create-onboarding">Créer / reprendre</button></header><div class="partner-task-list">${tasks.slice(0,10).map((row:any)=>`<div><span class="task-${esc(row.status)}">${row.status==='completed'?'✓':'○'}</span><section><strong>${esc(row.title)}</strong><small>${esc(row.category)} · ${dt(row.due_at)}</small></section>${row.status!=='completed'?`<button data-complete-onboarding-task="${esc(row.id)}">Terminer</button>`:''}</div>`).join('') || '<p>Plan onboarding non créé.</p>'}</div></article><article class="partner-panel"><header><strong>Launch gates</strong><button data-action="calculate-activation">Calculer</button></header><div class="partner-gates">${gates.map((row:any)=>`<div class="${row.status==='passed'?'passed':'blocked'}"><span>${row.status==='passed'?'✓':'!'}</span><section><strong>${esc(row.label)}</strong><small>${esc(status(row.status))}</small></section></div>`).join('') || '<p>Calculez la readiness pour initialiser les gates.</p>'}</div></article></div>
      <div class="partner-action-bar"><button data-action="approve-activation" class="b2b-primary">Approuver lancement</button><button data-action="prepare-first-service">Préparer premier service</button><button data-action="record-first-service">Résultat service</button><button data-action="create-hypercare">Créer hypercare</button></div></section>`
  }

  if (view === 'performance') return `<section class="partner-command"><article class="partner-workspace-head"><div><span class="partner-kicker">PARTNER PERFORMANCE</span><h2>Performance & Health Intelligence</h2><p>Les données absentes restent explicitement marquées comme manquantes.</p></div><div class="partner-health-ring"><strong>${health?.score ?? '—'}</strong><span>${esc(status(health?.level || 'unknown'))}</span></div></article>
    <div class="partner-metrics">${metric('Contracted',performance?.contracted_revenue!=null?money(performance.contracted_revenue):'Manquant')}${metric('Collected',performance?.collected_revenue!=null?money(performance.collected_revenue):'Manquant')}${metric('Service success',performance?.service_success!=null?`${performance.service_success}%`:'Manquant')}${metric('Satisfaction',performance?.satisfaction!=null?`${performance.satisfaction}%`:'Manquant')}</div>
    <div class="partner-two"><article class="partner-panel"><header><strong>Health dimensions</strong><button data-action="calculate-health">Recalculer</button></header><div class="dimension-list">${Object.entries(health?.dimensions||{}).map(([key,value])=>`<div><span>${esc(key.replaceAll('_',' '))}</span><strong>${value==null?'Missing':`${esc(value)}%`}</strong><i style="--dimension:${Number(value||0)}"></i></div>`).join('') || '<p>Aucun snapshot de santé.</p>'}</div></article><article class="partner-panel"><header><strong>Data quality</strong><span>${intelligence.missingData.length} missing</span></header><div class="partner-risk-list">${intelligence.missingData.map((row:string)=>`<div><strong>${esc(row)}</strong><small>Source réelle requise; aucune valeur ne sera inventée.</small></div>`).join('') || '<div class="positive"><strong>Données disponibles</strong><small>Aucun champ critique manquant.</small></div>'}</div></article></div>
    <div class="partner-action-bar"><button data-action="load-performance">Charger performance</button><button data-action="calculate-health" class="b2b-primary">Calculer santé</button><button data-action="prepare-qbr">Préparer QBR</button></div></section>`

  if (view === 'issues') {
    const active = operate.activeIssue || openIssues[0]
    return `<section class="partner-command"><article class="partner-workspace-head"><div><span class="partner-kicker">ISSUE COMMAND</span><h2>Risques, incidents & corrective actions</h2><p>${openIssues.length} issue(s) ouverte(s)</p></div><div class="risk-counter"><strong>${openIssues.filter((x:any)=>['high','critical'].includes(x.severity)).length}</strong><span>Critiques</span></div></article>
      <div class="issue-board">${openIssues.slice(0,12).map((row:any)=>`<article class="severity-${esc(row.severity)}"><header><span>${esc(row.category)}</span><strong>${esc(status(row.severity))}</strong></header><h3>${esc(row.title)}</h3><p>${esc(row.description || row.partner_impact || 'Impact à documenter')}</p><footer><span>${money(row.revenue_impact)}</span><button data-select-issue="${esc(row.id)}">Commander</button></footer></article>`).join('') || '<p class="positive-block">Aucun issue ouvert.</p>'}</div>
      ${active?`<article class="partner-panel"><header><strong>Issue actif · ${esc(active.title)}</strong><span>${esc(status(active.status))}</span></header><p>${esc(active.description || 'Description à compléter')}</p><div class="partner-action-bar"><button data-action="escalate-issue">Escalader</button><button data-action="create-corrective-action">Créer CAP</button><button data-action="close-corrective-action" class="b2b-primary">Clôturer CAP</button></div></article>`:''}
      <button data-action="create-issue" class="b2b-primary full-command-button">Créer un issue partenaire</button></section>`
  }

  if (view === 'qbr') return `<section class="partner-command"><article class="qbr-cover"><span>QUARTERLY BUSINESS REVIEW</span><h2>${esc(safePartner.commercial_name || safePartner.legal_name)}</h2><p>Contract performance · Revenue · Satisfaction · Issues · Growth · Renewal</p><div><strong>${dt(new Date().toISOString())}</strong><small>Préparation evidence-backed</small></div></article>
    <div class="partner-metrics">${metric('Health',String(health?.score ?? '—'),status(health?.level))}${metric('Issues',String(openIssues.length),'ouverts')}${metric('Growth',String(growth.opportunities.length),'opportunités')}${metric('Renewal',activeRenewal?status(activeRenewal.status):'Non créé','cycle')}</div>
    <div class="partner-two"><article class="partner-panel"><header><strong>Décisions attendues</strong></header><div class="qbr-section-list"><div>Performance contractuelle</div><div>Qualité & satisfaction</div><div>Issues et CAP</div><div>Expansion saine</div><div>Renewal risk</div></div></article><article class="partner-panel"><header><strong>Reviews précédentes</strong><span>${operate.reviews.length}</span></header><div class="partner-list">${operate.reviews.slice(0,6).map((row:any)=>`<div><section><strong>${esc(row.review_type)}</strong><small>${dt(row.created_at)}</small></section><span>${esc(status(row.status))}</span></div>`).join('') || '<p>Aucune review générée.</p>'}</div></article></div>
    <div class="partner-action-bar"><button data-action="prepare-review">Préparer revue mensuelle</button><button data-action="prepare-qbr" class="b2b-primary">Générer QBR</button></div></section>`

  if (view === 'growth') return `<section class="partner-command"><article class="partner-workspace-head"><div><span class="partner-kicker">GROWTH & EXPANSION</span><h2>Upsell, Cross-sell & Multi-site</h2><p>Expansion autorisée uniquement pour un partenaire sain et solvable.</p></div><div class="readiness-score"><strong>${health?.expansion_ready?'GO':'HOLD'}</strong><span>Expansion</span></div></article>
    <div class="growth-lanes"><article><header><strong>Signals</strong><span>${growth.signals.length}</span></header>${growth.signals.slice(0,8).map((row:any)=>`<div><strong>${esc(row.signal_type)}</strong><small>${esc(row.description)}</small><span>${Math.round(Number(row.confidence||0)*100)}%</span></div>`).join('')||'<p>Aucun signal détecté.</p>'}</article><article><header><strong>Opportunities</strong><span>${growth.opportunities.length}</span></header>${growth.opportunities.slice(0,8).map((row:any)=>`<div><strong>${esc(row.title)}</strong><small>${esc(row.opportunity_type)} · ${money(row.estimated_value)}</small><span>${esc(status(row.status))}</span></div>`).join('')||'<p>Aucune opportunité créée.</p>'}</article><article><header><strong>Expansion plans</strong><span>${growth.expansionPlans.length}</span></header>${growth.expansionPlans.slice(0,8).map((row:any)=>`<div><strong>${esc(row.expansion_type)}</strong><small>${esc(status(row.status))}</small><span>${dt(row.created_at)}</span></div>`).join('')||'<p>Aucun plan.</p>'}</article></div>
    <div class="partner-action-bar"><button data-action="detect-upsell">Détecter upsell</button><button data-action="create-upsell">Créer opportunité</button><button data-action="detect-cross-sell">Cross-sell</button><button data-action="detect-site-expansion">Nouveaux sites</button><button data-action="create-expansion-plan" class="b2b-primary">Plan expansion</button></div></section>`

  if (view === 'renewal') return `<section class="partner-command"><article class="renewal-timeline-head"><div><span class="partner-kicker">RENEWAL COMMAND</span><h2>${safePartner.contract_end_at?`Échéance ${dt(safePartner.contract_end_at)}`:'Date contractuelle manquante'}</h2><p>${activeRenewal?`${esc(status(activeRenewal.status))} · risque ${esc(status(activeRenewal.renewal_risk))}`:'Initialisez la renewal intelligence.'}</p></div><div class="risk-counter"><strong>${activeRenewal?.readiness_score ?? '—'}</strong><span>Readiness</span></div></article>
    <div class="renewal-rail">${[180,120,90,60,30].map((day)=>{const m=growth.renewalMilestones.find((x:any)=>x.days_before===day);return `<div class="${m?.status==='completed'?'done':''}"><span>${day}J</span><strong>${day===180?'Intelligence':day===120?'Performance':day===90?'Strategy':day===60?'Proposal':'Decision'}</strong><small>${m?dt(m.due_at):'À générer'}</small></div>`}).join('')}</div>
    <div class="partner-two"><article class="partner-panel"><header><strong>Churn signals</strong><span>${growth.churnRisks.length}</span></header><div class="partner-risk-list">${growth.churnRisks.slice(0,6).map((row:any)=>`<div><strong>${esc(status(row.risk_level))} · ${row.score}</strong><small>${esc((row.signals||[]).join(' · '))}</small></div>`).join('')||'<div class="positive"><strong>Aucun signal enregistré</strong><small>Lancez la détection churn.</small></div>'}</div></article><article class="partner-panel"><header><strong>Rescue cases</strong><span>${growth.rescueCases.length}</span></header><div class="partner-list">${growth.rescueCases.slice(0,6).map((row:any)=>`<div><section><strong>${esc(row.rescue_type)}</strong><small>${esc(row.reason)}</small></section><span>${money(row.revenue_at_risk)}</span></div>`).join('')||'<p>Aucun rescue ouvert.</p>'}</div></article></div>
    <div class="partner-action-bar"><button data-action="calculate-renewal">Calculer readiness</button><button data-action="create-renewal-plan">Créer stratégie</button><button data-action="prepare-renewal-proposal" class="b2b-primary">Préparer proposition</button><button data-action="detect-churn">Détecter churn</button><button data-action="create-partner-rescue">Executive rescue</button></div></section>`

  if (view === 'tender') return `<section class="partner-command"><article class="partner-workspace-head"><div><span class="partner-kicker">TENDER COMMAND</span><h2>Bid / No-bid & Compliance</h2><p>Détection → décision → exigences → pricing → approbation → submission → handoff</p></div><div class="risk-counter"><strong>${tenders.tenders.length}</strong><span>Tenders</span></div></article>
    <div class="tender-board">${tenders.tenders.slice(0,10).map((row:any)=>`<article><header><span>${esc(row.reference||'RFP')}</span><strong>${esc(status(row.status))}</strong></header><h3>${esc(row.title)}</h3><p>${esc(row.issuer||'Émetteur à confirmer')}</p><div><span>${money(row.estimated_value)}</span><small>${dt(row.submission_deadline)}</small></div><button data-select-tender="${esc(row.id)}">Ouvrir Tender Command</button></article>`).join('')||'<p>Aucun tender détecté.</p>'}</div>
    <div class="partner-action-bar"><button data-action="create-tender">Créer tender</button><button data-action="extract-tender-requirements">Exigences</button><button data-action="tender-bid-decision">Bid / No-bid</button><button data-action="update-tender-compliance">Compliance</button><button data-action="submit-tender" class="b2b-primary">Soumettre</button><button data-action="record-tender-outcome">Outcome</button></div></section>`

  const timeline = workspace.more?.timeline || []
  return `<section class="partner-command"><article class="partner-workspace-head"><div><span class="partner-kicker">PARTNER HISTORY</span><h2>Timeline, documents & audit</h2><p>Historique commercial, opérationnel, croissance et renewal.</p></div><div class="risk-counter"><strong>${timeline.length}</strong><span>Events</span></div></article><div class="partner-timeline">${timeline.slice(0,50).map((row:any)=>`<div><i></i><section><strong>${esc(row.title||row.event_type)}</strong><p>${esc(row.description||row.outcome||'')}</p><small>${dt(row.occurred_at||row.created_at)}</small></section></div>`).join('')||'<p>Aucun événement.</p>'}</div></section>`
}
