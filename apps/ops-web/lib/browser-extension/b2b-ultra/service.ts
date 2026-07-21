import { doctrineFor } from './doctrines'
import { runGovernedRevenueAI, type GovernedFinding } from './ai-provider'

type Input = { db: any; actor: any; device: any; access: any; commandKey: string; payload: any }
type Diagnostic = { table: string; ok: boolean; error?: string | null; count?: number }

const now = () => new Date().toISOString()
const norm = (value: unknown) => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const uuid = (value: unknown) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''))
const day = (value: unknown) => value ? new Date(String(value)).getTime() : 0
const fail = (message: string, status = 400, details?: any) => Object.assign(new Error(message), { status, details })
const ilikeLiteral = (value: unknown) => String(value || '').replace(/[\%_]/g, (match) => `\${match}`).slice(0, 300)

async function safeRows(db: any, table: string, build?: (query: any) => any): Promise<{ rows: any[]; diagnostic: Diagnostic }> {
  try {
    let query = db.from(table).select('*')
    if (build) query = build(query)
    const { data, error } = await query
    if (error) return { rows: [], diagnostic: { table, ok: false, error: String(error.message || error.code || error) } }
    return { rows: Array.isArray(data) ? data : data ? [data] : [], diagnostic: { table, ok: true, count: Array.isArray(data) ? data.length : data ? 1 : 0 } }
  } catch (error) {
    return { rows: [], diagnostic: { table, ok: false, error: error instanceof Error ? error.message : String(error) } }
  }
}

function scopeAllows(access: any, actor: any, row: any) {
  const scopes = Array.isArray(access?.scopes) ? access.scopes : []
  if (!scopes.length) return row.assigned_owner_id === actor.id || row.owner_id === actor.id || row.sales_owner_id === actor.id || row.operational_owner_id === actor.id || row.user_id === actor.id || row.created_by === actor.id || row.assigned_to === actor.id
  const broad = scopes.some((scope: any) => ['all','team','territory','vertical'].includes(String(scope.scope_type || scope.data_scope || scope.scope_key || '').toLowerCase()))
  if (broad) return true
  return row.assigned_owner_id === actor.id || row.owner_id === actor.id || row.sales_owner_id === actor.id || row.operational_owner_id === actor.id || row.user_id === actor.id || row.created_by === actor.id || row.assigned_to === actor.id
}

function accountShape(row: any, source: string, prospectId?: string | null) {
  const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata : {}
  return {
    prospectId: prospectId || row.prospect_id || (source === 'b2b_prospects' ? row.id : null),
    source,
    sourceId: row.id,
    name: row.name || row.account_name || row.company || row.partner_name || 'Organisation sans nom',
    legalName: row.legal_name || metadata.legal_name || null,
    parentName: metadata.parent_name || metadata.parentName || null,
    branchName: metadata.branch_name || metadata.branchName || null,
    metadata,
    website: row.website || metadata.website || null,
    domain: row.normalized_domain || metadata.domain || null,
    phone: row.phone || null,
    email: row.email || null,
    city: row.city || row.territory || null,
    address: row.address || metadata.address || null,
    sector: row.sector || row.segment || row.account_type || row.partner_type || null,
    ownerId: row.assigned_owner_id || row.owner_id || null,
    ownerName: row.owner_name || row.owner || null,
    status: row.status || row.stage || 'active',
    priority: row.priority_score || row.priority || null,
    nextAction: row.next_action || null,
    nextActionAt: row.next_follow_up_at || row.next_action_at || null,
    updatedAt: row.updated_at || row.created_at || null,
    bridgeRequired: !prospectId && source !== 'b2b_prospects',
  }
}

function accountKey(row: any) {
  const domain = norm(row.domain || row.website).replace(/^https? www /, '')
  const phone = String(row.phone || '').replace(/\D/g, '').slice(-9)
  return domain || phone || `${norm(row.name)}|${norm(row.city)}`
}

function dedupeAccounts(rows: any[]) {
  const map = new Map<string, any>()
  for (const row of rows) {
    const key = accountKey(row)
    const current = map.get(key)
    if (!current || (!current.prospectId && row.prospectId) || day(row.updatedAt) > day(current.updatedAt)) map.set(key, row)
  }
  return [...map.values()]
}

function textMatch(account: any, query: string) {
  if (!query) return true
  const haystack = norm([account.name, account.legalName, account.website, account.domain, account.phone, account.email, account.city, account.address, account.sector, account.ownerName].filter(Boolean).join(' '))
  return query.split(/\s+/).every((token) => haystack.includes(token))
}

