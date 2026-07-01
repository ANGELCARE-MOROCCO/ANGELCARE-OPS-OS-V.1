import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  getTrainingHubContext,
  requireTrainingHubPermission,
  trainingHubErrorResponse,
  TrainingHubHttpError,
} from '@/lib/traininghub/auth'

export const dynamic = 'force-dynamic'

type JsonRecord = Record<string, any>

const WRITE_PERMISSIONS = ['training.proposal.create', 'training.proposal.send', 'training.delivery.manage', 'training.billing.manage']

function clean(value: unknown) {
  return String(value || '').trim()
}

function n(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function intValue(value: unknown, fallback = 0) {
  const parsed = Math.floor(n(value))
  return parsed || fallback
}

function minorValue(value: unknown) {
  const parsed = n(value)
  if (parsed > 999999) return Math.round(parsed)
  return Math.round(parsed * 100)
}

function normalize(value: unknown) {
  return clean(value).toLowerCase()
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

  if (!url || !serviceKey) {
    throw new TrainingHubHttpError(
      'Configuration serveur manquante: SUPABASE_SERVICE_ROLE_KEY requis pour le cycle commercial production.',
      500,
      'TRAININGHUB_SERVICE_ROLE_MISSING',
    )
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }) as any
}

function missingSchemaColumn(error: any) {
  const text = String(error?.message || error?.details || '')
  const match = text.match(/Could not find the '([^']+)' column/i)
  return match?.[1] || null
}

function notNullColumn(error: any) {
  const text = String(error?.message || error?.details || '')
  const match = text.match(/null value in column "([^"]+)"/i)
  return match?.[1] || null
}

function defaultValueForRequiredColumn(table: string, column: string) {
  const key = `${table}.${column}`

  const defaults: Record<string, any> = {
    'bill_training_credits.credit_type': 'training_course',
    'bill_training_credits.source_type': 'order',
    'trn_sessions.session_code': `TH-SES-${Date.now().toString(36).toUpperCase()}`,
    'trn_sessions.status': 'planned',
    'trn_sessions.delivery_mode': 'onsite',
    'bill_training_credits.status': 'available',
    'bill_training_credits.quantity_total': 1,
    'bill_training_credits.quantity_remaining': 1,
    'bill_training_credits.hours_total': 0,
    'bill_proposal_items.item_type': 'training_course',
    'bill_order_items.item_type': 'training_course',
    'bill_invoice_items.item_type': 'training_course',
    'bill_invoices.invoice_number': `TH-INV-${Date.now().toString(36).toUpperCase()}`,
    'bill_orders.order_number': `TH-ORD-${Date.now().toString(36).toUpperCase()}`,
    'bill_proposals.proposal_number': `TH-PROP-${Date.now().toString(36).toUpperCase()}`,
  }

  return Object.prototype.hasOwnProperty.call(defaults, key) ? defaults[key] : undefined
}

async function insertFirst(admin: any, table: string, payloads: JsonRecord[], code: string, message: string) {
  let lastError: any = null

  for (const payload of payloads) {
    let safePayload: JsonRecord = { ...payload }

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const { data, error } = await admin.from(table).insert(safePayload).select('*').maybeSingle()
      if (!error && data) return data

      lastError = error
      const missingColumn = missingSchemaColumn(error)
      if (missingColumn && Object.prototype.hasOwnProperty.call(safePayload, missingColumn)) {
        const { [missingColumn]: _removed, ...nextPayload } = safePayload
        safePayload = nextPayload
        continue
      }

      const requiredColumn = notNullColumn(error)
      const defaultValue = requiredColumn ? defaultValueForRequiredColumn(table, requiredColumn) : undefined
      if (requiredColumn && defaultValue !== undefined) {
        safePayload = { ...safePayload, [requiredColumn]: defaultValue }
        continue
      }

      break
    }
  }

  throw new TrainingHubHttpError(lastError?.message || message, 500, code)
}

async function updateFirst(admin: any, table: string, id: string, payloads: JsonRecord[], code: string, message: string) {
  let lastError: any = null
  for (const payload of payloads) {
    const { data, error } = await admin.from(table).update(payload).eq('id', id).select('*').maybeSingle()
    if (!error && data) return data
    lastError = error
  }
  throw new TrainingHubHttpError(lastError?.message || message, 500, code)
}

