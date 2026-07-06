import { createClient } from '@supabase/supabase-js'

export type PermanentDeleteMode = 'smoke_only' | 'force_confirmed'

export type PermanentPartnerDeleteOptions = {
  organizationId: string
  actorEmail?: string | null
  actorProfileId?: string | null
  reason?: string
  confirmText?: string
  mode?: PermanentDeleteMode
}

type Operation = { step: string; table: string; ok: boolean; affected?: number; error?: string | null }

const DIRECT_TABLES = [
  'partner_document_versions',
  'partner_document_files',
  'partner_documents',
  'trn_certificates',
  'trn_session_attendance',
  'trn_attendance',
  'trn_session_participants',
  'trn_sessions',
  'bill_payment_allocations',
  'bill_invoice_lines',
  'bill_invoice_items',
  'bill_invoices',
  'bill_order_lines',
  'bill_order_items',
  'bill_orders',
  'bill_proposal_lines',
  'bill_proposal_items',
  'bill_proposals',
  'bill_training_credits',
  'bill_subscriptions',
  'bill_accounts',
  'traininghub_partner_business_rules',
  'traininghub_partner_billing_rules',
  'traininghub_partner_services',
  'traininghub_partner_access',
  'traininghub_commercial_opportunities',
  'partner_requests',
  'learn_entitlements',
  'core_organization_sites',
  'authz_user_role_assignments',
  'core_memberships',
  'core_user_profiles',
] as const

function clean(value: unknown, fallback = '') {
  const text = String(value || '').trim()
  return text || fallback
}

function normalize(value: unknown) {
  return clean(value).toLowerCase()
}

function asArray(data: any) {
  return Array.isArray(data) ? data : data ? [data] : []
}

function isMissingRelation(error: any) {
  const msg = String(error?.message || error || '').toLowerCase()
  return msg.includes('schema cache') || msg.includes('does not exist') || msg.includes('could not find the table') || msg.includes('could not find the')
}

function isSmokeOrg(org: any) {
  const haystack = [
    org?.name,
    org?.legal_name,
    org?.display_name,
    org?.email,
    org?.primary_contact_email,
    org?.billing_email,
    org?.segment,
    org?.organization_type,
    org?.partner_type,
    JSON.stringify(org?.metadata || {}),
  ].map(normalize).join(' ')

  return haystack.includes('smoke') || haystack.includes('test') || haystack.includes('demo') || org?.metadata?.is_smoke === true || org?.metadata?.smoke_test === true || org?.metadata?.test === true
}

export function createTrainingHubPermanentDeleteAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  }

  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function getOrg(supabase: any, organizationId: string) {
  const { data, error } = await supabase.from('core_organizations').select('*').eq('id', organizationId).maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

async function deleteEq(supabase: any, table: string, column: string, value: string): Promise<Operation> {
  try {
    const { data, error } = await supabase.from(table).delete().eq(column, value).select('id')
    if (error) {
      if (isMissingRelation(error)) return { step: 'delete_eq_skip_missing', table, ok: true, affected: 0, error: null }
      return { step: `delete_${column}`, table, ok: false, affected: 0, error: error.message }
    }
    return { step: `delete_${column}`, table, ok: true, affected: asArray(data).length, error: null }
  } catch (error) {
    return { step: `delete_${column}`, table, ok: true, affected: 0, error: null }
  }
}

async function idsBy(supabase: any, table: string, column: string, value: string) {
  try {
    const { data, error } = await supabase.from(table).select('id').eq(column, value).limit(1000)
    if (error) return []
    return asArray(data).map((item) => clean(item.id)).filter(Boolean)
  } catch {
    return []
  }
}

async function deleteIn(supabase: any, table: string, column: string, values: string[]): Promise<Operation> {
  if (!values.length) return { step: `delete_${column}_in_empty`, table, ok: true, affected: 0, error: null }
  try {
    const { data, error } = await supabase.from(table).delete().in(column, values).select('id')
    if (error) {
      if (isMissingRelation(error)) return { step: 'delete_in_skip_missing', table, ok: true, affected: 0, error: null }
      return { step: `delete_${column}_in`, table, ok: false, affected: 0, error: error.message }
    }
    return { step: `delete_${column}_in`, table, ok: true, affected: asArray(data).length, error: null }
  } catch {
    return { step: `delete_${column}_in`, table, ok: true, affected: 0, error: null }
  }
}

async function archiveFallback(supabase: any, organizationId: string, options: PermanentPartnerDeleteOptions) {
  const payload = {
    status: 'deleted',
    access_status: 'deleted',
    stage: 'deleted',
    is_active: false,
    archived_at: new Date().toISOString(),
    deleted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {
      permanent_delete_failed: true,
      deleted_from_ui: true,
      reason: options.reason || null,
      actor_email: options.actorEmail || null,
      actor_profile_id: options.actorProfileId || null,
    },
  }

  const { data, error } = await supabase.from('core_organizations').update(payload).eq('id', organizationId).select('id').maybeSingle()
  return { ok: !error, data, error: error?.message || null }
}

async function manualDelete(supabase: any, organizationId: string, options: PermanentPartnerDeleteOptions) {
  const org = await getOrg(supabase, organizationId)

  if (!org) {
    return { ok: true, hardDeleted: true, alreadyDeleted: true, organizationId, message: 'Partner already deleted.' }
  }

  const smokeSafe = isSmokeOrg(org)
  const explicit = options.confirmText === 'I_UNDERSTAND_DELETE_PARTNER_PERMANENTLY'

  if (!smokeSafe && !explicit) {
    return { ok: false, blocked: true, smokeSafe, organizationId, message: 'Permanent delete blocked: partner is not smoke/test/demo.' }
  }

  const operations: Operation[] = []
  const sessionIds = Array.from(new Set([...(await idsBy(supabase, 'trn_sessions', 'organization_id', organizationId)), ...(await idsBy(supabase, 'trn_sessions', 'partner_id', organizationId))]))
  const invoiceIds = Array.from(new Set([...(await idsBy(supabase, 'bill_invoices', 'organization_id', organizationId)), ...(await idsBy(supabase, 'bill_invoices', 'partner_id', organizationId))]))
  const orderIds = Array.from(new Set([...(await idsBy(supabase, 'bill_orders', 'organization_id', organizationId)), ...(await idsBy(supabase, 'bill_orders', 'partner_id', organizationId))]))
  const proposalIds = Array.from(new Set([...(await idsBy(supabase, 'bill_proposals', 'organization_id', organizationId)), ...(await idsBy(supabase, 'bill_proposals', 'partner_id', organizationId))]))
  const documentIds = Array.from(new Set([...(await idsBy(supabase, 'partner_documents', 'organization_id', organizationId)), ...(await idsBy(supabase, 'partner_documents', 'partner_id', organizationId))]))

  for (const table of ['trn_session_participants', 'trn_session_attendance', 'trn_attendance', 'trn_certificates']) operations.push(await deleteIn(supabase, table, 'session_id', sessionIds))
  for (const table of ['bill_invoice_lines', 'bill_invoice_items', 'bill_payment_allocations']) operations.push(await deleteIn(supabase, table, 'invoice_id', invoiceIds))
  for (const table of ['bill_order_lines', 'bill_order_items']) operations.push(await deleteIn(supabase, table, 'order_id', orderIds))
  for (const table of ['bill_proposal_lines', 'bill_proposal_items']) operations.push(await deleteIn(supabase, table, 'proposal_id', proposalIds))
  for (const table of ['partner_document_versions', 'partner_document_files']) operations.push(await deleteIn(supabase, table, 'document_id', documentIds))

  for (let pass = 0; pass < 4; pass += 1) {
    for (const table of DIRECT_TABLES) {
      operations.push(await deleteEq(supabase, table, 'organization_id', organizationId))
      operations.push(await deleteEq(supabase, table, 'partner_id', organizationId))
      operations.push(await deleteEq(supabase, table, 'org_id', organizationId))
    }
  }

  const orgDelete = await deleteEq(supabase, 'core_organizations', 'id', organizationId)
  operations.push(orgDelete)

  if (orgDelete.ok && (orgDelete.affected || 0) > 0) {
    return {
      ok: true,
      hardDeleted: true,
      rpcUsed: false,
      organizationId,
      organizationName: clean(org.name || org.legal_name || org.display_name, 'Partner'),
      smokeSafe,
      operations,
      message: 'Partner permanently deleted with manual fallback.',
    }
  }

  const fallback = await archiveFallback(supabase, organizationId, options)
  return {
    ok: fallback.ok,
    hardDeleted: false,
    fallbackArchived: fallback.ok,
    rpcUsed: false,
    organizationId,
    organizationName: clean(org.name || org.legal_name || org.display_name, 'Partner'),
    smokeSafe,
    operations,
    errors: operations.filter((op) => op.error).map((op) => `${op.table}: ${op.error}`),
    message: fallback.ok
      ? 'Permanent delete was blocked by a remaining FK, so the smoke partner was marked deleted/hidden. Install the SQL RPC for full hard delete.'
      : 'Permanent delete failed. Install and run database/traininghub_smoke_partner_hard_delete.sql.',
  }
}

async function audit(supabase: any, options: PermanentPartnerDeleteOptions, result: any) {
  try {
    await supabase.from('auto_events').insert({
      organization_id: options.organizationId,
      event_type: 'traininghub.partner.permanent_delete',
      title: 'TrainingHub partner permanent delete',
      status: result?.ok === false ? 'failed' : 'completed',
      payload: { options, result },
      created_at: new Date().toISOString(),
    })
  } catch {
    // ignore audit table absence
  }
}

export async function permanentlyDeleteTrainingHubPartner(supabase: any, options: PermanentPartnerDeleteOptions) {
  const organizationId = clean(options.organizationId)
  if (!organizationId) throw new Error('organizationId is required.')

  const confirmText = options.confirmText || (options.mode === 'force_confirmed' ? 'I_UNDERSTAND_DELETE_PARTNER_PERMANENTLY' : null)

  const rpc = await supabase.rpc('traininghub_hard_delete_partner_cascade', {
    p_org_id: organizationId,
    p_confirm_text: confirmText,
  })

  if (!rpc.error) {
    const result = {
      ...(rpc.data || {}),
      ok: rpc.data?.ok !== false,
      rpcUsed: true,
      organizationId,
    }
    await audit(supabase, options, result)
    return result
  }

  const result = await manualDelete(supabase, organizationId, options)
  await audit(supabase, options, result)
  return {
    ...result,
    rpcError: rpc.error.message,
  }
}