async function launchpad(input: Input) {
  const q = norm(input.payload?.query)
  const diagnostics: Diagnostic[] = []
  const [browser, maps, revenueAccounts, revenueProspects, revenuePartners, opportunities, revenueOpportunities, partners, b2bContacts, revenueContacts, renewals, contexts] = await Promise.all([
    safeRows(input.db, 'b2b_prospects', (query) => query.is('archived_at', null).order('updated_at', { ascending: false }).limit(1000)),
    safeRows(input.db, 'browser_extension_ultra_commercial_id_map', (query) => query.eq('status', 'active').limit(5000)),
    safeRows(input.db, 'revenue_accounts', (query) => query.order('updated_at', { ascending: false }).limit(1000)),
    safeRows(input.db, 'revenue_prospects', (query) => query.eq('status', 'active').order('updated_at', { ascending: false }).limit(1000)),
    safeRows(input.db, 'revenue_partnerships', (query) => query.eq('status', 'active').order('updated_at', { ascending: false }).limit(500)),
    safeRows(input.db, 'browser_extension_b2b_opportunities', (query) => query.order('updated_at', { ascending: false }).limit(1000)),
    safeRows(input.db, 'revenue_opportunities', (query) => query.order('updated_at', { ascending: false }).limit(1000)),
    safeRows(input.db, 'browser_extension_b2b_partners', (query) => query.order('updated_at', { ascending: false }).limit(1000)),
    safeRows(input.db, 'b2b_contacts', (query) => query.order('updated_at', { ascending: false }).limit(2000)),
    safeRows(input.db, 'revenue_contacts', (query) => query.order('updated_at', { ascending: false }).limit(2000)),
    safeRows(input.db, 'browser_extension_b2b_renewal_plans', (query) => query.order('updated_at', { ascending: false }).limit(1000)),
    safeRows(input.db, 'browser_extension_ultra_contexts', (query) => query.eq('user_id', input.actor.id).order('updated_at', { ascending: false }).limit(100)),
  ])
  diagnostics.push(browser.diagnostic, maps.diagnostic, revenueAccounts.diagnostic, revenueProspects.diagnostic, revenuePartners.diagnostic, opportunities.diagnostic, revenueOpportunities.diagnostic, partners.diagnostic, b2bContacts.diagnostic, revenueContacts.diagnostic, renewals.diagnostic, contexts.diagnostic)
  const mappingRows = maps.rows.filter((row: any) => row.status === 'active')
  const mapping = new Map(mappingRows.map((row: any) => [`${row.source_table}:${row.source_id}`, row.target_prospect_id || row.canonical_prospect_id || null]))
  const accounts = dedupeAccounts([
    ...browser.rows.filter((row) => scopeAllows(input.access, input.actor, row)).map((row) => accountShape(row, 'b2b_prospects', row.id)),
    ...revenueAccounts.rows.filter((row) => scopeAllows(input.access, input.actor, row)).map((row) => accountShape(row, 'revenue_accounts', mapping.get(`revenue_accounts:${row.id}`))),
    ...revenueProspects.rows.filter((row) => scopeAllows(input.access, input.actor, row)).map((row) => accountShape(row, 'revenue_prospects', mapping.get(`revenue_prospects:${row.id}`))),
    ...revenuePartners.rows.filter((row) => scopeAllows(input.access, input.actor, row)).map((row) => accountShape(row, 'revenue_partnerships', mapping.get(`revenue_partnerships:${row.id}`))),
  ])
  const oppByProspect = new Map<string, any[]>()
  for (const row of opportunities.rows.filter((row) => scopeAllows(input.access, input.actor, row))) {
    const list = oppByProspect.get(String(row.prospect_id)) || []
    list.push({ ...row, source: 'browser_extension_b2b_opportunities' }); oppByProspect.set(String(row.prospect_id), list)
  }
  for (const row of revenueOpportunities.rows.filter((row) => scopeAllows(input.access, input.actor, row))) {
    const targetProspect = mapping.get(`revenue_opportunities:${row.id}`) || mapping.get(`revenue_prospects:${row.prospect_id}`) || mapping.get(`revenue_accounts:${row.account_id}`)
    if (!targetProspect) continue
    const list = oppByProspect.get(String(targetProspect)) || []
    list.push({ ...row, source: 'revenue_opportunities', historicalSourceId: row.id }); oppByProspect.set(String(targetProspect), list)
  }
  const partnerByProspect = new Map<string, any>()
  for (const row of partners.rows.filter((row) => scopeAllows(input.access, input.actor, row))) partnerByProspect.set(String(row.prospect_id), row)
  const contactsByProspect = new Map<string, any[]>()
  const attachContact = (prospectId: unknown, row: any, source: string) => {
    if (!prospectId) return
    const list = contactsByProspect.get(String(prospectId)) || []
    list.push({ id: row.id, source, name: row.name || row.full_name || row.contact_name, role: row.role || row.role_title || row.decision_role, department: row.department, email: row.email, phone: row.phone || row.whatsapp, verification: row.verification_state || row.validation_status || 'unverified' })
    contactsByProspect.set(String(prospectId), list)
  }
  for (const row of b2bContacts.rows) attachContact(row.prospect_id, row, 'b2b_contacts')
  for (const row of revenueContacts.rows) attachContact(mapping.get(`revenue_accounts:${row.account_id}`), row, 'revenue_contacts')
  const renewalByProspect = new Map<string, any[]>()
  for (const row of renewals.rows) {
    const list = renewalByProspect.get(String(row.prospect_id)) || []
    list.push(row); renewalByProspect.set(String(row.prospect_id), list)
  }
  const contextByProspect = new Map(contexts.rows.filter((row: any) => row.active_account_id).map((row: any) => [String(row.active_account_id), row]))
  const hydrated = accounts.map((account) => {
    const opps = account.prospectId ? oppByProspect.get(String(account.prospectId)) || [] : []
    const activeOpportunity = opps.find((row: any) => row.status === 'active' || row.status === 'open') || opps[0] || null
    const partner = account.prospectId ? partnerByProspect.get(String(account.prospectId)) || null : null
    const contacts = account.prospectId ? contactsByProspect.get(String(account.prospectId)) || [] : []
    const renewalRows = account.prospectId ? renewalByProspect.get(String(account.prospectId)) || [] : []
    const context = account.prospectId ? contextByProspect.get(String(account.prospectId)) || null : null
    const stale = !account.updatedAt || Date.now() - day(account.updatedAt) > 30 * 86400000
    const followupRequired = Boolean(account.nextActionAt && day(account.nextActionAt) < Date.now()) || Boolean(activeOpportunity?.next_action_due_at && day(activeOpportunity.next_action_due_at) < Date.now())
    const parentBranch = [account.parentName, account.branchName, account.metadata?.parent_name, account.metadata?.branch_name].filter(Boolean)
    return {
      ...account,
      contacts,
      opportunities: opps.slice(0, 20),
      activeOpportunity,
      partner,
      renewals: renewalRows,
      pinned: Boolean(context?.metadata?.pinned),
      lastOpenedAt: context?.updated_at || null,
      stale,
      followupRequired,
      revenueRisk: ['at_risk','blocked','stalled'].includes(String(activeOpportunity?.forecast_category || activeOpportunity?.status || '').toLowerCase()),
      searchText: [contacts.map((row) => [row.name,row.role,row.email,row.phone].filter(Boolean).join(' ')).join(' '), opps.map((row: any) => row.title).join(' '), partner?.commercial_name, partner?.legal_name, renewalRows.map((row: any) => row.status).join(' '), ...parentBranch].join(' '),
    }
  }).filter((row) => textMatch({ ...row, ownerName: `${row.ownerName || ''} ${row.searchText || ''}` }, q))
  const recent = [...hydrated].sort((a, b) => day(b.lastOpenedAt || b.updatedAt) - day(a.lastOpenedAt || a.updatedAt)).slice(0, 20)
  return {
    generatedAt: now(),
    query: input.payload?.query || '',
    accounts: hydrated.slice(0, Math.min(Number(input.payload?.limit || 120), 500)),
    lists: {
      recent,
      myAccounts: hydrated.filter((row) => row.ownerId === input.actor.id).slice(0, 30),
      strategic: hydrated.filter((row) => ['A','critical','strategic','high'].includes(String(row.priority))).slice(0, 30),
      followupRequired: hydrated.filter((row) => row.followupRequired).slice(0, 30),
      activeOpportunities: hydrated.filter((row) => row.activeOpportunity).slice(0, 30),
      activePartners: hydrated.filter((row) => row.partner).slice(0, 30),
      stale: hydrated.filter((row) => row.stale).slice(0, 30),
      renewals: hydrated.filter((row) => row.renewals.length).slice(0, 30),
      revenueRisk: hydrated.filter((row) => row.revenueRisk).slice(0, 30),
      pinned: hydrated.filter((row) => row.pinned).slice(0, 30),
      bridgeRequired: hydrated.filter((row) => row.bridgeRequired).slice(0, 30),
    },
    summary: {
      authorizedAccounts: hydrated.length,
      usableAccounts: hydrated.filter((row) => row.prospectId).length,
      bridgeRequired: hydrated.filter((row) => row.bridgeRequired).length,
      activeOpportunities: hydrated.filter((row) => row.activeOpportunity).length,
      activePartners: hydrated.filter((row) => row.partner).length,
      followupRequired: hydrated.filter((row) => row.followupRequired).length,
      renewals: hydrated.filter((row) => row.renewals.length).length,
      pinned: hydrated.filter((row) => row.pinned).length,
    },
    diagnostics,
  }
}