async function audit(admin: any, input: JsonRecord) {
  const payload = {
    organization_id: input.organization_id || null,
    actor_user_id: input.actor_user_id || null,
    entity_type: input.entity_type || 'traininghub_revenue_lifecycle',
    entity_id: input.entity_id || null,
    action: input.action || 'traininghub.revenue.action',
    severity: input.severity || 'info',
    message: input.message || input.action || 'Action TrainingHub',
    metadata: {
      source: 'traininghub_revenue_lifecycle',
      ...input.metadata,
    },
  }

  const attempts = [
    () => admin.from('audit_change_logs').insert(payload).select('*').maybeSingle(),
    () => admin.from('audit_security_logs').insert(payload).select('*').maybeSingle(),
    () =>
      admin.from('auto_events').insert({
        organization_id: payload.organization_id,
        event_type: payload.action,
        title: payload.message,
        status: 'open',
        payload: payload.metadata,
      }).select('*').maybeSingle(),
  ]

  for (const attempt of attempts) {
    try {
      const { data, error } = await attempt()
      if (!error && data) return data
    } catch {
      // best effort only
    }
  }
  return null
}

async function getOrganization(admin: any, organizationId: string) {
  const { data, error } = await admin.from('core_organizations').select('*').eq('id', organizationId).maybeSingle()
  if (error || !data?.id) throw new TrainingHubHttpError(error?.message || 'Partenaire introuvable.', 404, 'TRAININGHUB_ORG_NOT_FOUND')
  return data
}

async function getCourse(admin: any, courseId: string) {
  const { data, error } = await admin.from('trn_courses').select('*').eq('id', courseId).maybeSingle()
  if (error || !data?.id) throw new TrainingHubHttpError(error?.message || 'Formation introuvable.', 404, 'TRAININGHUB_COURSE_NOT_FOUND')
  return data
}

async function getProposal(admin: any, proposalId: string) {
  const { data, error } = await admin.from('bill_proposals').select('*').eq('id', proposalId).maybeSingle()
  if (error || !data?.id) throw new TrainingHubHttpError(error?.message || 'Proposition introuvable.', 404, 'TRAININGHUB_PROPOSAL_NOT_FOUND')
  return data
}

async function getOrder(admin: any, orderId: string) {
  const { data, error } = await admin.from('bill_orders').select('*').eq('id', orderId).maybeSingle()
  if (error || !data?.id) throw new TrainingHubHttpError(error?.message || 'Commande introuvable.', 404, 'TRAININGHUB_ORDER_NOT_FOUND')
  return data
}

async function getProposalItems(admin: any, proposalId: string) {
  const { data } = await admin.from('bill_proposal_items').select('*').eq('proposal_id', proposalId)
  return Array.isArray(data) ? data : []
}

async function getOrderItems(admin: any, orderId: string) {
  const { data } = await admin.from('bill_order_items').select('*').eq('order_id', orderId)
  return Array.isArray(data) ? data : []
}

function amountFromCourse(course: any, participantCount: number, requestedHours: number, discountMinor = 0) {
  const baseMinor = n(course.onsite_entry_price_minor || course.refresh_entry_price_minor || 0)
  const safeBase = baseMinor > 0 ? baseMinor : Math.max(100000, requestedHours * 100000)
  const qtyFactor = Math.max(1, Math.ceil(participantCount / Math.max(1, n(course.starter_max_participants || 8))))
  return Math.max(0, safeBase * qtyFactor - discountMinor)
}

