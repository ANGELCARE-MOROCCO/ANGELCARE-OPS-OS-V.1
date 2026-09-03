/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { requireAngelcare360OperatorPermission } from '@/lib/angelcare360/operator/access'
import { launchTenantSupportAccess, requestTenantSupportAccess } from '@/lib/angelcare360/operator/tenant-access'
import { createServiceClient } from '@/lib/supabase/server'
import { recordDemoEvent } from '@/lib/sanila-demo/authority'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function snapshot(configId?: string | null) {
  const db = await createServiceClient()
  let query = db.from('sanila_demo_configs').select('*').eq('classification', 'master_demo').eq('active', true)
  if (configId) query = query.eq('id', configId)
  const { data: config, error } = await query.maybeSingle()
  if (error) throw error
  if (!config) return null
  const [tenant, school, admin, grants, sessions, events, resets, sideEffects] = await Promise.all([
    db.from('angelcare360_operator_tenants').select('id,client_id,school_id,tenant_slug,environment,status,provisioning_status,command_center_url').eq('id', config.operator_tenant_id).maybeSingle(),
    db.from('angelcare360_schools').select('id,school_code,name,status,metadata_json').eq('id', config.school_id).maybeSingle(),
    config.school_admin_app_user_id ? db.from('app_users').select('id,email,full_name,status').eq('id', config.school_admin_app_user_id).maybeSingle() : Promise.resolve({ data: null }),
    db.from('sanila_demo_access_grants').select('id,status,approval_state,used_count,effective_expires_at').eq('config_id', config.id).order('created_at', { ascending: false }).limit(200),
    db.from('sanila_demo_sessions').select('id,grant_id,effective_expires_at,last_seen_at,revoked_at,grant:sanila_demo_access_grants(status)').eq('config_id', config.id).order('created_at', { ascending: false }).limit(200),
    db.from('sanila_demo_access_events').select('*').eq('config_id', config.id).order('created_at', { ascending: false }).limit(30),
    db.from('sanila_demo_reset_runs').select('*').eq('config_id', config.id).order('started_at', { ascending: false }).limit(20),
    db.from('sanila_demo_side_effect_events').select('*').eq('config_id', config.id).order('created_at', { ascending: false }).limit(20),
  ])
  const now = Date.now(); const grantRows = grants.data || []; const sessionRows = sessions.data || []
  return { config, tenant: tenant.data, school: school.data, schoolAdmin: admin.data, counts: config.seed_counts || {}, activeGrants: grantRows.filter((grant: any) => ['ready', 'active'].includes(grant.status)).length, validSessions: config.access_status === 'active' ? sessionRows.filter((session: any) => !session.revoked_at && ['active', 'exhausted'].includes(session.grant?.status) && new Date(session.effective_expires_at).getTime() > now).length : 0, grants: grantRows, sessions: sessionRows, events: events.data || [], resets: resets.data || [], sideEffects: sideEffects.data || [], environmentHealth: { classification: Boolean(school.data?.metadata_json?.sanila_master_demo), tenantLinked: tenant.data?.school_id === config.school_id, seedHealthy: config.seed_health === 'healthy', safetyEnforced: config.safety_status === 'enforced', nonBillable: config.billing_mode === 'non_billable' } }
}

