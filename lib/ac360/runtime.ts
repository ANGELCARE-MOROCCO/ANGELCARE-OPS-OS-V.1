import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import type { Ac360AccessDecision } from './types'

export type Ac360CurrentUser = {
  id?: string
  email?: string
  full_name?: string
  name?: string
  role?: string
  role_key?: string
  permissions?: string[]
} | null

export type Ac360BootstrapInput = {
  orgCode?: string
  displayName?: string
  ownerEmail?: string
  planKey?: 'start' | 'pro' | 'command'
  city?: string
  status?: 'trial' | 'active'
}

function normalizePermissions(user: Ac360CurrentUser) {
  return Array.isArray(user?.permissions) ? user!.permissions!.map(String) : []
}

export function isAc360RuntimeAdmin(user: Ac360CurrentUser) {
  const role = String(user?.role || user?.role_key || '').toLowerCase()
  const permissions = normalizePermissions(user)
  return ['ceo', 'owner', 'super_admin', 'admin'].includes(role) || permissions.includes('*') || permissions.includes('ac360.foundation.manage') || permissions.includes('ac360.billing.manage')
}

export async function requireAc360Admin() {
  const user = (await getCurrentUser().catch(() => null)) as Ac360CurrentUser
  if (!user?.id) {
    return { ok: false as const, status: 401, error: 'Unauthorized AC360 session. Please sign in again.', user: null }
  }
  if (!isAc360RuntimeAdmin(user)) {
    return { ok: false as const, status: 403, error: 'AC360 foundation action requires CEO / owner / super admin permission.', user }
  }
  return { ok: true as const, user }
}

export async function getAc360CurrentContext(orgId?: string) {
  const db = await createClient()
  const user = (await getCurrentUser().catch(() => null)) as Ac360CurrentUser

  if (!user?.id && !orgId) {
    return { ok: false, error: 'No signed-in user or orgId supplied.', user: null, context: null }
  }

  let membershipQuery = db
    .from('ac360_user_memberships')
    .select('*, organization:ac360_organizations(*), campus:ac360_campuses(*)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1) as any

  if (orgId) membershipQuery = membershipQuery.eq('org_id', orgId)
  else membershipQuery = membershipQuery.eq('app_user_id', user?.id)

  const { data: memberships, error: membershipError } = await membershipQuery
  if (membershipError) return { ok: false, error: membershipError.message, user, context: null }

  let org = memberships?.[0]?.organization || null
  let membership = memberships?.[0] || null

  if (!org && orgId) {
    const { data: orgRow, error: orgError } = await db.from('ac360_organizations').select('*').eq('id', orgId).maybeSingle()
    if (orgError) return { ok: false, error: orgError.message, user, context: null }
    org = orgRow || null
  }

  if (!org) {
    return { ok: true, user, context: null, needsBootstrap: true }
  }

  const [subscriptionRes, walletRes, restrictionsRes, recommendationsRes] = await Promise.all([
    db.from('ac360_subscriptions').select('*, plan:ac360_plans(*), plan_version:ac360_plan_versions(*)').eq('org_id', org.id).in('status', ['trial', 'active', 'grace', 'past_due', 'restricted']).order('created_at', { ascending: false }).limit(1),
    db.from('ac360_credit_wallets').select('*').eq('org_id', org.id).eq('wallet_key', 'main').maybeSingle(),
    db.from('ac360_restrictions').select('*').eq('org_id', org.id).eq('status', 'active').order('created_at', { ascending: false }).limit(20),
    db.from('ac360_recommendations').select('*').eq('org_id', org.id).eq('status', 'open').order('created_at', { ascending: false }).limit(20),
  ] as any)

  return {
    ok: true,
    user,
    context: {
      org,
      membership,
      subscription: subscriptionRes.data?.[0] || null,
      wallet: walletRes.data || null,
      restrictions: restrictionsRes.data || [],
      recommendations: recommendationsRes.data || [],
    },
    needsBootstrap: false,
  }
}

export async function bootstrapAc360FoundationOrg(input: Ac360BootstrapInput = {}) {
  const gate = await requireAc360Admin()
  if (!gate.ok) return gate

  const user = gate.user
  const db = await createClient()
  const ownerEmail = input.ownerEmail || user.email || undefined

  const { data, error } = await db.rpc('ac360_bootstrap_foundation_org', {
    p_org_code: input.orgCode || 'ANGELCARE360-INTERNAL',
    p_display_name: input.displayName || 'AngelCare 360 Internal Command',
    p_owner_app_user_id: user.id || null,
    p_owner_email: ownerEmail || null,
    p_plan_key: input.planKey || 'command',
    p_city: input.city || 'Temara',
    p_status: input.status || 'active',
  })

  if (error) return { ok: false, status: 500, error: error.message || 'AC360 bootstrap failed.' }
  return { ok: true, data }
}

export async function getAc360BillingCenter(orgId?: string) {
  const context = await getAc360CurrentContext(orgId)
  if (!context.ok || !context.context?.org?.id) return { ...context, billing: null }

  const db = await createClient()
  const resolvedOrgId = context.context.org.id

  try {
    await db.rpc('ac360_reconcile_lifecycle', { p_org_id: resolvedOrgId })
  } catch {
    // Lifecycle reconciliation should never block billing center rendering.
  }

  const [items, addons, invoices, invoiceLines, usage, walletLedger, features, entitlements, meters] = await Promise.all([
    db.from('ac360_subscription_items').select('*').eq('org_id', resolvedOrgId).order('created_at', { ascending: false }),
    db.from('ac360_addons').select('*').eq('status', 'active').order('family', { ascending: true }),
    db.from('ac360_invoices').select('*').eq('org_id', resolvedOrgId).order('created_at', { ascending: false }).limit(12),
    db.from('ac360_invoice_lines').select('*').eq('org_id', resolvedOrgId).order('created_at', { ascending: false }).limit(80),
    db.from('ac360_usage_summaries').select('*').eq('org_id', resolvedOrgId).order('period_start', { ascending: false }).limit(80),
    db.from('ac360_credit_ledger').select('*').eq('org_id', resolvedOrgId).order('created_at', { ascending: false }).limit(50),
    db.from('ac360_feature_registry').select('*').eq('status', 'active').order('module_key', { ascending: true }),
    context.context.subscription?.plan_version_id
      ? db.from('ac360_plan_entitlements').select('*').eq('plan_version_id', context.context.subscription.plan_version_id).order('feature_key', { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    db.from('ac360_usage_meters').select('*').eq('status', 'active').order('category', { ascending: true }),
  ] as any)

  const activeAddonKeys = new Set((items.data || []).filter((item: any) => item.item_type === 'addon' && ['active', 'cancel_pending'].includes(item.status)).map((item: any) => item.addon_key))

  return {
    ...context,
    billing: {
      items: items.data || [],
      addons: addons.data || [],
      activeAddonKeys: Array.from(activeAddonKeys),
      invoices: invoices.data || [],
      invoiceLines: invoiceLines.data || [],
      usage: usage.data || [],
      walletLedger: walletLedger.data || [],
      features: features.data || [],
      entitlements: entitlements.data || [],
      meters: meters.data || [],
    },
  }
}

export async function activateAc360Addon(input: { orgId: string; addonKey: string; quantity?: number; billingInterval?: string }) {
  const gate = await requireAc360Admin()
  if (!gate.ok) return gate
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_activate_addon', {
    p_org_id: input.orgId,
    p_addon_key: input.addonKey,
    p_quantity: input.quantity || 1,
    p_billing_interval: input.billingInterval || 'monthly',
    p_actor_app_user_id: gate.user.id || null,
  })
  if (error) return { ok: false, status: 500, error: error.message || 'AC360 add-on activation failed.' }
  return { ok: true, data }
}

export async function cancelAc360Addon(input: { orgId: string; addonKey: string; cancelAtPeriodEnd?: boolean }) {
  const gate = await requireAc360Admin()
  if (!gate.ok) return gate
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_cancel_addon', {
    p_org_id: input.orgId,
    p_addon_key: input.addonKey,
    p_cancel_at_period_end: input.cancelAtPeriodEnd ?? true,
    p_actor_app_user_id: gate.user.id || null,
  })
  if (error) return { ok: false, status: 500, error: error.message || 'AC360 add-on cancellation failed.' }
  return { ok: true, data }
}

