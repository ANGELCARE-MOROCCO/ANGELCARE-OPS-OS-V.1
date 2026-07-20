import { NextRequest, NextResponse } from 'next/server'
import { requireExtensionAdminApi, loadUserAccess } from '@/lib/browser-extension/runtime'
import { B2B_EXTENSION_CONTRACT, BROWSER_EXTENSION_MODULES } from '@/lib/browser-extension/catalog'
import { writeExtensionAudit } from '@/lib/browser-extension/audit'

const B2B_MODULE_KEY = 'revenue_b2b'
const ALLOWED_ADAPTERS = new Set(['angelcare_saas', 'generic_web', 'google_maps', 'gmail', 'whatsapp_web', 'google_calendar', 'linkedin_assisted'])
const B2B_MANAGED_ADAPTERS = new Set(['angelcare_saas', 'generic_web', 'google_maps', 'gmail', 'whatsapp_web', 'google_calendar'])
const ALLOWED_AUTONOMY = new Set(['READ_ONLY', 'SUGGEST_ONLY', 'USER_CONFIRMATION', 'MANAGER_APPROVAL', 'SAFE_AUTOMATION', 'BLOCKED'])
const ALLOWED_LEVELS = new Set(['NONE', 'VIEW', 'SUGGEST', 'CREATE', 'EXECUTE', 'APPROVE', 'ADMINISTER'])
const MANAGED_SCOPE_KEYS = new Set(['territories', 'verticals', 'account_ownership', 'data_visibility'])
const B2B_MODULE = BROWSER_EXTENSION_MODULES.find((item: any) => item.key === B2B_MODULE_KEY) as any
const B2B_SUBMODULE_KEYS = new Set((B2B_MODULE?.submodules || []).map((item: any) => item.key))
const B2B_CAPABILITY_KEYS = new Set(B2B_EXTENSION_CONTRACT.capabilities.map((item: any) => item.permission))
const OPERATIONAL_CAPABILITY_KEYS = new Set(B2B_EXTENSION_CONTRACT.capabilities.filter((item: any) => item.patch02Status === 'implemented' || item.patch03Status === 'implemented' || item.patch04Status === 'implemented' || item.patch05Status === 'implemented' || (item.patch06Status === 'implemented' || item.patch06Status === 'preserved')).map((item: any) => item.permission))

type Row = Record<string, any>

function profilePayload(access: Awaited<ReturnType<typeof loadUserAccess>>) {
  return {
    enabled: Boolean(access.profile?.enabled),
    defaultAutonomy: String(access.profile?.default_autonomy || 'USER_CONFIRMATION'),
    validUntil: access.profile?.valid_until || null,
    notes: access.profile?.notes || '',
    modules: (access.modules || []).map((row: Row) => ({ key: row.module_key, accessLevel: row.access_level || 'VIEW' })),
    submodules: (access.submodules || []).map((row: Row) => ({ moduleKey: row.module_key, key: row.submodule_key, accessLevel: row.access_level || 'VIEW' })),
    capabilities: (access.capabilities || []).map((row: Row) => ({ key: row.capability_key, moduleKey: row.module_key || B2B_MODULE_KEY, accessLevel: row.access_level || 'EXECUTE' })),
    adapters: (access.adapters || []).map((row: Row) => ({ key: row.adapter_key, permissionMode: row.permission_mode || 'ON_DEMAND' })),
    scopes: Object.fromEntries((access.scopes || []).map((row: Row) => [row.scope_key, row.scope_value || {}])),
    autonomy: (access.autonomy || []).map((row: Row) => ({ actionPattern: row.action_pattern, mode: row.mode, priority: row.priority || 0 })),
    approvals: (access.approvals || []).map((row: Row) => ({ commandPattern: row.command_pattern, approvalLevel: row.approval_level || 'manager', approverRole: row.approver_role || null })),
  }
}