async function createProposal(admin: any, body: JsonRecord, actorId: string) {
  const organizationId = clean(body.organization_id)
  const courseId = clean(body.course_id)
  if (!organizationId) throw new TrainingHubHttpError('Partenaire requis.', 400, 'TRAININGHUB_ORG_REQUIRED')
  if (!courseId) throw new TrainingHubHttpError('Formation requise.', 400, 'TRAININGHUB_COURSE_REQUIRED')

  const organization = await getOrganization(admin, organizationId)
  const course = await getCourse(admin, courseId)
  const participantCount = intValue(body.participant_count, intValue(course.starter_min_participants, 3))
  const requestedHours = intValue(body.requested_hours, intValue(course.min_hours, 6))
  const discountMinor = minorValue(body.commercial_discount_minor || body.discount_mad || 0)
  const lineTotalMinor = amountFromCourse(course, participantCount, requestedHours, discountMinor)
  const proposalNumber = clean(body.proposal_number) || `TH-PROP-${Date.now().toString(36).toUpperCase()}`
  const title = clean(body.title) || `Proposition formation — ${course.title || course.ref}`

  const proposal = await insertFirst(
    admin,
    'bill_proposals',
    [
      {
        organization_id: organizationId,
        proposal_number: proposalNumber,
        title,
        status: 'draft',
        currency_code: 'MAD',
        subtotal_minor: lineTotalMinor,
        discount_minor: discountMinor,
        grand_total_minor: lineTotalMinor,
        valid_until: clean(body.valid_until) || null,
        partner_notes: clean(body.partner_notes) || null,
        metadata: {
          source: 'traininghub_revenue_lifecycle',
          lifecycle_stage: 'draft',
          organization_name: organization.name,
          created_by: actorId,
        },
      },
      {
        organization_id: organizationId,
        proposal_number: proposalNumber,
        title,
        status: 'draft',
        currency_code: 'MAD',
        grand_total_minor: lineTotalMinor,
        metadata: {
          source: 'traininghub_revenue_lifecycle',
          lifecycle_stage: 'draft',
          created_by: actorId,
        },
      },
      {
        organization_id: organizationId,
        title,
        status: 'draft',
        grand_total_minor: lineTotalMinor,
      },
    ],
    'TRAININGHUB_PROPOSAL_CREATE_FAILED',
    'Proposition non créée.',
  )

  const item = await insertFirst(
    admin,
    'bill_proposal_items',
    [
      {
        proposal_id: proposal.id,
        organization_id: organizationId,
        course_id: courseId,
        item_type: 'training_course',
        description: `${course.ref || 'TRN'} — ${course.title || 'Formation AngelCare'}`,
        participant_count: participantCount,
        requested_hours: requestedHours,
        unit_price_minor: n(course.onsite_entry_price_minor || lineTotalMinor),
        discount_minor: discountMinor,
        line_total_minor: lineTotalMinor,
        currency_code: 'MAD',
        metadata: {
          source: 'traininghub_revenue_lifecycle',
          course_ref: course.ref,
          created_by: actorId,
        },
      },
      {
        proposal_id: proposal.id,
        course_id: courseId,
        item_type: 'training_course',
        description: `${course.ref || 'TRN'} — ${course.title || 'Formation AngelCare'}`,
        participant_count: participantCount,
        line_total_minor: lineTotalMinor,
      },
      {
        proposal_id: proposal.id,
        course_id: courseId,
        item_type: 'training_course',
        line_total_minor: lineTotalMinor,
      },
    ],
    'TRAININGHUB_PROPOSAL_ITEM_CREATE_FAILED',
    'Ligne de proposition non créée.',
  )

  await audit(admin, {
    organization_id: organizationId,
    actor_user_id: actorId,
    entity_type: 'bill_proposal',
    entity_id: proposal.id,
    action: 'traininghub.proposal.created',
    message: 'Proposition TrainingHub créée',
    metadata: { proposal_id: proposal.id, item_id: item.id, amount_minor: lineTotalMinor },
  })

  return { proposal, item, organization, course }
}

async function sendProposal(admin: any, proposalId: string, actorId: string) {
  const proposal = await getProposal(admin, proposalId)
  const updated = await updateFirst(
    admin,
    'bill_proposals',
    proposalId,
    [
      {
        status: 'sent',
        sent_at: new Date().toISOString(),
        metadata: {
          ...(proposal.metadata || {}),
          lifecycle_stage: 'sent',
          sent_by: actorId,
        },
      },
      { status: 'sent' },
    ],
    'TRAININGHUB_PROPOSAL_SEND_FAILED',
    'Proposition non envoyée.',
  )

  await audit(admin, {
    organization_id: proposal.organization_id,
    actor_user_id: actorId,
    entity_type: 'bill_proposal',
    entity_id: proposalId,
    action: 'traininghub.proposal.sent',
    message: 'Proposition envoyée',
  })

  return updated
}