export async function grantAc360Credits(input: { orgId: string; amount: number; reason?: string; idempotencyKey?: string }) {
  const gate = await requireAc360Admin()
  if (!gate.ok) return gate
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_grant_credits', {
    p_org_id: input.orgId,
    p_amount: input.amount,
    p_reason: input.reason || 'Manual AC360 top-up',
    p_actor_app_user_id: gate.user.id || null,
    p_idempotency_key: input.idempotencyKey || null,
  })
  if (error) return { ok: false, status: 500, error: error.message || 'AC360 credit grant failed.' }
  return { ok: true, data }
}

export async function generateAc360Invoice(input: { orgId: string; periodStart?: string; periodEnd?: string; status?: string }) {
  const gate = await requireAc360Admin()
  if (!gate.ok) return gate
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_generate_subscription_invoice', {
    p_org_id: input.orgId,
    p_period_start: input.periodStart || null,
    p_period_end: input.periodEnd || null,
    p_status: input.status || 'issued',
  })
  if (error) return { ok: false, status: 500, error: error.message || 'AC360 invoice generation failed.' }
  return { ok: true, data }
}

export async function reconcileAc360Lifecycle(orgId: string) {
  const gate = await requireAc360Admin()
  if (!gate.ok) return gate
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_reconcile_lifecycle', { p_org_id: orgId })
  if (error) return { ok: false, status: 500, error: error.message || 'AC360 lifecycle reconciliation failed.' }
  return { ok: true, data }
}

export async function requireAc360FeatureAccess(input: { orgId: string; featureKey: string; actionKey?: string; quantity?: number }): Promise<Ac360AccessDecision> {
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_has_feature', {
    p_org_id: input.orgId,
    p_feature_key: input.featureKey,
    p_action_key: input.actionKey || null,
    p_quantity: input.quantity || 1,
  })

  if (error) return { allowed: false, decision: 'error', reason: error.message || 'Entitlement RPC failed.', source: 'rpc' }
  const row = Array.isArray(data) ? data[0] : data
  return {
    allowed: Boolean(row?.allowed),
    decision: row?.decision || (row?.allowed ? 'allowed' : 'blocked'),
    reason: row?.reason || 'No AC360 entitlement decision returned.',
    source: row?.source || 'rpc',
    accessMode: row?.access_mode || null,
    limitKey: row?.limit_key || null,
    limitValue: row?.limit_value == null ? null : Number(row.limit_value),
    activeSubscriptionId: row?.active_subscription_id || null,
  }
}