async function scopedAccount(input: Input, prospectId: string) {
  const { data, error } = await input.db.from('b2b_prospects').select('*').eq('id', prospectId).is('archived_at', null).maybeSingle()
  if (error || !data) throw fail('ACCOUNT_NOT_FOUND', 404, error)
  if (!scopeAllows(input.access, input.actor, data)) throw fail('ACCOUNT_SCOPE_DENIED', 403)
  return data
}

async function assertRelated(input: Input, table: string, id: unknown, prospectId: string, label: string) {
  if (!id) return null
  if (!uuid(id)) throw fail(`INVALID_${label}_ID`)
  const { data, error } = await input.db.from(table).select('*').eq('id', id).maybeSingle()
  if (error || !data) throw fail(`${label}_NOT_FOUND`, 404, error)
  if (data.prospect_id && String(data.prospect_id) !== prospectId) throw fail(`${label}_ACCOUNT_MISMATCH`, 409)
  return data
}

async function setContext(input: Input) {
  const p = input.payload || {}
  const prospectId = String(p.activeAccountId || p.prospectId || '')
  if (!uuid(prospectId)) throw fail('INVALID_ACTIVE_ACCOUNT_ID')
  const account = await scopedAccount(input, prospectId)
  const [opportunity, contact, partner] = await Promise.all([
    assertRelated(input, 'browser_extension_b2b_opportunities', p.activeOpportunityId || p.opportunityId, prospectId, 'OPPORTUNITY'),
    assertRelated(input, 'b2b_contacts', p.activeContactId, prospectId, 'CONTACT'),
    assertRelated(input, 'browser_extension_b2b_partners', p.activePartnerId, prospectId, 'PARTNER'),
  ])
  for (const [key, value] of Object.entries({ activeContractId: p.activeContractId, activeSiteId: p.activeSiteId, activeMeetingId: p.activeMeetingId, activeProposalId: p.activeProposalId, activeIssueId: p.activeIssueId, activeRenewalId: p.activeRenewalId, activeScanSessionId: p.activeScanSessionId })) if (value && !uuid(value)) throw fail(`INVALID_${key.replace(/^active/,'').replace(/Id$/,'').toUpperCase()}_ID`)
  const { data: existing } = await input.db.from('browser_extension_ultra_contexts').select('*').eq('user_id', input.actor.id).eq('device_id', input.device.id).maybeSingle()
  const accountChanged = existing?.active_account_id && String(existing.active_account_id) !== prospectId
  const safeUrl = p.sourceUrl && /^https?:\/\//i.test(String(p.sourceUrl)) ? String(p.sourceUrl).slice(0, 3000) : null
  const row = {
    user_id: input.actor.id,
    device_id: input.device.id,
    active_account_id: prospectId,
    active_opportunity_id: opportunity?.id || (!accountChanged ? existing?.active_opportunity_id : null),
    active_contact_id: contact?.id || (!accountChanged ? existing?.active_contact_id : null),
    active_partner_id: partner?.id || (!accountChanged ? existing?.active_partner_id : null),
    active_contract_id: p.activeContractId || (!accountChanged ? existing?.active_contract_id : null),
    active_site_id: p.activeSiteId || (!accountChanged ? existing?.active_site_id : null),
    active_meeting_id: p.activeMeetingId || (!accountChanged ? existing?.active_meeting_id : null),
    active_proposal_id: p.activeProposalId || (!accountChanged ? existing?.active_proposal_id : null),
    active_issue_id: p.activeIssueId || (!accountChanged ? existing?.active_issue_id : null),
    active_renewal_id: p.activeRenewalId || (!accountChanged ? existing?.active_renewal_id : null),
    active_scan_session_id: p.activeScanSessionId || (!accountChanged ? existing?.active_scan_session_id : null),
    source_url: safeUrl,
    source_adapter: p.sourceAdapter ? String(p.sourceAdapter).slice(0, 120) : null,
    context_version: Number(existing?.context_version || 0) + 1,
    last_transition: String(p.lastTransition || (accountChanged ? 'account_switched' : 'context_updated')).slice(0, 160),
    metadata: { ...(existing?.metadata || {}), ...(p.metadata || {}), accountName: account.name },
    updated_at: now(),
  }
  const { data, error } = await input.db.from('browser_extension_ultra_contexts').upsert(row, { onConflict: 'user_id,device_id' }).select('*').single()
  if (error) throw fail('ULTRA_CONTEXT_PERSIST_FAILED', 500, error)
  return { context: data, invalidatedDependentContext: Boolean(accountChanged) }
}

async function readContext(input: Input) {
  const { data, error } = await input.db.from('browser_extension_ultra_contexts').select('*').eq('user_id', input.actor.id).eq('device_id', input.device.id).maybeSingle()
  if (error) throw fail('ULTRA_CONTEXT_READ_FAILED', 500, error)
  if (!data?.active_account_id) return { context: data || null }
  try { await scopedAccount(input, String(data.active_account_id)); return { context: data } }
  catch (contextError: any) {
    await input.db.from('browser_extension_ultra_contexts').delete().eq('id', data.id)
    return { context: null, invalidated: true, reason: contextError?.message || 'ACCOUNT_SCOPE_INVALIDATED' }
  }
}

const journeyDefinitions = {
  prospect: ['Detected','Duplicate decision','Account confirmed','Evidence reviewed','Enrichment','Contacts','Buying committee','Score','Plan','Opportunity','First action'],
  opportunity: ['Qualification','Stakeholders','Outreach','Discovery','Meeting','Need','Solution','Proposal','Pricing approval','Negotiation','Closing gates','Payment'],
  partner: ['Handoff','Acceptance','Onboarding','Activation','First service','Hypercare','Performance','Issues','Growth','Renewal'],
}

