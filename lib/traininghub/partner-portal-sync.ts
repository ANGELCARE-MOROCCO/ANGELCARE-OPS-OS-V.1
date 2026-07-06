import { TrainingHubHttpError } from './auth'
import type { TrainingHubContext } from './types'

export type TrainingHubPartnerRequest = {
  id: string
  request_type?: string
  title?: string
  description?: string
  status?: string
  priority?: string
  created_at?: string
  updated_at?: string
}

export type TrainingHubPartnerPortalSummary = {
  organization: any
  organization_id: string
  mode: string
  preview: boolean
  stage: string
  next_action: string
  maturity: number
  open_invoice_minor: number
  memberships: any[]
  accounts: any[]
  subscriptions: any[]
  proposals: any[]
  orders: any[]
  invoices: any[]
  credits: any[]
  sessions: any[]
  participants: any[]
  certificates: any[]
  documents: any[]
  resources: any[]
  entitlements: any[]
  sites: any[]
  commercial_state: any
  training_state: any
  proof_state: any
  warnings: string[]
}

function clean(value: unknown) {
  return String(value || '').trim()
}

function normalize(value: unknown) {
  return clean(value).toLowerCase()
}

function isInternalOrg(org: any) {
  const type = normalize(org?.organization_type || org?.type)
  const name = normalize(org?.name || org?.legal_name || org?.display_name)
  return type.includes('internal') || name.includes('angelcare ops') || name === 'angelcare'
}

function isSmokeOrg(org: any) {
  const name = normalize(org?.name || org?.legal_name || org?.display_name)
  const email = normalize(org?.primary_contact_email || org?.billing_email)
  return name.includes('smoke') || email.includes('traininghub-smoke')
}

function isActive(row: any) {
  if (!row) return false
  const status = normalize(row.status || 'active')
  const stage = normalize(row.stage || '')
  const access = normalize(row.access_status || 'active')
  if (['inactive', 'disabled', 'suspended', 'deleted', 'archived'].includes(status)) return false
  if (stage && ['inactive', 'disabled', 'suspended', 'deleted', 'archived'].includes(stage)) return false
  if (access && ['inactive', 'disabled', 'suspended', 'deleted', 'archived'].includes(access)) return false
  if (row.is_active === false) return false
  return true
}

function uniq(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => clean(value)).filter(Boolean)))
}

export async function trainingHubSafeRows(supabase: any, table: string, select = '*', organizationId?: string, options?: { limit?: number; order?: string }) {
  try {
    let query = supabase.from(table).select(select)
    if (organizationId) {
      query = table === 'core_organizations' ? query.eq('id', organizationId) : query.eq('organization_id', organizationId)
    }
    if (options?.order) query = query.order(options.order, { ascending: false })
    if (options?.limit) query = query.limit(options.limit)

    const { data, error } = await query
    return {
      rows: Array.isArray(data) ? data : data ? [data] : [],
      error: error?.message || null,
    }
  } catch (error) {
    return {
      rows: [],
      error: error instanceof Error ? error.message : String(error || 'Erreur inconnue'),
    }
  }
}

