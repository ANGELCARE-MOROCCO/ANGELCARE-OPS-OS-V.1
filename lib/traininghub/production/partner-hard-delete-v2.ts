import { createClient } from '@supabase/supabase-js'

export type PartnerHardDeleteV2Options = {
  organizationId: string
  allowNonSmoke?: boolean
  reason?: string
  actorProfileId?: string | null
  actorEmail?: string | null
}

export type PartnerHardDeleteV2Result = {
  ok: boolean
  organizationId: string
  method: 'rpc_v3' | 'js_fallback'
  data?: any
  error?: string | null
  message: string
}

const DIRECT_TABLES = [
  'partner_documents',
  'trn_certificates',
  'trn_session_participants',
  'trn_sessions',
  'bill_training_credits',
  'bill_invoice_lines',
  'bill_invoices',
  'bill_order_lines',
  'bill_orders',
  'bill_proposal_lines',
  'bill_proposals',
  'bill_subscription_items',
  'bill_subscriptions',
  'bill_accounts',
  'partner_requests',
  'traininghub_commercial_opportunities',
  'learn_entitlements',
  'core_organization_sites',
  'authz_user_role_assignments',
  'core_memberships',
] as const

function clean(value: unknown, fallback = '') {
  const text = String(value || '').trim()
  return text || fallback
}

function asArray(data: any) {
  return Array.isArray(data) ? data : data ? [data] : []
}

function normalize(value: unknown) {
  return clean(value).toLowerCase()
}

export function createPartnerHardDeleteV2AdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  }

  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function findOrganization(supabase: any, organizationId: string) {
  const { data, error } = await supabase
    .from('core_organizations')
    .select('*')
    .eq('id', organizationId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

function isSmoke(org: any) {
  if (!org) return true
  const haystack = [
    org.name,
    org.legal_name,
    org.display_name,
    org.email,
    org.primary_contact_email,
    org.billing_email,
    JSON.stringify(org.metadata || {}),
  ].map(normalize).join(' ')

  return haystack.includes('smoke') || haystack.includes('test') || haystack.includes('demo') || haystack.includes('sandbox')
}

async function deleteBy(supabase: any, table: string, column: string, value: string) {
  try {
    const { data, error } = await supabase.from(table).delete().eq(column, value).select('id')
    if (error) return { table, column, ok: false, count: 0, error: error.message }
    return { table, column, ok: true, count: asArray(data).length, error: null }
  } catch (error) {
    return { table, column, ok: true, count: 0, error: null }
  }
}

async function archiveOrganization(supabase: any, organizationId: string, reason: string) {
  const payload = {
    status: 'archived',
    access_status: 'archived',
    is_active: false,
    archived_at: new Date().toISOString(),
    deleted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {
      traininghub_delete_v2: {
        reason,
        at: new Date().toISOString(),
      },
    },
  }

  const { data, error } = await supabase
    .from('core_organizations')
    .update(payload)
    .eq('id', organizationId)
    .select('id')
  return { data, error }
}

async function jsFallbackHardDelete(supabase: any, options: PartnerHardDeleteV2Options) {
  const org = await findOrganization(supabase, options.organizationId)

  if (!org) {
    return {
      ok: true,
      organizationId: options.organizationId,
      method: 'js_fallback' as const,
      data: { alreadyDeleted: true },
      error: null,
      message: 'Partner already deleted or not found.',
    }
  }

  if (!isSmoke(org) && !options.allowNonSmoke) {
    return {
      ok: false,
      organizationId: options.organizationId,
      method: 'js_fallback' as const,
      data: { organizationName: org.name || org.legal_name || org.display_name, isSmoke: false },
      error: 'NOT_SMOKE_REFUSED',
      message: 'Hard delete refused because partner is not detected as smoke/test/demo.',
    }
  }

  const operations = []
  for (let pass = 0; pass < 6; pass += 1) {
    for (const table of DIRECT_TABLES) {
      operations.push(await deleteBy(supabase, table, 'organization_id', options.organizationId))
      operations.push(await deleteBy(supabase, table, 'partner_id', options.organizationId))
      operations.push(await deleteBy(supabase, table, 'org_id', options.organizationId))
    }
  }

  const finalDelete = await deleteBy(supabase, 'core_organizations', 'id', options.organizationId)
  operations.push(finalDelete)

  if (finalDelete.ok && finalDelete.count > 0) {
    return {
      ok: true,
      organizationId: options.organizationId,
      method: 'js_fallback' as const,
      data: { operations },
      error: null,
      message: 'Smoke partner permanently deleted through JS fallback.',
    }
  }

  const archive = await archiveOrganization(supabase, options.organizationId, options.reason || 'Hard delete fallback archive')
  return {
    ok: false,
    organizationId: options.organizationId,
    method: 'js_fallback' as const,
    data: { operations, archiveError: archive.error?.message || null },
    error: finalDelete.error || archive.error?.message || 'DELETE_BLOCKED',
    message: 'Hard delete still blocked. Partner was archived if possible; run SQL RPC v3 and paste finalError.',
  }
}

export async function hardDeleteTrainingHubPartnerV2(
  supabase: any,
  options: PartnerHardDeleteV2Options,
): Promise<PartnerHardDeleteV2Result> {
  const organizationId = clean(options.organizationId)
  if (!organizationId) throw new Error('organizationId is required.')

  const rpc = await supabase.rpc('traininghub_force_delete_partner_v3', {
    p_organization_id: organizationId,
    p_allow_non_smoke: Boolean(options.allowNonSmoke),
  })

  if (!rpc.error) {
    const data = rpc.data
    return {
      ok: data?.ok !== false,
      organizationId,
      method: 'rpc_v3',
      data,
      error: data?.ok === false ? clean(data?.finalError || data?.code || data?.message) : null,
      message: clean(data?.message, data?.ok === false ? 'RPC v3 returned failure.' : 'Partner deleted by RPC v3.'),
    }
  }

  const rpcMsg = clean(rpc.error?.message)
  if (rpcMsg.includes('traininghub_force_delete_partner_v3') || rpcMsg.includes('function') || rpcMsg.includes('schema cache')) {
    const fallback = await jsFallbackHardDelete(supabase, options)
    return {
      ...fallback,
      message: `${fallback.message} RPC v3 is not installed or not visible yet. Run database/traininghub_force_delete_partner_v3.sql in Supabase SQL editor.`,
      error: fallback.error || rpcMsg,
    }
  }

  return {
    ok: false,
    organizationId,
    method: 'rpc_v3',
    data: rpc.data,
    error: rpcMsg,
    message: `RPC v3 hard delete failed: ${rpcMsg}`,
  }
}