async function journey(input: Input) {
  const prospectId = input.payload?.prospectId || input.payload?.activeAccountId
  if (!uuid(prospectId)) throw fail('PROSPECT_ID_REQUIRED')
  const diagnostics: Diagnostic[] = []
  const tables: Array<[string, string]> = [
    ['browser_extension_b2b_evidence','evidence'], ['b2b_contacts','contacts'], ['browser_extension_b2b_buying_committee','committee'],
    ['browser_extension_b2b_score_snapshots','scores'], ['browser_extension_b2b_account_plans','plans'], ['browser_extension_b2b_opportunities','opportunities'],
    ['browser_extension_b2b_next_best_actions','actions'], ['browser_extension_b2b_communication_drafts','communications'], ['browser_extension_b2b_meeting_outcomes','meetings'],
    ['browser_extension_b2b_proposal_versions','proposals'], ['browser_extension_b2b_pricing_calculations','pricing'], ['browser_extension_b2b_negotiation_rooms','negotiation'],
    ['browser_extension_b2b_closing_readiness','closing'], ['browser_extension_b2b_payment_gates','payments'], ['browser_extension_b2b_handoffs','handoffs'],
    ['browser_extension_b2b_partners','partners'], ['browser_extension_b2b_partner_activations','activations'], ['browser_extension_b2b_partner_performance_snapshots','performance'],
    ['browser_extension_b2b_partner_issues','issues'], ['browser_extension_b2b_growth_plans','growth'], ['browser_extension_b2b_renewal_plans','renewals'],
  ]
  const result: Record<string, any[]> = {}
  await Promise.all(tables.map(async ([table, key]) => {
    const response = await safeRows(input.db, table, (query) => query.eq('prospect_id', prospectId).order('created_at', { ascending: false }).limit(200))
    diagnostics.push(response.diagnostic); result[key] = response.rows
  }))
  const opp = result.opportunities?.find((row: any) => row.status === 'active') || result.opportunities?.[0] || null
  const prospectChecks = [true, true, true, result.evidence.length > 0, true, result.contacts.length > 0, result.committee.length > 0, result.scores.length > 0, result.plans.length > 0, Boolean(opp), result.actions.length > 0]
  const opportunityChecks = [Boolean(opp), result.committee.length > 0, result.communications.length > 0, result.meetings.length > 0, result.meetings.length > 0, result.meetings.length > 0, result.proposals.length > 0, result.proposals.length > 0, result.pricing.some((row: any) => ['approved','within_guardrail'].includes(String(row.margin_status || row.status))), result.negotiation.length > 0, result.closing.some((row: any) => Number(row.score || 0) >= 80), result.payments.some((row: any) => ['verified','cleared'].includes(String(row.status))) ]
  const partnerChecks = [result.handoffs.length > 0, result.handoffs.some((row: any) => ['accepted','approved'].includes(String(row.status))), result.partners.length > 0, result.activations.some((row: any) => ['approved','active','launched'].includes(String(row.status || row.activation_status))), result.performance.length > 0, result.performance.length > 0, result.performance.length > 0, result.issues.length > 0, result.growth.length > 0, result.renewals.length > 0]
  const build = (name: keyof typeof journeyDefinitions, checks: boolean[]) => journeyDefinitions[name].map((label, index) => ({ index: index + 1, label, complete: Boolean(checks[index]), current: !checks[index] && checks.slice(0, index).every(Boolean), blocker: !checks[index] ? `Missing prerequisite: ${label}` : null }))
  const journeys = { prospect: build('prospect', prospectChecks), opportunity: build('opportunity', opportunityChecks), partner: build('partner', partnerChecks) }
  const active = opp ? 'opportunity' : result.partners.length ? 'partner' : 'prospect'
  const current = journeys[active as keyof typeof journeys].find((step) => step.current) || journeys[active as keyof typeof journeys].at(-1)
  return { prospectId, activeJourney: active, currentStep: current, journeys, blockers: Object.values(journeys).flat().filter((step: any) => step.current || (!step.complete && step.index <= 3)).slice(0, 8), counts: Object.fromEntries(Object.entries(result).map(([key, rows]) => [key, rows.length])), diagnostics, generatedAt: now() }
}

const timelineTables: Array<[string, string, string]> = [
  ['browser_extension_b2b_evidence','evidence','created_at'], ['b2b_contacts','contact','created_at'], ['browser_extension_b2b_next_best_actions','task','created_at'],
  ['browser_extension_b2b_communication_drafts','communication','created_at'], ['browser_extension_b2b_call_briefs','call','created_at'], ['browser_extension_b2b_meeting_outcomes','meeting','created_at'],
  ['browser_extension_b2b_opportunity_stage_history','opportunity_stage','changed_at'], ['browser_extension_b2b_proposal_versions','proposal','created_at'], ['browser_extension_b2b_pricing_calculations','pricing','created_at'],
  ['browser_extension_b2b_negotiation_events','negotiation','created_at'], ['browser_extension_b2b_contract_requirements','contract','created_at'], ['browser_extension_b2b_payment_gates','payment','created_at'],
  ['browser_extension_b2b_handoffs','handoff','created_at'], ['browser_extension_b2b_partner_activations','activation','created_at'], ['browser_extension_b2b_partner_performance_snapshots','partner_performance','created_at'],
  ['browser_extension_b2b_partner_issues','issue','created_at'], ['browser_extension_b2b_growth_plans','growth','created_at'], ['browser_extension_b2b_renewal_plans','renewal','created_at'],
  ['browser_extension_b2b_management_interventions','management','created_at'], ['b2b_activities','saas_activity','created_at'],
]

function timelineLabel(type: string, row: any) {
  return row.title || row.label || row.subject || row.proposal_title || row.summary?.title || row.action_type || row.evidence_type || row.status || type.replaceAll('_', ' ')
}

async function timeline(input: Input) {
  const prospectId = input.payload?.prospectId || input.payload?.activeAccountId
  if (!uuid(prospectId)) throw fail('PROSPECT_ID_REQUIRED')
  const diagnostics: Diagnostic[] = []
  const events: any[] = []
  await Promise.all(timelineTables.map(async ([table, type, dateField]) => {
    const response = await safeRows(input.db, table, (query) => query.eq('prospect_id', prospectId).order(dateField, { ascending: false }).limit(100))
    diagnostics.push(response.diagnostic)
    for (const row of response.rows) events.push({ id: row.id, type, at: row[dateField] || row.updated_at || row.created_at, title: timelineLabel(type, row), status: row.status || row.validation_status || null, evidenceBound: type === 'evidence' || Boolean(row.evidence || row.evidence_id || row.evidence_ids), sourceTable: table, payload: row })
  }))

  // Read historical Revenue Command records through the canonical bridge instead of copying them into a second CRM.
  const mapResponse = await safeRows(input.db, 'browser_extension_ultra_commercial_id_map', (query) => query.eq('target_prospect_id', prospectId).eq('status', 'active').limit(500))
  diagnostics.push(mapResponse.diagnostic)
  const sourceIds = (table: string) => mapResponse.rows.filter((row: any) => row.source_table === table).map((row: any) => row.source_id).filter(Boolean)
  const revenueProspectIds = sourceIds('revenue_prospects')
  const revenueAccountIds = sourceIds('revenue_accounts')
  const revenueOpportunityIds = sourceIds('revenue_opportunities')
  const addLegacy = async (table: string, type: string, dateField: string, build: (query: any) => any) => {
    const response = await safeRows(input.db, table, build)
    diagnostics.push(response.diagnostic)
    for (const row of response.rows) events.push({ id: row.id, type, at: row[dateField] || row.updated_at || row.created_at, title: timelineLabel(type, row), status: row.status || null, evidenceBound: false, sourceTable: table, historical: true, payload: row })
  }
  const legacyReads: Promise<void>[] = []
  if (revenueProspectIds.length) {
    legacyReads.push(addLegacy('revenue_tasks', 'legacy_task', 'created_at', (query) => query.in('prospect_id', revenueProspectIds).order('created_at', { ascending: false }).limit(100)))
    legacyReads.push(addLegacy('revenue_appointments', 'legacy_meeting', 'created_at', (query) => query.in('prospect_id', revenueProspectIds).order('created_at', { ascending: false }).limit(100)))
    legacyReads.push(addLegacy('revenue_activities', 'legacy_activity', 'created_at', (query) => query.in('prospect_id', revenueProspectIds).order('created_at', { ascending: false }).limit(100)))
    legacyReads.push(addLegacy('revenue_partnerships', 'legacy_partnership', 'created_at', (query) => query.in('prospect_id', revenueProspectIds).order('created_at', { ascending: false }).limit(100)))
  }
  if (revenueAccountIds.length) legacyReads.push(addLegacy('revenue_contacts', 'legacy_contact', 'created_at', (query) => query.in('account_id', revenueAccountIds).order('created_at', { ascending: false }).limit(100)))
  if (revenueOpportunityIds.length) legacyReads.push(addLegacy('revenue_opportunities', 'legacy_opportunity', 'created_at', (query) => query.in('id', revenueOpportunityIds).order('created_at', { ascending: false }).limit(100)))
  await Promise.all(legacyReads)
  events.sort((a, b) => day(b.at) - day(a.at))
  return { prospectId, events: events.slice(0, Math.min(Number(input.payload?.limit || 300), 1000)), diagnostics, generatedAt: now() }
}

