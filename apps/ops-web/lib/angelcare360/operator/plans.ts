import { getOperatorClient, safeList, toRecord } from './shared'
import { requireAngelcare360OperatorPermission } from './access'
import { writeOperatorAuditLog } from './audit'
import { operatorPlanCreateSchema, operatorPlanRetireSchema, operatorPlanUpdateSchema } from './validation'
import type { Angelcare360OperatorPackageRecord, Angelcare360OperatorPlanRecord } from '@/types/angelcare360/operator'

export async function listOperatorPlans() {
  await requireAngelcare360OperatorPermission('operator.plans.view')
  return (await safeList('angelcare360_operator_plans', '*', [], ['name', { ascending: true }])) as Angelcare360OperatorPlanRecord[]
}

export async function createOperatorPlan(input: unknown) {
  const parsed = operatorPlanCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le plan est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.plans.create')
  const supabase = await getOperatorClient()
  const payload = {
    plan_code: parsed.data.planCode,
    name: parsed.data.name,
    description: parsed.data.description || null,
    monthly_price_mad: parsed.data.monthlyPriceMad,
    annual_price_mad: parsed.data.annualPriceMad,
    billing_cycle: parsed.data.billingCycle,
    max_students: parsed.data.maxStudents ?? null,
    max_staff: parsed.data.maxStaff ?? null,
    max_users: parsed.data.maxUsers ?? null,
    max_sites: parsed.data.maxSites ?? null,
    included_modules: parsed.data.includedModules || [],
    included_features: parsed.data.includedFeatures || [],
    support_level: parsed.data.supportLevel || 'standard',
    status: parsed.data.status,
  }
  const { data, error } = await supabase.from('angelcare360_operator_plans').insert(payload).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'plans',
    action: 'plan.created',
    entityType: 'angelcare360_operator_plans',
    entityId: String(data.id),
    severity: 'notice',
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorPlanRecord }
}

export async function updateOperatorPlan(input: unknown) {
  const parsed = operatorPlanUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le plan est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.plans.update')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_plans').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = {
    plan_code: parsed.data.planCode,
    name: parsed.data.name,
    description: parsed.data.description || null,
    monthly_price_mad: parsed.data.monthlyPriceMad,
    annual_price_mad: parsed.data.annualPriceMad,
    billing_cycle: parsed.data.billingCycle,
    max_students: parsed.data.maxStudents ?? null,
    max_staff: parsed.data.maxStaff ?? null,
    max_users: parsed.data.maxUsers ?? null,
    max_sites: parsed.data.maxSites ?? null,
    included_modules: parsed.data.includedModules || [],
    included_features: parsed.data.includedFeatures || [],
    support_level: parsed.data.supportLevel || 'standard',
    status: parsed.data.status,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('angelcare360_operator_plans').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'plans',
    action: 'plan.updated',
    entityType: 'angelcare360_operator_plans',
    entityId: String(data.id),
    severity: 'notice',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorPlanRecord }
}

export async function retireOperatorPlan(input: unknown) {
  const parsed = operatorPlanRetireSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le plan est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.plans.update')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_plans').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = { status: 'retired', updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from('angelcare360_operator_plans').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'plans',
    action: 'plan.retired',
    entityType: 'angelcare360_operator_plans',
    entityId: String(data.id),
    severity: 'warning',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorPlanRecord }
}

export async function listOperatorPackages() {
  await requireAngelcare360OperatorPermission('operator.plans.view')
  return (await safeList('angelcare360_operator_packages', '*', [], ['name', { ascending: true }])) as Angelcare360OperatorPackageRecord[]
}

export async function createOperatorPackage(input: unknown) {
  const parsed = (await import('./validation')).operatorPackageCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le package est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.plans.create')
  const supabase = await getOperatorClient()
  const payload = {
    package_code: parsed.data.packageCode,
    name: parsed.data.name,
    description: parsed.data.description || null,
    module_keys: parsed.data.moduleKeys || [],
    feature_keys: parsed.data.featureKeys || [],
    status: parsed.data.status,
  }
  const { data, error } = await supabase.from('angelcare360_operator_packages').insert(payload).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'packages',
    action: 'package.created',
    entityType: 'angelcare360_operator_packages',
    entityId: String(data.id),
    severity: 'notice',
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorPackageRecord }
}

export async function updateOperatorPackage(input: unknown) {
  const parsed = (await import('./validation')).operatorPackageUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le package est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.plans.update')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_packages').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = {
    package_code: parsed.data.packageCode,
    name: parsed.data.name,
    description: parsed.data.description || null,
    module_keys: parsed.data.moduleKeys || [],
    feature_keys: parsed.data.featureKeys || [],
    status: parsed.data.status,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('angelcare360_operator_packages').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'packages',
    action: 'package.updated',
    entityType: 'angelcare360_operator_packages',
    entityId: String(data.id),
    severity: 'notice',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorPackageRecord }
}