export async function resolveTrainingHubPartnerOrganizationScope(supabase: any, context: TrainingHubContext | any) {
  const profileMetadata = context.profile?.metadata || {}
  const authMetadata = context.authUser?.user_metadata || {}

  const candidateIds = uniq([
    context.organization?.id,
    context.organization_id,
    context.membership?.organization_id,
    context.profile?.organization_id,
    profileMetadata.organization_id,
    authMetadata.organization_id,
    ...(Array.isArray(context.organizationIds) ? context.organizationIds : []),
    ...(Array.isArray(context.memberships) ? context.memberships.map((membership: any) => membership.organization_id) : []),
    ...(Array.isArray(context.organizations) ? context.organizations.map((org: any) => org.id) : []),
  ])

  const directOrganization =
    context.organization ||
    (Array.isArray(context.organizations) ? context.organizations.find((org: any) => candidateIds.includes(org.id)) : null) ||
    null

  const partnerCandidate = Array.isArray(context.organizations)
    ? context.organizations.find((org: any) => candidateIds.includes(org.id) && !isInternalOrg(org) && !isSmokeOrg(org))
    : null

  if (partnerCandidate?.id) {
    return { organizationId: partnerCandidate.id, organization: partnerCandidate, mode: 'context_partner_scope', fallback: false }
  }

  if (candidateIds.length && (!context.isInternal || !context.isSuperAdmin)) {
    const organizations = await trainingHubSafeRows(supabase, 'core_organizations', '*')
    const candidate = organizations.rows.find((org: any) => candidateIds.includes(org.id) && isActive(org))
    if (candidate?.id) {
      return { organizationId: candidate.id, organization: candidate, mode: 'membership_scope', fallback: false }
    }

    return { organizationId: candidateIds[0], organization: directOrganization, mode: 'membership_scope_unloaded', fallback: false }
  }

  if (candidateIds.length && directOrganization && !isInternalOrg(directOrganization)) {
    return { organizationId: candidateIds[0], organization: directOrganization, mode: 'direct_scope', fallback: false }
  }

  if (context.isInternal || context.isSuperAdmin || isInternalOrg(directOrganization)) {
    const orgs = await trainingHubSafeRows(supabase, 'core_organizations', '*')
    const partner =
      orgs.rows.find((org: any) => isActive(org) && !isInternalOrg(org) && !isSmokeOrg(org)) ||
      orgs.rows.find((org: any) => isActive(org) && !isSmokeOrg(org)) ||
      orgs.rows[0]

    if (partner?.id) {
      return { organizationId: partner.id, organization: partner, mode: 'admin_partner_preview', fallback: true }
    }
  }

  if (candidateIds[0]) {
    return { organizationId: candidateIds[0], organization: directOrganization, mode: 'fallback_scope', fallback: true }
  }

  return { organizationId: '', organization: null, mode: 'missing_scope', fallback: false }
}

function amount(row: any) {
  return Number(row.grand_total_minor || row.amount_due_minor || row.balance_due_minor || row.subtotal_minor || row.total_minor || row.amount_minor || 0) || 0
}

function statusOf(row: any) {
  return normalize(row?.status || row?.stage || '')
}

function activeOrPending(rows: any[]) {
  return rows.filter((row) => !['cancelled', 'deleted', 'archived', 'void'].includes(statusOf(row)))
}

function stage(data: any) {
  if (data.certificates.length) return 'certifié'
  if (data.sessions.length) return 'formation'
  if (data.credits.length) return 'crédits activés'
  if (data.invoices.length) return 'facturation'
  if (data.orders.length) return 'commande'
  if (data.subscriptions.length) return 'abonnement'
  if (data.proposals.length) return 'offre'
  if (data.accounts.length) return 'compte créé'
  return 'activation'
}

function nextAction(currentStage: string) {
  if (currentStage === 'activation') return 'Créer le compte partenaire, préparer l’offre et activer les accès.'
  if (currentStage === 'compte créé') return 'Finaliser votre première offre avec AngelCare.'
  if (currentStage === 'offre') return 'Valider la proposition et préparer la commande.'
  if (currentStage === 'abonnement') return 'Confirmer la période de facturation et ouvrir les crédits.'
  if (currentStage === 'commande') return 'Suivre la facturation et activer les crédits formation.'
  if (currentStage === 'facturation') return 'Planifier la session de formation.'
  if (currentStage === 'crédits activés') return 'Confirmer les participants et la date.'
  if (currentStage === 'formation') return 'Suivre les présences et les certificats.'
  return 'Préparer le renouvellement ou la montée en gamme.'
}