function issue(key: string, category: string, severity: string, title: string, details: any, suggestedCorrection: string) {
  return { issueKey: key, category, severity, title, details, suggestedCorrection }
}

async function scanQuality(input: Input) {
  const prospectId = input.payload?.prospectId || input.payload?.activeAccountId || null
  const diagnostics: Diagnostic[] = []
  const browser = await safeRows(input.db, 'b2b_prospects', (query) => prospectId ? query.eq('id', prospectId).limit(1) : query.is('archived_at', null).limit(1000))
  diagnostics.push(browser.diagnostic)
  const contacts = await safeRows(input.db, 'b2b_contacts', (query) => prospectId ? query.eq('prospect_id', prospectId).limit(500) : query.limit(1000))
  const committee = await safeRows(input.db, 'browser_extension_b2b_buying_committee', (query) => prospectId ? query.eq('prospect_id', prospectId).limit(500) : query.limit(1000))
  const opportunities = await safeRows(input.db, 'browser_extension_b2b_opportunities', (query) => prospectId ? query.eq('prospect_id', prospectId).limit(500) : query.limit(1000))
  const payment = await safeRows(input.db, 'browser_extension_b2b_payment_gates', (query) => prospectId ? query.eq('prospect_id', prospectId).limit(500) : query.limit(1000))
  const partners = await safeRows(input.db, 'browser_extension_b2b_partners', (query) => prospectId ? query.eq('prospect_id', prospectId).limit(500) : query.limit(1000))
  const renewals = await safeRows(input.db, 'browser_extension_b2b_renewal_plans', (query) => prospectId ? query.eq('prospect_id', prospectId).limit(500) : query.limit(1000))
  diagnostics.push(contacts.diagnostic, committee.diagnostic, opportunities.diagnostic, payment.diagnostic, partners.diagnostic, renewals.diagnostic)
  const issues: any[] = []
  const seen = new Map<string, any>()
  for (const row of browser.rows) {
    const key = `${norm(row.website).replace(/^https? www /, '') || norm(row.name)}|${norm(row.city)}`
    if (seen.has(key)) issues.push(issue(`duplicate:${seen.get(key).id}:${row.id}`, 'duplicate', 'critical', `Doublon probable: ${row.name}`, { records: [seen.get(key).id, row.id], signals: ['normalized name/domain','city'] }, 'Review and merge or classify as a distinct branch.'))
    else seen.set(key, row)
    if (!row.assigned_owner_id) issues.push(issue(`owner:${row.id}`, 'missing_owner', 'high', `Owner manquant: ${row.name}`, { prospectId: row.id }, 'Assign an accountable commercial owner.'))
    if (!row.city) issues.push(issue(`territory:${row.id}`, 'missing_territory', 'high', `Territoire manquant: ${row.name}`, { prospectId: row.id }, 'Confirm city and territory before execution.'))
    if (!row.next_action && !row.next_follow_up_at) issues.push(issue(`next_action:${row.id}`, 'missing_next_action', 'high', `Aucune prochaine action: ${row.name}`, { prospectId: row.id }, 'Create a dated, outcome-oriented next action.'))
  }
  for (const row of contacts.rows) {
    const phone = String(row.phone || '').replace(/\D/g, '')
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(row.email))) issues.push(issue(`email:${row.id}`, 'invalid_contact', 'medium', `Email invalide: ${row.name || row.full_name || row.id}`, { contactId: row.id, value: row.email }, 'Correct or mark the email as unverified.'))
    if (row.phone && phone.length < 9) issues.push(issue(`phone:${row.id}`, 'invalid_contact', 'medium', `Téléphone invalide: ${row.name || row.full_name || row.id}`, { contactId: row.id, value: row.phone }, 'Correct or mark the number as unverified.'))
  }
  const committeeByProspect = new Set(committee.rows.map((row: any) => String(row.prospect_id)))
  for (const row of browser.rows) if (!committeeByProspect.has(String(row.id))) issues.push(issue(`committee:${row.id}`, 'missing_decision_maker', 'high', `Comité d’achat absent: ${row.name}`, { prospectId: row.id }, 'Create focused research missions for missing buying roles.'))
  const verifiedPayment = new Set(payment.rows.filter((row: any) => ['verified','cleared'].includes(String(row.status))).map((row: any) => String(row.opportunity_id)))
  for (const row of opportunities.rows) if (['won','closed_won'].includes(String(row.stage || row.status).toLowerCase()) && !verifiedPayment.has(String(row.id))) issues.push(issue(`false_won:${row.id}`, 'false_won', 'critical', `Won sans paiement vérifié: ${row.title || row.id}`, { opportunityId: row.id }, 'Reopen the gate or attach verified Finance evidence before won state.'))
  const partnerProspects = new Set(partners.rows.map((row: any) => String(row.prospect_id)))
  for (const row of partners.rows) if (!row.prospect_id) issues.push(issue(`partner_account:${row.id}`, 'partner_without_account', 'critical', `Partenaire sans compte canonique: ${row.commercial_name || row.id}`, { partnerId: row.id }, 'Map the partner to its canonical prospect/account.'))
  for (const row of renewals.rows) if (!row.contract_id) issues.push(issue(`renewal_contract:${row.id}`, 'renewal_without_contract', 'high', `Renouvellement sans contrat: ${row.id}`, { renewalId: row.id, prospectId: row.prospect_id }, 'Attach the authoritative contract before renewal approval.'))
  for (const row of browser.rows) if (partners.rows.length && !partnerProspects.has(String(row.id)) && String(row.status).toLowerCase().includes('partner')) issues.push(issue(`partner_missing:${row.id}`, 'partner_without_account', 'critical', `Statut partenaire sans Partner 360: ${row.name}`, { prospectId: row.id }, 'Complete commercial-to-operational handoff and create the canonical partner record.'))
  const stored: any[] = []
  for (const item of issues) {
    const row = { issue_key: item.issueKey, prospect_id: prospectId || item.details?.prospectId || null, category: item.category, severity: item.severity, title: item.title, details: item.details, suggested_correction: item.suggestedCorrection, owner_id: input.actor.id, status: 'open', detected_at: now(), updated_at: now() }
    const { data, error } = await input.db.from('browser_extension_ultra_data_quality_issues').upsert(row, { onConflict: 'issue_key' }).select('*').single()
    stored.push(error ? { ...row, persistenceError: error.message } : data)
  }
  return { scope: prospectId ? 'account' : 'authorized_portfolio', prospectId, issues: stored, summary: { total: stored.length, critical: stored.filter((row) => row.severity === 'critical').length, high: stored.filter((row) => row.severity === 'high').length, medium: stored.filter((row) => row.severity === 'medium').length }, diagnostics, generatedAt: now() }
}

