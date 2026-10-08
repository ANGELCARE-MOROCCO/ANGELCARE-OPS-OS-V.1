import { createServiceClient } from '@/lib/supabase/server'
import { requireAngelcare360OperatorPermission } from './access'
import { writeOperatorAuditLog } from './audit'
import { reconcileTenantAccessAccountsForLinkedSchool } from './tenant-access'
import { asString, toRecord } from './shared'

const INSTITUTION_TABLE = 'angelcare360_operator_growth_institutions'
const TENANT_TABLE = 'angelcare360_operator_tenants'
const SCHOOL_TABLE = 'angelcare360_schools'
const SCHOOL_SETTINGS_TABLE = 'angelcare360_school_settings'

function isSchoolInstitution(value: unknown) {
  const normalized = asString(value).trim().toLowerCase()
  return ['school', 'ecole', 'école'].includes(normalized)
}

function safeSchoolCode(value: unknown, fallbackId: string) {
  const normalized = asString(value)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
  return normalized || `INS-${fallbackId.replace(/-/g, '').slice(0, 12).toUpperCase()}`
}

function linkedInstitutionId(school: Record<string, unknown> | null | undefined) {
  return asString(toRecord(school?.metadata_json).operator_growth_institution_id)
}

export type InstitutionSchoolProvisioningResult = {
  ok: boolean
  error?: string
  institutionId?: string
  operatorTenantId?: string
  schoolId?: string
  schoolCreated?: boolean
  tenantLinked?: boolean
  accessAccountsReconciled?: number
  activeSchoolRolesProvisioned?: number
}