export function calculateTrainingHubMaturity(data: any) {
  return Math.min(
    100,
    Math.round(
      (data.accounts.length ? 10 : 0) +
        (data.proposals.length ? 12 : 0) +
        (data.subscriptions.length ? 12 : 0) +
        (data.orders.length ? 12 : 0) +
        (data.invoices.length ? 12 : 0) +
        (data.credits.length ? 14 : 0) +
        (data.sessions.length ? 14 : 0) +
        (data.participants.length ? 7 : 0) +
        (data.certificates.length ? 7 : 0),
    ),
  )
}

function commercialState(data: any, org: any) {
  const openInvoices = data.invoices.filter((invoice: any) => !['paid', 'settled', 'closed', 'cancelled'].includes(statusOf(invoice)))
  const availableCredits = data.credits.reduce((total: number, credit: any) => total + Number(credit.quantity_available ?? credit.quantity_remaining ?? credit.quantity_total ?? 0), 0)
  const activeSubscriptions = activeOrPending(data.subscriptions).filter((subscription: any) => ['active', 'trialing', 'pending', 'scheduled'].includes(statusOf(subscription) || 'active'))

  return {
    account_ready: Boolean(data.accounts.length),
    offer_ready: Boolean(data.proposals.length),
    subscription_ready: Boolean(activeSubscriptions.length),
    order_ready: Boolean(data.orders.length),
    invoice_ready: Boolean(data.invoices.length),
    credit_wallet_ready: Boolean(data.credits.length),
    open_invoice_count: openInvoices.length,
    open_invoice_minor: openInvoices.reduce((total: number, invoice: any) => total + amount(invoice), 0),
    available_credits: availableCredits,
    billing_status: org?.billing_status || org?.metadata?.billing?.status || (data.invoices.length ? 'Facturation suivie' : 'Aucune facture émise'),
    plan_name: org?.plan_name || org?.metadata?.commercial?.plan || activeSubscriptions[0]?.plan_name || data.proposals[0]?.title || 'Activation TrainingHub',
  }
}

function trainingState(data: any) {
  const plannedSessions = data.sessions.filter((session: any) => ['planned', 'scheduled', 'confirmed'].includes(statusOf(session)))
  const deliveredSessions = data.sessions.filter((session: any) => ['delivered', 'completed', 'closed'].includes(statusOf(session)))
  return {
    has_sessions: Boolean(data.sessions.length),
    planned_sessions: plannedSessions.length,
    delivered_sessions: deliveredSessions.length,
    participant_count: data.participants.length,
    certificate_count: data.certificates.length,
    resource_count: data.resources.length + data.entitlements.length,
  }
}

function proofState(data: any) {
  return {
    document_count: data.documents.length,
    certificate_count: data.certificates.length,
    published_documents: data.documents.filter((document: any) => ['published', 'available', 'active'].includes(statusOf(document))).length,
  }
}