async function resolveQuality(input: Input) {
  const issueId = input.payload?.issueId
  if (!uuid(issueId)) throw fail('ISSUE_ID_REQUIRED')
  const { data: current, error: readError } = await input.db.from('browser_extension_ultra_data_quality_issues').select('*').eq('id', issueId).single()
  if (readError || !current) throw fail('DATA_QUALITY_ISSUE_NOT_FOUND', 404, readError)
  const status = ['resolved','accepted_exception','dismissed'].includes(String(input.payload?.status)) ? input.payload.status : 'resolved'
  const { data, error } = await input.db.from('browser_extension_ultra_data_quality_issues').update({ status, resolution_notes: String(input.payload?.notes || '').slice(0, 3000), resolved_by: input.actor.id, resolved_at: now(), updated_at: now() }).eq('id', issueId).select('*').single()
  if (error) throw fail('DATA_QUALITY_RESOLUTION_FAILED', 500, error)
  await input.db.from('browser_extension_ultra_data_quality_history').insert({ issue_id: issueId, actor_id: input.actor.id, from_status: current.status, to_status: status, notes: input.payload?.notes || null, evidence: input.payload?.evidence || {}, created_at: now() })
  return { issue: data }
}

async function bridgeStatus(input: Input) {
  const [runs, mappings, conflicts] = await Promise.all([
    safeRows(input.db, 'browser_extension_ultra_bridge_runs', (query) => query.order('created_at', { ascending: false }).limit(20)),
    safeRows(input.db, 'browser_extension_ultra_commercial_id_map', (query) => query.limit(5000)),
    safeRows(input.db, 'browser_extension_ultra_bridge_conflicts', (query) => query.order('created_at', { ascending: false }).limit(500)),
  ])
  return { latestRun: runs.rows[0] || null, mappings: { total: mappings.rows.length, active: mappings.rows.filter((row) => row.status === 'active').length, review: mappings.rows.filter((row) => row.status === 'review').length }, conflicts: { total: conflicts.rows.length, unresolved: conflicts.rows.filter((row) => !['resolved','dismissed'].includes(String(row.status))).length, rows: conflicts.rows.slice(0, 100) }, diagnostics: [runs.diagnostic, mappings.diagnostic, conflicts.diagnostic], generatedAt: now() }
}

async function aiReason(input: Input) {
  const prospectId = input.payload?.prospectId || input.payload?.activeAccountId
  if (!uuid(prospectId)) throw fail('PROSPECT_ID_REQUIRED')
  const [accountR, evidenceR, committeeR, oppR] = await Promise.all([
    safeRows(input.db, 'b2b_prospects', (query) => query.eq('id', prospectId).limit(1)),
    safeRows(input.db, 'browser_extension_b2b_evidence', (query) => query.eq('prospect_id', prospectId).order('created_at', { ascending: false }).limit(150)),
    safeRows(input.db, 'browser_extension_b2b_buying_committee', (query) => query.eq('prospect_id', prospectId).limit(100)),
    safeRows(input.db, 'browser_extension_b2b_opportunities', (query) => query.eq('prospect_id', prospectId).order('updated_at', { ascending: false }).limit(50)),
  ])
  const account = accountR.rows[0]
  if (!account) throw fail('ACCOUNT_NOT_FOUND', 404)
  const doctrine = doctrineFor(account.sector || account.vertical)
  const evidence = evidenceR.rows.map((row: any, index: number) => ({ id: `E${index + 1}`, type: row.evidence_type || row.field_key || 'fact', value: String(row.observed_value || row.normalized_value || ''), sourceUrl: row.source_url || null, confidence: row.confidence || null, validationStatus: row.validation_status || null }))
  const missingRoles = doctrine.buyingRoles.filter((role) => !committeeR.rows.some((row: any) => String(row.role_key || row.decision_role) === role && row.status !== 'missing'))
  const activeOpp = oppR.rows.find((row: any) => row.status === 'active') || oppR.rows[0]
  const rules: GovernedFinding[] = []
  if (!evidence.length) rules.push({ classification: 'missing_information', title: 'Dossier sans preuve exploitable', rationale: 'Aucune preuve source n’est liée au compte. Toute recommandation commerciale avancée doit rester bloquée.', evidenceIds: [], confidence: 1, nextAction: 'Run a governed scan and validate evidence.' })
  if (missingRoles.length) rules.push({ classification: 'commercial_hypothesis', title: 'Couverture du comité d’achat incomplète', rationale: `${missingRoles.length} rôle(s) critique(s) restent à identifier: ${missingRoles.slice(0, 5).join(', ')}.`, evidenceIds: evidence.slice(0, 3).map((row) => row.id), confidence: evidence.length ? 0.72 : 0.45, nextAction: `Create research mission for ${missingRoles[0]}.` })
  if (!activeOpp) rules.push({ classification: 'commercial_hypothesis', title: 'Aucune opportunité active', rationale: `Le doctrine ${doctrine.label} propose ${doctrine.programs.slice(0, 3).join(', ')}, mais une qualification humaine doit confirmer le besoin et le budget.`, evidenceIds: evidence.slice(0, 5).map((row) => row.id), confidence: evidence.length ? 0.65 : 0.35, nextAction: 'Confirm one opportunity hypothesis and create a qualified opportunity.' })
  if (activeOpp && !activeOpp.next_action_due_at) rules.push({ classification: 'evidence_backed_inference', title: 'Opportunité sans prochaine action datée', rationale: 'Une opportunité active sans échéance ne peut pas être pilotée ni forecastée de manière fiable.', evidenceIds: evidence.slice(0, 3).map((row) => row.id), confidence: 0.9, nextAction: 'Create a dated next-best action.' })
  const result = await runGovernedRevenueAI({ objective: String(input.payload?.objective || 'Recommend the next governed commercial action'), account, doctrine, evidence, rulesFallback: rules })
  const { data, error } = await input.db.from('browser_extension_ultra_ai_runs').insert({ user_id: input.actor.id, device_id: input.device.id, prospect_id: prospectId, objective: input.payload?.objective || 'next_governed_action', mode: result.mode, provider: result.provider, model: result.model, configured: result.configured, used: result.used, warning: result.warning, evidence_ids: evidence.map((row) => row.id), request_snapshot: { account: { id: account.id, name: account.name, sector: account.sector }, doctrine: doctrine.key }, result_payload: result, created_at: now() }).select('*').single()
  if (error) throw fail('ULTRA_AI_RUN_PERSIST_FAILED', 500, error)
  return { run: data, result, doctrine, evidenceCount: evidence.length, truthBoundary: 'AI findings remain evidence-backed inferences or hypotheses until human verification.' }
}