async function acceptProposal(admin: any, proposalId: string, actorId: string) {
  const proposal = await getProposal(admin, proposalId)
  const updated = await updateFirst(
    admin,
    'bill_proposals',
    proposalId,
    [
      {
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        metadata: {
          ...(proposal.metadata || {}),
          lifecycle_stage: 'accepted',
          accepted_by: actorId,
        },
      },
      { status: 'accepted' },
    ],
    'TRAININGHUB_PROPOSAL_ACCEPT_FAILED',
    'Proposition non acceptée.',
  )

  await audit(admin, {
    organization_id: proposal.organization_id,
    actor_user_id: actorId,
    entity_type: 'bill_proposal',
    entity_id: proposalId,
    action: 'traininghub.proposal.accepted',
    message: 'Proposition acceptée',
  })

  return updated
}

async function convertToOrderInvoice(admin: any, proposalId: string, actorId: string) {
  const proposal = await getProposal(admin, proposalId)
  const proposalItems = await getProposalItems(admin, proposalId)
  const totalMinor = n(proposal.grand_total_minor || proposal.subtotal_minor || proposalItems.reduce((sum: number, item: any) => sum + n(item.line_total_minor), 0))
  const orderNumber = `TH-ORD-${Date.now().toString(36).toUpperCase()}`
  const invoiceNumber = `TH-INV-${Date.now().toString(36).toUpperCase()}`

  const order = await insertFirst(
    admin,
    'bill_orders',
    [
      {
        organization_id: proposal.organization_id,
        proposal_id: proposal.id,
        order_number: orderNumber,
        title: proposal.title || 'Commande formation TrainingHub',
        status: 'confirmed',
        currency_code: proposal.currency_code || 'MAD',
        subtotal_minor: totalMinor,
        grand_total_minor: totalMinor,
        confirmed_at: new Date().toISOString(),
        metadata: {
          source: 'traininghub_revenue_lifecycle',
          lifecycle_stage: 'confirmed',
          proposal_id: proposal.id,
          created_by: actorId,
        },
      },
      {
        organization_id: proposal.organization_id,
        proposal_id: proposal.id,
        order_number: orderNumber,
        status: 'confirmed',
        currency_code: proposal.currency_code || 'MAD',
        grand_total_minor: totalMinor,
      },
      {
        organization_id: proposal.organization_id,
        proposal_id: proposal.id,
        status: 'confirmed',
        grand_total_minor: totalMinor,
      },
    ],
    'TRAININGHUB_ORDER_CREATE_FAILED',
    'Commande non créée.',
  )

  const orderItems = []
  for (const item of proposalItems.length ? proposalItems : [{ line_total_minor: totalMinor, description: proposal.title }]) {
    const orderItem = await insertFirst(
      admin,
      'bill_order_items',
      [
        {
          organization_id: proposal.organization_id,
          order_id: order.id,
          item_type: 'training_course',
          proposal_item_id: item.id || null,
                    description: item.description || proposal.title || 'Formation AngelCare',
          participant_count: item.participant_count || null,
          requested_hours: item.requested_hours || item.estimated_hours || null,
          unit_price_minor: item.unit_price_minor || item.line_total_minor || totalMinor,
          line_total_minor: item.line_total_minor || totalMinor,
          currency_code: proposal.currency_code || 'MAD',
          metadata: { source: 'traininghub_revenue_lifecycle', proposal_item_id: item.id || null },
        },
        {
          order_id: order.id,
          item_type: 'training_course',
                    description: item.description || proposal.title || 'Formation AngelCare',
          line_total_minor: item.line_total_minor || totalMinor,
        },
        {
          order_id: order.id,
          item_type: 'training_course',
                    line_total_minor: item.line_total_minor || totalMinor,
        },
      ],
      'TRAININGHUB_ORDER_ITEM_CREATE_FAILED',
      'Ligne de commande non créée.',
    )
    orderItems.push(orderItem)
  }

  const invoice = await insertFirst(
    admin,
    'bill_invoices',
    [
      {
        organization_id: proposal.organization_id,
        proposal_id: proposal.id,
        order_id: order.id,
        invoice_number: invoiceNumber,
        title: proposal.title || 'Facture formation TrainingHub',
        status: 'issued',
        currency_code: proposal.currency_code || 'MAD',
        subtotal_minor: totalMinor,
        grand_total_minor: totalMinor,
        amount_due_minor: totalMinor,
        issued_at: new Date().toISOString(),
        due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          source: 'traininghub_revenue_lifecycle',
          lifecycle_stage: 'issued',
          proposal_id: proposal.id,
          order_id: order.id,
          created_by: actorId,
        },
      },
      {
        organization_id: proposal.organization_id,
        order_id: order.id,
        invoice_number: invoiceNumber,
        status: 'issued',
        currency_code: proposal.currency_code || 'MAD',
        grand_total_minor: totalMinor,
        amount_due_minor: totalMinor,
      },
      {
        organization_id: proposal.organization_id,
        order_id: order.id,
        invoice_number: invoiceNumber,
        status: 'issued',
        grand_total_minor: totalMinor,
      },
    ],
    'TRAININGHUB_INVOICE_CREATE_FAILED',
    'Facture non créée.',
  )

  const invoiceItems = []
  for (const item of orderItems.length ? orderItems : [{ line_total_minor: totalMinor, description: proposal.title }]) {
    const invoiceItem = await insertFirst(
      admin,
      'bill_invoice_items',
      [
        {
          organization_id: proposal.organization_id,
          invoice_id: invoice.id,
          item_type: 'training_course',
          order_item_id: item.id || null,
                    description: item.description || proposal.title || 'Formation AngelCare',
          quantity: 1,
          unit_price_minor: item.unit_price_minor || item.line_total_minor || totalMinor,
          line_total_minor: item.line_total_minor || totalMinor,
          currency_code: proposal.currency_code || 'MAD',
          metadata: { source: 'traininghub_revenue_lifecycle' },
        },
        {
          invoice_id: invoice.id,
          item_type: 'training_course',
          order_item_id: item.id || null,
                    description: item.description || proposal.title || 'Formation AngelCare',
          line_total_minor: item.line_total_minor || totalMinor,
        },
        {
          invoice_id: invoice.id,
          item_type: 'training_course',
                    line_total_minor: item.line_total_minor || totalMinor,
        },
      ],
      'TRAININGHUB_INVOICE_ITEM_CREATE_FAILED',
      'Ligne de facture non créée.',
    )
    invoiceItems.push(invoiceItem)
  }

  await updateFirst(
    admin,
    'bill_proposals',
    proposal.id,
    [
      {
        status: 'converted_to_order',
        converted_order_id: order.id,
        metadata: {
          ...(proposal.metadata || {}),
          lifecycle_stage: 'converted_to_order',
          order_id: order.id,
          invoice_id: invoice.id,
          converted_by: actorId,
        },
      },
      { status: 'converted_to_order' },
    ],
    'TRAININGHUB_PROPOSAL_CONVERT_UPDATE_FAILED',
    'Proposition non marquée convertie.',
  )

  await audit(admin, {
    organization_id: proposal.organization_id,
    actor_user_id: actorId,
    entity_type: 'bill_order',
    entity_id: order.id,
    action: 'traininghub.proposal.converted',
    message: 'Proposition convertie en commande et facture',
    metadata: { proposal_id: proposal.id, order_id: order.id, invoice_id: invoice.id, total_minor: totalMinor },
  })

  return { proposal, order, orderItems, invoice, invoiceItems }
}

