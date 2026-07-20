import type { ModuleRuntime } from './types.js'
import type { BrowserBusinessContext } from '../types.js'
import { DOMAIN_LABELS, OPERATIONAL_CAPABILITY_UI } from './revenue-b2b/capability-ui.js'
import { loadWorkspaceSession, saveWorkspaceSession, subscribeWorkspaceSession } from './revenue-b2b/workspace-store.js'
import type { ManagementWorkspaceHydration, PartnerWorkspaceHydration, WorkspaceDomain, WorkspaceHydration, WorkspaceSession } from './revenue-b2b/workspace-types.js'
import { PARTNER_DOMAIN_LABELS, PARTNER_NAV, defaultPartnerView, partnerDomainForView, renderPartnerWorkspace, type PartnerViewKey } from './revenue-b2b/partner-mode.js'
import { handlePartnerAction } from './revenue-b2b/partner-actions.js'
import { MANAGEMENT_DOMAIN_LABELS, MANAGEMENT_NAV, defaultManagementView, isManagementView, managementDomainForView, renderManagementWorkspace, type ManagementViewKey } from './revenue-b2b/management-mode.js'
import { handleManagementAction } from './revenue-b2b/management-actions.js'

type ViewKey = PartnerViewKey
  | ManagementViewKey
  | 'recognition'
  | 'today'
  | 'opportunity'
  | 'pipeline'
  | 'outreach'
  | 'communications'
  | 'calls'
  | 'field_visits'
  | 'meetings'
  | 'tasks'
  | 'sequences'
  | 'committee'
  | 'plan'
  | 'territory'
  | 'timeline'
  | 'evidence'
  | 'proposal'
  | 'pricing'
  | 'negotiation'
  | 'closing'
  | 'payments'
  | 'rescue'
  | 'capabilities'

type State = {
  context?: BrowserBusinessContext
  analysis?: any
  execution: Record<string, any>
  hydration?: WorkspaceHydration
  partnerHydration?: PartnerWorkspaceHydration
  partnerHydrating?: boolean
  managementHydration?: ManagementWorkspaceHydration
  managementHydrating?: boolean
  workspaceSession?: WorkspaceSession | null
  hydrating?: boolean
  stale?: boolean
  busy?: string
  error?: string
  errorDetails?: any
  notice?: string
  activeDomain: WorkspaceDomain
  activeView: ViewKey
  lastHydratedAt?: string
  paletteOpen?: boolean
}

type FormField = {
  name: string
  label: string
  type?: 'text' | 'textarea' | 'number' | 'datetime-local' | 'select' | 'checkbox'
  value?: string | number | boolean | null
  placeholder?: string
  required?: boolean
  options?: Array<{ value: string; label: string }>
}

let state: State = { activeDomain: 'account', activeView: 'recognition', execution: {}, workspaceSession: null }
let root: HTMLElement | null = null
let moduleRef: any = null
let hydrateTimer: number | null = null
let refreshTimer: number | null = null
let unsubscribeWorkspace: (() => void) | null = null
let runtimeMessageListener: ((message: any) => void) | null = null
let commandKeyListener: ((event: KeyboardEvent) => void) | null = null

const cap = (key: string) => Boolean(moduleRef?.capabilities?.includes(key))
const sub = (key: string) => Boolean(moduleRef?.submodules?.includes(key))
const esc = (value: unknown) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] || char))
const money = (value: unknown) => `${Number(value || 0).toLocaleString('fr-FR')} Dh`
const dt = (value: unknown) => value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(String(value))) : '—'
const prospect = () => state.hydration?.account || state.execution.prospect || state.analysis?.prospect || (state.analysis?.matches?.[0]?.confidence >= .82 ? state.analysis?.matches?.[0]?.prospect : null) || state.execution.opportunity?.prospect || null
const opportunity = () => state.hydration?.activeOpportunity || state.execution.opportunity || state.analysis?.opportunity || null
const partner = () => state.partnerHydration?.partner || state.hydration?.partnerSummary || state.execution.partner || null
const partnerMode = () => Boolean(partner()?.id)
const isPartnerView = (view: ViewKey): view is PartnerViewKey => ['partner_overview','handoff','activation','performance','issues','qbr','growth','renewal','tender','partner_timeline'].includes(view)
const managementMode = () => ['extension.b2b.manager_control','extension.b2b.staff_execution_quality','extension.b2b.b2b_reporting','extension.b2b.controlled_automation'].some(cap)
const currentAdapter = () => state.context?.adapterId || null

async function message<T = any>(payload: unknown): Promise<T> {
  return chrome.runtime.sendMessage(payload)
}

function setState(next: Partial<State>) {
  state = { ...state, ...next, execution: next.execution ? { ...state.execution, ...next.execution } : state.execution }
  render()
}

function clearMessages() {
  state.error = undefined
  state.errorDetails = undefined
  state.notice = undefined
}

function domainForView(view: ViewKey): WorkspaceDomain {
  if (isManagementView(view)) return managementDomainForView(view)
  if (isPartnerView(view)) return partnerDomainForView(view)
  if (['recognition', 'committee'].includes(view)) return 'account'
  if (['today', 'opportunity', 'pipeline', 'outreach', 'communications', 'calls', 'field_visits', 'meetings', 'tasks', 'sequences'].includes(view)) return 'execute'
  if (['proposal', 'pricing', 'negotiation', 'closing', 'payments', 'rescue'].includes(view)) return 'deal'
  if (['plan', 'territory'].includes(view)) return 'intelligence'
  return 'more'
}

function defaultViewForDomain(domain: WorkspaceDomain): ViewKey {
  if (isManagementView(state.activeView)) return defaultManagementView(domain)
  if (partnerMode()) return defaultPartnerView(domain)
  if (domain === 'account') return 'recognition'
  if (domain === 'execute') return cap('extension.b2b.daily_revenue_command') ? 'today' : 'opportunity'
  if (domain === 'deal') return cap('extension.b2b.proposal_studio') ? 'proposal' : 'closing'
  if (domain === 'intelligence') return 'plan'
  return 'timeline'
}

function accountFromResult(result: any) {
  return result?.prospect || result?.account || (result?.matches?.[0]?.confidence >= .82 ? result.matches[0].prospect : null) || null
}

async function persistActiveWorkspace(account: any, opp?: any | null) {
  if (!account?.id) return
  const session: WorkspaceSession = {
    prospectId: String(account.id),
    opportunityId: opp?.id ? String(opp.id) : null,
    activePartnerId: state.partnerHydration?.activeContext?.activePartnerId || partner()?.id || state.workspaceSession?.activePartnerId || null,
    activeContractId: state.partnerHydration?.activeContext?.activeContractId || state.workspaceSession?.activeContractId || null,
    activeSiteId: state.partnerHydration?.activeContext?.activeSiteId || state.workspaceSession?.activeSiteId || null,
    activeServiceId: state.partnerHydration?.activeContext?.activeServiceId || state.workspaceSession?.activeServiceId || null,
    activeActivationId: state.partnerHydration?.activeContext?.activeActivationId || state.workspaceSession?.activeActivationId || null,
    activeIssueId: state.partnerHydration?.activeContext?.activeIssueId || state.workspaceSession?.activeIssueId || null,
    activeGrowthOpportunityId: state.partnerHydration?.activeContext?.activeGrowthOpportunityId || state.workspaceSession?.activeGrowthOpportunityId || null,
    activeRenewalId: state.partnerHydration?.activeContext?.activeRenewalId || state.workspaceSession?.activeRenewalId || null,
    activeRecommendationId: state.managementHydration?.activeContext?.activeRecommendationId || state.workspaceSession?.activeRecommendationId || null,
    activeRiskId: state.managementHydration?.activeContext?.activeRiskId || state.workspaceSession?.activeRiskId || null,
    activeCoachingId: state.managementHydration?.activeContext?.activeCoachingId || state.workspaceSession?.activeCoachingId || null,
    activeAutomationId: state.managementHydration?.activeContext?.activeAutomationId || state.workspaceSession?.activeAutomationId || null,
    accountName: account.name || account.commercial_name || null,
    sourceUrl: state.context?.url || state.workspaceSession?.sourceUrl || null,
    sourceAdapter: state.context?.adapterId || state.workspaceSession?.sourceAdapter || null,
    updatedAt: new Date().toISOString(),
  }
  state.workspaceSession = session
  await saveWorkspaceSession(session)
}

async function hydratePartnerWorkspace(force = false) {
  const account = prospect()
  if (!account?.id || state.partnerHydrating) return null
  if (!force && state.partnerHydration?.account?.id === account.id && !state.stale) return state.partnerHydration
  state.partnerHydrating = true
  render()
  try {
    const response: any = await message({
      type: 'HYDRATE_B2B_PARTNER_WORKSPACE',
      partnerId: partner()?.id || state.workspaceSession?.activePartnerId || null,
      prospectId: account.id,
      activeIds: {
        activePartnerId: state.workspaceSession?.activePartnerId || null,
        activeContractId: state.workspaceSession?.activeContractId || null,
        activeSiteId: state.workspaceSession?.activeSiteId || null,
        activeServiceId: state.workspaceSession?.activeServiceId || null,
        activeActivationId: state.workspaceSession?.activeActivationId || null,
        activeIssueId: state.workspaceSession?.activeIssueId || null,
        activeGrowthOpportunityId: state.workspaceSession?.activeGrowthOpportunityId || null,
        activeRenewalId: state.workspaceSession?.activeRenewalId || null,
      },
    })
    if (!response?.ok) throw Object.assign(new Error(response?.error || 'PARTNER_360_HYDRATION_FAILED'), { details: response?.details })
    state.partnerHydration = response.data
    if (response.data?.partner) state.execution.partner = response.data.partner
    state.lastHydratedAt = response.data?.refreshedAt || state.lastHydratedAt
    if (response.data?.activeContext) {
      const session: WorkspaceSession = { ...(state.workspaceSession || { prospectId: account.id, updatedAt: new Date().toISOString() }), ...response.data.activeContext, prospectId: account.id, opportunityId: opportunity()?.id || state.workspaceSession?.opportunityId || null, accountName: account.name || account.commercial_name || null, sourceUrl: state.context?.url || state.workspaceSession?.sourceUrl || null, sourceAdapter: state.context?.adapterId || state.workspaceSession?.sourceAdapter || null, updatedAt: new Date().toISOString() }
      state.workspaceSession = session
      await saveWorkspaceSession(session)
    }
    if (response.data?.partner && !isPartnerView(state.activeView)) {
      state.activeDomain = 'account'
      state.activeView = 'partner_overview'
    }
    return response.data
  } catch (error: any) {
    if (error?.message !== 'PARTNER_WORKSPACE_ACCESS_REQUIRED') {
      state.error = error?.message || 'PARTNER_360_HYDRATION_FAILED'
      state.errorDetails = error?.details || null
    }
    return null
  } finally {
    state.partnerHydrating = false
    render()
  }
}

async function hydrateManagementWorkspace(force = false) {
  if (!managementMode() || state.managementHydrating) return null
  if (!force && state.managementHydration && !state.stale) return state.managementHydration
  state.managementHydrating = true
  render()
  try {
    const response: any = await message({
      type: 'HYDRATE_B2B_MANAGEMENT_WORKSPACE',
      activeIds: {
        activeRecommendationId: state.workspaceSession?.activeRecommendationId || null,
        activeRiskId: state.workspaceSession?.activeRiskId || null,
        activeCoachingId: state.workspaceSession?.activeCoachingId || null,
        activeAutomationId: state.workspaceSession?.activeAutomationId || null,
      },
    })
    if (!response?.ok) throw Object.assign(new Error(response?.error || 'MANAGEMENT_WORKSPACE_HYDRATION_FAILED'), { details: response?.details })
    state.managementHydration = response.data
    state.lastHydratedAt = response.data?.refreshedAt || state.lastHydratedAt
    if (response.data?.activeContext && state.workspaceSession?.prospectId) {
      const nextSession: WorkspaceSession = { ...state.workspaceSession, ...response.data.activeContext, updatedAt: new Date().toISOString() }
      state.workspaceSession = nextSession
      await saveWorkspaceSession(nextSession)
    }
    return response.data
  } catch (error: any) {
    if (error?.message !== 'MANAGEMENT_WORKSPACE_ACCESS_REQUIRED') {
      state.error = error?.message || 'MANAGEMENT_WORKSPACE_HYDRATION_FAILED'
      state.errorDetails = error?.details || null
    }
    return null
  } finally {
    state.managementHydrating = false
    render()
  }
}

async function hydrateWorkspace(force = false) {
  const account = prospect()
  if (!account?.id) return null
  if (state.hydrating) return null
  if (!force && state.hydration?.account?.id === account.id && !state.stale) return state.hydration
  state.hydrating = true
  render()
  try {
    const response: any = await message({
      type: 'HYDRATE_B2B_WORKSPACE',
      prospectId: account.id,
      opportunityId: opportunity()?.id || state.workspaceSession?.opportunityId || null,
    })
    if (!response?.ok) throw Object.assign(new Error(response?.error || 'B2B_WORKSPACE_HYDRATION_FAILED'), { details: response?.details })
    state.hydration = response.data
    state.execution.prospect = response.data.account
    if (response.data.activeOpportunity) state.execution.opportunity = response.data.activeOpportunity
    state.lastHydratedAt = response.data.refreshedAt
    state.stale = false
    await persistActiveWorkspace(response.data.account, response.data.activeOpportunity)
    const hasPartnerCapability = ['extension.b2b.operational_handoff','extension.b2b.partner_activation','extension.b2b.partner_performance','extension.b2b.upsell_cross_sell','extension.b2b.renewal_management','extension.b2b.tender_rfp_intelligence'].some(cap)
    if (hasPartnerCapability) await hydratePartnerWorkspace(true)
    if (managementMode()) await hydrateManagementWorkspace(true)
    return response.data
  } catch (error: any) {
    state.error = error?.message || 'B2B_WORKSPACE_HYDRATION_FAILED'
    state.errorDetails = error?.details || null
    return null
  } finally {
    state.hydrating = false
    render()
  }
}

function scheduleHydration(delay = 250) {
  if (!prospect()?.id) return
  if (hydrateTimer != null) window.clearTimeout(hydrateTimer)
  hydrateTimer = window.setTimeout(() => { void hydrateWorkspace(true) }, delay)
}

async function restoreWorkspace() {
  const session = await loadWorkspaceSession()
  if (!session?.prospectId) return
  state.workspaceSession = session
  state.execution.prospect = { id: session.prospectId, name: session.accountName || 'Compte B2B' }
  if (session.opportunityId) state.execution.opportunity = { id: session.opportunityId }
  state.stale = true
  render()
  await hydrateWorkspace(true)
}

async function clearWorkspace() {
  state.workspaceSession = null
  state.hydration = undefined
  state.partnerHydration = undefined
  state.managementHydration = undefined
  state.analysis = undefined
  state.context = undefined
  state.execution = {}
  state.activeDomain = 'account'
  state.activeView = 'recognition'
  await saveWorkspaceSession(null)
  render()
}

function mergeExecution(result: any) {
  if (!result || typeof result !== 'object') return
  const patch: Record<string, any> = {}
  const directKeys = [
    'prospect', 'opportunity', 'nextBestAction', 'pipeline', 'risks', 'strategy', 'draft',
    'communicationContext', 'signals', 'callBrief', 'call', 'fieldVisit', 'meeting',
    'meetingBrief', 'liveNotes', 'suggestedQuestion', 'meetingOutcome', 'followup',
    'sequence', 'steps', 'enrollment', 'attribution', 'referralSource', 'timeline',
    'actions', 'stageRecommendation', 'recommendedStage', 'currentStage', 'missing', 'facts',
    'offerConfiguration', 'recommendedPricingModel', 'alternatives', 'pricing', 'marginGuard', 'policy', 'marginSnapshot', 'proposal', 'approvalRequest', 'approvalDecision', 'delivery', 'discountRequest', 'negotiationRoom', 'negotiationEvent', 'counteroffer', 'objection', 'strategy', 'readiness', 'checks', 'closingGate', 'contractRequirement', 'paymentGate', 'paymentPromise', 'revenueRescue', 'executiveIntervention', 'partner', 'handoff', 'version', 'commitments', 'validation', 'onboarding', 'task', 'activation', 'gates', 'blockers', 'firstService', 'hypercare', 'performance', 'health', 'issue', 'correctiveAction', 'review', 'signal', 'growthOpportunity', 'expansionPlan', 'renewal', 'milestones', 'churnRisk', 'partnerRescue', 'tender', 'requirements', 'compliance', 'recommendations', 'recommendation', 'assessment', 'forecast', 'override', 'risk', 'intervention', 'qualityAssessment', 'patterns', 'coaching', 'snapshot', 'report', 'automation', 'approval', 'run', 'killSwitch',
  ]
  for (const key of directKeys) if (result[key] !== undefined) patch[key] = result[key]
  if (result.opportunities || result.summary) patch.pipeline = result
  if (result.priorityActions || result.pipelineSummary || result.metrics) patch.daily = result
  if (result.communicationContext) patch.communication = result
  if (result.risks && result.total !== undefined) patch.riskReport = result
  if (result.timeline) patch.timeline = result.timeline
  if (result.actions) patch.actions = result.actions
  state.execution = { ...state.execution, ...patch }
}

async function ensurePageAccess() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
  if (!tab?.url) throw new Error('NO_ACTIVE_TAB')
  const url = new URL(tab.url)
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('UNSUPPORTED_PAGE_PROTOCOL')
  const originPattern = `${url.origin}/*`
  const already = await chrome.permissions.contains({ origins: [originPattern] })
  if (!already) {
    const granted = await chrome.permissions.request({ origins: [originPattern] })
    if (!granted) throw new Error('PAGE_ACCESS_NOT_GRANTED')
  }
}

