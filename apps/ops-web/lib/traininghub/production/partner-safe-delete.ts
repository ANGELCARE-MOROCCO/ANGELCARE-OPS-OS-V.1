import { createClient } from '@supabase/supabase-js'

export type TrainingHubPartnerDeleteMode =
  | 'archive'
  | 'suspend'
  | 'hard_delete'
  | 'hard_delete_if_smoke_else_archive'

export type TrainingHubPartnerSafeDeleteOptions = {
  organizationId: string
  mode?: TrainingHubPartnerDeleteMode
  reason?: string
  actorProfileId?: string | null
  actorEmail?: string | null
  confirmSmokeDelete?: boolean
}

export type TrainingHubPartnerSafeDeleteResult = {
  ok: boolean
  organizationId: string
  organizationName: string
  requestedMode: TrainingHubPartnerDeleteMode
  executedMode: 'archive' | 'suspend' | 'hard_delete' | 'fallback_archive'
  smokeSafe: boolean
  operations: Array<{
    step: string
    table: string
    ok: boolean
    affected?: number | null
    error?: string | null
  }>
  errors: string[]
  message: string
}

type JsonRecord = Record<string, any>

const CHILD_TABLES = [
  'partner_documents',
  'trn_certificates',
  'trn_session_participants',
  'trn_sessions',
  'bill_training_credits',
  'bill_invoices',
  'bill_orders',
  'bill_proposals',
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

function normalize(value: unknown) {
  return clean(value).toLowerCase()
}

function nowIso() {
  return new Date().toISOString()
}

function parseDbError(error: any) {
  const msg = String(error?.message || error || '')
  return (
    msg.match(/Could not find the '([^']+)' column/i)?.[1] ||
    msg.match(/column [^.\s]+\.([a-zA-Z0-9_]+) does not exist/i)?.[1] ||
    msg.match(/null value in column "([^"]+)"/i)?.[1] ||
    ''
  )
}

function tableMissing(error: any) {
  const msg = String(error?.message || error || '').toLowerCase()
  return msg.includes('does not exist') || msg.includes('schema cache') || msg.includes('not find the table')
}

function asArray(data: any) {
  return Array.isArray(data) ? data : data ? [data] : []
}

export function createTrainingHubPartnerSafeDeleteAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  }

  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function getOrganization(supabase: any, organizationId: string) {
  const { data, error } = await supabase
    .from('core_organizations')
    .select('*')
    .eq('id', organizationId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data?.id) throw new Error(`Partner organization not found: ${organizationId}`)

  return data as JsonRecord
}

function isSmokeOrganization(org: JsonRecord) {
  const haystack = [
    org.name,
    org.legal_name,
    org.display_name,
    org.primary_contact_email,
    org.billing_email,
    org.email,
    org.segment,
    org.organization_type,
    org.partner_type,
    JSON.stringify(org.metadata || {}),
  ].map(normalize).join(' ')

  return (
    haystack.includes('smoke') ||
    haystack.includes('test') ||
    haystack.includes('demo') ||
    org.metadata?.is_smoke === true ||
    org.metadata?.smoke_test === true ||
    org.metadata?.test === true
  )
}

async function adaptiveUpdateByFilter(
  supabase: any,
  table: string,
  filterColumn: string,
  filterValue: string,
  payload: JsonRecord,
) {
  let row = JSON.parse(JSON.stringify(payload || {}))

  for (let attempt = 0; attempt < 24; attempt += 1) {
    try {
      const { data, error } = await supabase
        .from(table)
        .update(row)
        .eq(filterColumn, filterValue)
        .select('id')

      if (!error) {
        return { ok: true, affected: asArray(data).length, error: null }
      }

      if (tableMissing(error)) {
        return { ok: true, affected: 0, error: null }
      }

      const col = parseDbError(error)
      if (col && col in row) {
        delete row[col]
        continue
      }

      return { ok: false, affected: 0, error: error.message }
    } catch (error) {
      return { ok: false, affected: 0, error: error instanceof Error ? error.message : String(error || 'unknown') }
    }
  }

  return { ok: false, affected: 0, error: 'Adaptive update failed.' }
}

async function adaptiveDeleteByFilter(
  supabase: any,
  table: string,
  filterColumn: string,
  filterValue: string,
) {
  try {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq(filterColumn, filterValue)
      .select('id')

    if (!error) {
      return { ok: true, affected: asArray(data).length, error: null }
    }

    if (tableMissing(error)) {
      return { ok: true, affected: 0, error: null }
    }

    return { ok: false, affected: 0, error: error.message }
  } catch (error) {
    return { ok: false, affected: 0, error: error instanceof Error ? error.message : String(error || 'unknown') }
  }
}

async function adaptiveUpdateOrganization(supabase: any, organizationId: string, payload: JsonRecord) {
  return adaptiveUpdateByFilter(supabase, 'core_organizations', 'id', organizationId, payload)
}

async function adaptiveDeleteOrganization(supabase: any, organizationId: string) {
  return adaptiveDeleteByFilter(supabase, 'core_organizations', 'id', organizationId)
}

async function audit(supabase: any, options: TrainingHubPartnerSafeDeleteOptions, result: Partial<TrainingHubPartnerSafeDeleteResult>) {
  const payload = {
    organization_id: options.organizationId,
    event_type: 'traininghub.partner.safe_delete',
    title: `Partner delete action: ${result.executedMode || options.mode || 'archive'}`,
    status: result.ok === false ? 'failed' : 'completed',
    payload: {
      reason: options.reason || null,
      actor_profile_id: options.actorProfileId || null,
      actor_email: options.actorEmail || null,
      result,
    },
    created_at: nowIso(),
  }

  // auto_events may not exist in older local schemas. Ignore errors by design.
  await adaptiveUpdateByFilter(supabase, 'auto_events', 'id', '__never__', {}).catch(() => null)
  try {
    await supabase.from('auto_events').insert(payload)
  } catch {
    // no-op
  }
}