async function issueCredits(admin: any, orderId: string, actorId: string) {
  const order = await getOrder(admin, orderId)
  const orderItems = await getOrderItems(admin, orderId)
  const credits = []

  for (const item of orderItems.length ? orderItems : [{ course_id: null, participant_count: 1, requested_hours: 0, line_total_minor: order.grand_total_minor }]) {
    const quantity = intValue(item.participant_count, 1)
    const credit = await insertFirst(
      admin,
      'bill_training_credits',
      [
        {
          organization_id: order.organization_id,
          order_id: order.id,
          order_item_id: item.id || null,
                    credit_type: 'training_delivery',
          status: 'available',
          quantity_total: quantity,
          quantity_remaining: quantity,
          hours_total: n(item.requested_hours || item.estimated_hours || 0),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            source: 'traininghub_revenue_lifecycle',
            created_by: actorId,
          },
        },
        {
          organization_id: order.organization_id,
          order_id: order.id,
          item_type: 'training_course',
                    status: 'available',
          quantity_total: quantity,
          quantity_remaining: quantity,
        },
        {
          organization_id: order.organization_id,
          order_id: order.id,
          source_type: 'order',
          source_id: order.id,
          credit_type: 'training_course',
          status: 'available',
        },
      ],
      'TRAININGHUB_CREDIT_CREATE_FAILED',
      'Crédit formation non créé.',
    )
    credits.push(credit)
  }

  await audit(admin, {
    organization_id: order.organization_id,
    actor_user_id: actorId,
    entity_type: 'bill_order',
    entity_id: order.id,
    action: 'traininghub.credits.issued',
    message: 'Crédits formation émis',
    metadata: { order_id: order.id, credits: credits.map((credit) => credit.id) },
  })

  return { order, credits }
}