export async function buildTrainingHubPartnerPortalSummary(supabase: any, context: TrainingHubContext | any): Promise<TrainingHubPartnerPortalSummary> {
  const scope = await resolveTrainingHubPartnerOrganizationScope(supabase, context)

  if (!scope.organizationId) {
    throw new TrainingHubHttpError(
      'Aucun établissement partenaire n’est rattaché à cette session.',
      403,
      'TRAININGHUB_PARTNER_SCOPE_MISSING',
    )
  }

  const [
    organizations,
    memberships,
    accounts,
    subscriptions,
    proposals,
    orders,
    invoices,
    credits,
    sessions,
    participants,
    certificates,
    documents,
    resources,
    entitlements,
    sites,
  ] = await Promise.all([
    trainingHubSafeRows(supabase, 'core_organizations', '*', scope.organizationId),
    trainingHubSafeRows(supabase, 'core_memberships', '*', scope.organizationId),
    trainingHubSafeRows(supabase, 'bill_accounts', '*', scope.organizationId),
    trainingHubSafeRows(supabase, 'bill_subscriptions', '*', scope.organizationId),
    trainingHubSafeRows(supabase, 'bill_proposals', '*', scope.organizationId),
    trainingHubSafeRows(supabase, 'bill_orders', '*', scope.organizationId),
    trainingHubSafeRows(supabase, 'bill_invoices', '*', scope.organizationId),
    trainingHubSafeRows(supabase, 'bill_training_credits', '*', scope.organizationId),
    trainingHubSafeRows(supabase, 'trn_sessions', '*', scope.organizationId),
    trainingHubSafeRows(supabase, 'trn_session_participants', '*', scope.organizationId),
    trainingHubSafeRows(supabase, 'trn_certificates', '*', scope.organizationId),
    trainingHubSafeRows(supabase, 'partner_documents', '*', scope.organizationId),
    trainingHubSafeRows(supabase, 'trn_course_resources', '*', undefined, { limit: 80, order: 'created_at' }),
    trainingHubSafeRows(supabase, 'learn_entitlements', '*', scope.organizationId),
    trainingHubSafeRows(supabase, 'core_organization_sites', '*', scope.organizationId),
  ])

  const data = {
    organization: organizations.rows[0] || scope.organization || context.organization || context.organizations?.[0] || null,
    memberships: memberships.rows,
    accounts: accounts.rows,
    subscriptions: subscriptions.rows,
    proposals: proposals.rows,
    orders: orders.rows,
    invoices: invoices.rows,
    credits: credits.rows,
    sessions: sessions.rows,
    participants: participants.rows,
    certificates: certificates.rows,
    documents: documents.rows,
    resources: resources.rows,
    entitlements: entitlements.rows,
    sites: sites.rows,
  }

  const currentStage = stage(data)
  const openInvoiceMinor = data.invoices
    .filter((invoice: any) => !['paid', 'settled', 'closed', 'cancelled'].includes(normalize(invoice.status)))
    .reduce((total: number, invoice: any) => total + amount(invoice), 0)

  const warnings = [
    organizations.error,
    memberships.error,
    accounts.error,
    subscriptions.error,
    proposals.error,
    orders.error,
    invoices.error,
    credits.error,
    sessions.error,
    participants.error,
    certificates.error,
    documents.error,
    resources.error,
    entitlements.error,
    sites.error,
  ].filter(Boolean) as string[]

  return {
    ...data,
    organization_id: scope.organizationId,
    mode: scope.mode,
    preview: scope.fallback,
    stage: currentStage,
    next_action: nextAction(currentStage),
    maturity: calculateTrainingHubMaturity(data),
    open_invoice_minor: openInvoiceMinor,
    commercial_state: commercialState(data, data.organization),
    training_state: trainingState(data),
    proof_state: proofState(data),
    warnings,
  }
}

export async function listTrainingHubPartnerRequests(supabase: any, context: TrainingHubContext | any) {
  const scope = await resolveTrainingHubPartnerOrganizationScope(supabase, context)

  if (!scope.organizationId) {
    throw new TrainingHubHttpError('Aucun établissement partenaire rattaché à cette session.', 403, 'TRAININGHUB_PARTNER_SCOPE_MISSING')
  }

  const primary = await trainingHubSafeRows(supabase, 'partner_requests', '*', scope.organizationId, { order: 'created_at' })
  if (!primary.error) return primary.rows as TrainingHubPartnerRequest[]

  const fallback = await trainingHubSafeRows(supabase, 'auto_events', '*', scope.organizationId, { order: 'created_at' })
  return fallback.rows
    .filter((row: any) => normalize(row.event_type).startsWith('partner_request'))
    .map((row: any) => ({
      id: row.id,
      request_type: row.payload?.request_type || row.event_type || 'support_issue',
      title: row.title || row.payload?.title || 'Demande partenaire',
      description: row.payload?.description || row.description || '',
      status: row.status || 'open',
      priority: row.payload?.priority || 'normal',
      created_at: row.created_at,
      updated_at: row.updated_at,
    })) as TrainingHubPartnerRequest[]
}
