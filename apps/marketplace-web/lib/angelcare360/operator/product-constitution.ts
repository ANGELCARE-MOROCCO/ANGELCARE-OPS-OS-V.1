import { requireAngelcare360OperatorPermission } from './access'
import { getOperatorClient } from './shared'
import { writeOperatorAuditLog } from './audit'
import type { ProductConstitutionSnapshot } from '@/types/angelcare360/product-constitution'

type Row = Record<string, unknown>
type Descriptor = { table: string; writable: boolean }

const TABLES: Record<keyof ProductConstitutionSnapshot, Descriptor> = {
  modules: { table: 'angelcare360_operator_product_modules', writable: false },
  features: { table: 'angelcare360_operator_product_features', writable: false },
  addons: { table: 'angelcare360_operator_product_addons', writable: false },
  meters: { table: 'angelcare360_operator_product_meters', writable: false },
  packageVersions: { table: 'angelcare360_operator_package_versions', writable: false },
  priceBooks: { table: 'angelcare360_operator_price_books', writable: false },
  domains: { table: 'angelcare360_operator_product_domains', writable: true },
  capabilities: { table: 'angelcare360_operator_product_capabilities', writable: true },
  services: { table: 'angelcare360_operator_product_services', writable: true },
  topupOffers: { table: 'angelcare360_operator_topup_offers', writable: true },
  routeBindings: { table: 'angelcare360_operator_product_route_bindings', writable: true },
  operationBindings: { table: 'angelcare360_operator_product_operations', writable: true },
  billingProfiles: { table: 'angelcare360_operator_product_billing_profiles', writable: true },
  configurationOwnership: { table: 'angelcare360_operator_product_configuration_ownership', writable: true },
  provisioningBlueprints: { table: 'angelcare360_operator_product_provisioning_blueprints', writable: true },
  visibilityRules: { table: 'angelcare360_operator_product_visibility_rules', writable: true },
  legacyMappings: { table: 'angelcare360_operator_legacy_product_mappings', writable: true },
}

function text(value: unknown) { return typeof value === 'string' ? value.trim() : value == null ? '' : String(value) }
function obj(value: unknown): Row { return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {} }
function descriptorFor(kind: string): Descriptor {
  const descriptor = (TABLES as Record<string, Descriptor>)[kind]
  if (!descriptor) throw new Error(`Type constitutionnel non pris en charge: ${kind}`)
  return descriptor
}
async function read(descriptor: Descriptor) {
  const db = await getOperatorClient()
  const { data, error } = await db.from(descriptor.table).select('*').order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []) as Row[]
}
async function recordRevision(entityType: string, entityId: string, operation: string, before: Row, after: Row, actorUserId?: string) {
  const db = await getOperatorClient()
  const { count } = await db.from('angelcare360_operator_product_revisions').select('id', { count: 'exact', head: true }).eq('entity_type', entityType).eq('entity_id', entityId)
  const { error } = await db.from('angelcare360_operator_product_revisions').insert({
    entity_type: entityType,
    entity_id: entityId,
    revision_number: (count || 0) + 1,
    operation,
    change_scope: 'catalogue_only',
    before_data: before,
    after_data: after,
    impact_data: {},
    created_by: actorUserId || null,
  })
  if (error) throw new Error(error.message)
}

export async function loadProductConstitutionSnapshot(): Promise<ProductConstitutionSnapshot> {
  await requireAngelcare360OperatorPermission('operator.plans.view')
  const entries = await Promise.all(Object.entries(TABLES).map(async ([key, descriptor]) => [key, await read(descriptor)] as const))
  return Object.fromEntries(entries) as unknown as ProductConstitutionSnapshot
}

export async function executeProductConstitutionOperation(operation: string, raw: unknown) {
  const session = await requireAngelcare360OperatorPermission('operator.plans.update')
  const payload = obj(raw)
  const kind = text(payload.kind)
  const descriptor = descriptorFor(kind)
  if (!descriptor.writable) throw new Error('Cette famille est gouvernée dans le Product Kernel principal. Ouvrez le studio Catalogue & Packages pour la modifier.')
  const db = await getOperatorClient()

  if (operation === 'record.upsert') {
    const id = text(payload.id)
    const record = obj(payload.record)
    const { data: before } = id ? await db.from(descriptor.table).select('*').eq('id', id).maybeSingle() : { data: null }
    const query = id
      ? db.from(descriptor.table).update({ ...record, updated_at: new Date().toISOString() }).eq('id', id)
      : db.from(descriptor.table).insert(record)
    const { data, error } = await query.select('*').single()
    if (error) throw new Error(error.message)
    const entityId = String((data as Row).id)
    await recordRevision(descriptor.table, entityId, id ? 'updated' : 'created', obj(before), data as Row, session.user.id)
    await writeOperatorAuditLog({ module: 'product_constitution', action: `product_constitution.${kind}.${id ? 'updated' : 'created'}`, entityType: descriptor.table, entityId, beforeData: obj(before), afterData: data as Row })
    return { ok: true, record: data }
  }

  if (operation === 'record.lifecycle') {
    const id = text(payload.id)
    const status = text(payload.status)
    if (!id || !status) throw new Error('Identifiant et statut requis.')
    const { data: before } = await db.from(descriptor.table).select('*').eq('id', id).maybeSingle()
    const { data, error } = await db.from(descriptor.table).update({ status, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
    if (error) throw new Error(error.message)
    await recordRevision(descriptor.table, id, `lifecycle.${status}`, obj(before), data as Row, session.user.id)
    await writeOperatorAuditLog({ module: 'product_constitution', action: `product_constitution.${kind}.lifecycle`, entityType: descriptor.table, entityId: id, beforeData: obj(before), afterData: data as Row })
    return { ok: true, record: data }
  }

  throw new Error(`Opération inconnue: ${operation}`)
}