export async function GET() {
  try { await requireAngelcare360OperatorPermission('operator.demo.environment.view'); return NextResponse.json({ ok: true, snapshot: await snapshot() }) }
  catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Accès refusé.' }, { status: 403 }) }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAngelcare360OperatorPermission('operator.demo.environment.manage')
    const body = await request.json() as Record<string, any>
    const db = await createServiceClient()
    if (body.action === 'configure') {
      if (!body.operatorTenantId || !body.schoolId || !body.schoolAdminAppUserId || body.confirmation !== 'CLASSIFY SANILA MASTER DEMO') return NextResponse.json({ ok: false, error: 'Tenant, école, School Admin et confirmation exacte requis.' }, { status: 422 })
      const [tenant, school, admin, adminRole] = await Promise.all([
        db.from('angelcare360_operator_tenants').select('id,school_id,status,environment').eq('id', body.operatorTenantId).maybeSingle(),
        db.from('angelcare360_schools').select('id,status,metadata_json').eq('id', body.schoolId).maybeSingle(),
        db.from('app_users').select('id,status').eq('id', body.schoolAdminAppUserId).maybeSingle(),
        db.from('angelcare360_user_roles').select('id').eq('app_user_id', body.schoolAdminAppUserId).eq('school_id', body.schoolId).eq('status', 'active').limit(1).maybeSingle(),
      ])
      if (!tenant.data || !school.data || tenant.data.school_id !== body.schoolId || tenant.data.status !== 'active' || school.data.status !== 'active' || admin.data?.status !== 'active' || !adminRole.data) return NextResponse.json({ ok: false, error: 'Le tenant, l’école et le School Admin actif avec rôle école doivent être liés.' }, { status: 422 })
      const { data, error } = await db.rpc('sanila_configure_master_demo', { p_operator_tenant_id: body.operatorTenantId, p_school_id: body.schoolId, p_school_admin_app_user_id: body.schoolAdminAppUserId, p_actor_user_id: actor.user.id })
      if (error) throw error
      return NextResponse.json({ ok: true, snapshot: await snapshot(data.id) })
    }
    const config = (await db.from('sanila_demo_configs').select('*').eq('id', body.configId).eq('classification', 'master_demo').eq('active', true).maybeSingle()).data
    if (!config) return NextResponse.json({ ok: false, error: 'Master Demo introuvable.' }, { status: 404 })
    if (body.action === 'suspend' || body.action === 'reactivate') {
      const required = body.action === 'suspend' ? 'SUSPEND ALL DEMO ACCESS' : 'REACTIVATE SANILA MASTER DEMO'
      if (body.confirmation !== required) return NextResponse.json({ ok: false, error: 'Confirmation exacte requise.' }, { status: 422 })
      const accessStatus = body.action === 'suspend' ? 'suspended' : 'active'
      await db.from('sanila_demo_configs').update({ access_status: accessStatus, updated_by: actor.user.id, updated_at: new Date().toISOString() }).eq('id', config.id)
      await recordDemoEvent({ configId: config.id, actorUserId: actor.user.id, eventType: body.action === 'suspend' ? 'environment_suspended' : 'environment_reactivated', severity: 'warning' })
      return NextResponse.json({ ok: true, snapshot: await snapshot(config.id) })
    }
    if (body.action === 'verify') {
      const { data, error } = await db.rpc('sanila_verify_master_demo', { p_config_id: config.id }); if (error) throw error
      await recordDemoEvent({ configId: config.id, actorUserId: actor.user.id, eventType: 'canonical_verify_completed', severity: data?.ok ? 'notice' : 'critical', metadata: data || {} })
      return NextResponse.json({ ok: Boolean(data?.ok), verify: data, snapshot: await snapshot(config.id) }, { status: data?.ok ? 200 : 409 })
    }
    if (body.action === 'seed') {
      if (body.confirmation !== 'SEED SANILA MASTER DEMO') return NextResponse.json({ ok: false, error: 'Saisissez SEED SANILA MASTER DEMO.' }, { status: 422 })
      const { data, error } = await db.rpc('sanila_seed_master_demo', { p_config_id: config.id }); if (error) throw error
      await recordDemoEvent({ configId: config.id, actorUserId: actor.user.id, eventType: 'canonical_seed_requested', severity: data?.ok ? 'notice' : 'critical', metadata: data || {} })
      return NextResponse.json({ ok: Boolean(data?.ok), seed: data, snapshot: await snapshot(config.id) }, { status: data?.ok ? 200 : 409 })
    }
    if (body.action === 'reset') {
      if (body.confirmation !== 'RESET SANILA MASTER DEMO') return NextResponse.json({ ok: false, error: 'Saisissez RESET SANILA MASTER DEMO.' }, { status: 422 })
      const { data, error } = await db.rpc('sanila_reset_master_demo', { p_config_id: config.id, p_requested_by: actor.user.id }); if (error) throw error
      return NextResponse.json({ ok: Boolean(data?.ok), reset: data, snapshot: await snapshot(config.id) }, { status: data?.ok ? 200 : 409 })
    }
    if (body.action === 'open_internal') {
      const tenant = (await db.from('angelcare360_operator_tenants').select('id,client_id').eq('id', config.operator_tenant_id).single()).data
      if (!tenant) return NextResponse.json({ ok: false, error: 'Tenant Master Demo introuvable.' }, { status: 404 })
      const requested = await requestTenantSupportAccess({ clientId: tenant.client_id, tenantId: tenant.id, reason: 'Inspection interne du SANILA Master Demo', accessMode: 'read_only', durationHours: 1 })
      if (!requested.ok) return NextResponse.json(requested, { status: 422 })
      const launched = await launchTenantSupportAccess({ id: requested.session.id })
      if (!launched.ok) return NextResponse.json(launched, { status: 422 })
      const response = NextResponse.json({ ok: true, url: launched.supportUrl, expiresAt: launched.expiresAt })
      response.cookies.set('angelcare360_support_access', launched.supportSessionId!, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/angelcare-360-command-center', maxAge: 3600 })
      return response
    }
    return NextResponse.json({ ok: false, error: 'Action inconnue.' }, { status: 400 })
  } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Action impossible.' }, { status: 400 }) }
}
