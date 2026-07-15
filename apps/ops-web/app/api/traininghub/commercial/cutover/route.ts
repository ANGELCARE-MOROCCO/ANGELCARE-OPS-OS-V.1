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
const WRITE_PERMISSIONS = ['training.access.manage', 'training.proposal.create', 'training.proposal.send', 'training.delivery.manage', 'training.billing.manage']

function clean(value: unknown) {
  return String(value || '').trim()
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
  if (!url || !serviceKey) {
    throw new TrainingHubHttpError('Configuration serveur manquante: SUPABASE_SERVICE_ROLE_KEY requis pour le cutover production.', 500, 'TRAININGHUB_SERVICE_ROLE_MISSING')
  }
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } }) as any
}

async function countRows(admin: any, table: string, filter?: (query: any) => any) {
  try {
    let query = admin.from(table).select('id', { count: 'exact', head: true })
    if (filter) query = filter(query)
    const { count, error } = await query
    return { count: count || 0, error: error?.message || null }
  } catch (error) {
    return { count: 0, error: error instanceof Error ? error.message : String(error || 'Erreur inconnue') }
  }
}

async function fetchRows(admin: any, table: string, select = 'id', filter?: (query: any) => any, limit = 5000) {
  try {
    let query = admin.from(table).select(select).limit(limit)
    if (filter) query = filter(query)
    const { data, error } = await query
    return { data: Array.isArray(data) ? data : [], error: error?.message || null }
  } catch (error) {
    return { data: [], error: error instanceof Error ? error.message : String(error || 'Erreur inconnue') }
  }
}

function smokeFilter(query: any, table: string) {
  if (table === 'core_organizations') return query.or('name.ilike.%SMOKE%,name.ilike.%Smoke%,primary_contact_email.ilike.%traininghub-smoke%,billing_email.ilike.%traininghub-smoke%')
  if (table === 'core_user_profiles') return query.or('email.ilike.%traininghub-smoke%,email.ilike.%smoke-participant%,full_name.ilike.%Smoke%')
  if (table === 'bill_proposals') return query.or('proposal_number.ilike.%SMOKE%,title.ilike.%Smoke%')
  if (table === 'bill_orders') return query.or('order_number.ilike.%SMOKE%,title.ilike.%Smoke%')
  if (table === 'bill_invoices') return query.or('invoice_number.ilike.%SMOKE%,title.ilike.%Smoke%')
  if (table === 'trn_sessions') return query.or('session_code.ilike.%SMOKE%,title.ilike.%Smoke%')
  if (table === 'trn_session_participants') return query.or('email.ilike.%smoke-participant%,full_name.ilike.%Smoke%,participant_name.ilike.%Smoke%')
  if (table === 'trn_certificates') return query.or('certificate_number.ilike.%SMOKE%')
  return query
}

async function audit(admin: any, input: JsonRecord) {
  const payload = {
    organization_id: input.organization_id || null,
    actor_user_id: input.actor_user_id || null,
    entity_type: input.entity_type || 'traininghub_cutover',
    entity_id: input.entity_id || null,
    action: input.action || 'traininghub.cutover.action',
    severity: input.severity || 'info',
    message: input.message || input.action || 'Action cutover TrainingHub',
    metadata: { source: 'traininghub_cutover', ...input.metadata },
  }

  const attempts = [
    () => admin.from('audit_change_logs').insert(payload).select('*').maybeSingle(),
    () => admin.from('audit_security_logs').insert(payload).select('*').maybeSingle(),
    () => admin.from('auto_events').insert({ organization_id: payload.organization_id, event_type: payload.action, title: payload.message, status: 'open', payload: payload.metadata }).select('*').maybeSingle(),
  ]

  for (const attempt of attempts) {
    try {
      const { data, error } = await attempt()
      if (!error && data) return data
    } catch {}
  }
  return null
}

async function getCutoverStatus(admin: any) {
  const required = [
    ['core_organizations', 'Dossiers partenaires', 1],
    ['bill_accounts', 'Comptes partenaires', 1],
    ['core_user_profiles', 'Profils utilisateurs', 1],
    ['core_memberships', 'Memberships', 1],
    ['authz_user_role_assignments', 'Affectations rôles', 1],
    ['bill_proposals', 'Propositions', 1],
    ['bill_orders', 'Commandes', 1],
    ['bill_invoices', 'Factures', 1],
    ['bill_training_credits', 'Crédits formation', 1],
    ['trn_sessions', 'Sessions', 1],
    ['trn_session_participants', 'Participants', 1],
    ['trn_certificates', 'Certificats', 1],
  ] as const

  const checkpoints = []
  for (const [table, label, minimum] of required) {
    const result = await countRows(admin, table)
    checkpoints.push({ table, label, count: result.count, minimum, pass: !result.error && result.count >= minimum, error: result.error })
  }

  const smokeTables = ['core_organizations', 'core_user_profiles', 'bill_proposals', 'bill_orders', 'bill_invoices', 'trn_sessions', 'trn_session_participants', 'trn_certificates']
  const smoke = []
  for (const table of smokeTables) {
    const result = await countRows(admin, table, (query) => smokeFilter(query, table))
    smoke.push({ table, count: result.count, error: result.error })
  }

  const env = {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE),
  }

  const dataPass = checkpoints.every((row) => row.pass)
  const smokeCount = smoke.reduce((total, row) => total + row.count, 0)
  const envPass = Object.values(env).every(Boolean)
  const score = Math.max(0, Math.min(100, Math.round((dataPass ? 55 : checkpoints.filter((row) => row.pass).length * 4.5) + (envPass ? 20 : 0) + (smokeCount === 0 ? 25 : Math.max(0, 20 - smokeCount)))))

  return {
    score,
    data_pass: dataPass,
    env_pass: envPass,
    smoke_count: smokeCount,
    env,
    checkpoints,
    smoke,
    verdict: dataPass && envPass && smokeCount === 0
      ? 'Cutover prêt: chaîne validée, environnement présent, aucun smoke record détecté.'
      : dataPass && envPass
        ? 'Cutover presque prêt: chaîne validée, nettoyer les données smoke avant production réelle.'
        : 'Cutover à finaliser: vérifier les checkpoints ou variables serveur.',
  }
}