async function execute(commandKey: string, payload: Record<string, unknown> = {}, options: { sourceAdapter?: string | null; silent?: boolean } = {}) {
  if (!options.silent) setState({ busy: 'Exécution contrôlée dans ANGELCARE…', error: undefined, errorDetails: undefined, notice: undefined })
  const response: any = await message({
    type: 'EXECUTE_B2B_COMMAND',
    input: {
      commandKey,
      sourceAdapter: options.sourceAdapter === undefined ? currentAdapter() : options.sourceAdapter,
      sourceOrigin: state.context?.origin || null,
      payload,
    },
  })
  if (!response?.ok) {
    const error = new Error(response?.error || 'ACTION_FAILED') as Error & { details?: any }
    error.details = response?.details || null
    throw error
  }
  if (response.data?.approvalRequired) return { approvalRequired: true, command: response.data.command }
  const result = response.data?.result ?? response.data
  mergeExecution(result)
  return result
}

async function run(commandKey: string, payload: Record<string, unknown>, success: string, options: { sourceAdapter?: string | null; view?: ViewKey } = {}) {
  try {
    const result = await execute(commandKey, payload, { sourceAdapter: options.sourceAdapter })
    if (result?.approvalRequired) return setState({ busy: undefined, notice: 'Action préparée et envoyée pour approbation.' })
    const nextView = options.view || state.activeView
    state.activeDomain = domainForView(nextView)
    setState({ busy: undefined, notice: success, activeView: nextView })
    if (prospect()?.id) scheduleHydration()
    if (commandKey.startsWith('b2b.handoff.') || commandKey.startsWith('b2b.partner.') || commandKey.startsWith('b2b.onboarding.') || commandKey.startsWith('b2b.activation.') || commandKey.startsWith('b2b.first_service.') || commandKey.startsWith('b2b.hypercare.') || commandKey.startsWith('b2b.corrective_action.') || commandKey.startsWith('b2b.qbr.') || commandKey.startsWith('b2b.upsell.') || commandKey.startsWith('b2b.cross_sell.') || commandKey.startsWith('b2b.expansion.') || commandKey.startsWith('b2b.renewal.') || commandKey.startsWith('b2b.churn_') || commandKey.startsWith('b2b.tender.')) await hydratePartnerWorkspace(true)
    if (commandKey.startsWith('b2b.ai_director.') || commandKey.startsWith('b2b.management.') || commandKey.startsWith('b2b.pipeline_truth.') || commandKey.startsWith('b2b.forecast.') || commandKey.startsWith('b2b.revenue_risk.') || commandKey.startsWith('b2b.proposal_recovery.') || commandKey.startsWith('b2b.payment_recovery.') || commandKey.startsWith('b2b.renewal_rescue.') || commandKey.startsWith('b2b.partner_health_rescue.') || commandKey.startsWith('b2b.execution_quality.') || commandKey.startsWith('b2b.coaching.') || commandKey.startsWith('b2b.territory_intelligence.') || commandKey.startsWith('b2b.vertical_intelligence.') || commandKey.startsWith('b2b.report.') || commandKey.startsWith('b2b.automation.')) await hydrateManagementWorkspace(true)
    return result
  } catch (error: any) {
    setState({ busy: undefined, error: error?.message || 'ACTION_FAILED', errorDetails: error?.details || null })
    return null
  }
}

async function analyze() {
  clearMessages()
  setState({ busy: 'Analyse du contexte navigateur…' })
  try {
    await ensurePageAccess()
    const captured: any = await message({ type: 'CAPTURE_ACTIVE_CONTEXT' })
    if (!captured?.ok) throw new Error(captured?.error || 'CONTEXT_CAPTURE_FAILED')
    state.context = captured.context

    if (captured.context.adapterId === 'gmail' && cap('extension.b2b.gmail_assisted_operations')) {
      const result = await execute('b2b.gmail.thread_resolve', { context: captured.context }, { sourceAdapter: 'gmail', silent: true })
      state.analysis = result?.prospect ? { prospect: result.prospect, normalized: { organization: result.prospect }, communication: result } : { communication: result }
      mergeExecution(result)
      state.activeDomain = 'execute'
      state.activeView = 'communications'
      if (result?.prospect) {
        await persistActiveWorkspace(result.prospect, result.opportunity)
        await hydrateWorkspace(true)
      }
      return setState({ busy: undefined, notice: result?.prospect ? 'Fil Gmail relié au dossier B2B et Account 360 synchronisé.' : 'Fil Gmail analysé. Un rapprochement de compte est requis.' })
    }

    if (captured.context.adapterId === 'whatsapp_web' && cap('extension.b2b.whatsapp_assisted_operations')) {
      const result = await execute('b2b.whatsapp.context_resolve', { context: captured.context }, { sourceAdapter: 'whatsapp_web', silent: true })
      state.analysis = result?.prospect ? { prospect: result.prospect, normalized: { organization: result.prospect }, communication: result } : { communication: result }
      mergeExecution(result)
      state.activeDomain = 'execute'
      state.activeView = 'communications'
      if (result?.prospect) {
        await persistActiveWorkspace(result.prospect, result.opportunity)
        await hydrateWorkspace(true)
      }
      return setState({ busy: undefined, notice: result?.prospect ? 'Conversation WhatsApp reliée au dossier B2B et Account 360 synchronisé.' : 'Conversation analysée. Un rapprochement de compte est requis.' })
    }

    const result = await execute('b2b.context.resolve', { context: captured.context }, { sourceAdapter: captured.context.adapterId, silent: true })
    state.analysis = result
    mergeExecution(result)
    const recognized = accountFromResult(result)
    const nextView: ViewKey = captured.context.adapterId === 'google_maps' && sub('territory_sweep') && !recognized ? 'territory' : 'recognition'
    state.activeDomain = domainForView(nextView)
    state.activeView = nextView
    if (recognized) {
      await persistActiveWorkspace(recognized, result?.opportunity)
      await hydrateWorkspace(true)
    }
    setState({
      busy: undefined,
      notice: recognized ? 'Compte reconnu. Account 360, exécution et deal chargés.' : 'Contexte analysé. Validation ou création du compte requise.',
    })
  } catch (error: any) {
    setState({ busy: undefined, error: error?.message || 'ANALYSIS_FAILED', errorDetails: error?.details || null })
  }
}

function fieldHtml(field: FormField) {
  const id = `form-${field.name}`
  const common = `id="${id}" name="${esc(field.name)}" ${field.required ? 'required' : ''}`
  if (field.type === 'textarea') return `<label>${esc(field.label)}<textarea ${common} placeholder="${esc(field.placeholder || '')}">${esc(field.value || '')}</textarea></label>`
  if (field.type === 'select') return `<label>${esc(field.label)}<select ${common}>${(field.options || []).map((option) => `<option value="${esc(option.value)}" ${String(field.value ?? '') === option.value ? 'selected' : ''}>${esc(option.label)}</option>`).join('')}</select></label>`
  if (field.type === 'checkbox') return `<label class="b2b-check"><input ${common} type="checkbox" ${field.value ? 'checked' : ''}><span>${esc(field.label)}</span></label>`
  return `<label>${esc(field.label)}<input ${common} type="${esc(field.type || 'text')}" value="${esc(field.value ?? '')}" placeholder="${esc(field.placeholder || '')}"></label>`
}