async function partnerOperations(input: Input) {
  const prospectId = input.payload?.prospectId || input.payload?.activeAccountId
  if (!uuid(prospectId)) throw fail('PROSPECT_ID_REQUIRED')
  const account = await scopedAccount(input, String(prospectId))
  const partnerRows = await safeRows(input.db, 'browser_extension_b2b_partners', (query) => query.eq('prospect_id', prospectId).order('updated_at', { ascending: false }).limit(20))
  const partner = input.payload?.partnerId
    ? partnerRows.rows.find((row: any) => String(row.id) === String(input.payload.partnerId))
    : partnerRows.rows[0]
  if (input.payload?.partnerId && !partner) throw fail('PARTNER_ACCOUNT_MISMATCH', 409)
  const exactSourceIds = [partner?.id, prospectId].filter(Boolean).map(String)
  const diagnostics: Diagnostic[] = [partnerRows.diagnostic]
  const carelink = await safeRows(input.db, 'carelink_dispatch_assignments', (query) => query.in('source_id', exactSourceIds).order('updated_at', { ascending: false }).limit(100))
  diagnostics.push(carelink.diagnostic)

  // Name-based candidates remain explicitly unverified until a governed mapping is recorded.
  const name = ilikeLiteral(partner?.commercial_name || partner?.legal_name || account.name)
  const missions = name ? await safeRows(input.db, 'serviceos_missions', (query) => query.ilike('clientName', `%${name}%`).order('created_at', { ascending: false }).limit(100)) : { rows: [], diagnostic: { table: 'serviceos_missions', ok: true, count: 0 } }
  const invoices = name ? await safeRows(input.db, 'sales_invoices', (query) => query.ilike('client_name', `%${name}%`).order('created_at', { ascending: false }).limit(100)) : { rows: [], diagnostic: { table: 'sales_invoices', ok: true, count: 0 } }
  diagnostics.push(missions.diagnostic, invoices.diagnostic)
  const mappings = await safeRows(input.db, 'browser_extension_ultra_commercial_id_map', (query) => query.eq('target_prospect_id', prospectId).eq('entity_type', 'operations').eq('status', 'active').limit(200))
  diagnostics.push(mappings.diagnostic)
  return {
    prospectId,
    partner: partner || null,
    exactLinks: { carelinkDispatch: carelink.rows, governedMappings: mappings.rows },
    reviewCandidates: { serviceMissions: missions.rows, financeInvoices: invoices.rows },
    counts: { carelinkDispatch: carelink.rows.length, governedMappings: mappings.rows.length, serviceMissionCandidates: missions.rows.length, financeInvoiceCandidates: invoices.rows.length },
    diagnostics,
    truthBoundary: 'Exact source IDs and governed mappings are authoritative. Name-matched missions or invoices are review candidates only and are never silently attached or treated as verified delivery/payment evidence.',
    generatedAt: now(),
  }
}

async function report(input: Input) {
  const [launch, quality, bridge] = await Promise.all([launchpad({ ...input, payload: { limit: 500 } }), scanQuality({ ...input, payload: {} }), bridgeStatus(input)])
  const operations = input.payload?.prospectId ? await partnerOperations({ ...input, payload: { prospectId: input.payload.prospectId, partnerId: input.payload.partnerId } }) : null
  const type = String(input.payload?.reportType || 'daily_revenue_brief')
  const payload = { type, generatedAt: now(), portfolio: launch.summary, dataQuality: quality.summary, bridge: { mappings: bridge.mappings, conflicts: bridge.conflicts }, partnerOperations: operations?.counts || null, missingData: [...launch.diagnostics, ...quality.diagnostics, ...bridge.diagnostics, ...(operations?.diagnostics || [])].filter((row) => !row.ok), evidence: { launchpadGeneratedAt: launch.generatedAt, qualityGeneratedAt: quality.generatedAt, bridgeGeneratedAt: bridge.generatedAt, partnerOperationsGeneratedAt: operations?.generatedAt || null } }
  const { data, error } = await input.db.from('browser_extension_ultra_reports').insert({ report_type: type, user_id: input.actor.id, scope_type: input.payload?.scopeType || 'authorized_portfolio', scope_reference: input.payload?.scopeReference || null, version: 1, report_payload: payload, evidence: payload.evidence, missing_data: payload.missingData, created_at: now() }).select('*').single()
  if (error) throw fail('ULTRA_REPORT_PERSIST_FAILED', 500, error)
  return { report: data, payload }
}

const LOW_RISK_JOB_TYPES = new Set(['data_quality_scan','report_generate','stale_detection','renewal_milestone'])

async function schedulerStatus(input: Input) {
  const [control, schedules, jobs, runs] = await Promise.all([
    safeRows(input.db, 'browser_extension_ultra_scheduler_control', (query) => query.eq('singleton', true).limit(1)),
    safeRows(input.db, 'browser_extension_ultra_schedules', (query) => query.order('schedule_key').limit(100)),
    safeRows(input.db, 'browser_extension_ultra_jobs', (query) => query.order('created_at', { ascending: false }).limit(200)),
    safeRows(input.db, 'browser_extension_ultra_job_runs', (query) => query.order('started_at', { ascending: false }).limit(100)),
  ])
  return {
    control: control.rows[0] || { paused: true, kill_switch: true, reason: 'SCHEDULER_SCHEMA_NOT_AVAILABLE' },
    schedules: schedules.rows,
    queue: {
      queued: jobs.rows.filter((row) => row.status === 'queued').length,
      running: jobs.rows.filter((row) => row.status === 'running').length,
      failed: jobs.rows.filter((row) => row.status === 'failed').length,
      completed: jobs.rows.filter((row) => row.status === 'completed').length,
      recent: jobs.rows.slice(0, 50),
    },
    runs: runs.rows,
    diagnostics: [control.diagnostic, schedules.diagnostic, jobs.diagnostic, runs.diagnostic],
    generatedAt: now(),
  }
}