export async function provisionGrowthInstitutionSanilaSchool(input: unknown): Promise<InstitutionSchoolProvisioningResult> {
  const actor = await requireAngelcare360OperatorPermission('operator.tenants.update')
  const payload = toRecord(input)
  const institutionId = asString(payload.institutionId || payload.institution_id)
  const requestedTenantId = asString(payload.operatorTenantId || payload.tenantId || payload.tenant_id)
  if (!institutionId) return { ok: false, error: 'L’institution à provisionner est requise.' }

  const db = await createServiceClient()
  const institutionResult = await db.from(INSTITUTION_TABLE).select('*').eq('id', institutionId).maybeSingle()
  if (institutionResult.error || !institutionResult.data) return { ok: false, error: institutionResult.error?.message || 'Institution introuvable.' }
  const institution = institutionResult.data as Record<string, unknown>
  if (!isSchoolInstitution(institution.institution_type)) return { ok: false, error: 'Seule une institution de type School peut devenir un établissement SANILA.' }

  const institutionTenantId = asString(institution.tenant_id)
  const tenantId = requestedTenantId || institutionTenantId
  if (!tenantId) return { ok: false, error: 'L’institution doit être reliée à un tenant Operator avant le provisioning SANILA.' }
  if (institutionTenantId && requestedTenantId && institutionTenantId !== requestedTenantId) return { ok: false, error: 'Le tenant demandé ne correspond pas au tenant de l’institution.' }

  const tenantResult = await db.from(TENANT_TABLE).select('*').eq('id', tenantId).maybeSingle()
  if (tenantResult.error || !tenantResult.data) return { ok: false, error: tenantResult.error?.message || 'Tenant Operator introuvable.' }
  const tenant = tenantResult.data as Record<string, unknown>
  const institutionClientId = asString(institution.client_id)
  const tenantClientId = asString(tenant.client_id)
  if (!institutionClientId || !tenantClientId || institutionClientId !== tenantClientId) return { ok: false, error: 'Institution et tenant doivent appartenir au même client Operator.' }
  if (asString(tenant.status) !== 'active') return { ok: false, error: 'Le tenant Operator doit être actif avant le provisioning de l’école SANILA.' }

  const institutionMetadata = toRecord(institution.metadata)
  const tenantSchoolId = asString(tenant.school_id)
  const metadataSchoolId = asString(institutionMetadata.sanila_school_id)
  if (tenantSchoolId && metadataSchoolId && tenantSchoolId !== metadataSchoolId) return { ok: false, error: 'Conflit de liaison: le tenant et l’institution référencent deux écoles SANILA différentes.' }

  let schoolId = tenantSchoolId || metadataSchoolId
  let school: Record<string, unknown> | null = null
  let schoolCreated = false

  if (schoolId) {
    const schoolResult = await db.from(SCHOOL_TABLE).select('*').eq('id', schoolId).maybeSingle()
    if (schoolResult.error || !schoolResult.data) return { ok: false, error: schoolResult.error?.message || 'La liaison SANILA existante pointe vers une école introuvable.' }
    school = schoolResult.data as Record<string, unknown>
  }

  if (!school) {
    const linkedResult = await db.from(SCHOOL_TABLE).select('*').contains('metadata_json', { operator_growth_institution_id: institutionId }).limit(2)
    if (linkedResult.error) return { ok: false, error: linkedResult.error.message }
    if ((linkedResult.data || []).length > 1) return { ok: false, error: 'Plusieurs écoles SANILA revendiquent la même institution Operator. Intervention requise.' }
    school = ((linkedResult.data || [])[0] || null) as Record<string, unknown> | null
    schoolId = asString(school?.id)
  }

  const schoolCode = safeSchoolCode(institution.institution_code, institutionId)
  if (!school) {
    const codeResult = await db.from(SCHOOL_TABLE).select('*').eq('school_code', schoolCode).limit(2)
    if (codeResult.error) return { ok: false, error: codeResult.error.message }
    if ((codeResult.data || []).length > 1) return { ok: false, error: `Le code école ${schoolCode} n’est pas unique.` }
    const codeSchool = ((codeResult.data || [])[0] || null) as Record<string, unknown> | null
    if (codeSchool) {
      const ownerInstitutionId = linkedInstitutionId(codeSchool)
      if (!ownerInstitutionId || ownerInstitutionId !== institutionId) return { ok: false, error: `Le code école ${schoolCode} appartient déjà à une autre autorité. Aucun rattachement automatique n’a été effectué.` }
      school = codeSchool
      schoolId = asString(codeSchool.id)
    }
  }

  if (!school) {
    const schoolMetadata = {
      source: 'operator_growth_institution_bridge',
      operator_growth_institution_id: institutionId,
      operator_client_id: institutionClientId,
      operator_tenant_id: tenantId,
      estimated_students: institution.estimated_students ?? null,
      estimated_staff: institution.estimated_staff ?? null,
      institution_region: asString(institution.region) || null,
    }
    const created = await db.from(SCHOOL_TABLE).insert({
      school_code: schoolCode,
      name: asString(institution.name) || 'Établissement SANILA',
      school_type: 'ecole_privee',
      city: asString(institution.city) || null,
      country: asString(institution.country) || 'Maroc',
      address: asString(institution.address) || null,
      phone: null,
      email: null,
      language: 'fr',
      currency: 'MAD',
      timezone: 'Africa/Casablanca',
      status: 'active',
      metadata_json: schoolMetadata,
    }).select('*').single()
    if (created.error || !created.data) return { ok: false, error: created.error?.message || 'Création de l’école SANILA impossible.' }
    school = created.data as Record<string, unknown>
    schoolId = asString(created.data.id)
    schoolCreated = true
  }

  if (!schoolId || !school) return { ok: false, error: 'École SANILA non résolue.' }
  const claimedByInstitution = linkedInstitutionId(school)
  if (claimedByInstitution && claimedByInstitution !== institutionId) return { ok: false, error: 'Cette école SANILA est déjà liée à une autre institution Operator.' }

  const schoolMetadata = {
    ...toRecord(school.metadata_json),
    source: 'operator_growth_institution_bridge',
    operator_growth_institution_id: institutionId,
    operator_client_id: institutionClientId,
    operator_tenant_id: tenantId,
  }
  const schoolUpdate = await db.from(SCHOOL_TABLE).update({ metadata_json: schoolMetadata, updated_at: new Date().toISOString() }).eq('id', schoolId).select('id').single()
  if (schoolUpdate.error) return { ok: false, error: schoolUpdate.error.message }

  const existingSettings = await db.from(SCHOOL_SETTINGS_TABLE).select('metadata_json').eq('school_id', schoolId).maybeSingle()
  if (existingSettings.error) return { ok: false, error: existingSettings.error.message }
  const settings = await db.from(SCHOOL_SETTINGS_TABLE).upsert({
    school_id: schoolId,
    default_language: 'fr',
    default_currency: 'MAD',
    default_timezone: 'Africa/Casablanca',
    status: 'active',
    metadata_json: { ...toRecord(existingSettings.data?.metadata_json), source: 'operator_growth_institution_bridge', operator_growth_institution_id: institutionId },
  }, { onConflict: 'school_id' })
  if (settings.error) return { ok: false, error: settings.error.message }

  const tenantLink = await db.from(TENANT_TABLE)
    .update({ school_id: schoolId, updated_at: new Date().toISOString() })
    .eq('id', tenantId)
    .or(`school_id.is.null,school_id.eq.${schoolId}`)
    .select('id,school_id')
    .maybeSingle()
  if (tenantLink.error || !tenantLink.data || asString(tenantLink.data.school_id) !== schoolId) return { ok: false, error: tenantLink.error?.message || 'Le tenant a été lié simultanément à une autre école. Aucun écrasement n’a été effectué.' }

  const nextInstitutionMetadata = {
    ...institutionMetadata,
    sanila_school_id: schoolId,
    sanila_school_state: 'linked',
    sanila_school_provisioned_at: new Date().toISOString(),
  }
  const institutionUpdate = await db.from(INSTITUTION_TABLE).update({ metadata: nextInstitutionMetadata, updated_at: new Date().toISOString() }).eq('id', institutionId).select('id').single()
  if (institutionUpdate.error) return { ok: false, error: institutionUpdate.error.message }

  const reconciliation = await reconcileTenantAccessAccountsForLinkedSchool({ tenantId, schoolId, clientId: institutionClientId })
  if (!reconciliation.ok) return { ok: false, error: reconciliation.error || 'École liée, mais la réconciliation Tenant Access a échoué.', institutionId, operatorTenantId: tenantId, schoolId, schoolCreated, tenantLinked: true }

  await writeOperatorAuditLog({
    module: 'growth',
    action: schoolCreated ? 'institution.sanila_school_provisioned' : 'institution.sanila_school_reconciled',
    entityType: INSTITUTION_TABLE,
    entityId: institutionId,
    clientId: institutionClientId,
    tenantId,
    severity: 'notice',
    afterData: { school_id: schoolId, institution_id: institutionId, tenant_id: tenantId },
    metadata: { operator_role: actor.operatorRole, school_created: schoolCreated, access_accounts_reconciled: reconciliation.accountsReconciled, active_school_roles_provisioned: reconciliation.activeSchoolRolesProvisioned },
  })

  return {
    ok: true,
    institutionId,
    operatorTenantId: tenantId,
    schoolId,
    schoolCreated,
    tenantLinked: true,
    accessAccountsReconciled: reconciliation.accountsReconciled,
    activeSchoolRolesProvisioned: reconciliation.activeSchoolRolesProvisioned,
  }
}