function openForm(title: string, description: string, fields: FormField[], submitLabel = 'Confirmer'): Promise<Record<string, any> | null> {
  return new Promise((resolve) => {
    const host = document.createElement('div')
    host.className = 'b2b-modal-backdrop'
    host.innerHTML = `<section class="b2b-modal"><div class="b2b-modal-head"><div><span class="b2b-kicker">ACTION CONTRÔLÉE</span><h3>${esc(title)}</h3><p>${esc(description)}</p></div><button type="button" data-close>×</button></div><form>${fields.map(fieldHtml).join('')}<div class="b2b-modal-actions"><button type="button" data-cancel>Annuler</button><button class="b2b-primary" type="submit">${esc(submitLabel)}</button></div></form></section>`
    document.body.appendChild(host)
    const close = (value: Record<string, any> | null) => { host.remove(); resolve(value) }
    host.querySelector('[data-close]')?.addEventListener('click', () => close(null))
    host.querySelector('[data-cancel]')?.addEventListener('click', () => close(null))
    host.addEventListener('click', (event) => { if (event.target === host) close(null) })
    host.querySelector('form')?.addEventListener('submit', (event) => {
      event.preventDefault()
      const form = event.currentTarget as HTMLFormElement
      const output: Record<string, any> = {}
      for (const field of fields) {
        const element = form.elements.namedItem(field.name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
        if (!element) continue
        if (field.type === 'checkbox') output[field.name] = (element as HTMLInputElement).checked
        else if (field.type === 'number') output[field.name] = Number(element.value || 0)
        else output[field.name] = element.value.trim()
      }
      close(output)
    })
    ;(host.querySelector('input,textarea,select') as HTMLElement | null)?.focus()
  })
}

function statusBar() {
  const details = state.errorDetails?.missing || state.errorDetails?.allowedTerritories || null
  return `${state.busy ? `<div class="b2b-status busy">${esc(state.busy)}</div>` : ''}${state.error ? `<div class="b2b-status error"><strong>${esc(state.error)}</strong>${details ? `<small>${esc(Array.isArray(details) ? details.join(' · ') : JSON.stringify(details))}</small>` : ''}</div>` : ''}${state.notice ? `<div class="b2b-status success">${esc(state.notice)}</div>` : ''}`
}

function accountHeader() {
  const account = prospect()
  const opp = opportunity()
  if (!account) return ''
  return `<div class="b2b-account-context"><div><span class="b2b-kicker">COMPTE ACTIF</span><strong>${esc(account.name || 'Compte B2B')}</strong><small>${esc(account.city || 'Territoire non confirmé')} · ${esc(account.sector || account.vertical || 'B2B')}</small></div>${opp ? `<div class="b2b-stage-pill">${esc(opp.stage || 'qualified')}</div>` : '<div class="b2b-stage-pill muted">Sans opportunité</div>'}</div>`
}

function account360View() {
  const workspace = state.hydration!
  const account = workspace.account
  const opp = workspace.activeOpportunity
  const score = workspace.intelligence.score?.scores || state.analysis?.score?.scores || {}
  const quality = workspace.intelligence.dataQuality
  const health = workspace.intelligence.commercialHealth
  const committeeTotal = Math.max(workspace.committee.length, state.analysis?.vertical?.decisionMakerRoles?.length || 0)
  const committeeKnown = workspace.committee.filter((row: any) => row.status && row.status !== 'missing').length
  const next = workspace.execution.nextActions.find((row: any) => row.status === 'open') || workspace.execution.followups.find((row: any) => row.status === 'open')
  const risks = [...(health.reasons || []), ...(workspace.deal.closingReadiness?.missing_requirements || [])].slice(0, 5)
  const annual = Number(opp?.estimated_annual_value || account.estimated_annual_value || 0)
  return `<section class="b2b-command premium-account-360">
    <article class="command-account-hero">
      <div class="command-account-main"><div class="command-account-kicker"><span>ACCOUNT 360 LIVE</span><i class="sync-dot"></i></div><h2>${esc(account.name)}</h2><p>${esc(account.sector || 'B2B')} · ${esc(account.city || 'Territoire à confirmer')}</p><div class="command-account-badges"><span>${esc(account.priority_score || 'Priorité active')}</span><span>${esc(opp?.stage || account.status || 'Compte')}</span><span>${esc(workspace.owner?.full_name || workspace.owner?.name || 'Owner non assigné')}</span></div></div>
      <div class="command-fit-ring" style="--fit:${Number(score.overall || account.score || 0)}"><strong>${Number(score.overall || account.score || 0) || '—'}</strong><span>Fit</span></div>
    </article>
    <div class="command-metrics-grid">
      <article><span>Potentiel annuel</span><strong>${annual ? money(annual) : 'À qualifier'}</strong><small>${opp ? `${Number(opp.probability || 0)}% probabilité` : 'Opportunité à créer'}</small></article>
      <article><span>Comité décision</span><strong>${committeeKnown}/${committeeTotal || 4}</strong><small>${committeeKnown ? 'couverture active' : 'recherche requise'}</small></article>
      <article><span>Qualité dossier</span><strong>${quality.score}%</strong><small>${quality.missing.length ? `${quality.missing.length} champs manquants` : 'dossier complet'}</small></article>
      <article><span>Santé commerciale</span><strong class="health-${esc(health.level)}">${health.score}</strong><small>${esc(health.level.replace('_', ' '))}</small></article>
    </div>
    <article class="next-best-action-card">
      <div><span class="b2b-kicker">PROCHAINE MEILLEURE ACTION</span><h3>${esc(next?.title || opp?.next_action || 'Qualifier le prochain engagement commercial')}</h3><p>${esc(next?.objective || (health.reasons?.length ? `Résoudre: ${health.reasons.join(' · ')}` : 'Maintenir une action datée, orientée décision et rattachée au compte.'))}</p></div>
      <span class="next-action-date">${dt(next?.due_at || opp?.next_action_due_at)}</span>
      <div class="command-action-row"><button data-action="prepare-call" class="b2b-primary">Préparer appel</button><button data-action="prepare-meeting">Réunion</button><button data-action="create-followup">Suivi</button></div>
    </article>
    <div class="command-two-column">
      <article class="b2b-panel"><div class="b2b-panel-head"><strong>Comité d’achat</strong><button data-view="committee">Ouvrir</button></div><div class="committee-mini">${workspace.committee.slice(0, 5).map((row: any) => `<div><span class="b2b-role-state ${row.status === 'missing' ? 'missing' : 'known'}"></span><section><strong>${esc(row.role_label)}</strong><small>${esc(row.person_name || row.job_title || 'À identifier')}</small></section></div>`).join('') || '<p>Aucun décideur structuré.</p>'}</div></article>
      <article class="b2b-panel"><div class="b2b-panel-head"><strong>Risques immédiats</strong><button data-domain="intelligence">Analyser</button></div><div class="risk-chip-list">${risks.map((item) => `<span>${esc(item)}</span>`).join('') || '<span class="positive">Aucun risque critique détecté</span>'}</div></article>
    </div>
    <article class="b2b-panel"><div class="b2b-panel-head"><strong>Contacts & relations</strong><button data-view="committee">Gérer</button></div><div class="contact-strip">${workspace.contacts.slice(0, 6).map((row: any) => `<div><span>${esc((row.name || '?').split(' ').map((x: string) => x[0]).join('').slice(0,2))}</span><section><strong>${esc(row.name)}</strong><small>${esc(row.role || row.department || 'Contact B2B')}</small></section></div>`).join('') || '<p>Aucun contact capturé.</p>'}</div></article>
    <div class="command-action-grid"><button data-action="enrich">Enrichir le compte</button><button data-action="build-plan">Plan de compte</button><button data-action="create-opportunity" class="b2b-primary">${opp ? 'Ouvrir opportunité' : 'Créer opportunité'}</button><button data-focus-mode>Focus Mode</button></div>
  </section>`
}

function recognitionView() {
  if (state.hydration?.account) return account360View()
  const analysis = state.analysis
  if (!analysis || analysis.communication) {
    return `<section class="b2b-empty"><div class="b2b-orbit">AC</div><h2>Intelligence compte prête</h2><p>Ouvrez un site professionnel, une fiche Google Maps, un fil Gmail ou une conversation WhatsApp autorisée.</p><button id="analyze" class="b2b-primary">Analyser la page active</button></section>`
  }
  const organization = analysis.normalized?.organization || state.context?.organization || {}
  const scores = analysis.score?.scores || {}
  const top = analysis.matches?.[0]
  const account = prospect()
  return `<section class="b2b-command">
    <div class="b2b-account-head"><div><span class="b2b-kicker">${esc(analysis.vertical?.label || organization.sector || 'COMPTE B2B')}</span><h2>${esc(organization.name || account?.name || 'Organisation détectée')}</h2><p>${esc(organization.city || account?.city || 'Territoire non confirmé')} · ${esc(analysis.context?.resolved_status || 'analysé')}</p></div><div class="b2b-score"><strong>${scores.overall ?? '—'}</strong><span>Priorité ${esc(analysis.score?.priority || '—')}</span></div></div>
    ${top ? `<div class="b2b-alert ${top.confidence >= 0.82 ? 'success' : 'warning'}"><strong>${top.confidence >= 0.82 ? 'Compte ANGELCARE existant' : 'Doublon possible'}</strong><span>${Math.round(top.confidence * 100)}% · ${esc(top.reasons?.join(' · '))}</span></div>` : '<div class="b2b-alert success"><strong>Nouvelle opportunité de compte</strong><span>Aucun doublon crédible détecté.</span></div>'}
    <div class="b2b-grid"><article><span>Adéquation</span><strong>${scores.commercialFit ?? '—'}</strong></article><article><span>Potentiel revenu</span><strong>${scores.revenuePotential ?? '—'}</strong></article><article><span>Maturité achat</span><strong>${scores.buyingReadiness ?? '—'}</strong></article><article><span>Expansion</span><strong>${scores.expansionPotential ?? '—'}</strong></article></div>
    <article class="b2b-panel"><div class="b2b-panel-head"><strong>Intelligence commerciale</strong><span>${money(analysis.vertical?.estimatedAnnualValue?.min)}–${money(analysis.vertical?.estimatedAnnualValue?.max)}</span></div><p>${esc(analysis.vertical?.commercialAngle || analysis.score?.explanation)}</p><ul>${(analysis.vertical?.opportunitySignals || []).map((item: string) => `<li>${esc(item)}</li>`).join('')}</ul></article>
    <article class="b2b-panel"><div class="b2b-panel-head"><strong>Prochaine meilleure action</strong><span>Gouvernée</span></div><p>${esc(analysis.recommendedAction || analysis.vertical?.recommendedNextAction)}</p></article>
    <div class="b2b-actions">
      ${!account && cap('extension.b2b.prospect_capture') ? '<button data-action="create-prospect" class="b2b-primary">Créer le prospect</button>' : ''}
      ${account && !opportunity() && cap('extension.b2b.opportunity_creation') ? '<button data-action="create-opportunity" class="b2b-primary">Créer l’opportunité</button>' : ''}
      ${account && cap('extension.b2b.account_enrichment') ? '<button data-action="enrich">Enrichir le compte</button>' : ''}
      ${account ? '<button data-action="open-account">Ouvrir le dossier</button>' : ''}
    </div>
  </section>`
}

function todayView() {
  const daily = state.execution.daily
  if (!daily) return `<section class="b2b-empty"><h2>Commandement du jour</h2><p>Chargez vos actions prioritaires, suivis en retard, réunions et opportunités à risque.</p><button data-action="load-today" class="b2b-primary">Charger ma journée</button></section>`
  const metrics = daily.metrics || {}
  return `<section class="b2b-command">
    <div class="b2b-grid b2b-grid-4"><article><span>Opportunités</span><strong>${metrics.activeOpportunities || 0}</strong></article><article><span>Priorités</span><strong>${metrics.priorityActions || 0}</strong></article><article><span>Retards</span><strong>${metrics.overdueFollowups || 0}</strong></article><article><span>À risque</span><strong>${metrics.atRisk || 0}</strong></article></div>
    <article class="b2b-panel"><div class="b2b-panel-head"><strong>Actions prioritaires</strong><button data-action="load-today">Actualiser</button></div><div class="b2b-work-list">${(daily.priorityActions || []).map((row: any) => `<div><section><strong>${esc(row.title)}</strong><small>${esc(row.objective)} · ${dt(row.due_at)}</small></section><button data-complete-action="${esc(row.id)}">Terminer</button></div>`).join('') || '<p>Aucune action prioritaire ouverte.</p>'}</div></article>
    <article class="b2b-panel"><div class="b2b-panel-head"><strong>Suivis en retard</strong><span>${(daily.overdueFollowups || []).length}</span></div><div class="b2b-work-list">${(daily.overdueFollowups || []).slice(0, 10).map((row: any) => `<div><section><strong>${esc(row.title)}</strong><small>${esc(row.channel)} · échéance ${dt(row.due_at)}</small></section><button data-complete-followup="${esc(row.id)}">Clôturer</button></div>`).join('') || '<p>Aucun suivi en retard.</p>'}</div></article>
    <article class="b2b-panel"><div class="b2b-panel-head"><strong>Risques commerciaux</strong><span>${(daily.risks || []).length}</span></div><div class="b2b-risk-list">${(daily.risks || []).slice(0, 10).map((row: any) => `<div class="risk-${esc(row.riskLevel)}"><strong>${esc(row.accountName || 'Compte')}</strong><span>${esc(row.reasons?.join(' · '))}</span></div>`).join('') || '<p>Aucun risque détecté.</p>'}</div></article>
  </section>`
}

function opportunityView() {
  const account = prospect()
  const opp = opportunity()
  if (!account) return `<section class="b2b-empty"><h2>Aucun compte actif</h2><p>Analysez ou ouvrez un compte avant de créer une opportunité.</p></section>`
  if (!opp) return `<section class="b2b-empty"><h2>Créer l’opportunité commerciale</h2><p>Transformez ${esc(account.name)} en opportunité gouvernée avec valeur, échéance, étape et prochaine action.</p>${cap('extension.b2b.opportunity_creation') ? '<button data-action="create-opportunity" class="b2b-primary">Créer maintenant</button>' : ''}</section>`
  const nba = state.execution.nextBestAction || { title: opp.next_action, due_at: opp.next_action_due_at }
  return `<section class="b2b-command">
    ${accountHeader()}
    <div class="b2b-opportunity-card"><div><span class="b2b-kicker">OPPORTUNITÉ ACTIVE</span><h2>${esc(opp.title)}</h2><p>${esc(opp.scope_summary || 'Portée commerciale à confirmer')}</p></div><div class="b2b-value"><strong>${money(opp.estimated_annual_value)}</strong><span>${Number(opp.probability || 0)}% probabilité</span></div></div>
    <div class="b2b-grid"><article><span>Étape</span><strong class="b2b-small-strong">${esc(opp.stage)}</strong></article><article><span>Clôture prévue</span><strong class="b2b-small-strong">${dt(opp.expected_close_at)}</strong></article><article><span>Risque</span><strong class="b2b-small-strong">${esc(opp.risk_level)}</strong></article><article><span>Lancement</span><strong class="b2b-small-strong">${dt(opp.launch_at)}</strong></article></div>
    <article class="b2b-panel b2b-next-action"><div class="b2b-panel-head"><strong>Prochaine meilleure action</strong><span>${dt(nba?.due_at)}</span></div><h3>${esc(nba?.title || 'À recalculer')}</h3><p>${esc(nba?.objective || nba?.reasoning?.join(' · ') || 'Maintenir une prochaine action datée et orientée résultat.')}</p></article>
    <div class="b2b-actions"><button data-action="stage-recommend">Recommander l’étape</button><button data-action="stage-change">Faire avancer</button><button data-action="prepare-outreach">Préparer outreach</button><button data-action="create-followup">Créer suivi</button><button data-action="prepare-call">Préparer appel</button><button data-action="prepare-meeting">Préparer réunion</button><button data-action="attribute-campaign">Attribuer campagne</button><button data-action="record-referral">Source referral</button></div>
    ${state.execution.stageRecommendation ? `<div class="b2b-alert ${state.execution.stageRecommendation.ready ? 'success' : 'warning'}"><strong>Étape recommandée: ${esc(state.execution.stageRecommendation.recommendedStage?.label || state.execution.stageRecommendation.recommendedStage?.key || '—')}</strong><span>${esc((state.execution.stageRecommendation.missing || []).join(' · ') || 'Conditions satisfaites')}</span></div>` : ''}
  </section>`
}

function pipelineView() {
  const pipeline = state.execution.pipeline
  const risks = state.execution.riskReport
  if (!pipeline) return `<section class="b2b-empty"><h2>Pipeline gouverné</h2><p>Chargez vos opportunités autorisées, valeurs, étapes et risques d’exécution.</p><button data-action="load-pipeline" class="b2b-primary">Charger le pipeline</button></section>`
  return `<section class="b2b-command">
    <div class="b2b-pipeline-summary">${(pipeline.summary || []).filter((row: any) => row.count).map((row: any) => `<article><span>${esc(row.label)}</span><strong>${row.count}</strong><small>${money(row.value)}</small></article>`).join('') || '<p>Aucune opportunité active.</p>'}</div>
    <article class="b2b-panel"><div class="b2b-panel-head"><strong>Opportunités autorisées</strong><button data-action="load-pipeline">Actualiser</button></div><div class="b2b-opportunity-list">${(pipeline.opportunities || []).map((row: any) => `<button data-select-opportunity="${esc(row.id)}"><section><strong>${esc(row.prospect?.name || row.title)}</strong><small>${esc(row.stage)} · ${esc(row.next_action || 'Aucune prochaine action')}</small></section><span>${money(row.estimated_annual_value)}</span></button>`).join('') || '<p>Aucune opportunité.</p>'}</div></article>
    <article class="b2b-panel"><div class="b2b-panel-head"><strong>Risques détectés</strong><span>${risks?.total || 0}</span></div><div class="b2b-risk-list">${(risks?.risks || []).map((row: any) => `<div class="risk-${esc(row.riskLevel)}"><strong>${esc(row.accountName)}</strong><span>${esc(row.reasons?.join(' · '))}</span></div>`).join('') || '<p>Aucun risque détecté.</p>'}</div></article>
  </section>`
}

function outreachView() {
  const opp = opportunity()
  if (!opp) return `<section class="b2b-empty"><h2>Outreach contextuel</h2><p>Créez ou sélectionnez une opportunité avant de préparer une approche personnalisée.</p></section>`
  const strategy = state.execution.strategy
  const draft = state.execution.draft
  return `<section class="b2b-command">${accountHeader()}
    ${strategy ? `<article class="b2b-panel"><div class="b2b-panel-head"><strong>Stratégie ${esc(strategy.channel)}</strong><span>${esc(strategy.purpose)}</span></div><h3>${esc(strategy.subject || strategy.call_opening)}</h3><p class="b2b-draft-body">${esc(strategy.body || strategy.call_opening)}</p><ul>${(strategy.discovery_questions || strategy.discoveryQuestions || []).map((q: string) => `<li>${esc(q)}</li>`).join('')}</ul></article>` : `<section class="b2b-empty compact"><h2>Aucune stratégie préparée</h2><p>Le moteur adaptera l’angle, le canal et les questions au vertical, à l’étape et au rôle visé.</p><button data-action="prepare-outreach" class="b2b-primary">Préparer une stratégie</button></section>`}
    ${draft ? `<article class="b2b-panel"><div class="b2b-panel-head"><strong>Brouillon contrôlé</strong><span>Confirmation humaine requise</span></div>${draft.subject ? `<h3>${esc(draft.subject)}</h3>` : ''}<p class="b2b-draft-body">${esc(draft.body)}</p><div class="b2b-actions"><button data-action="copy-draft">Copier</button><button data-action="log-communication">Journaliser le résultat</button></div></article>` : ''}
  </section>`
}

function communicationsView() {
  const communication = state.execution.communication || state.analysis?.communication
  const draft = state.execution.draft
  const adapter = state.context?.adapterId
  if (!communication && !['gmail', 'whatsapp_web'].includes(String(adapter))) return `<section class="b2b-empty"><h2>Communications assistées</h2><p>Ouvrez un fil Gmail ou une conversation WhatsApp autorisée, puis analysez la page.</p><button id="analyze" class="b2b-primary">Analyser la conversation</button></section>`
  const signals = communication?.signals || state.execution.signals || {}
  return `<section class="b2b-command">
    <div class="b2b-channel-head"><strong>${adapter === 'gmail' ? 'Gmail assisté' : adapter === 'whatsapp_web' ? 'WhatsApp assisté' : 'Communication B2B'}</strong><span>${communication?.prospect ? 'Compte reconnu' : 'Rapprochement requis'}</span></div>
    <div class="b2b-grid"><article><span>Signal d’achat</span><strong class="b2b-small-strong">${signals.positiveBuyingSignal ? 'Positif' : 'À confirmer'}</strong></article><article><span>Dates détectées</span><strong>${(signals.dates || []).length}</strong></article></div>
    <article class="b2b-panel"><div class="b2b-panel-head"><strong>Objections et signaux</strong><span>Assisté</span></div><ul>${(signals.objections || []).map((item: string) => `<li>${esc(item)}</li>`).join('') || '<li>Aucune objection structurée détectée.</li>'}</ul></article>
    ${communication?.prospect ? `<div class="b2b-actions"><button data-action="prepare-context-reply" class="b2b-primary">Préparer la réponse</button><button data-action="create-followup">Créer suivi</button></div>` : `<div class="b2b-alert warning"><strong>Compte non relié</strong><span>Ouvrez ou analysez d’abord le site/fiche du compte, ou utilisez le dossier ANGELCARE correspondant.</span></div>`}
    ${draft ? `<article class="b2b-panel"><div class="b2b-panel-head"><strong>Réponse préparée</strong><span>Aucun envoi automatique</span></div>${draft.subject ? `<h3>${esc(draft.subject)}</h3>` : ''}<p class="b2b-draft-body">${esc(draft.body)}</p><div class="b2b-actions"><button data-action="copy-draft">Copier le message</button><button data-action="log-communication">Journaliser</button></div></article>` : ''}
  </section>`
}

function callsView() {
  const opp = opportunity()
  if (!opp) return `<section class="b2b-empty"><h2>Call Command</h2><p>Sélectionnez une opportunité avant de préparer un appel.</p></section>`
  const brief = state.execution.callBrief || state.hydration?.execution.callBriefs?.[0]
  return `<section class="b2b-command">${accountHeader()}
    ${brief ? `<article class="b2b-panel"><div class="b2b-panel-head"><strong>Brief d’appel</strong><span>${esc(brief.status)}</span></div><h3>${esc(brief.objective)}</h3><p>${esc(brief.account_summary)}</p><ul>${(brief.questions || []).map((q: string) => `<li>${esc(q)}</li>`).join('')}</ul><div class="b2b-panel-split"><div><span>Résultat souhaité</span><strong>${esc(brief.desired_outcome)}</strong></div><div><span>Minimum acceptable</span><strong>${esc(brief.minimum_next_step)}</strong></div></div><div class="b2b-actions"><button data-action="record-call" class="b2b-primary">Enregistrer le résultat</button><button data-action="prepare-call">Nouveau brief</button></div></article>` : `<section class="b2b-empty compact"><h2>Brief non préparé</h2><p>Préparez l’objectif, les questions, les objections connues et le prochain engagement attendu.</p><button data-action="prepare-call" class="b2b-primary">Préparer l’appel</button></section>`}
    ${state.execution.call ? `<div class="b2b-alert success"><strong>Appel enregistré</strong><span>${esc(state.execution.call.call_result)} · ${esc(state.execution.call.summary)}</span></div>` : ''}
  </section>`
}

function visitsView() {
  const opp = opportunity()
  if (!opp) return `<section class="b2b-empty"><h2>Visite terrain</h2><p>Sélectionnez une opportunité avant de créer une mission de visite.</p></section>`
  const visit = state.execution.fieldVisit || state.hydration?.execution.fieldVisits?.[0] || state.hydration?.execution.fieldVisits?.[0]
  return `<section class="b2b-command">${accountHeader()}
    ${visit ? `<article class="b2b-panel"><div class="b2b-panel-head"><strong>Mission terrain</strong><span>${esc(visit.status)}</span></div><h3>${esc(visit.visit_objective)}</h3><p>${esc(visit.location)} · ${dt(visit.planned_at)}</p><div class="b2b-actions">${visit.status !== 'completed' ? '<button data-action="record-visit" class="b2b-primary">Clôturer la visite</button>' : ''}<button data-action="create-visit">Nouvelle visite</button></div></article>` : `<section class="b2b-empty compact"><h2>Aucune visite active</h2><p>Créez une mission datée avec objectif, lieu, preuve attendue et suivi obligatoire.</p><button data-action="create-visit" class="b2b-primary">Planifier une visite</button></section>`}
  </section>`
}

function meetingsView() {
  const opp = opportunity()
  if (!opp) return `<section class="b2b-empty"><h2>Réunions B2B</h2><p>Sélectionnez une opportunité avant de préparer ou planifier une réunion.</p></section>`
  const brief = state.execution.meetingBrief || state.hydration?.execution.meetings?.briefs?.[0]
  const notes = state.execution.liveNotes || state.hydration?.execution.meetings?.notes?.[0]
  const outcome = state.execution.meetingOutcome || state.hydration?.execution.meetings?.outcomes?.[0] || state.hydration?.execution.meetings?.outcomes?.[0]
  return `<section class="b2b-command">${accountHeader()}
    <div class="b2b-actions"><button data-action="schedule-meeting">Planifier</button><button data-action="prepare-meeting">Préparer</button>${brief ? '<button data-action="assist-meeting">Assistant live</button>' : ''}${brief || notes ? '<button data-action="summarize-meeting">Compte rendu</button>' : ''}</div>
    ${brief ? `<article class="b2b-panel"><div class="b2b-panel-head"><strong>Brief de réunion</strong><span>${esc(brief.meeting_type)}</span></div><h3>${esc(brief.objective)}</h3><p>${esc(brief.account_summary)}</p><div class="b2b-missing"><strong>Informations manquantes</strong>${(brief.missing_information || []).map((item: string) => `<span>${esc(item)}</span>`).join('') || '<span>Aucune lacune critique.</span>'}</div><ul>${(brief.questions || []).map((q: string) => `<li>${esc(q)}</li>`).join('')}</ul></article>` : ''}
    ${notes ? `<article class="b2b-panel b2b-live"><div class="b2b-panel-head"><strong>Assistant de réunion</strong><span>Sans enregistrement secret</span></div><h3>${esc(state.execution.suggestedQuestion)}</h3><p>${esc(notes.checklist?.notes)}</p></article>` : ''}
    ${outcome ? `<article class="b2b-panel"><div class="b2b-panel-head"><strong>Compte rendu structuré</strong><span>${esc(outcome.status)}</span></div><p>${esc(JSON.stringify(outcome.summary || {}))}</p>${outcome.status !== 'applied' ? '<button data-action="apply-meeting-outcome" class="b2b-primary">Appliquer au pipeline</button>' : ''}</article>` : ''}
  </section>`
}

function tasksView() {
  const actions = state.execution.actions || state.execution.daily?.priorityActions || state.hydration?.execution.nextActions || []
  return `<section class="b2b-command">${accountHeader()}
    <div class="b2b-actions"><button data-action="create-followup" class="b2b-primary">Créer un suivi</button><button data-action="load-actions">Actualiser</button></div>
    <article class="b2b-panel"><div class="b2b-panel-head"><strong>Actions ouvertes</strong><span>${actions.length}</span></div><div class="b2b-work-list">${actions.map((row: any) => `<div><section><strong>${esc(row.title)}</strong><small>${esc(row.objective)} · ${dt(row.due_at)}</small></section><button data-complete-action="${esc(row.id)}">Terminer</button></div>`).join('') || '<p>Aucune action ouverte dans votre périmètre.</p>'}</div></article>
  </section>`
}

function sequencesView() {
  const opp = opportunity()
  const sequence = state.execution.sequence
  const enrollment = state.execution.enrollment || state.hydration?.execution.sequenceEnrollments?.[0]
  return `<section class="b2b-command">${opp ? accountHeader() : ''}
    <div class="b2b-actions"><button data-action="create-sequence" class="b2b-primary">Créer séquence</button>${sequence && opp ? '<button data-action="enroll-sequence">Inscrire le compte</button>' : ''}${enrollment?.status === 'active' ? '<button data-action="pause-sequence">Pause</button><button data-action="stop-sequence">Arrêter</button>' : ''}</div>
    ${sequence ? `<article class="b2b-panel"><div class="b2b-panel-head"><strong>${esc(sequence.name)}</strong><span>${esc(sequence.status)}</span></div><p>${esc(sequence.objective)}</p><div class="b2b-sequence-steps">${(state.execution.steps || []).map((step: any) => `<div><span>J+${step.day_offset}</span><strong>${esc(step.channel)}</strong><small>${esc(step.purpose)} · confirmation humaine</small></div>`).join('')}</div></article>` : `<section class="b2b-empty compact"><h2>Séquences adaptatives</h2><p>Chaque étape externe exige une confirmation. Une réponse, réunion ou refus arrête automatiquement la séquence.</p></section>`}
    ${enrollment ? `<div class="b2b-alert success"><strong>Compte inscrit</strong><span>${esc(enrollment.status)} · prochain passage ${dt(enrollment.next_run_at)}</span></div>` : ''}
  </section>`
}

function committeeView() {
  const analysis = state.analysis
  const account = prospect()
  if (!account) return `<section class="b2b-empty"><h2>Aucun compte sélectionné</h2><p>Reconnaissez ou créez un compte avant de bâtir sa carte décisionnelle.</p></section>`
  const committeeRows = state.hydration?.committee || analysis?.committee || []
  const identified = new Map(committeeRows.map((row: any) => [row.role_key, row]))
  const roles = analysis?.vertical?.decisionMakerRoles || [
    {key:'economic_buyer',label:'Acheteur économique'},
    {key:'commercial_sponsor',label:'Sponsor commercial'},
    {key:'operational_owner',label:'Responsable opérationnel'},
    {key:'financial_approver',label:'Approbateur financier'},
    {key:'procurement',label:'Achats / Procurement'},
    {key:'legal_risk',label:'Juridique / Risque'},
  ]
  return `<section class="b2b-command">${accountHeader()}<article class="b2b-panel"><div class="b2b-panel-head"><strong>Comité d’achat</strong><span>${identified.size}/${roles.length} identifiés</span></div><div class="b2b-role-list">${roles.map((role: any) => { const row: any = identified.get(role.key); return `<div><span class="b2b-role-state ${row ? 'known' : 'missing'}"></span><section><strong>${esc(role.label)}</strong><small>${row ? esc(row.person_name || row.job_title || 'Identifié') : 'Partie prenante manquante'}</small></section>${!row ? `<button data-research-role="${esc(role.key)}" data-research-label="${esc(role.label)}">Créer mission</button>` : ''}</div>` }).join('')}</div></article></section>`
}

function planView() {
  const plan = state.analysis?.accountPlan || state.hydration?.intelligence.accountPlan
  const account = prospect()
  if (!account) return `<section class="b2b-empty"><h2>Intelligence compte</h2><p>Reconnaissez un compte avant d’ouvrir le cockpit intelligence.</p><button id="analyze" class="b2b-primary">Analyser la page active</button></section>`
  const score = state.hydration?.intelligence.score?.scores || state.analysis?.score?.scores || {}
  const contributions = state.hydration?.intelligence.score?.contributions || state.analysis?.score?.contributions || []
  const health = state.hydration?.intelligence.commercialHealth
  const quality = state.hydration?.intelligence.dataQuality
  const missingRoles = (state.hydration?.committee || []).filter((row: any) => row.status === 'missing')
  const programs = state.analysis?.vertical?.recommendedPrograms || state.analysis?.vertical?.programs || []
  return `<section class="b2b-command intelligence-command">
    ${accountHeader()}
    <article class="intelligence-hero"><div><span class="b2b-kicker">DIRECTION COMMERCIALE · ACCOUNT INTELLIGENCE</span><h2>${esc(account.name)}</h2><p>${esc(state.analysis?.vertical?.commercialAngle || plan?.opportunity_thesis || 'Prioriser la décision, sécuriser les décideurs et convertir le potentiel en prochaine action datée.')}</p></div><div class="intelligence-health"><strong>${health?.score ?? score.overall ?? '—'}</strong><span>${esc(health?.level || 'commercial health')}</span></div></article>
    <div class="intelligence-score-grid">
      ${[['Adéquation',score.commercialFit],['Potentiel revenu',score.revenuePotential],['Maturité achat',score.buyingReadiness],['Couverture décision',score.decisionMakerCoverage],['Faisabilité',score.operationalFeasibility],['Expansion',score.expansionPotential]].map(([label,value])=>`<article><div><span>${esc(label)}</span><strong>${value ?? '—'}</strong></div><div class="mini-progress"><i style="width:${Math.min(100,Number(value||0))}%"></i></div></article>`).join('')}
    </div>
    <div class="command-two-column">
      <article class="b2b-panel"><div class="b2b-panel-head"><strong>Signaux & contributions</strong><span>${contributions.length}</span></div><div class="signal-list">${contributions.slice(0,8).map((row:any)=>`<div><span>${esc(row.label || row.reason || row.key)}</span><strong>${Number(row.points || row.value || 0)>0?'+':''}${esc(row.points ?? row.value ?? '')}</strong></div>`).join('') || '<p>Relancez une analyse de page pour enrichir les signaux.</p>'}</div></article>
      <article class="b2b-panel"><div class="b2b-panel-head"><strong>Risques anticipés</strong><span>${health?.reasons?.length || missingRoles.length}</span></div><div class="risk-chip-list">${(health?.reasons || []).map((item:string)=>`<span>${esc(item)}</span>`).join('')}${missingRoles.slice(0,4).map((row:any)=>`<span>${esc(row.role_label)} manquant</span>`).join('') || '<span class="positive">Aucun risque critique</span>'}</div></article>
    </div>
    <article class="b2b-panel account-plan-studio"><div class="b2b-panel-head"><strong>Plan de pénétration</strong><span>${plan ? `V${plan.plan_version} · ${esc(plan.status)}` : 'À générer'}</span></div>${plan?`<h3>${esc(plan.objective)}</h3><p>${esc(plan.opportunity_thesis)}</p><div class="b2b-milestones">${(plan.milestones || []).map((item:any)=>`<div><span>${esc(item.status)}</span><strong>${esc(item.label)}</strong></div>`).join('')}</div><div class="command-action-row"><button data-view="committee">Comité de décision</button><button data-action="build-plan">Nouvelle version</button><button data-domain="execute" class="b2b-primary">Exécuter le plan</button></div>`:`<p>Structurez parties prenantes, jalons, risques, valeur, angle d’entrée et missions de recherche.</p><button data-action="build-plan" class="b2b-primary">Générer le plan de compte</button>`}</article>
    ${programs.length?`<article class="b2b-panel"><div class="b2b-panel-head"><strong>Programmes ANGELCARE recommandés</strong><span>${programs.length}</span></div><div class="program-chip-list">${programs.map((item:any)=>`<span>${esc(typeof item==='string'?item:item.label||item.name)}</span>`).join('')}</div></article>`:''}
    <article class="data-quality-strip"><div><span>Qualité du dossier</span><strong>${quality?.score ?? '—'}%</strong></div><div class="mini-progress"><i style="width:${quality?.score || 0}%"></i></div><small>${quality?.missing?.length ? `À compléter: ${quality.missing.join(' · ')}` : 'Dossier prêt pour exécution'}</small></article>
  </section>`
}

function territoryView() {
  const analysis = state.analysis
  if (!analysis || state.context?.adapterId !== 'google_maps') return `<section class="b2b-empty"><h2>Google Maps Territory Sweep</h2><p>Ouvrez une fiche entreprise sélectionnée. Aucune collecte massive n’est effectuée.</p><button id="analyze" class="b2b-primary">Analyser la fiche</button></section>`
  const classification = analysis.territory?.classification || analysis.target?.classification || 'reviewed'
  return `<section class="b2b-command"><article class="b2b-panel"><div class="b2b-panel-head"><strong>Cible territoire</strong><span>${esc(classification)}</span></div><h3 class="b2b-plan-title">${esc(analysis.normalized?.organization?.name)}</h3><p>${esc(analysis.normalized?.organization?.address || analysis.normalized?.organization?.city)}</p><div class="b2b-grid"><article><span>Score cible</span><strong>${analysis.score?.scores?.overall ?? '—'}</strong></article><article><span>Vertical</span><strong class="b2b-small-strong">${esc(analysis.vertical?.label)}</strong></article></div><div class="b2b-actions"><button data-action="capture-territory" class="b2b-primary">Capturer la cible</button>${prospect() && !opportunity() ? '<button data-action="create-opportunity">Créer opportunité</button>' : ''}</div></article></section>`
}

function timelineView() {
  const account = prospect()
  const rows = state.execution.timeline || state.hydration?.more.timeline || []
  if (!account) return `<section class="b2b-empty"><h2>Timeline unifiée</h2><p>Sélectionnez un compte pour afficher son histoire commerciale.</p></section>`
  return `<section class="b2b-command">${accountHeader()}<article class="b2b-panel"><div class="b2b-panel-head"><strong>Chronologie commerciale</strong><button data-action="load-timeline">Actualiser</button></div><div class="b2b-timeline">${rows.map((row: any) => `<div><span></span><section><strong>${esc(row.title)}</strong><small>${dt(row.occurredAt)} · ${esc(row.source)}</small><p>${esc(row.description || '')}</p></section></div>`).join('') || '<p>Aucun événement chargé.</p>'}</div></article></section>`
}

function evidenceView() {
  const evidence = state.context?.evidence || state.hydration?.more.evidence || []
  if (!state.analysis && !state.hydration) return `<section class="b2b-empty"><h2>Aucune preuve capturée</h2><p>Analysez d’abord une page autorisée.</p></section>`
  return `<section class="b2b-command"><article class="b2b-panel"><div class="b2b-panel-head"><strong>Traçabilité des sources</strong><span>${state.analysis?.evidenceCount ?? evidence.length} observations</span></div><div class="b2b-evidence-list">${evidence.map((item: any) => `<div><strong>${esc(item.fieldKey || item.type)}</strong><span>${esc(item.value)}</span><small>${Math.round(Number(item.confidence || 0) * 100)}% · ${esc(item.sourceUrl)}</small></div>`).join('') || '<p>Les preuves normalisées sont persistées côté serveur.</p>'}</div></article></section>`
}


function proposalView() {
  const account=prospect(), opp=opportunity(), proposal=state.execution.proposal || state.hydration?.deal.proposal, offer=state.execution.offerConfiguration || state.hydration?.deal.offerConfiguration
  const pricing=state.execution.pricing || state.hydration?.deal.pricing
  const approvals=state.hydration?.deal.approvals || []
  if(!opp)return `<section class="b2b-empty"><h2>Proposal Studio</h2><p>Sélectionnez ou créez une opportunité qualifiée avant de configurer une offre.</p><button data-domain="execute" class="b2b-primary">Ouvrir les opportunités</button></section>`
  const readiness=[
    ['Besoin confirmé',Boolean(opp.scope_summary)],
    ['Offre configurée',Boolean(offer)],
    ['Pricing calculé',Boolean(pricing)],
    ['Marge évaluée',Boolean(pricing?.gross_margin_percent!=null)],
    ['Proposition créée',Boolean(proposal)],
    ['Approbation',Boolean(approvals.some((row:any)=>row.status==='approved') || proposal?.status==='approved')],
  ]
  return `<section class="b2b-command proposal-studio-runtime">${accountHeader()}
    <article class="proposal-studio-head"><div><span class="b2b-kicker">PROPOSAL STUDIO</span><h2>${esc(proposal?.title || `${account?.name || 'Compte'} — Offre AngelCare`)}</h2><p>${esc(opp.scope_summary || 'Configurez la solution, la portée, le pricing et l’approbation.')}</p></div><div><strong>${proposal?`V${proposal.version_number}`:'DRAFT'}</strong><span>${esc(proposal?.status || 'construction')}</span></div></article>
    <div class="proposal-progress-rail">${readiness.map(([label,done],index)=>`<div class="${done?'done':''}"><span>${done?'✓':index+1}</span><small>${esc(label)}</small></div>`).join('')}</div>
    <div class="proposal-studio-grid">
      <article class="b2b-panel proposal-config-card"><div class="b2b-panel-head"><strong>Configuration solution</strong><span>${esc(offer?.status||'À configurer')}</span></div>${offer?`<h3>${esc(offer.service_line)}</h3><div class="proposal-facts"><span>${esc(offer.deployment_mode)}</span><span>${offer.contract_months} mois</span><span>${esc(offer.billing_frequency)}</span><span>${Number(offer.population_volume||0)} volume</span></div><p>${esc((offer.client_responsibilities||[]).join(' · ') || 'Responsabilités client à confirmer')}</p>`:'<p>Définissez service, sites, volume, fréquence, responsabilités, exclusions et calendrier.</p>'}<button data-action="configure-offer">${offer?'Modifier la configuration':'Configurer l’offre'}</button></article>
      <article class="b2b-panel proposal-economics-card"><div class="b2b-panel-head"><strong>Économie du deal</strong><span>${esc(pricing?.margin_status||'Non calculée')}</span></div>${pricing?`<div class="proposal-economics"><div><span>CA net</span><strong>${money(pricing.net_revenue)}</strong></div><div><span>Coût livraison</span><strong>${money(pricing.delivery_cost)}</strong></div><div><span>Contribution</span><strong>${money(pricing.gross_contribution)}</strong></div><div><span>Marge</span><strong>${Number(pricing.gross_margin_percent||0).toFixed(1)}%</strong></div></div>`:'<p>Calculez le modèle, tous les coûts, la contingence et la marge.</p>'}<div class="command-action-row"><button data-action="recommend-pricing">Modèle prix</button><button data-action="calculate-pricing" class="b2b-primary">Calculer</button></div></article>
    </div>
    ${proposal?`<article class="proposal-preview-card"><div class="proposal-preview-toolbar"><div><span>APERÇU COMMERCIAL</span><strong>Version ${proposal.version_number}</strong></div><div><button data-action="new-proposal-version">Nouvelle version</button><button data-focus-mode>Grand écran</button></div></div><div class="proposal-paper"><div class="proposal-paper-brand"><strong>ANGELCARE</strong><span>Partnership Proposal</span></div><h2>${esc(proposal.title)}</h2><p class="proposal-client">Préparée pour ${esc(account?.name)}</p><section><span>Contexte client</span><p>${esc(proposal.client_context || 'Contexte à finaliser')}</p></section><section><span>Besoin confirmé</span><p>${esc(proposal.confirmed_need || opp.scope_summary || 'Besoin à confirmer')}</p></section><section><span>Solution recommandée</span><p>${esc(proposal.solution_summary || 'Solution à finaliser')}</p></section><div class="proposal-paper-value"><span>Valeur commerciale</span><strong>${money(proposal.commercial_value)}</strong><small>Marge ${Number(proposal.gross_margin_percent||0).toFixed(1)}%</small></div></div><div class="command-action-grid"><button data-action="submit-proposal-approval">Soumettre approbation</button>${approvals.some((row:any)=>row.status==='submitted')?'<button data-action="approve-proposal">Approuver</button><button data-action="reject-proposal">Rejeter</button>':''}<button data-action="mark-proposal-delivered" class="b2b-primary">Enregistrer livraison</button></div></article>`:`<section class="proposal-create-gate"><div><span class="b2b-kicker">GATE DE CRÉATION</span><h3>La proposition est prête lorsque portée et pricing sont confirmés.</h3><p>${!offer?'• Offre non configurée<br>':''}${!pricing?'• Pricing non calculé<br>':''}${offer&&pricing?'Toutes les conditions techniques sont disponibles.':''}</p></div><button data-action="create-proposal" class="b2b-primary" ${!pricing?'disabled':''}>Créer la proposition</button></section>`}
  </section>`
}

function pricingView(){
  const opp=opportunity(), pricing=state.execution.pricing || state.hydration?.deal.pricing, guard=state.execution.marginGuard || state.hydration?.deal.margin, discount=state.execution.discountRequest || state.hydration?.deal.discountRequests?.[0]
  if(!opp)return `<section class="b2b-empty"><h2>Pricing & Margin</h2><p>Sélectionnez une opportunité.</p></section>`
  return `<section class="b2b-command">${accountHeader()}
    ${state.execution.recommendedPricingModel?`<div class="b2b-alert success"><strong>Modèle recommandé: ${esc(state.execution.recommendedPricingModel)}</strong><span>${esc((state.execution.alternatives||[]).join(' · '))}</span></div>`:''}
    ${pricing?`<article class="b2b-panel"><div class="b2b-panel-head"><strong>Économie de l’offre</strong><span>${esc(pricing.margin_status)}</span></div><div class="b2b-grid"><article><span>CA net</span><strong>${money(pricing.net_revenue)}</strong></article><article><span>Coût livraison</span><strong>${money(pricing.delivery_cost)}</strong></article><article><span>Contribution</span><strong>${money(pricing.gross_contribution)}</strong></article><article><span>Marge</span><strong>${Number(pricing.gross_margin_percent||0).toFixed(1)}%</strong></article></div>${guard?.blocked?'<div class="b2b-alert warning"><strong>Guardrail bloquant</strong><span>Approbation exécutive requise avant livraison.</span></div>':''}<div class="b2b-actions"><button data-action="evaluate-margin">Évaluer marge</button><button data-action="request-discount">Demander remise</button><button data-action="create-proposal" class="b2b-primary">Créer proposition</button></div></article>`:`<section class="b2b-empty compact"><h2>Tarification non calculée</h2><p>Calculez revenus, coûts directs, overhead, contingence et marge.</p><button data-action="calculate-pricing" class="b2b-primary">Calculer</button></section>`}
    ${discount?`<article class="b2b-panel"><div class="b2b-panel-head"><strong>Demande de remise</strong><span>${esc(discount.status)}</span></div><p>${discount.requested_discount_percent}% · marge révisée ${Number(discount.revised_margin||0).toFixed(1)}%</p><ul>${(discount.alternatives||[]).map((x:string)=>`<li>${esc(x)}</li>`).join('')}</ul>${discount.status==='submitted'?'<div class="b2b-actions"><button data-action="approve-discount">Approuver remise</button><button data-action="reject-discount">Rejeter remise</button></div>':''}</article>`:''}
  </section>`
}

function negotiationView(){
  const opp=opportunity(), room=state.execution.negotiationRoom || state.hydration?.deal.negotiationRoom, event=state.execution.negotiationEvent || state.hydration?.deal.negotiationEvents?.[0], objection=state.execution.objection || state.hydration?.deal.objections?.[0], counter=state.execution.counteroffer || state.hydration?.deal.counteroffer
  if(!opp)return `<section class="b2b-empty"><h2>Negotiation Deal Room</h2><p>Sélectionnez une opportunité avec proposition.</p></section>`
  return `<section class="b2b-command">${accountHeader()}
    ${room?`<article class="b2b-panel"><div class="b2b-panel-head"><strong>Deal Room active</strong><span>${esc(room.status)}</span></div><div class="b2b-grid"><article><span>Valeur</span><strong>${money(room.commercial_value)}</strong></article><article><span>Marge</span><strong>${Number(room.margin_percent||0).toFixed(1)}%</strong></article></div><p>${esc(room.next_action)}</p><div class="b2b-actions"><button data-action="record-negotiation-change">Enregistrer changement</button><button data-action="prepare-counteroffer">Contre-offre</button><button data-action="record-objection">Objection</button></div></article>`:`<section class="b2b-empty compact"><h2>Deal Room non ouverte</h2><p>Ouvrez la négociation depuis la proposition active.</p><button data-action="open-negotiation" class="b2b-primary">Ouvrir Deal Room</button></section>`}
    ${event?`<article class="b2b-panel"><strong>Dernier mouvement</strong><p>${esc(event.requested_change)}</p><small>Impact revenu ${money(event.commercial_impact)} · impact marge ${event.margin_impact}%</small></article>`:''}
    ${counter?`<article class="b2b-panel"><div class="b2b-panel-head"><strong>Contre-offre</strong><span>${esc(counter.status)}</span></div><p>${esc(counter.summary)}</p><small>${money(counter.commercial_value)} · ${Number(counter.margin_percent||0).toFixed(1)}%</small></article>`:''}
    ${objection?`<article class="b2b-panel"><div class="b2b-panel-head"><strong>Objection ${esc(objection.category)}</strong><span>${esc(objection.status)}</span></div><p>${esc(objection.statement)}</p><div class="b2b-alert success"><strong>Réponse recommandée</strong><span>${esc(objection.recommended_response)}</span></div><button data-action="resolve-objection">Résoudre</button></article>`:''}
  </section>`
}

function closingView(){
  const opp=opportunity(), ready=state.execution.readiness || state.hydration?.deal.closingReadiness, gate=state.execution.closingGate || state.hydration?.deal.closingGate, req=state.execution.contractRequirement || state.hydration?.deal.contractRequirements?.[0]
  if(!opp)return `<section class="b2b-empty"><h2>Closing Room</h2><p>Sélectionnez une opportunité.</p></section>`
  const missing=state.execution.missing||ready?.missing||[]
  return `<section class="b2b-command">${accountHeader()}
    ${ready?`<article class="b2b-panel"><div class="b2b-panel-head"><strong>Readiness clôture</strong><span>${ready.score}% · ${esc(ready.status)}</span></div><div class="b2b-progress"><span style="width:${Math.min(100,Number(ready.score||0))}%"></span></div><ul>${missing.map((x:string)=>`<li>${esc(x)}</li>`).join('')||'<li>Toutes les exigences sont satisfaites.</li>'}</ul></article>`:'<section class="b2b-empty compact"><h2>Readiness non évaluée</h2><p>Vérifiez besoin, portée, décideurs, proposition, prix, contrat, paiement et faisabilité.</p></section>'}
    <div class="b2b-actions"><button data-action="evaluate-closing">Évaluer</button><button data-action="create-contract-requirement">Exigence contrat</button><button data-action="check-closing-gates" class="b2b-primary">Contrôler clôture</button></div>
    ${gate?`<div class="b2b-alert ${gate.blocked?'warning':'success'}"><strong>${gate.blocked?'Clôture bloquée':'Clôture autorisée'}</strong><span>${esc((gate.missing_requirements||[]).join(' · '))}</span></div>`:''}
    ${req?`<article class="b2b-panel"><strong>${esc(req.label)}</strong><p>${esc(req.status)}</p><button data-action="complete-contract-requirement">Marquer complet</button></article>`:''}
  </section>`
}

function paymentsView(){
  const opp=opportunity(), promise=state.execution.paymentPromise || state.hydration?.deal.paymentPromises?.[0], gate=state.execution.paymentGate || state.hydration?.deal.paymentGate
  if(!opp)return `<section class="b2b-empty"><h2>Payment Command</h2><p>Sélectionnez une opportunité.</p></section>`
  return `<section class="b2b-command">${accountHeader()}
    ${promise?`<article class="b2b-panel"><div class="b2b-panel-head"><strong>Promesse paiement</strong><span>${esc(promise.status)}</span></div><h3>${money(promise.amount)}</h3><p>${dt(promise.promised_at)} · ${esc(promise.payer)}</p><button data-action="request-payment-verification">Demander vérification Finance</button></article>`:`<section class="b2b-empty compact"><h2>Aucune promesse active</h2><p>Enregistrez montant, payeur, méthode, date exacte et règle d’escalade.</p><button data-action="create-payment-promise" class="b2b-primary">Créer promesse</button></section>`}
    <div class="b2b-actions"><button data-action="check-payment-gate">Contrôler gate paiement</button></div>
    ${gate?`<div class="b2b-alert ${gate.status==='verified'?'success':'warning'}"><strong>Gate ${esc(gate.status)}</strong><span>${money(gate.amount_due)} · vérification ${gate.verification_required?'requise':'confirmée'}</span></div>`:''}
  </section>`
}

function rescueView(){
  const opp=opportunity(), rescue=state.execution.revenueRescue || state.hydration?.deal.rescueCases?.[0], intervention=state.execution.executiveIntervention || state.hydration?.deal.executiveInterventions?.[0]
  if(!opp)return `<section class="b2b-empty"><h2>Revenue Rescue</h2><p>Sélectionnez une opportunité à risque.</p></section>`
  return `<section class="b2b-command">${accountHeader()}
    ${rescue?`<article class="b2b-panel"><div class="b2b-panel-head"><strong>${esc(rescue.rescue_type)}</strong><span>${esc(rescue.priority)} · ${esc(rescue.status)}</span></div><h3>${money(rescue.risk_value)} à protéger</h3><p>${esc(rescue.reason)}</p></article>`:`<section class="b2b-empty compact"><h2>Aucun dossier rescue</h2><p>Créez un plan pour proposition bloquée, négociation, contrat ou paiement.</p><button data-action="create-rescue" class="b2b-primary">Créer rescue</button></section>`}
    <div class="b2b-actions"><button data-action="prepare-executive-intervention">Brief exécutif</button></div>
    ${intervention?`<article class="b2b-panel"><div class="b2b-panel-head"><strong>Intervention ${esc(intervention.executive_role)}</strong><span>${esc(intervention.status)}</span></div><p><strong>Blocage:</strong> ${esc(intervention.main_blocker)}</p><p><strong>Action:</strong> ${esc(intervention.recommended_intervention)}</p><p><strong>Résultat attendu:</strong> ${esc(intervention.required_outcome)}</p></article>`:''}
  </section>`
}

function capabilitiesView() {
  const assigned = OPERATIONAL_CAPABILITY_UI.filter((item) => cap(item.key))
  const grouped = (['account', 'execute', 'deal', 'intelligence', 'more'] as WorkspaceDomain[])
    .map((domain) => ({ domain, items: assigned.filter((item) => item.domain === domain) }))
    .filter((group) => group.items.length)
  return `<section class="b2b-command capability-command-center">
    ${accountHeader()}
    <article class="capability-coverage-hero"><div><span class="b2b-kicker">CAPABILITY-TO-UI COVERAGE</span><h2>${assigned.length}/45 capacités opérationnelles chargées</h2><p>Chaque capacité assignée dispose d’une destination visible, d’une action gouvernée et d’un retour synchronisé.</p></div><strong>${Math.round((assigned.length / 45) * 100)}%</strong></article>
    ${grouped.map((group) => `<article class="b2b-panel capability-group"><div class="b2b-panel-head"><strong>${esc(DOMAIN_LABELS[group.domain].label)}</strong><span>${group.items.length} capacités</span></div><div class="capability-grid">${group.items.map((item) => `<button data-cap-view="${esc(item.view)}" data-cap-domain="${esc(item.domain)}" ${item.action ? `data-cap-action="${esc(item.action)}"` : ''}><span>${esc(item.id)}</span><strong>${esc(item.label)}</strong><small>${esc(item.summary)}</small><i>Ouvrir →</i></button>`).join('')}</div></article>`).join('')}
  </section>`
}

function currentView() {
  if (isManagementView(state.activeView) && state.managementHydration) return renderManagementWorkspace(state.activeView, state.managementHydration, { esc, money, dt })
  if (isManagementView(state.activeView) && !state.managementHydration) return `<section class="partner-empty"><div class="partner-empty-mark">AI</div><h2>Management Command</h2><p>Synchronisez le cockpit de direction pour charger les données autorisées.</p><button data-action="review-pipeline" class="b2b-primary">Initialiser la revue</button></section>`
  if (isPartnerView(state.activeView) && state.partnerHydration) return renderPartnerWorkspace(state.activeView, state.partnerHydration, { esc, money, dt })
  switch (state.activeView) {
    case 'today': return todayView()
    case 'opportunity': return opportunityView()
    case 'pipeline': return pipelineView()
    case 'outreach': return outreachView()
    case 'communications': return communicationsView()
    case 'calls': return callsView()
    case 'field_visits': return visitsView()
    case 'meetings': return meetingsView()
    case 'tasks': return tasksView()
    case 'sequences': return sequencesView()
    case 'committee': return committeeView()
    case 'plan': return planView()
    case 'territory': return territoryView()
    case 'timeline': return timelineView()
    case 'evidence': return evidenceView()
    case 'proposal': return proposalView()
    case 'pricing': return pricingView()
    case 'negotiation': return negotiationView()
    case 'closing': return closingView()
    case 'payments': return paymentsView()
    case 'rescue': return rescueView()
    case 'capabilities': return capabilitiesView()
    default: return recognitionView()
  }
}

const navConfig: Array<{ view: ViewKey; label: string; submodule: string; capability?: string; domain: WorkspaceDomain }> = [
  { view: 'recognition', label: 'Account 360', submodule: 'account_recognition', domain: 'account' },
  { view: 'committee', label: 'Décideurs', submodule: 'decision_makers', domain: 'account' },
  { view: 'today', label: 'Aujourd’hui', submodule: 'today', capability: 'extension.b2b.daily_revenue_command', domain: 'execute' },
  { view: 'opportunity', label: 'Opportunité', submodule: 'opportunities', capability: 'extension.b2b.opportunity_creation', domain: 'execute' },
  { view: 'pipeline', label: 'Pipeline', submodule: 'pipeline', capability: 'extension.b2b.intelligent_pipeline_management', domain: 'execute' },
  { view: 'outreach', label: 'Outreach', submodule: 'outreach', capability: 'extension.b2b.outreach_strategy_builder', domain: 'execute' },
  { view: 'communications', label: 'Comms', submodule: 'communications', domain: 'execute' },
  { view: 'calls', label: 'Appels', submodule: 'calls', capability: 'extension.b2b.call_preparation', domain: 'execute' },
  { view: 'field_visits', label: 'Terrain', submodule: 'field_visits', capability: 'extension.b2b.field_visit_mode', domain: 'execute' },
  { view: 'meetings', label: 'Réunions', submodule: 'meetings', capability: 'extension.b2b.meeting_preparation', domain: 'execute' },
  { view: 'tasks', label: 'Suivis', submodule: 'tasks', capability: 'extension.b2b.intelligent_pipeline_management', domain: 'execute' },
  { view: 'sequences', label: 'Séquences', submodule: 'sequences', capability: 'extension.b2b.controlled_automation', domain: 'execute' },
  { view: 'proposal', label: 'Proposal Studio', submodule: 'proposal_studio', capability: 'extension.b2b.proposal_studio', domain: 'deal' },
  { view: 'pricing', label: 'Pricing & Marge', submodule: 'pricing_margin', capability: 'extension.b2b.pricing_margin_protection', domain: 'deal' },
  { view: 'negotiation', label: 'Deal Room', submodule: 'negotiation_deal_room', capability: 'extension.b2b.negotiation_deal_room', domain: 'deal' },
  { view: 'closing', label: 'Closing', submodule: 'closing_room', capability: 'extension.b2b.closing_room', domain: 'deal' },
  { view: 'payments', label: 'Paiement', submodule: 'payment_promises', capability: 'extension.b2b.payment_promise_control', domain: 'deal' },
  { view: 'rescue', label: 'Rescue', submodule: 'revenue_rescue', capability: 'extension.b2b.revenue_rescue', domain: 'deal' },
  { view: 'handoff', label: 'Operational Handoff', submodule: 'operational_handoff', capability: 'extension.b2b.operational_handoff', domain: 'execute' },
  { view: 'plan', label: 'Plan & Scores', submodule: 'account_plans', domain: 'intelligence' },
  { view: 'territory', label: 'Territoire', submodule: 'territory_sweep', domain: 'intelligence' },
  { view: 'timeline', label: 'Timeline', submodule: 'activity_timeline', capability: 'extension.b2b.daily_revenue_command', domain: 'more' },
  { view: 'evidence', label: 'Preuves', submodule: 'evidence', domain: 'more' },
  { view: 'capabilities', label: '45 Capacités', submodule: 'account_recognition', capability: 'extension.b2b.dynamic_user_loading', domain: 'more' },
  ...MANAGEMENT_NAV,
]

function navAvailable(item: { submodule: string; capability?: string }) {
  return sub(item.submodule) && (!item.capability || cap(item.capability))
}

function workspaceHeader() {
  const account = prospect()
  const opp = opportunity()
  const activePartner = partner()
  const health = partnerMode() ? state.partnerHydration?.intelligence?.latestHealth : state.hydration?.intelligence.commercialHealth
  const surface = document.body.dataset.surface === 'focus' ? 'FOCUS MODE' : 'BROWSER SIDE COMMAND'
  const directorMode = isManagementView(state.activeView)
  const name = activePartner?.commercial_name || activePartner?.legal_name || account?.name
  const managerForecast = state.managementHydration?.pipeline?.latestForecast || state.managementHydration?.pipeline?.forecasts?.[0]
  const stage = activePartner ? `${activePartner.status || 'partner'} · ${activePartner.activation_status || 'activation'}` : opp?.stage || account?.status || 'Compte'
  return `<section class="command-topline">
    <div class="command-brandline"><span>${surface}${directorMode ? ' · DIRECTOR MODE' : activePartner ? ' · PARTNER MODE' : ''}</span><strong>${name ? esc(name) : 'Revenue Command'}</strong><small>${account ? `${esc(activePartner?.city || account.city || 'Territoire')} · ${esc(stage)}` : directorMode ? 'Cockpit de direction · scope autorisé · evidence-backed' : 'Analysez une page ou reprenez un compte actif'}</small></div>
    <div class="command-top-actions"><button data-palette-toggle title="Command Palette">⌘</button><button id="reanalyze" title="Analyser la page active">⌁</button>${account || directorMode ? `<button id="sync-workspace" title="Synchroniser le workspace">↻</button><button data-focus-mode title="Ouvrir Focus Mode">↗</button>${account ? '<button id="clear-workspace" title="Fermer le contexte actif">×</button>' : ''}` : ''}</div>
    ${account || directorMode ? `<div class="command-live-strip"><span><i class="sync-dot"></i>${state.hydrating || state.partnerHydrating || state.managementHydrating ? 'Synchronisation…' : state.stale ? 'Actualisation requise' : 'Live'}</span><span>${directorMode ? `Forecast ${managerForecast ? `${Math.round(Number(managerForecast.confidence || 0) * 100)}%` : '—'}` : `Health ${health?.score ?? '—'}`}</span><span>${state.lastHydratedAt ? `Sync ${dt(state.lastHydratedAt)}` : directorMode ? 'Management Command' : activePartner ? 'Partner 360' : 'Account 360'}</span></div>` : ''}
  </section>`
}

function commandPalette() {
  if (!state.paletteOpen) return ''
  const assigned = OPERATIONAL_CAPABILITY_UI.filter((item) => cap(item.key))
  const account = prospect()
  return `<div class="command-palette-backdrop" data-palette-close><section class="command-palette" role="dialog" aria-modal="true"><header><div><span>COMMAND PALETTE</span><strong>${account ? esc(account.name) : 'ANGELCARE Revenue Command'}</strong></div><button data-palette-close>×</button></header><div class="command-palette-search"><span>⌘K</span><input id="command-palette-query" placeholder="Rechercher une capacité ou une action…" autocomplete="off"></div><div class="command-palette-list">${assigned.map((item) => `<button data-cap-view="${esc(item.view)}" data-cap-domain="${esc(item.domain)}" ${item.action ? `data-cap-action="${esc(item.action)}"` : ''} data-palette-item="${esc(`${item.label} ${item.summary}`.toLowerCase())}"><span>${esc(item.id)}</span><section><strong>${esc(item.label)}</strong><small>${esc(item.summary)}</small></section><i>${esc((isManagementView(item.view) ? MANAGEMENT_DOMAIN_LABELS : partnerMode() ? PARTNER_DOMAIN_LABELS : DOMAIN_LABELS)[item.domain].short)} →</i></button>`).join('')}</div><footer><span>Entrée: ouvrir</span><span>Échap: fermer</span><span>${assigned.length}/45 assignées</span></footer></section></div>`
}

function render() {
  if (!root) return
  const modeManagement = isManagementView(state.activeView)
  const modePartner = !modeManagement && partnerMode()
  const sourceNav = modeManagement ? MANAGEMENT_NAV : modePartner ? PARTNER_NAV : navConfig
  const labels = modeManagement ? MANAGEMENT_DOMAIN_LABELS : modePartner ? PARTNER_DOMAIN_LABELS : DOMAIN_LABELS
  const available = sourceNav.filter(navAvailable)
  const domainAvailable = (['account', 'execute', 'deal', 'intelligence', 'more'] as WorkspaceDomain[]).filter((domain) => available.some((item) => item.domain === domain))
  if (!domainAvailable.includes(state.activeDomain)) state.activeDomain = domainAvailable[0] || 'account'
  const domainNav = available.filter((item) => item.domain === state.activeDomain)
  if (!domainNav.some((item) => item.view === state.activeView)) state.activeView = (domainNav[0]?.view || defaultViewForDomain(state.activeDomain)) as ViewKey
  root.innerHTML = `<section class="b2b-runtime enterprise-runtime ${modeManagement ? 'management-runtime' : modePartner ? 'partner-runtime' : ''}">
    ${workspaceHeader()}
    <nav class="command-domain-nav">${domainAvailable.map((domain) => `<button data-domain="${domain}" class="${state.activeDomain === domain ? 'active' : ''}"><span>${esc(labels[domain].short)}</span><small>${esc(labels[domain].description)}</small></button>`).join('')}</nav>
    <div class="command-context-row"><nav class="b2b-subnav contextual-nav">${domainNav.map((item) => `<button data-view="${item.view}" class="${state.activeView === item.view ? 'active' : ''}">${esc(item.label)}</button>`).join('')}</nav><span class="capability-count">${OPERATIONAL_CAPABILITY_UI.filter((item) => cap(item.key)).length}/45 actives</span></div>
    ${statusBar()}
    ${(state.hydrating && !state.hydration) || (state.partnerHydrating && !state.partnerHydration) || (state.managementHydrating && !state.managementHydration) ? '<section class="workspace-skeleton"><div></div><div></div><div></div><div></div></section>' : currentView()}
    ${commandPalette()}
  </section>`
  bindEvents()
}

function bindEvents() {
  if (!root) return
  root.querySelectorAll('[data-palette-toggle]').forEach((element) => element.addEventListener('click', () => { state.paletteOpen = !state.paletteOpen; render(); if (state.paletteOpen) window.setTimeout(() => (document.getElementById('command-palette-query') as HTMLInputElement | null)?.focus(), 20) }))
  root.querySelectorAll('[data-palette-close]').forEach((element) => element.addEventListener('click', (event) => { if (event.target === element || (element as HTMLElement).tagName === 'BUTTON') { state.paletteOpen = false; render() } }))
  const paletteQuery = document.getElementById('command-palette-query') as HTMLInputElement | null
  paletteQuery?.addEventListener('input', () => { const query = paletteQuery.value.trim().toLowerCase(); root?.querySelectorAll('[data-palette-item]').forEach((item) => { (item as HTMLElement).style.display = !query || String((item as HTMLElement).dataset.paletteItem || '').includes(query) ? '' : 'none' }) })
  root.querySelectorAll('#analyze,#reanalyze').forEach((element) => element.addEventListener('click', analyze))
  root.querySelectorAll('[data-domain]').forEach((element) => element.addEventListener('click', () => {
    const domain = ((element as HTMLElement).dataset.domain || 'account') as WorkspaceDomain
    state.activeDomain = domain
    state.activeView = defaultViewForDomain(domain)
    render()
  }))
  root.querySelectorAll('[data-view]').forEach((element) => element.addEventListener('click', async () => {
    const view = ((element as HTMLElement).dataset.view || 'recognition') as ViewKey
    state.activeDomain = domainForView(view)
    state.activeView = view
    render()
    if (view === 'today' && !state.execution.daily) await loadToday()
    if (view === 'pipeline' && !state.execution.pipeline) await loadPipeline()
    if (view === 'timeline' && prospect() && !(state.execution.timeline || state.hydration?.more.timeline || []).length) await loadTimeline()
    if (view === 'tasks' && !(state.execution.actions || state.hydration?.execution.nextActions || []).length) await loadActions()
  }))
  root.querySelectorAll('[data-action]').forEach((element) => element.addEventListener('click', () => handleAction((element as HTMLElement).dataset.action || '')))
  root.querySelectorAll('[data-focus-mode]').forEach((element) => element.addEventListener('click', () => { void message({ type: 'OPEN_B2B_FOCUS_MODE' }) }))
  root.querySelector('#sync-workspace')?.addEventListener('click', () => { state.stale = true; void hydrateWorkspace(true).then(() => hydratePartnerWorkspace(true)).then(() => hydrateManagementWorkspace(true)) })
  root.querySelector('#clear-workspace')?.addEventListener('click', () => { void clearWorkspace() })
  root.querySelectorAll('[data-cap-view]').forEach((element) => element.addEventListener('click', () => {
    const target = element as HTMLElement
    state.activeDomain = (target.dataset.capDomain || 'account') as WorkspaceDomain
    state.activeView = (target.dataset.capView || defaultViewForDomain(state.activeDomain)) as ViewKey
    state.paletteOpen = false
    render()
    const action = target.dataset.capAction
    if (action) window.setTimeout(() => { void handleAction(action) }, 80)
  }))
  root.querySelectorAll('[data-research-role]').forEach((element) => element.addEventListener('click', () => researchRole((element as HTMLElement).dataset.researchRole || '', (element as HTMLElement).dataset.researchLabel || 'Décideur')))
  root.querySelectorAll('[data-select-opportunity]').forEach((element) => element.addEventListener('click', () => selectOpportunity((element as HTMLElement).dataset.selectOpportunity || '')))
  root.querySelectorAll('[data-complete-action]').forEach((element) => element.addEventListener('click', () => completeAction((element as HTMLElement).dataset.completeAction || '')))
  root.querySelectorAll('[data-complete-followup]').forEach((element) => element.addEventListener('click', () => completeFollowup((element as HTMLElement).dataset.completeFollowup || '')))
  root.querySelectorAll('[data-complete-onboarding-task]').forEach((element) => element.addEventListener('click', () => completeOnboardingTask((element as HTMLElement).dataset.completeOnboardingTask || '')))
  root.querySelectorAll('[data-select-issue]').forEach((element) => element.addEventListener('click', () => selectPartnerContext('activeIssueId', (element as HTMLElement).dataset.selectIssue || '', 'issues')))
  root.querySelectorAll('[data-select-tender]').forEach((element) => element.addEventListener('click', () => selectPartnerContext('activeTenderId', (element as HTMLElement).dataset.selectTender || '', 'tender')))
}

async function loadToday() {
  await run('b2b.daily_command.read', {}, 'Commandement du jour actualisé.', { sourceAdapter: null, view: 'today' })
}

async function loadPipeline() {
  clearMessages(); setState({ busy: 'Chargement du pipeline et des risques…' })
  try {
    const pipeline = await execute('b2b.pipeline.read', { limit: 500 }, { sourceAdapter: null, silent: true })
    const riskReport = await execute('b2b.pipeline.risk_detect', { limit: 500 }, { sourceAdapter: null, silent: true })
    state.execution.pipeline = pipeline
    state.execution.riskReport = riskReport
    setState({ busy: undefined, notice: 'Pipeline actualisé.', activeView: 'pipeline' })
  } catch (error: any) {
    setState({ busy: undefined, error: error?.message || 'PIPELINE_LOAD_FAILED', errorDetails: error?.details || null })
  }
}

async function loadTimeline() {
  const account = prospect(); if (!account) return
  await run('b2b.timeline.read', { prospectId: account.id, limit: 150 }, 'Timeline actualisée.', { sourceAdapter: null, view: 'timeline' })
}

async function loadActions() {
  await run('b2b.next_action.read', { limit: 150 }, 'Actions actualisées.', { sourceAdapter: null, view: 'tasks' })
}

function selectOpportunity(id: string) {
  const candidates = state.execution.pipeline?.opportunities || state.hydration?.opportunities || []
  const row = candidates.find((item: any) => item.id === id)
  if (!row) return
  state.execution.opportunity = row
  if (row.prospect) state.execution.prospect = row.prospect
  state.activeDomain = 'execute'
  state.activeView = 'opportunity'
  state.notice = `${row.prospect?.name || state.hydration?.account?.name || row.title} sélectionné.`
  void persistActiveWorkspace(prospect(), row).then(() => hydrateWorkspace(true))
  render()
}

async function researchRole(roleKey: string, roleLabel: string) {
  const account = prospect(); if (!account) return
  await run('b2b.decision_maker.research', { prospectId: account.id, targetRoleKey: roleKey, targetRoleLabel: roleLabel }, `Mission ${roleLabel} créée.`, { view: 'committee' })
}

async function completeAction(id: string) {
  const form = await openForm('Terminer l’action', 'Le résultat alimente la timeline et recalcule la prochaine meilleure action.', [{ name: 'outcome', label: 'Résultat obtenu', type: 'textarea', required: true }])
  if (!form) return
  await run('b2b.next_action.complete', { actionId: id, outcome: form.outcome }, 'Action terminée et prochaine action recalculée.', { sourceAdapter: null })
  if (state.activeView === 'today') await loadToday(); else await loadActions()
}

async function completeFollowup(id: string) {
  const form = await openForm('Clôturer le suivi', 'Documentez le résultat réel avant clôture.', [{ name: 'outcome', label: 'Résultat', type: 'textarea', required: true }])
  if (!form) return
  await run('b2b.followup.complete', { followupId: id, outcome: form.outcome }, 'Suivi clôturé.', { sourceAdapter: null })
  if (state.activeView === 'today') await loadToday(); else await loadActions()
}

async function completeOnboardingTask(taskId: string) {
  if (!taskId) return
  const form = await openForm('Terminer la tâche onboarding', 'Ajoutez la preuve réelle ou documentez le blocker.', [
    { name: 'status', label: 'Statut', type: 'select', value: 'completed', options: [{ value: 'completed', label: 'Terminée' }, { value: 'blocked', label: 'Bloquée' }] },
    { name: 'blockerReason', label: 'Blocker / résultat', type: 'textarea' },
    { name: 'evidenceUrl', label: 'Preuve / URL' },
  ])
  if (!form) return
  await run('b2b.onboarding.task_complete', { taskId, status: form.status, blockerReason: form.blockerReason, evidence: { url: form.evidenceUrl || null } }, 'Tâche onboarding mise à jour.', { sourceAdapter: null, view: 'activation' })
}

async function selectPartnerContext(key: string, id: string, view: PartnerViewKey) {
  if (!id || !state.workspaceSession) return
  const mappedKey = key === 'activeTenderId' ? null : key
  if (mappedKey) state.workspaceSession = { ...state.workspaceSession, [mappedKey]: id, updatedAt: new Date().toISOString() }
  state.activeDomain = domainForView(view)
  state.activeView = view
  await saveWorkspaceSession(state.workspaceSession)
  await hydratePartnerWorkspace(true)
}

async function handleAction(kind: string) {
  const account = prospect()
  const opp = opportunity()
  const context = state.context
  const analysis = state.analysis

  try {
    const handled = await handleManagementAction(kind, {
      workspace: state.managementHydration,
      account,
      opportunity: opp,
      partner: partner(),
      openForm,
      run: (commandKey, payload, success, options) => run(commandKey, payload, success, options as any),
    })
    if (handled) return
  } catch (error: any) {
    return setState({ busy: undefined, error: error?.message || 'MANAGEMENT_ACTION_FAILED', errorDetails: error?.details || null })
  }

  try {
    const handled = await handlePartnerAction(kind, {
      workspace: state.partnerHydration,
      account,
      opportunity: opp,
      sourceUrl: state.context?.url || null,
      openForm,
      run: (commandKey, payload, success, options) => run(commandKey, payload, success, options as any),
    })
    if (handled) return
  } catch (error: any) {
    return setState({ busy: undefined, error: error?.message || 'PARTNER_ACTION_FAILED', errorDetails: error?.details || null })
  }

  if (kind === 'open-account' && account) return void await message({ type: 'OPEN_SAAS_ROUTE', route: `/b2b-partnerships/prospects/${account.id}` })
  if (kind === 'load-today') return loadToday()
  if (kind === 'load-pipeline') return loadPipeline()
  if (kind === 'load-timeline') return loadTimeline()
  if (kind === 'load-actions') return loadActions()

  if (kind === 'recommend-pricing' && opp) return run('b2b.pricing.model_recommend',{opportunityId:opp.id},'Modèle de tarification recommandé.',{sourceAdapter:null,view:'pricing'})
  if (kind === 'configure-offer' && opp) {
    const form=await openForm('Configurer l’offre','Définissez la solution, le mode de déploiement et les responsabilités.',[
      {name:'serviceLine',label:'Ligne de service',value:'AngelCare B2B Partnership',required:true},{name:'partnerProgram',label:'Programme partenaire'},
      {name:'populationVolume',label:'Volume cible',type:'number',value:0},{name:'frequency',label:'Fréquence',value:'Hebdomadaire'},
      {name:'serviceHours',label:'Horaires / couverture',type:'textarea'},{name:'deploymentMode',label:'Déploiement',type:'select',options:[{value:'pilot',label:'Pilote'},{value:'full',label:'Déploiement complet'},{value:'multi_site',label:'Multi-sites'}]},
      {name:'contractMonths',label:'Durée contrat (mois)',type:'number',value:12},{name:'billingFrequency',label:'Facturation',value:'monthly'},
      {name:'clientResponsibilitiesText',label:'Responsabilités client (séparées par ;)',type:'textarea'},{name:'angelcareResponsibilitiesText',label:'Responsabilités AngelCare (séparées par ;)',type:'textarea'},{name:'exclusionsText',label:'Exclusions (séparées par ;)',type:'textarea'}])
    if(!form)return; const split=(v:string)=>String(v||'').split(';').map(x=>x.trim()).filter(Boolean)
    return run('b2b.offer.configure',{opportunityId:opp.id,...form,clientResponsibilities:split(form.clientResponsibilitiesText),angelcareResponsibilities:split(form.angelcareResponsibilitiesText),exclusions:split(form.exclusionsText)},'Offre configurée.',{sourceAdapter:null,view:'proposal'})
  }
  if (kind === 'calculate-pricing' && opp) {
    const form=await openForm('Calculer tarification & marge','Saisissez le revenu et tous les coûts réellement anticipés.',[
      {name:'pricingModel',label:'Modèle',value:state.execution.recommendedPricingModel||'fixed_pilot',required:true},{name:'quotedRevenue',label:'CA brut (Dh)',type:'number',value:opp.estimated_annual_value||0,required:true},
      {name:'staffingCost',label:'Staffing',type:'number',value:0},{name:'transportCost',label:'Transport',type:'number',value:0},{name:'materialsCost',label:'Matériel',type:'number',value:0},{name:'trainingCost',label:'Formation',type:'number',value:0},{name:'overheadCost',label:'Overhead',type:'number',value:0},{name:'commissions',label:'Commissions',type:'number',value:0},{name:'contingency',label:'Contingence',type:'number',value:0},{name:'discountPercent',label:'Remise %',type:'number',value:0}])
    if(!form)return; return run('b2b.pricing.calculate',{opportunityId:opp.id,...form},'Tarification et marge calculées.',{sourceAdapter:null,view:'pricing'})
  }
  if (kind === 'evaluate-margin' && opp) return run('b2b.margin.evaluate',{opportunityId:opp.id,pricingId:state.execution.pricing?.id},'Guardrails marge évalués.',{sourceAdapter:null,view:'pricing'})
  if (kind === 'create-proposal' && opp) {
    const pricing=state.execution.pricing; if(!pricing)return setState({error:'PRICING_REQUIRED',activeView:'pricing'})
    const form=await openForm('Créer la proposition','Construisez une version liée à la portée et à la tarification validées.',[
      {name:'title',label:'Titre',value:`${account?.name||'Compte'} — Proposition AngelCare`,required:true},{name:'proposalType',label:'Type',value:'partnership'},
      {name:'clientContext',label:'Contexte client',type:'textarea'},{name:'confirmedNeed',label:'Besoin confirmé',type:'textarea',value:opp.scope_summary||''},{name:'solutionSummary',label:'Solution proposée',type:'textarea',required:true},{name:'validUntil',label:'Validité',type:'datetime-local'}])
    if(!form)return; return run('b2b.proposal.create',{opportunityId:opp.id,pricingId:pricing.id,offerConfigurationId:state.execution.offerConfiguration?.id,...form},'Proposition créée.',{sourceAdapter:null,view:'proposal'})
  }
  if (kind === 'new-proposal-version') {const proposal=state.execution.proposal || state.hydration?.deal.proposal;if(!proposal)return;const form=await openForm('Nouvelle version','Documentez précisément les changements.',[{name:'changeSummary',label:'Changements',type:'textarea',required:true}]);if(!form)return;return run('b2b.proposal.version_create',{proposalId:proposal.id,...form},'Nouvelle version créée.',{sourceAdapter:null,view:'proposal'})}
  if (kind === 'submit-proposal-approval') {const proposal=state.execution.proposal || state.hydration?.deal.proposal;if(!proposal)return;const form=await openForm('Soumettre approbation','Choisissez l’autorité et expliquez le besoin.',[{name:'approverRole',label:'Approbateur',type:'select',options:[{value:'sales_manager',label:'Sales Manager'},{value:'managing_director',label:'Managing Director'}]},{name:'reason',label:'Justification',type:'textarea'}]);if(!form)return;return run('b2b.proposal.submit_approval',{proposalId:proposal.id,...form},'Proposition soumise pour approbation.',{sourceAdapter:null,view:'proposal'})}
  if (kind === 'approve-proposal' || kind === 'reject-proposal') {
    const request=state.execution.approvalRequest || state.hydration?.deal.approvals?.[0]; if(!request)return
    const form=await openForm(kind==='approve-proposal'?'Approuver proposition':'Rejeter proposition','Décision réservée aux profils APPROVE/ADMINISTER.',[{name:'notes',label:'Notes décision',type:'textarea',required:true}])
    if(!form)return
    return run(kind==='approve-proposal'?'b2b.proposal.approve':'b2b.proposal.reject',{approvalRequestId:request.id,...form},kind==='approve-proposal'?'Proposition approuvée.':'Proposition rejetée.',{sourceAdapter:null,view:'proposal'})
  }
  if (kind === 'approve-discount' || kind === 'reject-discount') {
    const request=state.execution.discountRequest || state.hydration?.deal.discountRequests?.[0]; if(!request)return
    const form=await openForm(kind==='approve-discount'?'Approuver remise':'Rejeter remise','Décision réservée aux profils APPROVE/ADMINISTER.',[{name:'notes',label:'Notes décision',type:'textarea',required:true}])
    if(!form)return
    return run(kind==='approve-discount'?'b2b.discount.approve':'b2b.discount.reject',{discountRequestId:request.id,...form},kind==='approve-discount'?'Remise approuvée.':'Remise rejetée.',{sourceAdapter:null,view:'pricing'})
  }
  if (kind === 'mark-proposal-delivered') {const proposal=state.execution.proposal || state.hydration?.deal.proposal;if(!proposal)return;const form=await openForm('Marquer la proposition envoyée','Enregistrez uniquement une livraison réellement effectuée.',[{name:'channel',label:'Canal',value:'email'},{name:'recipient',label:'Destinataire',required:true},{name:'deliveryReference',label:'Référence / preuve',type:'textarea',required:true},{name:'followUpDueAt',label:'Suivi décision',type:'datetime-local',required:true}]);if(!form)return;return run('b2b.proposal.mark_delivered',{proposalId:proposal.id,...form},'Livraison enregistrée.',{sourceAdapter:null,view:'proposal'})}
  if (kind === 'request-discount' && opp) {const form=await openForm('Demander une remise','La marge révisée et les alternatives seront calculées.',[{name:'discountPercent',label:'Remise %',type:'number',required:true},{name:'reason',label:'Raison',type:'textarea',required:true},{name:'objectionContext',label:'Objection client',type:'textarea'},{name:'expectedBenefit',label:'Bénéfice attendu',type:'textarea'},{name:'contractMonths',label:'Durée',type:'number',value:12},{name:'paymentStructure',label:'Paiement'}]);if(!form)return;return run('b2b.discount.request',{opportunityId:opp.id,proposalId:state.execution.proposal?.id,...form},'Demande de remise soumise.',{sourceAdapter:null,view:'pricing'})}
  if (kind === 'open-negotiation' && opp) {const form=await openForm('Ouvrir Deal Room','Définissez la date décisionnelle et le prochain jalon.',[{name:'decisionDate',label:'Date décision',type:'datetime-local'},{name:'competitiveThreat',label:'Menace concurrente',type:'textarea'},{name:'nextAction',label:'Prochaine action',required:true}]);if(!form)return;return run('b2b.negotiation.open',{opportunityId:opp.id,...form},'Deal Room ouverte.',{sourceAdapter:null,view:'negotiation'})}
  if (kind === 'record-negotiation-change') {const room=state.execution.negotiationRoom || state.hydration?.deal.negotiationRoom;if(!room)return;const form=await openForm('Mouvement de négociation','Mesurez chaque impact avant réponse.',[{name:'eventType',label:'Type',value:'client_request'},{name:'requestedBy',label:'Demandé par',value:'Client'},{name:'requestedChange',label:'Changement demandé',type:'textarea',required:true},{name:'revenueImpact',label:'Impact revenu (Dh)',type:'number',value:0},{name:'marginImpact',label:'Impact marge points',type:'number',value:0},{name:'paymentImpact',label:'Impact paiement',type:'textarea'},{name:'operationalImpact',label:'Impact opérationnel',type:'textarea'},{name:'recommendedResponse',label:'Réponse recommandée',type:'textarea'},{name:'approvalRequired',label:'Approbation requise',type:'checkbox'}]);if(!form)return;return run('b2b.negotiation.change_record',{negotiationRoomId:room.id,...form},'Mouvement enregistré.',{sourceAdapter:null,view:'negotiation'})}
  if (kind === 'prepare-counteroffer') {const room=state.execution.negotiationRoom || state.hydration?.deal.negotiationRoom;if(!room)return;const form=await openForm('Préparer contre-offre','Recalculez valeur et marge pour une alternative contrôlée.',[{name:'strategy',label:'Stratégie',value:'revised_scope'},{name:'summary',label:'Résumé',type:'textarea',required:true},{name:'quotedRevenue',label:'CA brut',type:'number',value:room.commercial_value||0},{name:'staffingCost',label:'Staffing',type:'number',value:0},{name:'transportCost',label:'Transport',type:'number',value:0},{name:'materialsCost',label:'Matériel',type:'number',value:0},{name:'overheadCost',label:'Overhead',type:'number',value:0},{name:'discountPercent',label:'Remise %',type:'number',value:0}]);if(!form)return;return run('b2b.counteroffer.prepare',{negotiationRoomId:room.id,...form},'Contre-offre préparée.',{sourceAdapter:null,view:'negotiation'})}
  if (kind === 'record-objection' && opp) {const form=await openForm('Enregistrer objection','Classifiez-la avant de choisir une réponse.',[{name:'category',label:'Catégorie',type:'select',options:[{value:'price',label:'Prix'},{value:'payment_timing',label:'Timing paiement'},{value:'trust',label:'Confiance'},{value:'operational_capacity',label:'Capacité opérationnelle'},{value:'legal',label:'Juridique'},{value:'procurement',label:'Procurement'},{value:'other',label:'Autre'}]},{name:'statement',label:'Formulation exacte',type:'textarea',required:true},{name:'recommendedResponse',label:'Réponse personnalisée',type:'textarea'}]);if(!form)return;return run('b2b.objection.record',{opportunityId:opp.id,negotiationRoomId:state.execution.negotiationRoom?.id,...form,evidence:{sourceUrl:state.context?.url||null}},'Objection structurée.',{sourceAdapter:null,view:'negotiation'})}
  if (kind === 'resolve-objection') {const objection=state.execution.objection;if(!objection)return;const form=await openForm('Résoudre objection','Documentez la réponse et la preuve.',[{name:'resolution',label:'Résolution',type:'textarea',required:true},{name:'evidenceText',label:'Preuve',type:'textarea'}]);if(!form)return;return run('b2b.objection.resolve',{objectionId:objection.id,resolution:form.resolution,evidence:{note:form.evidenceText}},'Objection résolue.',{sourceAdapter:null,view:'negotiation'})}
  if (kind === 'evaluate-closing' && opp) {const form=await openForm('Évaluer readiness','Confirmez uniquement les éléments réellement vérifiés.',[{name:'decisionMakerEngaged',label:'Décideur engagé',type:'checkbox'},{name:'financialApproverEngaged',label:'Approbateur financier engagé',type:'checkbox'},{name:'priceAccepted',label:'Prix accepté',type:'checkbox'},{name:'paymentTermsAccepted',label:'Conditions paiement acceptées',type:'checkbox'},{name:'implementationFeasible',label:'Mise en œuvre faisable',type:'checkbox'}]);if(!form)return;return run('b2b.closing.readiness',{opportunityId:opp.id,...form},'Readiness évaluée.',{sourceAdapter:null,view:'closing'})}
  if (kind === 'create-contract-requirement' && opp) {const form=await openForm('Créer exigence contrat','Ajoutez une exigence vérifiable.',[{name:'requirementKey',label:'Clé',value:'signed_contract',required:true},{name:'label',label:'Exigence',value:'Contrat signé par autorité habilitée',required:true}]);if(!form)return;return run('b2b.contract.requirement_create',{opportunityId:opp.id,...form},'Exigence contrat créée.',{sourceAdapter:null,view:'closing'})}
  if (kind === 'complete-contract-requirement') {const req=state.execution.contractRequirement;if(!req)return;const form=await openForm('Compléter exigence','Ajoutez une preuve réelle.',[{name:'evidenceText',label:'Preuve / référence',type:'textarea',required:true}]);if(!form)return;return run('b2b.contract.status_update',{requirementId:req.id,status:'complete',evidence:{reference:form.evidenceText}},'Exigence contrat complétée.',{sourceAdapter:null,view:'closing'})}
  if (kind === 'check-closing-gates' && opp) return run('b2b.closing.gate_check',{opportunityId:opp.id,requestedState:'won'},'Gates de clôture validés.',{sourceAdapter:null,view:'closing'})
  if (kind === 'create-payment-promise' && opp) {const form=await openForm('Promesse de paiement','Enregistrez date, heure, montant, payeur et méthode.',[{name:'amount',label:'Montant Dh',type:'number',required:true},{name:'promisedAt',label:'Date et heure promises',type:'datetime-local',required:true},{name:'paymentMethod',label:'Méthode',required:true},{name:'payer',label:'Payeur',required:true},{name:'verificationDueAt',label:'Vérification à',type:'datetime-local'},{name:'escalationRule',label:'Escalade',value:'Escalader immédiatement après promesse manquée'}]);if(!form)return;return run('b2b.payment_promise.create',{opportunityId:opp.id,...form},'Promesse paiement enregistrée.',{sourceAdapter:null,view:'payments'})}
  if (kind === 'request-payment-verification') {const promise=state.execution.paymentPromise || state.hydration?.deal.paymentPromises?.[0];if(!promise)return;return run('b2b.payment_promise.verify_request',{paymentPromiseId:promise.id,proof:{submittedBySales:true}},'Demande de vérification Finance envoyée.',{sourceAdapter:null,view:'payments'})}
  if (kind === 'check-payment-gate' && opp) {const form=await openForm('Gate paiement','Le commercial ne confirme pas le paiement; Finance vérifie.',[{name:'amountDue',label:'Montant dû',type:'number',value:state.execution.paymentPromise?.amount||0},{name:'depositPercent',label:'Dépôt %',type:'number',value:50},{name:'dueAt',label:'Échéance',type:'datetime-local'},{name:'paymentMethod',label:'Méthode'},{name:'payer',label:'Payeur'}]);if(!form)return;return run('b2b.payment.gate_check',{opportunityId:opp.id,...form,financeVerified:false},'Gate paiement contrôlé.',{sourceAdapter:null,view:'payments'})}
  if (kind === 'create-rescue' && opp) {const form=await openForm('Créer Revenue Rescue','Protégez une valeur à risque avec propriétaire et échéance.',[{name:'rescueType',label:'Type',type:'select',options:[{value:'proposal_recovery',label:'Proposal Recovery'},{value:'negotiation_rescue',label:'Negotiation Rescue'},{value:'contract_recovery',label:'Contract Recovery'},{value:'payment_recovery',label:'Payment Recovery'},{value:'strategic_account',label:'Strategic Account Rescue'}]},{name:'riskValue',label:'Valeur à risque',type:'number',value:opp.estimated_annual_value||0},{name:'reason',label:'Raison',type:'textarea',required:true},{name:'priority',label:'Priorité',value:'high'},{name:'dueAt',label:'Échéance',type:'datetime-local'}]);if(!form)return;return run('b2b.revenue_rescue.create',{opportunityId:opp.id,...form},'Revenue Rescue créé.',{sourceAdapter:null,view:'rescue'})}
  if (kind === 'prepare-executive-intervention' && opp) {const form=await openForm('Brief intervention exécutive','Cadrez l’intervention et les engagements interdits.',[{name:'executiveRole',label:'Autorité',value:'managing_director'},{name:'strategicValue',label:'Valeur stratégique',type:'textarea'},{name:'mainBlocker',label:'Blocage principal',type:'textarea',required:true},{name:'clientRequest',label:'Demande client',type:'textarea'},{name:'approvedPosition',label:'Position AngelCare approuvée',type:'textarea'},{name:'recommendedIntervention',label:'Intervention recommandée',type:'textarea',required:true},{name:'prohibitedCommitmentsText',label:'Engagements interdits (;)',type:'textarea'},{name:'requiredOutcome',label:'Résultat requis',type:'textarea',required:true}]);if(!form)return;const prohibitedCommitments=String(form.prohibitedCommitmentsText||'').split(';').map(x=>x.trim()).filter(Boolean);return run('b2b.executive_intervention.prepare',{opportunityId:opp.id,...form,prohibitedCommitments},'Brief exécutif préparé.',{sourceAdapter:null,view:'rescue'})}
  if (kind === 'create-prospect' && context) return run('b2b.prospect.create', { context, contextId: analysis?.context?.id }, 'Prospect créé et relié au contexte navigateur.', { view: 'recognition' })
  if (kind === 'enrich' && context && account) return run('b2b.prospect.enrich', { prospectId: account.id, context, contextId: analysis?.context?.id, apply: true }, 'Enrichissement appuyé par les preuves appliqué.')
  if (kind === 'build-plan' && context && account) return run('b2b.account_plan.create', { prospectId: account.id, context, contextId: analysis?.context?.id }, 'Plan de compte généré.', { view: 'plan' })
  if (kind === 'capture-territory' && context) return run('b2b.territory.target_capture', { context, contextId: analysis?.context?.id }, 'Cible capturée dans le territoire.')

  if (kind === 'create-opportunity' && account) {
    const form = await openForm('Créer l’opportunité', 'Définissez une opportunité mesurable avec valeur, calendrier et portée.', [
      { name: 'title', label: 'Titre', value: `${account.name} — Partenariat stratégique`, required: true },
      { name: 'estimatedAnnualValue', label: 'Valeur annuelle estimée (Dh)', type: 'number', value: analysis?.vertical?.estimatedAnnualValue?.min || account.estimated_annual_value || 0 },
      { name: 'probability', label: 'Probabilité initiale (%)', type: 'number', value: 25 },
      { name: 'expectedCloseAt', label: 'Clôture prévue', type: 'datetime-local' },
      { name: 'programKey', label: 'Programme / offre', placeholder: 'Ex. school_parent_relief' },
      { name: 'scopeSummary', label: 'Portée préliminaire', type: 'textarea', placeholder: 'Besoin, population, sites, volume…' },
    ])
    if (!form) return
    const result = await run('b2b.opportunity.create', { prospectId: account.id, ...form, estimatedMonthlyValue: Number(form.estimatedAnnualValue || 0) / 12, sourceAdapter: context?.adapterId, sourceUrl: context?.url, contextId: analysis?.context?.id }, 'Opportunité créée avec prochaine action.', { sourceAdapter: context?.adapterId || null, view: 'opportunity' })
    return result
  }

  if (!opp) return setState({ error: 'OPPORTUNITY_REQUIRED', notice: undefined })

  if (kind === 'stage-recommend') return run('b2b.opportunity.stage_recommend', { opportunityId: opp.id }, 'Étape recommandée calculée.', { sourceAdapter: null, view: 'opportunity' })
  if (kind === 'stage-change') {
    const stages = ['research','qualified','initial_contact','discovery','meeting_scheduled','needs_confirmed','solution_design','proposal_preparation','proposal_sent','negotiation','commercial_agreement','contract_pending','payment_pending','activation_preparation','won','lost','nurture']
    const form = await openForm('Faire avancer le pipeline', 'Le serveur bloquera toute progression non appuyée par les preuves requises.', [
      { name: 'targetStage', label: 'Étape cible', type: 'select', value: opp.stage, options: stages.map((value) => ({ value, label: value.replaceAll('_', ' ') })) },
      { name: 'reason', label: 'Raison et preuve', type: 'textarea', required: true },
      { name: 'hasNeed', label: 'Besoin confirmé', type: 'checkbox', value: Boolean(opp.need_confirmed) },
      { name: 'hasScope', label: 'Portée confirmée', type: 'checkbox', value: Boolean(opp.scope_summary) },
      { name: 'hasProposal', label: 'Proposition existante', type: 'checkbox' },
      { name: 'hasCommercialAgreement', label: 'Accord commercial documenté', type: 'checkbox' },
      { name: 'hasContract', label: 'Contrat accepté/signé', type: 'checkbox' },
      { name: 'hasPayment', label: 'Paiement vérifié', type: 'checkbox' },
    ])
    if (!form) return
    const evidence = { hasNeed: form.hasNeed, hasScope: form.hasScope, hasProposal: form.hasProposal, hasCommercialAgreement: form.hasCommercialAgreement, hasContract: form.hasContract, hasPayment: form.hasPayment }
    return run('b2b.opportunity.stage_change', { opportunityId: opp.id, targetStage: form.targetStage, reason: form.reason, evidence }, 'Étape pipeline mise à jour.', { sourceAdapter: null, view: 'opportunity' })
  }

  if (kind === 'prepare-outreach' || kind === 'prepare-context-reply') {
    const adapter = state.context?.adapterId
    const form = await openForm('Préparer une approche', 'Le brouillon reste sous contrôle humain et ne sera jamais envoyé automatiquement.', [
      { name: 'purpose', label: 'Objectif', type: 'select', value: 'discovery', options: [
        { value: 'introduction', label: 'Introduction' }, { value: 'discovery', label: 'Découverte' }, { value: 'followup', label: 'Relance' }, { value: 'meeting', label: 'Invitation réunion' }, { value: 'reactivation', label: 'Réactivation' },
      ] },
      { name: 'channel', label: 'Canal', type: 'select', value: adapter === 'whatsapp_web' ? 'whatsapp' : adapter === 'gmail' ? 'email' : 'email', options: [
        { value: 'email', label: 'Email' }, { value: 'whatsapp', label: 'WhatsApp' }, { value: 'phone', label: 'Appel' }, { value: 'meeting', label: 'Réunion' },
      ] },
    ])
    if (!form) return
    const base = { prospectId: account?.id, opportunityId: opp.id, purpose: form.purpose, channel: form.channel, context: state.context, sourceAdapter: adapter, sourceUrl: state.context?.url }
    const commandKey = adapter === 'gmail' && cap('extension.b2b.gmail_assisted_operations') ? 'b2b.gmail.reply_prepare' : adapter === 'whatsapp_web' && cap('extension.b2b.whatsapp_assisted_operations') ? 'b2b.whatsapp.message_prepare' : 'b2b.communication.prepare'
    return run(commandKey, base, 'Approche personnalisée préparée, sans envoi automatique.', { sourceAdapter: adapter || null, view: adapter === 'gmail' || adapter === 'whatsapp_web' ? 'communications' : 'outreach' })
  }

  if (kind === 'copy-draft') {
    const draft = state.execution.draft
    if (!draft?.body) return
    await navigator.clipboard.writeText(`${draft.subject ? `${draft.subject}\n\n` : ''}${draft.body}`)
    return setState({ notice: 'Brouillon copié. L’envoi reste sous votre contrôle.' })
  }

  if (kind === 'log-communication') {
    const draft = state.execution.draft
    const form = await openForm('Journaliser la communication', 'Enregistrez uniquement le résultat réel de votre action.', [
      { name: 'outcome', label: 'Résultat', type: 'select', options: [
        { value: 'Sent', label: 'Envoyé' }, { value: 'Copied', label: 'Copié / prêt' }, { value: 'Replied - interested', label: 'Réponse positive' }, { value: 'Meeting requested', label: 'Réunion demandée' }, { value: 'No response', label: 'Sans réponse' }, { value: 'Declined', label: 'Refusé' },
      ] },
      { name: 'nextFollowUpAt', label: 'Prochain suivi', type: 'datetime-local' },
      { name: 'nextAction', label: 'Objectif du suivi', placeholder: 'Ex. confirmer la réunion de décision' },
    ])
    if (!form) return
    return run('b2b.communication.log', { opportunityId: opp.id, prospectId: account?.id, draftId: draft?.id, channel: draft?.channel || form.channel || 'email', subject: draft?.subject, body: draft?.body, outcome: form.outcome, sent: form.outcome === 'Sent', nextFollowUpAt: form.nextFollowUpAt || null, nextAction: form.nextAction, sourceAdapter: currentAdapter(), sourceUrl: state.context?.url }, 'Communication journalisée et séquence adaptée.', { sourceAdapter: currentAdapter(), view: state.activeView })
  }

  if (kind === 'create-followup') {
    const form = await openForm('Créer un suivi daté', 'Chaque suivi doit posséder un objectif clair, un canal et une échéance.', [
      { name: 'title', label: 'Titre', value: `Suivi — ${account?.name || 'compte'}`, required: true },
      { name: 'objective', label: 'Objectif concret', type: 'textarea', required: true },
      { name: 'dueAt', label: 'Échéance', type: 'datetime-local', required: true },
      { name: 'channel', label: 'Canal', type: 'select', options: [{ value: 'email', label: 'Email' }, { value: 'phone', label: 'Appel' }, { value: 'whatsapp', label: 'WhatsApp' }, { value: 'meeting', label: 'Réunion' }, { value: 'internal', label: 'Interne' }] },
      { name: 'priority', label: 'Priorité', type: 'select', value: 'high', options: [{ value: 'medium', label: 'Moyenne' }, { value: 'high', label: 'Haute' }, { value: 'critical', label: 'Critique' }] },
    ])
    if (!form) return
    return run('b2b.followup.create', { opportunityId: opp.id, prospectId: account?.id, ...form }, 'Suivi créé et synchronisé avec les tâches.', { sourceAdapter: null, view: 'tasks' })
  }

  if (kind === 'prepare-call') {
    const form = await openForm('Préparer l’appel', 'Définissez le résultat commercial attendu avant de composer.', [
      { name: 'purpose', label: 'But', type: 'select', value: 'discovery', options: [{ value: 'introduction', label: 'Introduction' }, { value: 'discovery', label: 'Découverte' }, { value: 'followup', label: 'Relance' }, { value: 'decision', label: 'Décision' }] },
      { name: 'objective', label: 'Objectif spécifique', type: 'textarea', placeholder: 'Ex. confirmer le besoin, le décideur et la date de lancement' },
      { name: 'desiredOutcome', label: 'Résultat souhaité', value: 'Obtenir un engagement daté' },
      { name: 'minimumNextStep', label: 'Minimum acceptable', value: 'Un propriétaire et une échéance' },
    ])
    if (!form) return
    return run('b2b.call.prepare', { opportunityId: opp.id, prospectId: account?.id, ...form }, 'Brief d’appel préparé.', { sourceAdapter: null, view: 'calls' })
  }

  if (kind === 'record-call') {
    const brief = state.execution.callBrief || state.hydration?.execution.callBriefs?.[0]
    const form = await openForm('Résultat de l’appel', 'Le résultat met à jour la timeline, le suivi et la recommandation d’étape.', [
      { name: 'result', label: 'Résultat', type: 'select', options: [{ value: 'Interested', label: 'Intéressé' }, { value: 'Meeting accepted', label: 'Réunion acceptée' }, { value: 'Proposal requested', label: 'Proposition demandée' }, { value: 'Unavailable', label: 'Indisponible' }, { value: 'Wrong contact', label: 'Mauvais contact' }, { value: 'Declined', label: 'Refusé' }, { value: 'Decision delayed', label: 'Décision reportée' }] },
      { name: 'summary', label: 'Résumé', type: 'textarea', required: true },
      { name: 'nextStep', label: 'Prochaine étape' },
      { name: 'nextFollowUpAt', label: 'Prochain suivi', type: 'datetime-local' },
      { name: 'needConfirmed', label: 'Besoin confirmé', type: 'checkbox' },
      { name: 'scopeConfirmed', label: 'Portée confirmée', type: 'checkbox' },
      { name: 'decisionMakerIdentified', label: 'Décideur identifié', type: 'checkbox' },
    ])
    if (!form) return
    return run('b2b.call.result_record', { opportunityId: opp.id, prospectId: account?.id, callBriefId: brief?.id, ...form }, 'Appel enregistré et pipeline réévalué.', { sourceAdapter: null, view: 'calls' })
  }

  if (kind === 'create-visit') {
    const form = await openForm('Planifier la visite terrain', 'Créez une mission avec objectif, lieu, échéance et preuves attendues.', [
      { name: 'objective', label: 'Objectif', type: 'textarea', required: true },
      { name: 'plannedAt', label: 'Date et heure', type: 'datetime-local', required: true },
      { name: 'location', label: 'Lieu', value: account?.address || '' },
    ])
    if (!form) return
    return run('b2b.field_visit.create', { opportunityId: opp.id, prospectId: account?.id, ...form }, 'Visite terrain planifiée.', { sourceAdapter: null, view: 'field_visits' })
  }

  if (kind === 'record-visit') {
    const visit = state.execution.fieldVisit || state.hydration?.execution.fieldVisits?.[0] || state.hydration?.execution.fieldVisits?.[0]
    const form = await openForm('Clôturer la visite', 'Documentez la personne rencontrée, l’issue, les preuves et le suivi.', [
      { name: 'personMet', label: 'Personne rencontrée', required: true },
      { name: 'outcome', label: 'Résultat', type: 'textarea', required: true },
      { name: 'notes', label: 'Notes', type: 'textarea' },
      { name: 'nextStep', label: 'Prochaine étape', required: true },
      { name: 'nextFollowUpAt', label: 'Échéance suivante', type: 'datetime-local', required: true },
    ])
    if (!form) return
    return run('b2b.field_visit.result_record', { visitId: visit?.id, opportunityId: opp.id, prospectId: account?.id, ...form, evidence: { humanConfirmed: true } }, 'Visite clôturée et suivi créé.', { sourceAdapter: null, view: 'field_visits' })
  }

  if (kind === 'schedule-meeting') {
    const form = await openForm('Planifier une réunion', 'La réunion sera reliée au compte, à l’opportunité et à un brief de préparation.', [
      { name: 'meetingType', label: 'Type', type: 'select', value: 'Discovery', options: [{ value: 'Discovery', label: 'Découverte' }, { value: 'Decision', label: 'Décision' }, { value: 'Operational', label: 'Opérationnelle' }, { value: 'Executive', label: 'Exécutive' }] },
      { name: 'scheduledAt', label: 'Date et heure', type: 'datetime-local', required: true },
      { name: 'durationMinutes', label: 'Durée (minutes)', type: 'number', value: 30 },
      { name: 'location', label: 'Lieu / lien' },
      { name: 'agenda', label: 'Objectif / agenda', type: 'textarea', value: 'Confirmer besoin, portée, processus de décision et prochaine étape datée' },
    ])
    if (!form) return
    return run('b2b.meeting.create', { opportunityId: opp.id, prospectId: account?.id, ...form }, 'Réunion planifiée et brief créé.', { sourceAdapter: currentAdapter(), view: 'meetings' })
  }

  if (kind === 'prepare-meeting') {
    const form = await openForm('Préparer la réunion', 'Générez un briefing spécifique au compte et à l’étape commerciale.', [
      { name: 'meetingType', label: 'Type', value: 'discovery' },
      { name: 'objective', label: 'Objectif', type: 'textarea', value: 'Confirmer besoin, portée, timing, décideurs et engagement suivant' },
      { name: 'desiredCommitment', label: 'Engagement recherché', value: 'Accord sur le prochain jalon de décision' },
    ])
    if (!form) return
    return run('b2b.meeting.prepare', { opportunityId: opp.id, prospectId: account?.id, ...form }, 'Brief de réunion préparé.', { sourceAdapter: currentAdapter(), view: 'meetings' })
  }

  if (kind === 'assist-meeting') {
    const form = await openForm('Assistant live de réunion', 'Aucun enregistrement secret. Saisissez seulement les éléments confirmés avec les participants.', [
      { name: 'confirmed', label: 'Éléments confirmés (séparés par ;)', type: 'textarea' },
      { name: 'missing', label: 'Informations encore manquantes (séparées par ;)', type: 'textarea' },
      { name: 'objections', label: 'Objections (séparées par ;)', type: 'textarea' },
      { name: 'commitments', label: 'Engagements (séparés par ;)', type: 'textarea' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
      { name: 'consentConfirmed', label: 'Usage de notes assistées communiqué/accepté', type: 'checkbox' },
    ])
    if (!form) return
    const split = (value: string) => String(value || '').split(';').map((item) => item.trim()).filter(Boolean)
    return run('b2b.meeting.assist', { opportunityId: opp.id, prospectId: account?.id, confirmed: split(form.confirmed), missing: split(form.missing), objections: split(form.objections), commitments: split(form.commitments), notes: form.notes, consentConfirmed: form.consentConfirmed }, 'Notes de réunion structurées.', { sourceAdapter: currentAdapter(), view: 'meetings' })
  }

  if (kind === 'summarize-meeting') {
    const form = await openForm('Compte rendu post-réunion', 'Préparez un résumé structuré avant application au pipeline.', [
      { name: 'confirmedNeeds', label: 'Besoins confirmés (séparés par ;)', type: 'textarea', required: true },
      { name: 'scope', label: 'Portée', type: 'textarea' },
      { name: 'budget', label: 'Budget / cadre financier' },
      { name: 'timing', label: 'Timing / lancement' },
      { name: 'decisionProcess', label: 'Processus de décision', type: 'textarea' },
      { name: 'objections', label: 'Objections (séparées par ;)', type: 'textarea' },
      { name: 'commitments', label: 'Engagements (séparés par ;)', type: 'textarea' },
      { name: 'nextActionTitle', label: 'Prochaine action' },
      { name: 'nextActionDueAt', label: 'Échéance', type: 'datetime-local' },
      { name: 'notes', label: 'Notes complémentaires', type: 'textarea' },
    ])
    if (!form) return
    const split = (value: string) => String(value || '').split(';').map((item) => item.trim()).filter(Boolean)
    const nextActions = form.nextActionTitle && form.nextActionDueAt ? [{ title: form.nextActionTitle, dueAt: form.nextActionDueAt }] : []
    return run('b2b.meeting.summary_prepare', { opportunityId: opp.id, prospectId: account?.id, confirmedNeeds: split(form.confirmedNeeds), scope: form.scope, budget: form.budget, timing: form.timing, decisionProcess: form.decisionProcess, objections: split(form.objections), commitments: split(form.commitments), nextActions, notes: form.notes }, 'Compte rendu préparé pour validation.', { sourceAdapter: currentAdapter(), view: 'meetings' })
  }

  if (kind === 'apply-meeting-outcome') {
    const outcome = state.execution.meetingOutcome || state.hydration?.execution.meetings?.outcomes?.[0]
    if (!outcome?.id) return
    return run('b2b.meeting.outcome_apply', { outcomeId: outcome.id }, 'Compte rendu appliqué au pipeline et suivis créés.', { sourceAdapter: null, view: 'meetings' })
  }

  if (kind === 'create-sequence') {
    const form = await openForm('Créer une séquence contrôlée', 'Les étapes restent soumises à confirmation humaine et aux règles d’arrêt.', [
      { name: 'name', label: 'Nom', value: 'Séquence B2B — Conversion découverte', required: true },
      { name: 'vertical', label: 'Vertical', value: account?.sector || 'general' },
      { name: 'objective', label: 'Objectif', type: 'textarea', value: 'Convertir les comptes qualifiés en réunions de découverte' },
    ])
    if (!form) return
    return run('b2b.sequence.create', form, 'Séquence contrôlée créée.', { sourceAdapter: null, view: 'sequences' })
  }

  if (kind === 'enroll-sequence') {
    const sequence = state.execution.sequence
    if (!sequence?.id || !account) return
    return run('b2b.sequence.enroll', { sequenceId: sequence.id, prospectId: account.id, opportunityId: opp.id }, 'Compte inscrit dans la séquence contrôlée.', { sourceAdapter: null, view: 'sequences' })
  }

  if (kind === 'pause-sequence' || kind === 'stop-sequence') {
    const enrollment = state.execution.enrollment || state.hydration?.execution.sequenceEnrollments?.[0]
    if (!enrollment?.id) return
    const form = await openForm(kind === 'pause-sequence' ? 'Mettre en pause' : 'Arrêter la séquence', 'Documentez la raison de cette décision.', [{ name: 'reason', label: 'Raison', type: 'textarea', required: true }])
    if (!form) return
    return run(kind === 'pause-sequence' ? 'b2b.sequence.pause' : 'b2b.sequence.stop', { enrollmentId: enrollment.id, reason: form.reason }, kind === 'pause-sequence' ? 'Séquence en pause.' : 'Séquence arrêtée.', { sourceAdapter: null, view: 'sequences' })
  }

  if (kind === 'attribute-campaign') {
    const form = await openForm('Attribuer la campagne', 'Reliez l’opportunité à sa source commerciale sans écraser l’historique.', [
      { name: 'campaignKey', label: 'Campagne / code', required: true },
      { name: 'sourceLabel', label: 'Libellé source' },
      { name: 'sourceUrl', label: 'URL source', value: state.context?.url || '' },
      { name: 'firstTouch', label: 'Premier contact', type: 'checkbox' },
      { name: 'lastTouch', label: 'Dernier contact', type: 'checkbox', value: true },
    ])
    if (!form) return
    return run('b2b.campaign.attribute', { opportunityId: opp.id, prospectId: account?.id, ...form, attributedValue: opp.estimated_annual_value }, 'Attribution campagne enregistrée.', { sourceAdapter: currentAdapter() })
  }

  if (kind === 'record-referral') {
    const form = await openForm('Enregistrer la source referral', 'La terminologie canonique de réseau terrain est Ambassadors.', [
      { name: 'sourceType', label: 'Type', type: 'select', options: [{ value: 'ambassador', label: 'Ambassador' }, { value: 'partner', label: 'Partenaire' }, { value: 'employee', label: 'Employé' }, { value: 'customer', label: 'Client' }, { value: 'professional', label: 'Professionnel' }, { value: 'event', label: 'Événement' }, { value: 'campaign', label: 'Campagne' }, { value: 'organic', label: 'Organique' }, { value: 'google_maps', label: 'Google Maps' }, { value: 'institutional', label: 'Institutionnel' }, { value: 'other', label: 'Autre' }] },
      { name: 'sourceName', label: 'Nom de la source', required: true },
      { name: 'isPrimary', label: 'Source principale', type: 'checkbox', value: true },
    ])
    if (!form) return
    return run('b2b.referral_source.record', { prospectId: account?.id, opportunityId: opp.id, ...form, evidence: { sourceUrl: state.context?.url || null } }, 'Source referral enregistrée.', { sourceAdapter: currentAdapter() })
  }
}

const runtime: ModuleRuntime = {
  mount(container, module) {
    root = container
    moduleRef = module
    const first: ViewKey = managementMode() ? 'ai_director' : 'recognition'
    state = { activeDomain: 'account', activeView: first, execution: {}, workspaceSession: null }
    render()
    unsubscribeWorkspace = subscribeWorkspaceSession((session) => {
      if (!root || !session?.prospectId || session.prospectId === state.workspaceSession?.prospectId) return
      state.workspaceSession = session
      state.execution.prospect = { id: session.prospectId, name: session.accountName || 'Compte B2B' }
      state.execution.opportunity = session.opportunityId ? { id: session.opportunityId } : undefined
      state.stale = true
      void hydrateWorkspace(true)
    })
    runtimeMessageListener = (message: any) => {
      if (message?.type === 'ANGELCARE_WORKSPACE_INVALIDATE' && prospect()?.id) {
        state.stale = true
        render()
        if (document.visibilityState === 'visible') void hydrateWorkspace(true)
      }
    }
    chrome.runtime.onMessage.addListener(runtimeMessageListener)
    commandKeyListener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        state.paletteOpen = !state.paletteOpen
        render()
        if (state.paletteOpen) window.setTimeout(() => (document.getElementById('command-palette-query') as HTMLInputElement | null)?.focus(), 20)
      }
      if (event.key === 'Escape' && state.paletteOpen) {
        state.paletteOpen = false
        render()
      }
    }
    window.addEventListener('keydown', commandKeyListener)
    refreshTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') { if (prospect()?.id) void hydrateWorkspace(true); if (managementMode()) void hydrateManagementWorkspace(true) }
    }, 30000)
    void restoreWorkspace().then(() => {
      if (managementMode()) void hydrateManagementWorkspace(true)
      if (!prospect()?.id && !managementMode() && sub('today') && cap('extension.b2b.daily_revenue_command')) {
        state.activeDomain = 'execute'
        state.activeView = 'today'
        render()
        void loadToday()
      }
    })
  },
  unmount() {
    if (hydrateTimer != null) window.clearTimeout(hydrateTimer)
    if (refreshTimer != null) window.clearInterval(refreshTimer)
    hydrateTimer = null
    refreshTimer = null
    unsubscribeWorkspace?.()
    unsubscribeWorkspace = null
    if (runtimeMessageListener) chrome.runtime.onMessage.removeListener(runtimeMessageListener)
    runtimeMessageListener = null
    if (commandKeyListener) window.removeEventListener('keydown', commandKeyListener)
    commandKeyListener = null
    root = null
    moduleRef = null
    document.querySelectorAll('.b2b-modal-backdrop').forEach((node) => node.remove())
  },
}

export default runtime