async function schedulerEnqueue(input: Input) {
  const jobType = String(input.payload?.jobType || '')
  if (!LOW_RISK_JOB_TYPES.has(jobType)) throw fail('UNSUPPORTED_OR_HIGH_RISK_JOB_TYPE', 403, { allowed: [...LOW_RISK_JOB_TYPES] })
  const idempotencyKey = String(input.payload?.idempotencyKey || '').trim().slice(0, 250)
  if (!idempotencyKey) throw fail('IDEMPOTENCY_KEY_REQUIRED')
  const runAt = input.payload?.runAt ? new Date(String(input.payload.runAt)).toISOString() : now()
  const payload = input.payload?.payload && typeof input.payload.payload === 'object' ? input.payload.payload : {}
  const { data, error } = await input.db.from('browser_extension_ultra_jobs').upsert({
    idempotency_key: idempotencyKey,
    job_type: jobType,
    payload: { ...payload, eventSource: input.payload?.eventSource || 'governed_command', evidenceIds: Array.isArray(input.payload?.evidenceIds) ? input.payload.evidenceIds.slice(0, 50) : [] },
    status: 'queued',
    priority: Math.max(1, Math.min(Number(input.payload?.priority || 100), 1000)),
    run_at: runAt,
    max_attempts: Math.max(1, Math.min(Number(input.payload?.maxAttempts || 5), 10)),
    updated_at: now(),
  }, { onConflict: 'idempotency_key', ignoreDuplicates: true }).select('*').maybeSingle()
  if (error) throw fail('ULTRA_SCHEDULER_ENQUEUE_FAILED', 500, error)
  return { job: data || null, replayed: !data, truthBoundary: 'Only low-risk internal work can be queued. External messaging and commercial commitments remain unsupported.' }
}

async function schedulerControl(input: Input) {
  const action = String(input.payload?.action || '')
  if (!['pause','resume','kill','clear_kill'].includes(action)) throw fail('INVALID_SCHEDULER_CONTROL_ACTION')
  if (action === 'clear_kill' && input.payload?.confirmation !== 'CLEAR_ULTRA_KILL_SWITCH') throw fail('CLEAR_KILL_CONFIRMATION_REQUIRED', 409)
  const patch: any = { updated_by: input.actor.id, updated_at: now(), reason: String(input.payload?.reason || action).slice(0, 1000) }
  if (action === 'pause') patch.paused = true
  if (action === 'resume') patch.paused = false
  if (action === 'kill') { patch.kill_switch = true; patch.paused = true }
  if (action === 'clear_kill') { patch.kill_switch = false; patch.paused = true }
  const { data, error } = await input.db.from('browser_extension_ultra_scheduler_control').update(patch).eq('singleton', true).select('*').single()
  if (error) throw fail('ULTRA_SCHEDULER_CONTROL_FAILED', 500, error)
  if (action === 'kill') await input.db.from('browser_extension_ultra_jobs').update({ status: 'paused', locked_at: null, locked_by: null, updated_at: now() }).in('status', ['queued','running'])
  if (action === 'resume') await input.db.from('browser_extension_ultra_jobs').update({ status: 'queued', updated_at: now() }).eq('status', 'paused')
  return { control: data, action, truthBoundary: action === 'clear_kill' ? 'Kill switch cleared but scheduler remains paused until a separate resume command.' : null }
}

async function schedulerTick(input: Input) {
  const status = await schedulerStatus(input)
  if (status.control?.kill_switch || status.control?.paused) return { claimed: 0, enqueued: 0, results: [], blocked: true, control: status.control, generatedAt: now() }
  const { data: enqueued, error: enqueueError } = await input.db.rpc('browser_extension_ultra_enqueue_due_schedules')
  if (enqueueError) throw fail('ULTRA_SCHEDULER_ENQUEUE_DUE_FAILED', 500, enqueueError)
  const limit = Math.max(1, Math.min(Number(input.payload?.limit || 25), 100))
  const { data: claimed, error } = await input.db.rpc('browser_extension_ultra_claim_jobs', { p_worker_id: input.payload?.workerId || `extension:${input.device.id}`, p_limit: limit })
  if (error) throw fail('ULTRA_SCHEDULER_CLAIM_FAILED', 500, error)
  const results: any[] = []
  for (const job of claimed || []) {
    try {
      let result: any = { skipped: false }
      if (job.job_type === 'data_quality_scan') result = await scanQuality({ ...input, payload: job.payload || {} })
      else if (job.job_type === 'report_generate') result = await report({ ...input, payload: job.payload || {} })
      else if (job.job_type === 'stale_detection') result = await launchpad({ ...input, payload: { ...(job.payload || {}), limit: 500 } })
      else if (job.job_type === 'renewal_milestone') result = await safeRows(input.db, 'browser_extension_b2b_renewal_plans', (query) => query.lte('renewal_date', new Date(Date.now() + 90 * 86400000).toISOString()).limit(500))
      else throw fail('UNSUPPORTED_LOW_RISK_JOB_TYPE')
      await input.db.from('browser_extension_ultra_jobs').update({ status: 'completed', completed_at: now(), locked_at: null, locked_by: null, last_error: null, result_payload: result, updated_at: now() }).eq('id', job.id)
      await input.db.from('browser_extension_ultra_job_runs').insert({ job_id: job.id, worker_id: input.payload?.workerId || `extension:${input.device.id}`, status: 'completed', result_payload: result, started_at: job.locked_at || now(), completed_at: now() })
      results.push({ id: job.id, status: 'completed' })
    } catch (jobError) {
      const attempts = Number(job.attempts || 0) + 1
      const terminal = attempts >= Number(job.max_attempts || 5)
      const retryAt = new Date(Date.now() + Math.min(3600, 30 * 2 ** attempts) * 1000).toISOString()
      await input.db.from('browser_extension_ultra_jobs').update({ status: terminal ? 'failed' : 'queued', attempts, run_at: terminal ? job.run_at : retryAt, locked_at: null, locked_by: null, last_error: jobError instanceof Error ? jobError.message : String(jobError), updated_at: now() }).eq('id', job.id)
      await input.db.from('browser_extension_ultra_job_runs').insert({ job_id: job.id, worker_id: input.payload?.workerId || `extension:${input.device.id}`, status: terminal ? 'failed' : 'retry_scheduled', error: jobError instanceof Error ? jobError.message : String(jobError), started_at: job.locked_at || now(), completed_at: now() })
      results.push({ id: job.id, status: terminal ? 'failed' : 'retry_scheduled', retryAt: terminal ? null : retryAt })
    }
  }
  return { claimed: (claimed || []).length, enqueued: Number(enqueued || 0), results, generatedAt: now() }
}

export async function executeB2BUltraCommand(input: Input) {
  switch (input.commandKey) {
    case 'b2b.ultra.launchpad.read': return launchpad(input)
    case 'b2b.ultra.context.set': return setContext(input)
    case 'b2b.ultra.context.read': return readContext(input)
    case 'b2b.ultra.journey.read': return journey(input)
    case 'b2b.ultra.timeline.read': return timeline(input)
    case 'b2b.ultra.data_quality.scan': return scanQuality(input)
    case 'b2b.ultra.data_quality.resolve': return resolveQuality(input)
    case 'b2b.ultra.bridge.status': return bridgeStatus(input)
    case 'b2b.ultra.ai.reason': return aiReason(input)
    case 'b2b.ultra.report.generate': return report(input)
    case 'b2b.ultra.partner_operations.read': return partnerOperations(input)
    case 'b2b.ultra.scheduler.status': return schedulerStatus(input)
    case 'b2b.ultra.scheduler.enqueue': return schedulerEnqueue(input)
    case 'b2b.ultra.scheduler.control': return schedulerControl(input)
    case 'b2b.ultra.scheduler.tick': return schedulerTick(input)
    default: throw fail('UNSUPPORTED_B2B_ULTRA_COMMAND')
  }
}