async function createSessionFromOrder(admin: any, orderId: string, actorId: string) {
  const order = await getOrder(admin, orderId)
  const orderItems = await getOrderItems(admin, orderId)
  const firstItem = orderItems.find((item: any) => item.course_id) || orderItems[0] || {}
  const sessionCode = `TH-SES-${Date.now().toString(36).toUpperCase()}`

  const session = await insertFirst(
    admin,
    'trn_sessions',
    [
      {
        organization_id: order.organization_id,
        order_id: order.id,
        course_id: firstItem.course_id || null,
        session_code: sessionCode,
        title: clean(order.title) || 'Session formation TrainingHub',
        status: 'planned',
        delivery_mode: 'onsite',
        city: clean(order.city) || null,
        planned_participant_count: intValue(firstItem.participant_count, 1),
        planned_hours: intValue(firstItem.requested_hours || firstItem.estimated_hours, 6),
        scheduled_start_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          source: 'traininghub_revenue_lifecycle',
          order_id: order.id,
          created_by: actorId,
        },
      },
      {
        organization_id: order.organization_id,
        order_id: order.id,
        course_id: firstItem.course_id || null,
        session_code: sessionCode,
        status: 'planned',
        planned_participant_count: intValue(firstItem.participant_count, 1),
      },
      {
        organization_id: order.organization_id,
        course_id: firstItem.course_id || null,
        session_code: sessionCode,
        status: 'planned',
      },
    ],
    'TRAININGHUB_SESSION_CREATE_FAILED',
    'Session formation non créée.',
  )

  await audit(admin, {
    organization_id: order.organization_id,
    actor_user_id: actorId,
    entity_type: 'trn_session',
    entity_id: session.id,
    action: 'traininghub.session.created_from_order',
    message: 'Session créée depuis commande',
    metadata: { order_id: order.id, session_id: session.id },
  })

  return { order, session }
}

async function verifyPartnerChain(admin: any, organizationId: string) {
  const [accounts, subscriptions, proposals, orders, invoices, credits, sessions, participants, certificates] = await Promise.all([
    admin.from('bill_accounts').select('id,status').eq('organization_id', organizationId),
    admin.from('bill_subscriptions').select('id,status').eq('organization_id', organizationId),
    admin.from('bill_proposals').select('id,status,grand_total_minor').eq('organization_id', organizationId),
    admin.from('bill_orders').select('id,status,grand_total_minor').eq('organization_id', organizationId),
    admin.from('bill_invoices').select('id,status,grand_total_minor,amount_due_minor').eq('organization_id', organizationId),
    admin.from('bill_training_credits').select('id,status').eq('organization_id', organizationId),
    admin.from('trn_sessions').select('id,status').eq('organization_id', organizationId),
    admin.from('trn_session_participants').select('id,status').eq('organization_id', organizationId),
    admin.from('trn_certificates').select('id,status').eq('organization_id', organizationId),
  ])

  const counts = {
    accounts: accounts.data?.length || 0,
    subscriptions: subscriptions.data?.length || 0,
    proposals: proposals.data?.length || 0,
    orders: orders.data?.length || 0,
    invoices: invoices.data?.length || 0,
    credits: credits.data?.length || 0,
    sessions: sessions.data?.length || 0,
    participants: participants.data?.length || 0,
    certificates: certificates.data?.length || 0,
  }

  const score = Math.min(
    100,
    Math.round(
      (counts.accounts ? 12 : 0) +
        (counts.subscriptions ? 8 : 0) +
        (counts.proposals ? 14 : 0) +
        (counts.orders ? 14 : 0) +
        (counts.invoices ? 14 : 0) +
        (counts.credits ? 14 : 0) +
        (counts.sessions ? 14 : 0) +
        (counts.participants ? 5 : 0) +
        (counts.certificates ? 5 : 0),
    ),
  )

  return {
    organization_id: organizationId,
    score,
    counts,
    next_best_actions: [
      !counts.proposals ? 'Créer une proposition commerciale' : null,
      counts.proposals && !counts.orders ? 'Convertir une proposition acceptée en commande' : null,
      counts.orders && !counts.credits ? 'Émettre les crédits formation' : null,
      counts.orders && !counts.sessions ? 'Créer une session depuis commande' : null,
      counts.sessions && !counts.participants ? 'Ajouter les participants' : null,
      counts.participants && !counts.certificates ? 'Émettre les certificats' : null,
    ].filter(Boolean),
  }
}

