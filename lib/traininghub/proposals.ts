import { createTrainingHubUserClient } from './supabase'
import { TrainingHubHttpError, requireTrainingHubPermission } from './auth'
import { previewTrainingHubPricing } from './pricing'
import type {
  JsonRecord,
  TrainingHubContext,
  TrainingHubProposalCreateItem,
  TrainingHubProposalCreateRequest,
  TrainingHubProposalDetail,
  TrainingHubProposalSummary,
} from './types'

const DEFAULT_PROPOSAL_LIMIT = 50
const MAX_PROPOSAL_LIMIT = 200
const PROPOSAL_SELECT = `
  id,
  organization_id,
  site_id,
  proposal_number,
  status,
  title,
  commercial_owner_id,
  valid_until,
  currency_code,
  subtotal_minor,
  discount_total_minor,
  tax_total_minor,
  grand_total_minor,
  payment_terms,
  internal_notes,
  partner_notes,
  sent_at,
  accepted_at,
  converted_order_id,
  created_at,
  updated_at,
  metadata,
  core_organizations(id, name, legal_name, organization_type, status, city, country_code, currency_code)
`

function asObject(value: unknown, message = 'Invalid TrainingHub proposal payload.'): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TrainingHubHttpError(message, 400, 'TRAININGHUB_INVALID_PROPOSAL_PAYLOAD')
  }
  return value as JsonRecord
}

function normalizeString(value: unknown) {
  return String(value || '').trim()
}

function normalizeNullableString(value: unknown) {
  const text = normalizeString(value)
  return text || null
}

function normalizeDateString(value: unknown) {
  const text = normalizeString(value)
  if (!text) return null
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) {
    throw new TrainingHubHttpError('Invalid proposal date.', 400, 'TRAININGHUB_INVALID_PROPOSAL_DATE', { value: text })
  }
  return text.slice(0, 10)
}

function normalizePositiveInteger(value: unknown, fallback = 1, max = 999) {
  const n = Number(value ?? fallback)
  if (!Number.isFinite(n)) return fallback
  return Math.min(Math.max(Math.floor(n), 1), max)
}

function normalizeLimit(value: string | null) {
  const n = Number(value || '')
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_PROPOSAL_LIMIT
  return Math.min(Math.floor(n), MAX_PROPOSAL_LIMIT)
}

function normalizeProposalStatus(value: string | null) {
  const status = normalizeString(value)
  return status || null
}

function normalizeUuid(value: unknown) {
  const text = normalizeString(value)
  return text || ''
}

function currentIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function addDaysIso(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function generateBusinessNumber(prefix: string) {
  const now = new Date()
  const stamp = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${prefix}-${stamp}-${rand}`
}

function normalizeProposalRow(row: any): TrainingHubProposalSummary {
  return {
    ...row,
    organization: row.core_organizations || row.organization || null,
    core_organizations: undefined,
  } as TrainingHubProposalSummary
}

function normalizeProposalDetail(row: any, items: JsonRecord[], order?: JsonRecord | null, invoice?: JsonRecord | null): TrainingHubProposalDetail {
  return {
    ...normalizeProposalRow(row),
    payment_terms: row.payment_terms || null,
    internal_notes: row.internal_notes || null,
    partner_notes: row.partner_notes || null,
    items,
    order: order || null,
    invoice: invoice || null,
  }
}

function contextCanUseOrganization(context: TrainingHubContext, organizationId: string) {
  return context.isInternal || context.isSuperAdmin || context.organizationIds.includes(organizationId)
}

function requireProposalReadAccess(context: TrainingHubContext, organizationId: string) {
  if (!contextCanUseOrganization(context, organizationId)) {
    throw new TrainingHubHttpError('Cannot access another TrainingHub organization proposal.', 403, 'TRAININGHUB_PROPOSAL_ORG_FORBIDDEN')
  }
}

function requireInternalProposalControl(context: TrainingHubContext, permission: string | string[]) {
  if (!context.isInternal && !context.isSuperAdmin) {
    throw new TrainingHubHttpError('Internal TrainingHub proposal control required.', 403, 'TRAININGHUB_INTERNAL_ONLY')
  }
  requireTrainingHubPermission(context, permission)
}

function getRequestOrganizationId(context: TrainingHubContext, body: TrainingHubProposalCreateRequest) {
  const explicit = normalizeUuid(body.organization_id || body.organizationId)
  if (context.isInternal || context.isSuperAdmin) {
    if (!explicit) {
      throw new TrainingHubHttpError('organization_id is required when an internal user creates a TrainingHub proposal.', 400, 'TRAININGHUB_PROPOSAL_ORG_REQUIRED')
    }
    return explicit
  }

  const ownOrg = context.organizationIds[0]
  if (!ownOrg) throw new TrainingHubHttpError('No TrainingHub organization available.', 403, 'TRAININGHUB_NO_ORGANIZATION')
  if (explicit && explicit !== ownOrg) {
    throw new TrainingHubHttpError('Partner users cannot create proposals for another organization.', 403, 'TRAININGHUB_PROPOSAL_ORG_FORBIDDEN')
  }
  return ownOrg
}

function getRequestSiteId(body: TrainingHubProposalCreateRequest) {
  return normalizeNullableString(body.site_id || body.siteId)
}

function sanitizeItems(body: TrainingHubProposalCreateRequest) {
  if (!Array.isArray(body.items) || !body.items.length) {
    throw new TrainingHubHttpError('At least one proposal item is required.', 400, 'TRAININGHUB_PROPOSAL_ITEMS_REQUIRED')
  }
  if (body.items.length > 40) {
    throw new TrainingHubHttpError('Too many proposal items in one request.', 400, 'TRAININGHUB_PROPOSAL_TOO_MANY_ITEMS')
  }
  return body.items
}

async function loadProposalRow(id: string) {
  const supabase = await createTrainingHubUserClient()
  const { data, error } = await supabase
    .from('bill_proposals')
    .select(PROPOSAL_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_PROPOSAL_LOAD_FAILED')
  if (!data) throw new TrainingHubHttpError('TrainingHub proposal not found.', 404, 'TRAININGHUB_PROPOSAL_NOT_FOUND')
  return data as any
}

async function loadProposalItems(proposalId: string) {
  const supabase = await createTrainingHubUserClient()
  const { data, error } = await supabase
    .from('bill_proposal_items')
    .select(`
      id,
      proposal_id,
      course_id,
      item_type,
      description,
      participant_count,
      estimated_hours,
      unit_price_minor,
      quantity,
      discount_minor,
      line_total_minor,
      requires_custom_quote,
      pricing_preview_id,
      metadata,
      trn_courses(id, ref, title, category_id, currency_code, trn_categories(id, code, name))
    `)
    .eq('proposal_id', proposalId)
    .order('id', { ascending: true })

  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_PROPOSAL_ITEMS_LOAD_FAILED')
  return (data || []) as JsonRecord[]
}

async function loadConvertedOrderAndInvoice(orderId: string | null | undefined) {
  if (!orderId) return { order: null, invoice: null }
  const supabase = await createTrainingHubUserClient()

  const { data: order, error: orderError } = await supabase
    .from('bill_orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle()

  if (orderError) throw new TrainingHubHttpError(orderError.message, 500, 'TRAININGHUB_ORDER_LOAD_FAILED')

  const { data: invoice, error: invoiceError } = await supabase
    .from('bill_invoices')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (invoiceError) throw new TrainingHubHttpError(invoiceError.message, 500, 'TRAININGHUB_INVOICE_LOAD_FAILED')

  return { order: (order || null) as JsonRecord | null, invoice: (invoice || null) as JsonRecord | null }
}

export async function listTrainingHubProposals(context: TrainingHubContext, url: URL) {
  const supabase = await createTrainingHubUserClient()
  const limit = normalizeLimit(url.searchParams.get('limit'))
  const status = normalizeProposalStatus(url.searchParams.get('status'))
  const organizationId = normalizeUuid(url.searchParams.get('organization_id'))

  let query = supabase
    .from('bill_proposals')
    .select(PROPOSAL_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) query = query.eq('status', status)

  if (context.isInternal || context.isSuperAdmin) {
    requireTrainingHubPermission(context, ['training.proposal.create', 'training.proposal.send'])
    if (organizationId) query = query.eq('organization_id', organizationId)
  } else {
    query = query.in('organization_id', context.organizationIds)
  }

  const { data, error } = await query
  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_PROPOSALS_LIST_FAILED')
  return (data || []).map(normalizeProposalRow)
}

export async function getTrainingHubProposalById(context: TrainingHubContext, id: string) {
  const proposalId = normalizeUuid(id)
  if (!proposalId) throw new TrainingHubHttpError('Missing proposal id.', 400, 'TRAININGHUB_MISSING_PROPOSAL_ID')

  const row = await loadProposalRow(proposalId)
  requireProposalReadAccess(context, row.organization_id)

  const items = await loadProposalItems(proposalId)
  const { order, invoice } = await loadConvertedOrderAndInvoice(row.converted_order_id)
  return normalizeProposalDetail(row, items, order, invoice)
}

async function createProposalItemFromTraining(
  context: TrainingHubContext,
  proposalId: string,
  organizationId: string,
  siteId: string | null,
  item: TrainingHubProposalCreateItem,
) {
  const courseRef = normalizeString(item.course_ref || item.courseRef).toUpperCase()
  const courseId = normalizeUuid(item.course_id || item.courseId)

  if (!courseRef && !courseId) {
    throw new TrainingHubHttpError('Training proposal item requires course_ref or course_id.', 400, 'TRAININGHUB_PROPOSAL_ITEM_COURSE_REQUIRED')
  }

  const quantity = normalizePositiveInteger(item.quantity, 1, 20)
  const requestedHours = item.requested_hours ?? item.requestedHours ?? item.estimated_hours ?? item.estimatedHours ?? null

  const pricing = await previewTrainingHubPricing(
    context,
    {
      course_ref: courseRef || undefined,
      course_id: courseId || undefined,
      organization_id: organizationId,
      site_id: siteId,
      participant_count: item.participant_count ?? item.participantCount ?? 3,
      requested_hours: requestedHours,
      city: item.city || null,
      travel_fee_minor: item.travel_fee_minor ?? item.travelFeeMinor ?? 0,
      kit_fee_minor: item.kit_fee_minor ?? item.kitFeeMinor ?? 0,
      rush_fee_minor: item.rush_fee_minor ?? item.rushFeeMinor ?? 0,
      custom_material_fee_minor: item.custom_material_fee_minor ?? item.customMaterialFeeMinor ?? 0,
      trainer_seniority_fee_minor: item.trainer_seniority_fee_minor ?? item.trainerSeniorityFeeMinor ?? 0,
      commercial_discount_minor: item.commercial_discount_minor ?? item.commercialDiscountMinor ?? 0,
      discount_reason: item.discount_reason ?? item.discountReason ?? null,
      notes: item.notes || null,
    },
    { persist: true },
  )

  const lineTotal = pricing.final_price_minor * quantity
  const subtotalBeforeDiscount = (pricing.final_price_minor + pricing.discount_minor) * quantity

  return {
    proposal_id: proposalId,
    course_id: pricing.course_id,
    item_type: normalizeString(item.item_type || item.itemType) || 'training_course',
    description: normalizeNullableString(item.description) || `${pricing.course_ref} — ${pricing.course_title}`,
    participant_count: pricing.participant_count,
    estimated_hours: pricing.requested_hours,
    unit_price_minor: pricing.final_price_minor,
    quantity,
    discount_minor: pricing.discount_minor * quantity,
    line_total_minor: lineTotal,
    requires_custom_quote: pricing.requires_custom_quote,
    pricing_preview_id: pricing.id || null,
    metadata: {
      ...(item.metadata || {}),
      pricing_preview: pricing,
      subtotal_before_discount_minor: subtotalBeforeDiscount,
      created_from: 'traininghub_proposal_builder_api',
    },
  }
}

export async function createTrainingHubProposal(context: TrainingHubContext, rawBody: unknown) {
  requireInternalProposalControl(context, 'training.proposal.create')

  const body = asObject(rawBody) as TrainingHubProposalCreateRequest
  const organizationId = getRequestOrganizationId(context, body)
  const siteId = getRequestSiteId(body)

  if (!contextCanUseOrganization(context, organizationId)) {
    throw new TrainingHubHttpError('Cannot create proposal for another TrainingHub organization.', 403, 'TRAININGHUB_PROPOSAL_ORG_FORBIDDEN')
  }

  const items = sanitizeItems(body)
  const currencyCode = normalizeNullableString(body.currency_code || body.currencyCode) || 'MAD'
  const validUntil = normalizeDateString(body.valid_until || body.validUntil) || addDaysIso(15)
  const title = normalizeNullableString(body.title) || 'TrainingHub training proposal'

  const supabase = await createTrainingHubUserClient()
  const proposalNumber = generateBusinessNumber('TH-PROP')

  const { data: proposal, error: proposalError } = await supabase
    .from('bill_proposals')
    .insert({
      organization_id: organizationId,
      site_id: siteId,
      proposal_number: proposalNumber,
      status: 'draft',
      title,
      commercial_owner_id: context.profile.id,
      valid_until: validUntil,
      currency_code: currencyCode,
      subtotal_minor: 0,
      discount_total_minor: 0,
      tax_total_minor: 0,
      grand_total_minor: 0,
      payment_terms: normalizeNullableString(body.payment_terms || body.paymentTerms),
      internal_notes: normalizeNullableString(body.internal_notes || body.internalNotes),
      partner_notes: normalizeNullableString(body.partner_notes || body.partnerNotes),
      metadata: {
        ...(body.metadata || {}),
        source: 'traininghub_proposal_builder_api',
        created_by_profile_id: context.profile.id,
      },
    })
    .select(PROPOSAL_SELECT)
    .maybeSingle()

  if (proposalError || !proposal?.id) {
    throw new TrainingHubHttpError(proposalError?.message || 'Unable to create TrainingHub proposal.', 500, 'TRAININGHUB_PROPOSAL_CREATE_FAILED')
  }

  try {
    const rows = []
    for (const item of items) {
      rows.push(await createProposalItemFromTraining(context, proposal.id, organizationId, siteId, item))
    }

    const { error: itemsError } = await supabase.from('bill_proposal_items').insert(rows)
    if (itemsError) throw itemsError

    const subtotal = rows.reduce((sum, row: any) => sum + Number(row.metadata?.subtotal_before_discount_minor || row.line_total_minor || 0), 0)
    const discount = rows.reduce((sum, row: any) => sum + Number(row.discount_minor || 0), 0)
    const grandTotal = rows.reduce((sum, row: any) => sum + Number(row.line_total_minor || 0), 0)

    const { data: updated, error: updateError } = await supabase
      .from('bill_proposals')
      .update({
        subtotal_minor: subtotal,
        discount_total_minor: discount,
        tax_total_minor: 0,
        grand_total_minor: grandTotal,
        updated_at: new Date().toISOString(),
      })
      .eq('id', proposal.id)
      .select(PROPOSAL_SELECT)
      .maybeSingle()

    if (updateError || !updated) throw updateError || new Error('Proposal total update returned no row.')

    const proposalItems = await loadProposalItems(proposal.id)
    return normalizeProposalDetail(updated, proposalItems)
  } catch (error) {
    await supabase.from('bill_proposals').delete().eq('id', proposal.id)
    const message = error instanceof Error ? error.message : String(error || 'Proposal item creation failed')
    throw new TrainingHubHttpError(message, 500, 'TRAININGHUB_PROPOSAL_ITEMS_CREATE_FAILED')
  }
}

export async function sendTrainingHubProposal(context: TrainingHubContext, id: string) {
  requireInternalProposalControl(context, 'training.proposal.send')
  const proposal = await getTrainingHubProposalById(context, id)

  if (!['draft', 'internal_review', 'negotiation'].includes(String(proposal.status || ''))) {
    throw new TrainingHubHttpError('Only draft/internal_review/negotiation proposals can be sent.', 400, 'TRAININGHUB_PROPOSAL_NOT_SENDABLE')
  }

  const supabase = await createTrainingHubUserClient()
  const { data, error } = await supabase
    .from('bill_proposals')
    .update({ status: 'sent', sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', proposal.id)
    .select(PROPOSAL_SELECT)
    .maybeSingle()

  if (error || !data) throw new TrainingHubHttpError(error?.message || 'Unable to send proposal.', 500, 'TRAININGHUB_PROPOSAL_SEND_FAILED')

  const { error: eventError } = await supabase.from('auto_events').insert({
    event_type: 'proposal.sent',
    organization_id: data.organization_id,
    site_id: data.site_id,
    actor_user_id: context.profile.id,
    source_type: 'bill_proposals',
    source_id: data.id,
    payload: { proposal_number: data.proposal_number, grand_total_minor: data.grand_total_minor },
  })
  if (eventError) console.warn('[traininghub] proposal.sent event failed', eventError.message)

  return normalizeProposalDetail(data, await loadProposalItems(proposal.id))
}

export async function acceptTrainingHubProposal(context: TrainingHubContext, id: string) {
  const proposal = await getTrainingHubProposalById(context, id)
  requireProposalReadAccess(context, proposal.organization_id)

  if (!context.isInternal && !context.organizationIds.includes(proposal.organization_id)) {
    throw new TrainingHubHttpError('Cannot accept proposal for another organization.', 403, 'TRAININGHUB_PROPOSAL_ACCEPT_FORBIDDEN')
  }

  if (!['sent', 'viewed', 'negotiation'].includes(String(proposal.status || ''))) {
    throw new TrainingHubHttpError('Only sent/viewed/negotiation proposals can be accepted.', 400, 'TRAININGHUB_PROPOSAL_NOT_ACCEPTABLE')
  }

  const supabase = await createTrainingHubUserClient()
  const { data, error } = await supabase
    .from('bill_proposals')
    .update({ status: 'accepted', accepted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', proposal.id)
    .select(PROPOSAL_SELECT)
    .maybeSingle()

  if (error || !data) throw new TrainingHubHttpError(error?.message || 'Unable to accept proposal.', 500, 'TRAININGHUB_PROPOSAL_ACCEPT_FAILED')

  const { error: eventError } = await supabase.from('auto_events').insert({
    event_type: 'proposal.accepted',
    organization_id: data.organization_id,
    site_id: data.site_id,
    actor_user_id: context.profile.id,
    source_type: 'bill_proposals',
    source_id: data.id,
    payload: { proposal_number: data.proposal_number, grand_total_minor: data.grand_total_minor },
  })
  if (eventError) console.warn('[traininghub] proposal.accepted event failed', eventError.message)

  return normalizeProposalDetail(data, await loadProposalItems(proposal.id))
}

export async function convertTrainingHubProposalToOrder(context: TrainingHubContext, id: string) {
  requireInternalProposalControl(context, ['training.proposal.send', 'billing.invoice.issue'])
  const proposal = await getTrainingHubProposalById(context, id)

  if (proposal.converted_order_id) {
    return proposal
  }

  if (proposal.status !== 'accepted') {
    throw new TrainingHubHttpError('Proposal must be accepted before conversion to order.', 400, 'TRAININGHUB_PROPOSAL_NOT_ACCEPTED')
  }

  if (!proposal.items.length) {
    throw new TrainingHubHttpError('Cannot convert a proposal with no items.', 400, 'TRAININGHUB_PROPOSAL_EMPTY')
  }

  const supabase = await createTrainingHubUserClient()
  const orderNumber = generateBusinessNumber('TH-ORD')
  const invoiceNumber = generateBusinessNumber('TH-INV')

  const { data: order, error: orderError } = await supabase
    .from('bill_orders')
    .insert({
      organization_id: proposal.organization_id,
      site_id: proposal.site_id,
      order_number: orderNumber,
      proposal_id: proposal.id,
      status: 'awaiting_payment',
      currency_code: proposal.currency_code || 'MAD',
      subtotal_minor: proposal.subtotal_minor || 0,
      discount_total_minor: proposal.discount_total_minor || 0,
      tax_total_minor: proposal.tax_total_minor || 0,
      grand_total_minor: proposal.grand_total_minor || 0,
      metadata: { source: 'traininghub_proposal_conversion', proposal_number: proposal.proposal_number },
    })
    .select('*')
    .maybeSingle()

  if (orderError || !order?.id) {
    throw new TrainingHubHttpError(orderError?.message || 'Unable to create TrainingHub order.', 500, 'TRAININGHUB_ORDER_CREATE_FAILED')
  }

  try {
    const orderItems = proposal.items.map((item: any) => ({
      order_id: order.id,
      proposal_item_id: item.id,
      course_id: item.course_id || null,
      item_type: item.item_type || 'training_course',
      description: item.description || null,
      quantity: item.quantity || 1,
      participant_count: item.participant_count || null,
      estimated_hours: item.estimated_hours || null,
      unit_price_minor: item.unit_price_minor || 0,
      line_total_minor: item.line_total_minor || 0,
      fulfillment_status: 'not_started',
      metadata: { source: 'traininghub_proposal_conversion' },
    }))

    const { error: orderItemsError } = await supabase.from('bill_order_items').insert(orderItems)
    if (orderItemsError) throw orderItemsError

    const { data: invoice, error: invoiceError } = await supabase
      .from('bill_invoices')
      .insert({
        organization_id: proposal.organization_id,
        invoice_number: invoiceNumber,
        order_id: order.id,
        status: 'issued',
        currency_code: proposal.currency_code || 'MAD',
        issue_date: currentIsoDate(),
        due_date: addDaysIso(7),
        subtotal_minor: proposal.subtotal_minor || 0,
        discount_total_minor: proposal.discount_total_minor || 0,
        tax_total_minor: proposal.tax_total_minor || 0,
        grand_total_minor: proposal.grand_total_minor || 0,
        amount_paid_minor: 0,
        amount_due_minor: proposal.grand_total_minor || 0,
        sent_at: new Date().toISOString(),
        metadata: { source: 'traininghub_proposal_conversion', proposal_number: proposal.proposal_number, order_number: order.order_number },
      })
      .select('*')
      .maybeSingle()

    if (invoiceError || !invoice?.id) throw invoiceError || new Error('Invoice insert returned no row.')

    const invoiceItems = proposal.items.map((item: any) => ({
      invoice_id: invoice.id,
      order_item_id: null,
      description: item.description || null,
      quantity: item.quantity || 1,
      unit_price_minor: item.unit_price_minor || 0,
      line_total_minor: item.line_total_minor || 0,
      metadata: { proposal_item_id: item.id, course_id: item.course_id || null },
    }))
    const { error: invoiceItemsError } = await supabase.from('bill_invoice_items').insert(invoiceItems)
    if (invoiceItemsError) throw invoiceItemsError

    const { error: updateProposalError } = await supabase
      .from('bill_proposals')
      .update({ status: 'converted_to_order', converted_order_id: order.id, updated_at: new Date().toISOString() })
      .eq('id', proposal.id)

    if (updateProposalError) throw updateProposalError

    const { error: eventError } = await supabase.from('auto_events').insert({
      event_type: 'order.created',
      organization_id: proposal.organization_id,
      site_id: proposal.site_id,
      actor_user_id: context.profile.id,
      source_type: 'bill_orders',
      source_id: order.id,
      payload: { proposal_number: proposal.proposal_number, order_number: order.order_number, invoice_number: invoice.invoice_number },
    })
    if (eventError) console.warn('[traininghub] order.created event failed', eventError.message)

    const refreshed = await loadProposalRow(proposal.id)
    const refreshedItems = await loadProposalItems(proposal.id)
    return normalizeProposalDetail(refreshed, refreshedItems, order as JsonRecord, invoice as JsonRecord)
  } catch (error) {
    await supabase.from('bill_orders').delete().eq('id', order.id)
    const message = error instanceof Error ? error.message : String(error || 'Proposal conversion failed')
    throw new TrainingHubHttpError(message, 500, 'TRAININGHUB_PROPOSAL_CONVERSION_FAILED')
  }
}