async function deleteByIds(admin: any, table: string, ids: string[]) {
  if (!ids.length) return { table, deleted: 0, error: null }
  try {
    const { error } = await admin.from(table).delete().in('id', ids)
    return { table, deleted: error ? 0 : ids.length, error: error?.message || null }
  } catch (error) {
    return { table, deleted: 0, error: error instanceof Error ? error.message : String(error || 'Erreur inconnue') }
  }
}

async function cleanupSmokeRecords(admin: any, actorId: string) {
  const smokeOrgs = await fetchRows(admin, 'core_organizations', 'id,name,primary_contact_email,billing_email', (query) => smokeFilter(query, 'core_organizations'))
  const smokeProfiles = await fetchRows(admin, 'core_user_profiles', 'id,auth_user_id,email,full_name', (query) => smokeFilter(query, 'core_user_profiles'))
  const orgIds = smokeOrgs.data.map((row: any) => row.id).filter(Boolean)
  const profileIds = smokeProfiles.data.map((row: any) => row.id).filter(Boolean)
  const authUserIds = smokeProfiles.data.map((row: any) => row.auth_user_id || row.id).filter(Boolean)
  const results: any[] = []

  const linkedTables = [
    'trn_certificates', 'trn_session_participants', 'trn_sessions', 'bill_training_credits',
    'bill_payments', 'bill_invoice_items', 'bill_invoices', 'bill_order_items',
    'bill_orders', 'bill_proposal_items', 'bill_proposals', 'bill_subscriptions',
    'bill_accounts', 'authz_user_role_assignments', 'core_memberships',
  ]

  for (const table of linkedTables) {
    if (orgIds.length) {
      const rows = await fetchRows(admin, table, 'id,organization_id', (query) => query.in('organization_id', orgIds), 5000)
      results.push(await deleteByIds(admin, table, rows.data.map((row: any) => row.id).filter(Boolean)))
    }
  }

  if (profileIds.length) {
    const membershipRows = await fetchRows(admin, 'core_memberships', 'id,user_id', (query) => query.in('user_id', profileIds), 5000)
    const roleRows = await fetchRows(admin, 'authz_user_role_assignments', 'id,user_id', (query) => query.in('user_id', profileIds), 5000)
    results.push(await deleteByIds(admin, 'authz_user_role_assignments', roleRows.data.map((row: any) => row.id).filter(Boolean)))
    results.push(await deleteByIds(admin, 'core_memberships', membershipRows.data.map((row: any) => row.id).filter(Boolean)))
    results.push(await deleteByIds(admin, 'core_user_profiles', profileIds))
  }

  if (orgIds.length) results.push(await deleteByIds(admin, 'core_organizations', orgIds))

  for (const authUserId of authUserIds) {
    try {
      const { error } = await admin.auth.admin.deleteUser(authUserId)
      results.push({ table: 'auth.users', deleted: error ? 0 : 1, error: error?.message || null })
    } catch (error) {
      results.push({ table: 'auth.users', deleted: 0, error: error instanceof Error ? error.message : String(error || 'Erreur inconnue') })
    }
  }

  await audit(admin, { actor_user_id: actorId, entity_type: 'traininghub_cutover', action: 'traininghub.cutover.smoke_cleanup', message: 'Nettoyage des données smoke TrainingHub', metadata: { orgIds, profileIds, results } })
  return { orgIds, profileIds, authUserIds, results, status: await getCutoverStatus(admin) }
}

export async function GET() {
  try {
    const context = await getTrainingHubContext()
    if (!context.isInternal && !context.isSuperAdmin) throw new TrainingHubHttpError('Accès direction requis.', 403, 'TRAININGHUB_CUTOVER_INTERNAL_ONLY')
    requireTrainingHubPermission(context, WRITE_PERMISSIONS)
    return NextResponse.json({ ok: true, data: await getCutoverStatus(getServiceClient()) })
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getTrainingHubContext()
    if (!context.isInternal && !context.isSuperAdmin) throw new TrainingHubHttpError('Accès direction requis.', 403, 'TRAININGHUB_CUTOVER_INTERNAL_ONLY')
    requireTrainingHubPermission(context, WRITE_PERMISSIONS)

    const body = await request.json().catch(() => ({}))
    const action = clean(body.action)
    const admin = getServiceClient()

    if (action === 'refresh') return NextResponse.json({ ok: true, data: await getCutoverStatus(admin) })
    if (action === 'cleanup_smoke_records') return NextResponse.json({ ok: true, data: await cleanupSmokeRecords(admin, context.profile.id) })
    if (action === 'lock_baseline') {
      const status = await getCutoverStatus(admin)
      await audit(admin, { actor_user_id: context.profile.id, entity_type: 'traininghub_cutover', action: 'traininghub.cutover.baseline_locked', message: 'Baseline production TrainingHub verrouillée', metadata: { status } })
      return NextResponse.json({ ok: true, data: status })
    }

    throw new TrainingHubHttpError('Action cutover inconnue.', 400, 'TRAININGHUB_CUTOVER_ACTION_UNKNOWN')
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}