export async function GET(request: NextRequest) {
  try {
    const context = await getTrainingHubContext()
    if (!context.isInternal && !context.isSuperAdmin) {
      throw new TrainingHubHttpError('Accès direction requis.', 403, 'TRAININGHUB_REVENUE_LIFECYCLE_INTERNAL_ONLY')
    }
    requireTrainingHubPermission(context, WRITE_PERMISSIONS)

    const organizationId = clean(request.nextUrl.searchParams.get('organization_id'))
    if (!organizationId) throw new TrainingHubHttpError('Partenaire requis.', 400, 'TRAININGHUB_ORG_REQUIRED')

    const admin = getServiceClient()
    return NextResponse.json({ ok: true, data: await verifyPartnerChain(admin, organizationId) })
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getTrainingHubContext()
    if (!context.isInternal && !context.isSuperAdmin) {
      throw new TrainingHubHttpError('Accès direction requis.', 403, 'TRAININGHUB_REVENUE_LIFECYCLE_INTERNAL_ONLY')
    }
    requireTrainingHubPermission(context, WRITE_PERMISSIONS)

    const body = (await request.json()) as JsonRecord
    const action = clean(body.action)
    const admin = getServiceClient()

    if (action === 'create_proposal') {
      return NextResponse.json({ ok: true, data: await createProposal(admin, body, context.profile.id) })
    }

    if (action === 'send_proposal') {
      return NextResponse.json({ ok: true, data: await sendProposal(admin, clean(body.proposal_id), context.profile.id) })
    }

    if (action === 'accept_proposal') {
      return NextResponse.json({ ok: true, data: await acceptProposal(admin, clean(body.proposal_id), context.profile.id) })
    }

    if (action === 'convert_to_order_invoice') {
      return NextResponse.json({ ok: true, data: await convertToOrderInvoice(admin, clean(body.proposal_id), context.profile.id) })
    }

    if (action === 'issue_credits') {
      return NextResponse.json({ ok: true, data: await issueCredits(admin, clean(body.order_id), context.profile.id) })
    }

    if (action === 'create_session_from_order') {
      return NextResponse.json({ ok: true, data: await createSessionFromOrder(admin, clean(body.order_id), context.profile.id) })
    }

    if (action === 'verify_partner_chain') {
      return NextResponse.json({ ok: true, data: await verifyPartnerChain(admin, clean(body.organization_id)) })
    }

    if (action === 'run_full_chain') {
      let proposalId = clean(body.proposal_id)
      let orderId = clean(body.order_id)
      const created: JsonRecord = {}

      if (!proposalId) {
        const proposalBundle = await createProposal(admin, body, context.profile.id)
        proposalId = proposalBundle.proposal.id
        created.proposal = proposalBundle.proposal
        created.proposalItem = proposalBundle.item
      }

      await sendProposal(admin, proposalId, context.profile.id)
      await acceptProposal(admin, proposalId, context.profile.id)
      const converted = await convertToOrderInvoice(admin, proposalId, context.profile.id)
      orderId = converted.order.id
      created.order = converted.order
      created.invoice = converted.invoice

      const credits = await issueCredits(admin, orderId, context.profile.id)
      created.credits = credits.credits

      const session = await createSessionFromOrder(admin, orderId, context.profile.id)
      created.session = session.session

      return NextResponse.json({
        ok: true,
        data: {
          created,
          verification: await verifyPartnerChain(admin, converted.order.organization_id),
        },
      })
    }

    throw new TrainingHubHttpError('Action revenue lifecycle inconnue.', 400, 'TRAININGHUB_REVENUE_ACTION_UNKNOWN')
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}
