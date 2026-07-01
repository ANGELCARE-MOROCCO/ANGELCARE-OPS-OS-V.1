import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function one(table, query) {
  const { data, error } = await query
  if (error) throw new Error(`${table}: ${error.message}`)
  return Array.isArray(data) ? data[0] : data
}

function missingSchemaColumn(error) {
  const text = String(error?.message || error?.details || '')
  const match = text.match(/Could not find the '([^']+)' column/i)
  return match?.[1] || null
}

function notNullColumn(error) {
  const text = String(error?.message || error?.details || '')
  const match = text.match(/null value in column "([^"]+)"/i)
  return match?.[1] || null
}

function defaultValueForRequiredColumn(table, column) {
  const defaults = {
    'bill_training_credits.credit_type': 'training_course',
    'bill_training_credits.source_type': 'order',
    'trn_sessions.session_code': `SMOKE-SES-${Date.now().toString(36).toUpperCase()}`,
    'trn_sessions.status': 'planned',
    'trn_sessions.delivery_mode': 'onsite',
    'bill_training_credits.status': 'available',
    'bill_training_credits.quantity_total': 1,
    'bill_training_credits.quantity_remaining': 1,
    'bill_training_credits.hours_total': 0,
    'bill_proposal_items.item_type': 'training_course',
    'bill_order_items.item_type': 'training_course',
    'bill_invoice_items.item_type': 'training_course',
    'bill_invoices.invoice_number': `SMOKE-INV-${Date.now().toString(36).toUpperCase()}`,
    'bill_orders.order_number': `SMOKE-ORD-${Date.now().toString(36).toUpperCase()}`,
    'bill_proposals.proposal_number': `SMOKE-PROP-${Date.now().toString(36).toUpperCase()}`,
  }

  return Object.prototype.hasOwnProperty.call(defaults, `${table}.${column}`) ? defaults[`${table}.${column}`] : undefined
}

async function insertFirst(table, payloads) {
  let lastError = null

  for (const payload of payloads) {
    let safePayload = { ...payload }

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const { data, error } = await supabase.from(table).insert(safePayload).select('*').maybeSingle()
      if (!error && data) return data

      lastError = error
      const missingColumn = missingSchemaColumn(error)
      if (missingColumn && Object.prototype.hasOwnProperty.call(safePayload, missingColumn)) {
        delete safePayload[missingColumn]
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

  throw lastError || new Error(`Insert failed: ${table}`)
}

const org = await one(
  'core_organizations',
  supabase.from('core_organizations').select('*').order('created_at', { ascending: false }).limit(1),
)

const course = await one(
  'trn_courses',
  supabase.from('trn_courses').select('*').order('created_at', { ascending: false }).limit(1),
)

if (!org?.id) throw new Error('No organization found. Run partner smoke first.')
if (!course?.id) throw new Error('No course found. Create at least one training course first.')

const totalMinor = Number(course.onsite_entry_price_minor || 950000)
const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)

const proposal = await insertFirst('bill_proposals', [
  {
    organization_id: org.id,
    proposal_number: `SMOKE-PROP-${stamp}`,
    title: `Smoke revenue lifecycle — ${course.title || course.ref}`,
    status: 'accepted',
    currency_code: 'MAD',
    subtotal_minor: totalMinor,
    grand_total_minor: totalMinor,
    metadata: { source: 'smoke_traininghub_revenue_lifecycle' },
  },
  {
    organization_id: org.id,
    title: `Smoke revenue lifecycle — ${course.title || course.ref}`,
    status: 'accepted',
    grand_total_minor: totalMinor,
  },
])

const proposalItem = await insertFirst('bill_proposal_items', [
  {
    proposal_id: proposal.id,
    organization_id: org.id,
        item_type: 'training_course',
    description: `${course.ref || 'TRN'} — ${course.title || 'Formation'}`,
    participant_count: 8,
    requested_hours: 6,
    line_total_minor: totalMinor,
    currency_code: 'MAD',
  },
  { proposal_id: proposal.id, course_id: course.id, item_type: 'training_course', line_total_minor: totalMinor },
])

const order = await insertFirst('bill_orders', [
  {
    organization_id: org.id,
    proposal_id: proposal.id,
    order_number: `SMOKE-ORD-${stamp}`,
    status: 'confirmed',
    currency_code: 'MAD',
    grand_total_minor: totalMinor,
    metadata: { source: 'smoke_traininghub_revenue_lifecycle' },
  },
  { organization_id: org.id, proposal_id: proposal.id, status: 'confirmed', grand_total_minor: totalMinor },
])

const orderItem = await insertFirst('bill_order_items', [
  {
    organization_id: org.id,
    order_id: order.id,
    item_type: 'training_course',
    proposal_item_id: proposalItem.id,
    course_id: course.id,
    participant_count: 8,
    requested_hours: 6,
    line_total_minor: totalMinor,
    currency_code: 'MAD',
  },
  { order_id: order.id, course_id: course.id, item_type: 'training_course', line_total_minor: totalMinor },
])

const invoice = await insertFirst('bill_invoices', [
  {
    organization_id: org.id,
    proposal_id: proposal.id,
    order_id: order.id,
    invoice_number: `SMOKE-INV-${stamp}`,
    status: 'issued',
    currency_code: 'MAD',
    grand_total_minor: totalMinor,
    amount_due_minor: totalMinor,
    metadata: { source: 'smoke_traininghub_revenue_lifecycle' },
  },
  { organization_id: org.id, order_id: order.id, invoice_number: `SMOKE-INV-${stamp}`, status: 'issued', grand_total_minor: totalMinor },
])

const invoiceItem = await insertFirst('bill_invoice_items', [
  {
    organization_id: org.id,
    invoice_id: invoice.id,
    item_type: 'training_course',
    order_item_id: orderItem.id,
        line_total_minor: totalMinor,
    currency_code: 'MAD',
  },
  { invoice_id: invoice.id, item_type: 'training_course', line_total_minor: totalMinor },
])

const credit = await insertFirst('bill_training_credits', [
  {
    organization_id: org.id,
    order_id: order.id,
    order_item_id: orderItem.id,
        status: 'available',
    quantity_total: 8,
    quantity_remaining: 8,
  },
  { organization_id: org.id, order_id: order.id, source_type: 'order', source_id: order.id, course_id: course.id, credit_type: 'training_course', status: 'available' },
])

const session = await insertFirst('trn_sessions', [
  {
    organization_id: org.id,
    order_id: order.id,
        session_code: `SMOKE-SES-${stamp}`,
    status: 'planned',
    planned_participant_count: 8,
    planned_hours: 6,
  },
  { organization_id: org.id, course_id: course.id, session_code: `SMOKE-SES-${stamp}`, status: 'planned' },
])

console.log('Smoke revenue lifecycle created:')
console.table([
  {
    organization: org.id,
    course: course.id,
    proposal: proposal.id,
    order: order.id,
    invoice: invoice.id,
    invoiceItem: invoiceItem.id,
    credit: credit.id,
    session: session.id,
  },
])