function archivePayload(org: JsonRecord, options: TrainingHubPartnerSafeDeleteOptions) {
  return {
    status: options.mode === 'suspend' ? 'suspended' : 'archived',
    stage: options.mode === 'suspend' ? 'suspended' : 'archived',
    access_status: options.mode === 'suspend' ? 'suspended' : 'archived',
    is_active: false,
    archived_at: nowIso(),
    deleted_at: nowIso(),
    updated_at: nowIso(),
    metadata: {
      ...(org.metadata || {}),
      traininghub_delete: {
        mode: options.mode || 'archive',
        reason: options.reason || null,
        actor_profile_id: options.actorProfileId || null,
        actor_email: options.actorEmail || null,
        at: nowIso(),
      },
    },
  }
}

function childArchivePayload(options: TrainingHubPartnerSafeDeleteOptions) {
  return {
    status: options.mode === 'suspend' ? 'suspended' : 'archived',
    access_status: options.mode === 'suspend' ? 'suspended' : 'archived',
    is_active: false,
    portal_visible: false,
    is_visible_to_partner: false,
    archived_at: nowIso(),
    deleted_at: nowIso(),
    updated_at: nowIso(),
  }
}

export async function deleteTrainingHubPartnerSafely(
  supabase: any,
  options: TrainingHubPartnerSafeDeleteOptions,
): Promise<TrainingHubPartnerSafeDeleteResult> {
  const organizationId = clean(options.organizationId)
  const requestedMode = options.mode || 'hard_delete_if_smoke_else_archive'

  if (!organizationId) {
    throw new Error('organizationId is required.')
  }

  const org = await getOrganization(supabase, organizationId)
  const organizationName = clean(org.name || org.legal_name || org.display_name, 'TrainingHub partner')
  const smokeSafe = isSmokeOrganization(org)
  const operations: TrainingHubPartnerSafeDeleteResult['operations'] = []

  const executeHardDelete =
    requestedMode === 'hard_delete' ||
    (requestedMode === 'hard_delete_if_smoke_else_archive' && (smokeSafe || options.confirmSmokeDelete === true))

  if (executeHardDelete) {
    // Hard delete is intended for smoke/demo/test data only. If FK constraints still block,
    // we fall back to archive so the UI action does not stay impossible.
    for (const table of CHILD_TABLES) {
      const result = await adaptiveDeleteByFilter(supabase, table, 'organization_id', organizationId)
      operations.push({ step: 'hard_delete_children', table, ok: result.ok, affected: result.affected, error: result.error })

      // Some older rows may use partner_id rather than organization_id.
      const byPartner = await adaptiveDeleteByFilter(supabase, table, 'partner_id', organizationId)
      operations.push({ step: 'hard_delete_children_partner_id', table, ok: byPartner.ok, affected: byPartner.affected, error: byPartner.error })
    }

    const orgDelete = await adaptiveDeleteOrganization(supabase, organizationId)
    operations.push({ step: 'hard_delete_organization', table: 'core_organizations', ok: orgDelete.ok, affected: orgDelete.affected, error: orgDelete.error })

    if (orgDelete.ok) {
      const result: TrainingHubPartnerSafeDeleteResult = {
        ok: true,
        organizationId,
        organizationName,
        requestedMode,
        executedMode: 'hard_delete',
        smokeSafe,
        operations,
        errors: operations.filter((item) => item.error).map((item) => `${item.table}: ${item.error}`),
        message: `${organizationName} deleted safely.`,
      }

      await audit(supabase, options, result).catch(() => null)
      return result
    }

    // Fall through to archive fallback if FK or schema constraints block hard delete.
    operations.push({
      step: 'hard_delete_fallback',
      table: 'core_organizations',
      ok: true,
      affected: 0,
      error: 'Hard delete blocked; fallback archive will be executed.',
    })
  }

  for (const table of CHILD_TABLES) {
    const result = await adaptiveUpdateByFilter(supabase, table, 'organization_id', organizationId, childArchivePayload(options))
    operations.push({ step: requestedMode === 'suspend' ? 'suspend_children' : 'archive_children', table, ok: result.ok, affected: result.affected, error: result.error })

    const byPartner = await adaptiveUpdateByFilter(supabase, table, 'partner_id', organizationId, childArchivePayload(options))
    operations.push({ step: requestedMode === 'suspend' ? 'suspend_children_partner_id' : 'archive_children_partner_id', table, ok: byPartner.ok, affected: byPartner.affected, error: byPartner.error })
  }

  const orgArchive = await adaptiveUpdateOrganization(supabase, organizationId, archivePayload(org, options))
  operations.push({ step: requestedMode === 'suspend' ? 'suspend_organization' : 'archive_organization', table: 'core_organizations', ok: orgArchive.ok, affected: orgArchive.affected, error: orgArchive.error })

  const ok = operations.some((item) => item.step.includes('organization') && item.ok)
  const errors = operations.filter((item) => item.error).map((item) => `${item.step}.${item.table}: ${item.error}`)

  const result: TrainingHubPartnerSafeDeleteResult = {
    ok,
    organizationId,
    organizationName,
    requestedMode,
    executedMode: executeHardDelete ? 'fallback_archive' : requestedMode === 'suspend' ? 'suspend' : 'archive',
    smokeSafe,
    operations,
    errors,
    message: ok
      ? `${organizationName} archived/suspended safely.`
      : `${organizationName} could not be archived; inspect database constraints.`,
  }

  await audit(supabase, options, result).catch(() => null)
  return result
}
