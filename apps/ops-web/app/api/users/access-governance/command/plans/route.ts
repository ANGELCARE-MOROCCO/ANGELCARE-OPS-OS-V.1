import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createAccessGovernanceAdminClient } from '@/lib/users/access-governance/admin-client'
import { canManageUniversalAuthorizationCommand, canViewUniversalAuthorizationCommand, actorIdentity } from '@/lib/users/access-governance/universal/security'
import { buildUniversalReconciliationPlan, persistUniversalPlan } from '@/lib/users/access-governance/universal/reconciliation'
import { loadUniversalPlans } from '@/lib/users/access-governance/universal/repository'
import type { JsonObject, JsonValue, UniversalAuthorityManifest, UniversalReconciliationFinding } from '@/lib/users/access-governance/universal/types'

export const dynamic = 'force-dynamic'


function asJsonValue(value: unknown): JsonValue | undefined {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) {
    const values: JsonValue[] = []
    for (const item of value) {
      const converted = asJsonValue(item)
      if (converted !== undefined) values.push(converted)
    }
    return values
  }
  if (typeof value === 'object') {
    const object: JsonObject = {}
    for (const [key, item] of Object.entries(value)) {
      const converted = asJsonValue(item)
      if (converted !== undefined) object[key] = converted
    }
    return object
  }
  return undefined
}

function asJsonObject(value: unknown): JsonObject {
  const converted = asJsonValue(value)
  return converted !== null && typeof converted === 'object' && !Array.isArray(converted) ? converted : {}
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

export async function GET() {
  const actor = await getCurrentAppUser()
  if (!actor) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
  if (!canViewUniversalAuthorizationCommand(actor)) return NextResponse.json({ ok: false, error: 'Access denied.' }, { status: 403 })
  try {
    return NextResponse.json({ ok: true, plans: await loadUniversalPlans(createAccessGovernanceAdminClient(), 100) })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to load reconciliation plans.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const actor = await getCurrentAppUser()
  if (!actor) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
  if (!canManageUniversalAuthorizationCommand(actor)) return NextResponse.json({ ok: false, error: 'Access denied.' }, { status: 403 })
  const body = await request.json().catch(() => ({}))
  const findingIds = body && typeof body === 'object' && 'findingIds' in body && Array.isArray(body.findingIds) ? body.findingIds.map(String) : []
  const title = body && typeof body === 'object' && 'title' in body ? String(body.title).trim() : 'Authorization reconciliation plan'
  const description = body && typeof body === 'object' && 'description' in body ? String(body.description).trim() : ''
  if (!findingIds.length) return NextResponse.json({ ok: false, error: 'Select at least one reconciliation finding.' }, { status: 400 })
  const client = createAccessGovernanceAdminClient()
  const { data: findingRows, error: findingError } = await client.from('access_reconciliation_findings').select('*').in('id', findingIds)
  if (findingError) return NextResponse.json({ ok: false, error: findingError.message }, { status: 500 })
  if (!findingRows?.length) return NextResponse.json({ ok: false, error: 'No reconciliation findings were found.' }, { status: 404 })
  const sourceScanId = String(findingRows[0].scan_id)
  if (findingRows.some((row: Record<string, unknown>) => String(row.scan_id) !== sourceScanId)) return NextResponse.json({ ok: false, error: 'All findings in one plan must come from the same scan.' }, { status: 400 })
  const { data: manifestRows, error: manifestError } = await client.from('access_authority_manifests').select('*').eq('scan_id', sourceScanId)
  if (manifestError) return NextResponse.json({ ok: false, error: manifestError.message }, { status: 500 })
  const findings: UniversalReconciliationFinding[] = findingRows.map((row: Record<string, unknown>) => ({
    findingKey: String(row.finding_key), scanId: String(row.scan_id), state: String(row.reconciliation_state) as UniversalReconciliationFinding['state'], severity: String(row.severity) as UniversalReconciliationFinding['severity'],
    applicationKey: row.application_key ? String(row.application_key) : null, moduleKey: row.module_key ? String(row.module_key) : null,
    workspaceKey: row.workspace_key ? String(row.workspace_key) : null, operationKey: row.operation_key ? String(row.operation_key) : null,
    userId: row.user_id ? String(row.user_id) : null, tenantId: row.tenant_id ? String(row.tenant_id) : null,
    organizationId: row.organization_id ? String(row.organization_id) : null, title: String(row.title), explanation: String(row.explanation),
    expectedState: asJsonObject(row.expected_state), effectiveState: asJsonObject(row.effective_state), evidenceKeys: asStringArray(row.evidence_keys),
    confidence: String(row.confidence) as UniversalReconciliationFinding['confidence'], confidenceScore: Number(row.confidence_score), executionEligible: Boolean(row.execution_eligible),
    blockedReasons: asStringArray(row.blocked_reasons), proposedOperations: asStringArray(row.proposed_operations) as UniversalReconciliationFinding['proposedOperations'], status: String(row.status) as UniversalReconciliationFinding['status'], metadata: asJsonObject(row.metadata),
  }))
  const manifests: UniversalAuthorityManifest[] = (manifestRows ?? []).map((row: Record<string, unknown>) => ({
    manifestKey: String(row.manifest_key), scanId: String(row.scan_id), applicationKey: String(row.application_key), moduleKey: row.module_key ? String(row.module_key) : null,
    displayName: String(row.display_name), authorityModels: asStringArray(row.authority_models) as UniversalAuthorityManifest['authorityModels'], identityAuthority: asJsonObject(row.identity_authority), globalAuthority: asJsonObject(row.global_authority),
    membershipAuthority: asJsonObject(row.membership_authority), roleAuthority: asJsonObject(row.role_authority), permissionAuthority: asJsonObject(row.permission_authority), tenantAuthority: asJsonObject(row.tenant_authority),
    organizationAuthority: asJsonObject(row.organization_authority), workspaceAuthority: asJsonObject(row.workspace_authority), entitlementAuthority: asJsonObject(row.entitlement_authority), rlsAuthority: asJsonObject(row.rls_authority),
    revocationAuthority: asJsonObject(row.revocation_authority), auditAuthority: asJsonObject(row.audit_authority), cacheAuthority: asJsonObject(row.cache_authority), mutationAuthority: asJsonObject(row.mutation_authority),
    evidenceKeys: asStringArray(row.evidence_keys), confidence: String(row.confidence) as UniversalAuthorityManifest['confidence'], confidenceScore: Number(row.confidence_score), validationStatus: String(row.validation_status) as UniversalAuthorityManifest['validationStatus'],
    executable: Boolean(row.executable), unresolved: asStringArray(row.unresolved), metadata: asJsonObject(row.metadata),
  }))
  try {
    const plan = buildUniversalReconciliationPlan(sourceScanId, title, description, findings, manifests)
    const actorInfo = actorIdentity(actor)
    await persistUniversalPlan(client, plan, actorInfo.id, actorInfo.email)
    return NextResponse.json({ ok: true, plan }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to create reconciliation plan.' }, { status: 500 })
  }
}