async function loadSnapshot(db: any, userId: string) {
  const { data: user, error: userError } = await db
    .from('app_users')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (userError) {
    console.error('[BROWSER_EXTENSION_USER_SNAPSHOT]', userError)
    return null
  }

  if (!user) return null
  const access = await loadUserAccess(db, userId)
  const { data: devices } = await db.from('browser_extension_devices').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30)
  const deviceIds = (devices || []).map((row: Row) => row.id).filter(Boolean)
  let auditQuery = db.from('browser_extension_audit_logs').select('*').order('created_at', { ascending: false }).limit(60)
  if (deviceIds.length) auditQuery = auditQuery.or(`target_id.eq.${userId},device_id.in.(${deviceIds.join(',')})`)
  else auditQuery = auditQuery.eq('target_id', userId)
  const [{ data: audit }, { data: changes }] = await Promise.all([
    auditQuery,
    db.from('browser_extension_access_changes').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
  ])
  return { user, access, devices: devices || [], audit: audit || [], changes: changes || [] }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireExtensionAdminApi()
  if (!admin.ok) return admin.response
  const { id } = await params
  const snapshot = await loadSnapshot(admin.db, id)
  if (!snapshot) return NextResponse.json({ ok: false, error: 'User not found.' }, { status: 404 })
  return NextResponse.json({ ok: true, snapshot })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireExtensionAdminApi()
  if (!admin.ok) return admin.response
  const { id: userId } = await params
  const body = await req.json().catch(() => ({}))
  const incoming = body?.b2b || {}

  const { data: user } = await admin.db.from('app_users').select('id').eq('id', userId).maybeSingle()
  if (!user) return NextResponse.json({ ok: false, error: 'User not found.' }, { status: 404 })

  const moduleAccessLevel = String(incoming.moduleAccessLevel || 'EXECUTE')
  const capabilityAccessLevel = String(incoming.capabilityAccessLevel || 'EXECUTE')
  const b2bAutonomy = String(incoming.autonomy || 'USER_CONFIRMATION')
  if (!ALLOWED_LEVELS.has(moduleAccessLevel) || !ALLOWED_LEVELS.has(capabilityAccessLevel)) return NextResponse.json({ ok: false, error: 'Invalid access level.' }, { status: 400 })
  if (!ALLOWED_AUTONOMY.has(b2bAutonomy)) return NextResponse.json({ ok: false, error: 'Invalid B2B autonomy mode.' }, { status: 400 })

  const submodules: string[] = Array.from(new Set<string>((incoming.submodules || []).map((value: unknown) => String(value))))
  const capabilities: string[] = Array.from(new Set<string>((incoming.capabilities || []).map((value: unknown) => String(value))))
  const adapters: string[] = Array.from(new Set<string>((incoming.adapters || []).map((value: unknown) => String(value))))
  for (const key of submodules) if (!B2B_SUBMODULE_KEYS.has(key)) return NextResponse.json({ ok: false, error: `Unknown B2B submodule: ${key}` }, { status: 400 })
  for (const key of capabilities) {
    if (!B2B_CAPABILITY_KEYS.has(key)) return NextResponse.json({ ok: false, error: `Unknown B2B capability: ${key}` }, { status: 400 })
    if (!OPERATIONAL_CAPABILITY_KEYS.has(key)) return NextResponse.json({ ok: false, error: `Capability is contract-locked but not operational in Mega ZIP 6: ${key}` }, { status: 400 })
  }
  for (const key of adapters) if (!ALLOWED_ADAPTERS.has(key)) return NextResponse.json({ ok: false, error: `Unknown browser adapter: ${key}` }, { status: 400 })

  const existing = await loadUserAccess(admin.db, userId)
  const merged = profilePayload(existing)
  merged.enabled = Boolean(incoming.enabled)
  merged.validUntil = incoming.validUntil || null
  merged.notes = String(incoming.notes || '')

  merged.modules = merged.modules.filter((row: Row) => row.key !== B2B_MODULE_KEY)
  if (incoming.moduleEnabled) merged.modules.push({ key: B2B_MODULE_KEY, accessLevel: moduleAccessLevel })

  merged.submodules = merged.submodules.filter((row: Row) => row.moduleKey !== B2B_MODULE_KEY)
  if (incoming.moduleEnabled) merged.submodules.push(...submodules.map((key) => ({ moduleKey: B2B_MODULE_KEY, key, accessLevel: moduleAccessLevel })))

  merged.capabilities = merged.capabilities.filter((row: Row) => row.moduleKey !== B2B_MODULE_KEY)
  if (incoming.moduleEnabled) merged.capabilities.push(...capabilities.map((key) => ({ key, moduleKey: B2B_MODULE_KEY, accessLevel: capabilityAccessLevel })))

  merged.adapters = merged.adapters.filter((row: Row) => !B2B_MANAGED_ADAPTERS.has(row.key))
  merged.adapters.push(...adapters.filter((key) => B2B_MANAGED_ADAPTERS.has(key)).map((key) => ({ key, permissionMode: 'ON_DEMAND' })))

  for (const key of MANAGED_SCOPE_KEYS) delete merged.scopes[key]
  merged.scopes.territories = { values: Array.from(new Set((incoming.territories || []).map((value: unknown) => String(value).trim()).filter(Boolean))) }
  merged.scopes.verticals = { values: Array.from(new Set((incoming.verticals || []).map((value: unknown) => String(value).trim()).filter(Boolean))) }
  merged.scopes.account_ownership = { value: String(incoming.accountOwnership || 'assigned_or_created') }
  merged.scopes.data_visibility = { value: String(incoming.dataVisibility || 'authorized_b2b') }

  merged.autonomy = merged.autonomy.filter((row: Row) => row.actionPattern !== 'b2b.*')
  merged.autonomy.push({ actionPattern: 'b2b.*', mode: b2bAutonomy, priority: 100 })

  merged.approvals = merged.approvals.filter((row: Row) => !String(row.commandPattern || '').startsWith('b2b.'))
  if (incoming.requireSensitiveApproval) {
    const approverRole = String(incoming.approverRole || 'manager')
    for (const commandPattern of ['b2b.prospect.merge_request', 'b2b.prospect.branch_create', 'b2b.territory.mission_create', 'b2b.discount.request', 'b2b.proposal.submit_approval', 'b2b.proposal.mark_delivered', 'b2b.counteroffer.prepare', 'b2b.closing.gate_check', 'b2b.contract.status_update', 'b2b.payment.gate_check', 'b2b.payment_promise.verify_request', 'b2b.executive_intervention.prepare', 'b2b.handoff.accept', 'b2b.partner.activate', 'b2b.activation.approve', 'b2b.partner_issue.escalate', 'b2b.corrective_action.close', 'b2b.expansion.plan_create', 'b2b.renewal.proposal_prepare', 'b2b.tender.bid_decision', 'b2b.tender.submit', 'b2b.ai_director.accept_recommendation', 'b2b.management.account_reassign', 'b2b.management.opportunity_reassign', 'b2b.management.action_freeze', 'b2b.pipeline_truth.correction_apply', 'b2b.forecast.override_approve', 'b2b.revenue_risk.escalate', 'b2b.revenue_risk.resolve', 'b2b.coaching.review', 'b2b.automation.enable', 'b2b.automation.approval_decide', 'b2b.automation.kill']) {
      merged.approvals.push({ commandPattern, approvalLevel: 'manager', approverRole })
    }
  }

  const { data: accessVersion, error } = await admin.db.rpc('browser_extension_replace_user_access', {
    p_user_id: userId,
    p_assigned_by: admin.user.id,
    p_payload: merged,
  })
  if (error) {
    console.error('[USER_BROWSER_EXTENSION_ACCESS_SAVE]', error)
    return NextResponse.json({ ok: false, error: 'Unable to save Browser OS access. Verify the Mega ZIP 1 SQL migration.' }, { status: 500 })
  }

  await writeExtensionAudit(admin.db, {
    actor: admin.user,
    eventType: 'user_profile_b2b_extension_access_saved',
    moduleKey: B2B_MODULE_KEY,
    targetType: 'app_user',
    targetId: userId,
    result: 'ok',
    severity: 'medium',
    metadata: {
      accessVersion,
      enabled: merged.enabled,
      moduleEnabled: Boolean(incoming.moduleEnabled),
      submodules: submodules.length,
      capabilities: capabilities.length,
      adapters,
      territories: merged.scopes.territories,
      source: 'users_profile_browser_os_section',
    },
  })

  const snapshot = await loadSnapshot(admin.db, userId)

  if (!snapshot) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Access saved, but the user snapshot could not be reloaded.',
        accessVersion,
      },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, accessVersion, snapshot })
}
