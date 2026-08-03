import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { requireAngelcare360OperatorPermission } from './access'
import { getOperatorClient, toRecord } from './shared'
import { writeOperatorAuditLog } from './audit'
import type {
  CapacityTopupRecord,
  PackageVersionItemRecord,
  PackageVersionRecord,
  PriceBookEntryRecord,
  PriceBookRecord,
  ProductAddonRecord,
  ProductDependencyRecord,
  ProductFeatureRecord,
  ProductKernelItemType,
  ProductKernelSnapshot,
  ProductRevisionRecord,
  ProductChangeJobRecord,
  ProductMeterRecord,
  ProductModuleRecord,
  ScannerFindingRecord,
  ScannerRunRecord,
  SubscriptionAddonRecord,
  TenantEntitlementItemRecord,
  TenantEntitlementSnapshotRecord,
  TenantOverrideRecord,
} from '@/types/angelcare360/operator/product-kernel'

type Row = Record<string, unknown>
type SourceState = ProductKernelSnapshot['sources'][number]
type SourceResult<T> = { rows: T[]; source: SourceState }

const TABLES = {
  modules: 'angelcare360_operator_product_modules',
  capabilities: 'angelcare360_operator_product_capabilities',
  services: 'angelcare360_operator_product_services',
  features: 'angelcare360_operator_product_features',
  addons: 'angelcare360_operator_product_addons',
  meters: 'angelcare360_operator_product_meters',
  dependencies: 'angelcare360_operator_product_dependencies',
  packageVersions: 'angelcare360_operator_package_versions',
  packageItems: 'angelcare360_operator_package_version_items',
  priceBooks: 'angelcare360_operator_price_books',
  priceEntries: 'angelcare360_operator_price_book_entries',
  subscriptionAddons: 'angelcare360_operator_subscription_addons',
  topups: 'angelcare360_operator_capacity_topups',
  entitlementSnapshots: 'angelcare360_operator_tenant_entitlement_snapshots',
  entitlementItems: 'angelcare360_operator_tenant_entitlement_items',
  overrides: 'angelcare360_operator_tenant_overrides',
  scannerRuns: 'angelcare360_operator_product_scanner_runs',
  scannerFindings: 'angelcare360_operator_product_scanner_findings',
  publications: 'angelcare360_operator_product_publications',
  revisions: 'angelcare360_operator_product_revisions',
  changeJobs: 'angelcare360_operator_product_change_jobs',
} as const

const KNOWN_MODULES: Record<string, { name: string; category: string; summary: string; dependencies: string[]; meters: Array<[string, string, string]> }> = {
  administration: { name: 'Administration & Structure', category: 'core', summary: 'Établissements, années, périodes, classes, sections, matières et gouvernance scolaire.', dependencies: [], meters: [['institutions','Institutions','sites'],['classes','Classes actives','classes']] },
  people: { name: 'Personnes & Dossiers', category: 'core', summary: 'Élèves, parents, enseignants, personnel, relations et documents.', dependencies: ['administration'], meters: [['students','Élèves actifs','élèves'],['staff','Personnel actif','personnes'],['users','Utilisateurs','utilisateurs']] },
  admissions: { name: 'Admissions', category: 'growth', summary: 'Candidatures, entretiens, documents, décisions et conversion.', dependencies: ['people','administration'], meters: [['applications','Dossiers admissions','dossiers']] },
  attendance: { name: 'Présences', category: 'operations', summary: 'Présences quotidiennes, absences, retards, justifications et clôture.', dependencies: ['people','administration'], meters: [['attendance_events','Événements de présence','événements']] },
  academics: { name: 'Académique', category: 'core', summary: 'Emplois du temps, cours, devoirs, examens, notes et bulletins.', dependencies: ['people','administration'], meters: [['academic_records','Écritures académiques','écritures']] },
  finance: { name: 'Finance École', category: 'finance', summary: 'Frais, factures élèves, paiements, reçus, remises, relances et dépenses.', dependencies: ['people','administration'], meters: [['school_invoices','Factures école','factures'],['school_payments','Paiements école','paiements']] },
  payroll: { name: 'Paie & Honoraires', category: 'finance', summary: 'Périodes, éléments, primes, retenues, avances, validation et paiement.', dependencies: ['people'], meters: [['payroll_people','Personnes paie','personnes']] },
  transport: { name: 'Transport & Sécurité', category: 'operations', summary: 'Circuits, arrêts, véhicules, affectations, pickup, drop-off et sécurité.', dependencies: ['people','administration'], meters: [['vehicles','Véhicules','véhicules'],['routes','Circuits','circuits']] },
  library: { name: 'Bibliothèque', category: 'operations', summary: 'Ouvrages, exemplaires, emprunts, retours et retards.', dependencies: ['people'], meters: [['library_items','Exemplaires','exemplaires']] },
  inventory: { name: 'Inventaire', category: 'operations', summary: 'Articles, quantités, mouvements, seuils et responsabilités.', dependencies: ['administration'], meters: [['inventory_items','Articles inventaire','articles']] },
  communications: { name: 'Communication & Relation Famille', category: 'engagement', summary: 'Messagerie, notifications, réclamations et communications opérationnelles.', dependencies: ['people'], meters: [['messages','Messages','messages'],['notifications','Notifications','notifications']] },
  reports: { name: 'Rapports & Pilotage', category: 'intelligence', summary: 'Rapports, exports, tableaux de bord et preuves de gouvernance.', dependencies: ['administration'], meters: [['exports','Exports','exports']] },
}

function asString(value: unknown, fallback = '') {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}
function asNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
function asBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}
function asArray(value: unknown) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim()) return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}
function required(payload: Row, key: string, label: string) {
  const value = asString(payload[key])
  if (!value) throw new Error(`${label} est requis.`)
  return value
}
function optional(value: unknown) {
  const parsed = asString(value)
  return parsed || null
}
function jsonObject(value: unknown) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Row
  if (typeof value === 'string' && value.trim()) {
    try { const parsed = JSON.parse(value); return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Row : {} } catch { return {} }
  }
  return {}
}

async function readRows<T>(key: string, table: string, filters: Array<[string, unknown]> = [], order = 'created_at', ascending = false): Promise<SourceResult<T>> {
  const supabase = await getOperatorClient()
  let query = supabase.from(table).select('*')
  for (const [column, value] of filters) query = query.eq(column, value as never)
  if (order) query = query.order(order, { ascending })
  const { data, error } = await query
  if (error) return { rows: [], source: { key, state: 'unavailable', count: 0, error: error.message } }
  return { rows: (data || []) as T[], source: { key, state: 'complete', count: data?.length || 0 } }
}

export async function loadProductKernelSnapshot(scope: { clientId?: string; tenantId?: string; subscriptionId?: string } = {}): Promise<ProductKernelSnapshot> {
  await requireAngelcare360OperatorPermission('operator.plans.view')
  const clientFilter = scope.clientId ? [['client_id', scope.clientId] as [string, unknown]] : []
  const tenantFilter = scope.tenantId ? [['tenant_id', scope.tenantId] as [string, unknown]] : []
  const subscriptionFilter = scope.subscriptionId ? [['subscription_id', scope.subscriptionId] as [string, unknown]] : []
  const [modules, features, addons, meters, dependencies, packageVersions, packageItems, priceBooks, priceEntries, subscriptionAddons, topups, snapshots, items, overrides, runs, findings, revisions, changeJobs, clients, tenants, subscriptions, plans, packages, flags, limits] = await Promise.all([
    readRows<ProductModuleRecord>('modules', TABLES.modules, [], 'name', true),
    readRows<ProductFeatureRecord>('features', TABLES.features, [], 'name', true),
    readRows<ProductAddonRecord>('addons', TABLES.addons, [], 'name', true),
    readRows<ProductMeterRecord>('meters', TABLES.meters, [], 'name', true),
    readRows<ProductDependencyRecord>('dependencies', TABLES.dependencies, [], 'created_at', false),
    readRows<PackageVersionRecord>('packageVersions', TABLES.packageVersions, [], 'updated_at', false),
    readRows<PackageVersionItemRecord>('packageItems', TABLES.packageItems, [], 'sort_order', true),
    readRows<PriceBookRecord>('priceBooks', TABLES.priceBooks, [], 'name', true),
    readRows<PriceBookEntryRecord>('priceEntries', TABLES.priceEntries, [], 'updated_at', false),
    readRows<SubscriptionAddonRecord>('subscriptionAddons', TABLES.subscriptionAddons, subscriptionFilter, 'updated_at', false),
    readRows<CapacityTopupRecord>('topups', TABLES.topups, [...subscriptionFilter, ...tenantFilter], 'created_at', false),
    readRows<TenantEntitlementSnapshotRecord>('entitlementSnapshots', TABLES.entitlementSnapshots, [...clientFilter, ...tenantFilter], 'created_at', false),
    readRows<TenantEntitlementItemRecord>('entitlementItems', TABLES.entitlementItems, [], 'created_at', true),
    readRows<TenantOverrideRecord>('overrides', TABLES.overrides, [...clientFilter, ...tenantFilter], 'created_at', false),
    readRows<ScannerRunRecord>('scannerRuns', TABLES.scannerRuns, [], 'started_at', false),
    readRows<ScannerFindingRecord>('scannerFindings', TABLES.scannerFindings, [], 'created_at', false),
    readRows<ProductRevisionRecord>('revisions', TABLES.revisions, [], 'created_at', false),
    readRows<ProductChangeJobRecord>('changeJobs', TABLES.changeJobs, [], 'created_at', false),
    readRows<Row>('legacy.clients', 'angelcare360_operator_clients', clientFilter, 'display_name', true),
    readRows<Row>('legacy.tenants', 'angelcare360_operator_tenants', [...clientFilter, ...tenantFilter], 'created_at', false),
    readRows<Row>('legacy.subscriptions', 'angelcare360_operator_subscriptions', [...clientFilter, ...subscriptionFilter], 'created_at', false),
    readRows<Row>('legacy.plans', 'angelcare360_operator_plans', [], 'name', true),
    readRows<Row>('legacy.packages', 'angelcare360_operator_packages', [], 'name', true),
    readRows<Row>('legacy.featureFlags', 'angelcare360_operator_feature_flags', [...clientFilter, ...tenantFilter], 'updated_at', false),
    readRows<Row>('legacy.usageLimits', 'angelcare360_operator_usage_limits', [...clientFilter, ...tenantFilter], 'updated_at', false),
  ])
  const sources = [modules.source, features.source, addons.source, meters.source, dependencies.source, packageVersions.source, packageItems.source, priceBooks.source, priceEntries.source, subscriptionAddons.source, topups.source, snapshots.source, items.source, overrides.source, runs.source, findings.source, revisions.source, changeJobs.source, clients.source, tenants.source, subscriptions.source, plans.source, packages.source, flags.source, limits.source]
  const completeCount = sources.filter((source) => source.state === 'complete').length
  const sourceState: ProductKernelSnapshot['sourceState'] = completeCount === sources.length ? 'complete' : completeCount ? 'partial' : 'unavailable'
  const allowedSubscriptionIds = new Set(subscriptions.rows.map((row) => asString(row.id)).filter(Boolean))
  const allowedTenantIds = new Set(tenants.rows.map((row) => asString(row.id)).filter(Boolean))
  const scopedSubscriptionAddons = scope.clientId && !scope.subscriptionId ? subscriptionAddons.rows.filter((row) => allowedSubscriptionIds.has(row.subscription_id)) : subscriptionAddons.rows
  const scopedTopups = scope.clientId && !scope.subscriptionId && !scope.tenantId ? topups.rows.filter((row) => allowedSubscriptionIds.has(row.subscription_id) || Boolean(row.tenant_id && allowedTenantIds.has(row.tenant_id))) : topups.rows
  const scopedSnapshots = snapshots.rows.filter((row) => !scope.clientId || asString(row.client_id) === scope.clientId)
  const snapshotIds = new Set(scopedSnapshots.map((row) => row.id))
  return {
    modules: modules.rows,
    features: features.rows,
    addons: addons.rows,
    meters: meters.rows,
    dependencies: dependencies.rows,
    packageVersions: packageVersions.rows,
    packageItems: packageItems.rows,
    priceBooks: priceBooks.rows,
    priceEntries: priceEntries.rows,
    subscriptionAddons: scopedSubscriptionAddons,
    topups: scopedTopups,
    entitlementSnapshots: scopedSnapshots,
    entitlementItems: items.rows.filter((row) => snapshotIds.has(row.snapshot_id)),
    overrides: overrides.rows.filter((row) => !scope.clientId || row.client_id === scope.clientId),
    scannerRuns: runs.rows,
    scannerFindings: findings.rows,
    revisions: revisions.rows,
    changeJobs: changeJobs.rows,
    legacy: { clients: clients.rows, tenants: tenants.rows, subscriptions: subscriptions.rows, plans: plans.rows, packages: packages.rows, featureFlags: flags.rows, usageLimits: limits.rows },
    sourceState,
    sources,
  }
}

async function audit(action: string, entityType: string, entityId: string, afterData: Row, beforeData?: Row | null, context: { clientId?: string; tenantId?: string } = {}) {
  await writeOperatorAuditLog({
    module: 'product-kernel', action, entityType, entityId,
    clientId: context.clientId || null, tenantId: context.tenantId || null,
    severity: action.includes('suspend') || action.includes('retire') || action.includes('override') ? 'warning' : 'notice',
    beforeData: beforeData || null, afterData,
  })
}

async function insertRecord(table: string, payload: Row, action: string, entityType: string) {
  const supabase = await getOperatorClient()
  const { data, error } = await supabase.from(table).insert(payload).select('*').single()
  if (error) throw new Error(error.message)
  await audit(action, entityType, String((data as Row).id), payload)
  return data as Row
}
async function updateRecord(table: string, id: string, payload: Row, action: string, entityType: string, context: { clientId?: string; tenantId?: string } = {}) {
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from(table).select('*').eq('id', id).maybeSingle()
  const next = { ...payload, updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from(table).update(next).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)
  await audit(action, entityType, id, next, toRecord(before), context)
  return data as Row
}

function adminChangeScope(payload: Row) {
  return asString(payload.changeScope, 'catalogue_only')
}
function selectedSubscriptionIds(payload: Row) {
  return asArray(payload.selectedSubscriptionIds).map((value) => asString(value)).filter(Boolean)
}
async function createProductRevision(entityType: string, entityId: string, operation: string, before: Row, after: Row, payload: Row, impact: Row = {}) {
  const supabase = await getOperatorClient()
  const { count } = await supabase.from(TABLES.revisions).select('id', { count: 'exact', head: true }).eq('entity_type', entityType).eq('entity_id', entityId)
  const row = {
    entity_type: entityType, entity_id: entityId, revision_number: (count || 0) + 1, operation,
    change_scope: adminChangeScope(payload), effective_at: optional(payload.effectiveAt), reason: optional(payload.reason),
    before_data: before, after_data: after, impact_data: impact,
  }
  const { error } = await supabase.from(TABLES.revisions).insert(row)
  if (error) throw new Error(error.message)
}
async function createProductChangeJob(entityType: string, entityId: string, operation: string, payload: Row, impact: Row, result: Row = {}) {
  const scope = adminChangeScope(payload)
  if (!['scheduled','existing_at_renewal','selected_subscriptions','all_active_subscriptions'].includes(scope) && !optional(payload.effectiveAt)) return
  const supabase = await getOperatorClient()
  const { error } = await supabase.from(TABLES.changeJobs).insert({
    entity_type: entityType, entity_id: entityId, operation, change_scope: scope,
    selected_subscription_ids: selectedSubscriptionIds(payload), effective_at: optional(payload.effectiveAt),
    status: scope === 'scheduled' || optional(payload.effectiveAt) ? 'scheduled' : 'executed',
    reason: optional(payload.reason), impact_data: impact, result_data: result,
  })
  if (error) throw new Error(error.message)
}
async function updateRecordWithRevision(table: string, id: string, payload: Row, action: string, entityType: string, changePayload: Row, impact: Row = {}, context: { clientId?: string; tenantId?: string } = {}) {
  const supabase = await getOperatorClient()
  const { data: before, error: beforeError } = await supabase.from(table).select('*').eq('id', id).single()
  if (beforeError) throw new Error(beforeError.message)
  const record = await updateRecord(table, id, payload, action, entityType, context)
  await createProductRevision(entityType, id, action, toRecord(before) || {}, record, changePayload, impact)
  await createProductChangeJob(entityType, id, action, changePayload, impact, { recordId: id })
  return record
}

async function requirePackageVersion(id: string) {
  const supabase = await getOperatorClient()
  const { data, error } = await supabase.from(TABLES.packageVersions).select('id,status,version_code').eq('id', id).single()
  if (error) throw new Error(error.message)
  return data as Row
}

async function deleteRecord(table: string, id: string, action: string, entityType: string) {
  const supabase = await getOperatorClient()
  const { data: before, error: beforeError } = await supabase.from(table).select('*').eq('id', id).single()
  if (beforeError) throw new Error(beforeError.message)
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw new Error(error.message)
  await audit(action, entityType, id, {}, toRecord(before))
  return before as Row
}


const PRODUCT_ENTITY_OPERATION_MANIFEST = ['module.create','module.update','module.clone','module.delete-draft','feature.create','feature.update','feature.clone','feature.delete-draft','addon.create','addon.update','addon.clone','addon.delete-draft','meter.create','meter.update','meter.clone','meter.delete-draft'] as const
void PRODUCT_ENTITY_OPERATION_MANIFEST

type VersionedProductKind = 'module' | 'feature' | 'addon' | 'meter'
const VERSIONED_PRODUCT_TABLES: Record<VersionedProductKind, string> = {
  module: TABLES.modules,
  feature: TABLES.features,
  addon: TABLES.addons,
  meter: TABLES.meters,
}

function bumpVersion(value: unknown) {
  const current = asString(value, '1.0.0')
  const parts = current.split('.').map((part) => Number(part))
  if (parts.length >= 3 && parts.every(Number.isFinite)) return `${parts[0]}.${parts[1]}.${parts[2] + 1}`
  return `${current}-next`
}

async function countRows(table: string, filters: Array<[string, unknown]>) {
  const supabase = await getOperatorClient()
  let query = supabase.from(table).select('id', { count: 'exact', head: true })
  for (const [column, value] of filters) query = query.eq(column, value as never)
  const { count, error } = await query
  if (error) throw new Error(error.message)
  return count || 0
}

async function requireProductEntity(kind: VersionedProductKind, id: string) {
  const supabase = await getOperatorClient()
  const table = VERSIONED_PRODUCT_TABLES[kind]
  const { data, error } = await supabase.from(table).select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  return data as Row
}

async function cloneVersionedProductEntity(kind: VersionedProductKind, id: string, payload: Row) {
  await requireAngelcare360OperatorPermission('operator.plans.create')
  const supabase = await getOperatorClient()
  const table = VERSIONED_PRODUCT_TABLES[kind]
  const { data, error } = await supabase.from(table).select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  const source = { ...(data as Row) }
  for (const key of ['id','created_at','updated_at','archived_at','published_at','deprecated_at','retired_at','last_reviewed_at']) delete source[key]
  const next = {
    ...source,
    version: asString(payload.version, bumpVersion(source.version)),
    status: 'draft',
    supersedes_id: id,
    lifecycle_note: optional(payload.reason) || `Nouvelle version créée depuis ${asString(source.version, '1.0.0')}`,
  }
  const record = await insertRecord(table, next, `product.${kind}.cloned`, table)
  return { ok: true, record }
}

async function transitionProductEntity(kind: VersionedProductKind, id: string, payload: Row) {
  await requireAngelcare360OperatorPermission('operator.plans.update')
  const status = required(payload, 'status', 'Le nouvel état')
  const supabase = await getOperatorClient()
  const table = VERSIONED_PRODUCT_TABLES[kind]
  const { data, error } = await supabase.from(table).select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  const current = data as Row
  const currentStatus = asString(current.status)
  const allowedStatuses = ['draft','review','published','suspended','deprecated','retired','archived']
  if (!allowedStatuses.includes(status)) throw new Error(`État Product Kernel inconnu: ${status}.`)
  if (status !== currentStatus && !asString(payload.reason)) throw new Error('Une justification administrateur est requise pour cette transition.')
  const now = new Date().toISOString()
  const next: Row = { status, lifecycle_note: optional(payload.reason), last_reviewed_at: now }
  if (status === 'published') next.published_at = now
  if (status === 'deprecated') next.deprecated_at = now
  if (status === 'retired') next.retired_at = now
  if (status === 'archived') next.archived_at = now
  const impact = await productEntityImpact(kind, id)
  const record = await updateRecordWithRevision(table, id, next, `product.${kind}.${status}`, table, payload, impact)
  const sync = await synchronizeProductEntitySubscriptions(kind, id, payload)
  return { ok: true, record, previousStatus: currentStatus, impact, sync }
}

async function productEntityImpact(kind: VersionedProductKind, id: string) {
  const packageItems = await countRows(TABLES.packageItems, [['item_type', kind], ['item_id', id]])
  const dependenciesAsSource = await countRows(TABLES.dependencies, [['source_type', kind], ['source_id', id]])
  const dependenciesAsTarget = await countRows(TABLES.dependencies, [['target_type', kind], ['target_id', id]])
  const impact: Row = { packageItems, dependencies: dependenciesAsSource + dependenciesAsTarget }
  if (kind === 'module') {
    impact.features = await countRows(TABLES.features, [['module_id', id]])
    impact.addons = await countRows(TABLES.addons, [['module_id', id]])
  }
  if (kind === 'feature') impact.addons = await countRows(TABLES.addons, [['feature_id', id]])
  if (kind === 'addon') impact.subscriptionAssignments = await countRows(TABLES.subscriptionAddons, [['addon_id', id]])
  if (kind === 'meter') impact.topups = await countRows(TABLES.topups, [['meter_id', id]])
  return impact
}

async function deleteDraftProductEntity(kind: VersionedProductKind, id: string) {
  await requireAngelcare360OperatorPermission('operator.plans.update')
  const current = await requireProductEntity(kind, id)
  if (asString(current.status) !== 'draft') throw new Error('Seul un brouillon jamais publié peut être supprimé définitivement.')
  const impact = await productEntityImpact(kind, id)
  const blocking = Object.entries(impact).filter(([, value]) => Number(value) > 0)
  if (blocking.length) throw new Error(`Suppression bloquée: ${blocking.map(([key, value]) => `${key}=${value}`).join(' · ')}.`)
  return { ok: true, record: await deleteRecord(VERSIONED_PRODUCT_TABLES[kind], id, `product.${kind}.deleted_draft`, VERSIONED_PRODUCT_TABLES[kind]), impact }
}

async function validatePackageVersion(id: string) {
  await requireAngelcare360OperatorPermission('operator.packages.view')
  const supabase = await getOperatorClient()
  const { data: items, error } = await supabase.from(TABLES.packageItems).select('*').eq('package_version_id', id)
  if (error) throw new Error(error.message)
  const itemRows = (items || []) as Row[]
  if (!itemRows.length) return { ok: true, valid: false, blockers: ['Composition vide'], itemCount: 0 }
  try {
    const report = await validatePackageComposition(supabase, itemRows)
    return { ok: true, valid: true, blockers: [], itemCount: itemRows.length, report }
  } catch (error) {
    return { ok: true, valid: false, blockers: [error instanceof Error ? error.message : 'Validation impossible'], itemCount: itemRows.length }
  }
}

async function deleteDraftPackageVersion(id: string) {
  await requireAngelcare360OperatorPermission('operator.packages.update')
  const current = await requirePackageVersion(id)
  if (asString(current.status) !== 'draft') throw new Error('Seule une version package en brouillon peut être supprimée.')
  const subscriptions = await countRows('angelcare360_operator_subscriptions', [['package_version_id', id]])
  if (subscriptions) throw new Error(`Suppression bloquée: ${subscriptions} abonnement(s) utilisent cette version.`)
  return { ok: true, record: await deleteRecord(TABLES.packageVersions, id, 'product.package_version.deleted_draft', TABLES.packageVersions) }
}

async function clonePriceBook(id: string, payload: Row) {
  await requireAngelcare360OperatorPermission('operator.plans.create')
  const supabase = await getOperatorClient()
  const [{ data: source, error }, { data: entries, error: entriesError }] = await Promise.all([
    supabase.from(TABLES.priceBooks).select('*').eq('id', id).single(),
    supabase.from(TABLES.priceEntries).select('*').eq('price_book_id', id),
  ])
  if (error) throw new Error(error.message)
  if (entriesError) throw new Error(entriesError.message)
  const sourceRow = source as Row
  const next = {
    price_book_code: asString(payload.priceBookCode, asString(sourceRow.price_book_code)),
    version_code: asString(payload.versionCode, `${asString(sourceRow.version_code, '1.0')}-next`),
    name: asString(payload.name, `${asString(sourceRow.name)} · nouvelle version`),
    currency: sourceRow.currency,
    region_code: sourceRow.region_code,
    status: 'draft',
    effective_from: optional(payload.effectiveFrom),
    effective_to: null,
    supersedes_id: id,
    owner_role: sourceRow.owner_role,
    lifecycle_note: optional(payload.reason) || `Cloné depuis ${asString(sourceRow.price_book_code)}`,
  }
  const cloned = await insertRecord(TABLES.priceBooks, next, 'product.price_book.cloned', TABLES.priceBooks)
  const entryRows = ((entries || []) as Row[]).map((entry) => ({
    price_book_id: cloned.id,
    item_type: entry.item_type,
    item_id: entry.item_id,
    billing_cycle: entry.billing_cycle,
    unit_price: entry.unit_price,
    setup_fee: entry.setup_fee,
    minimum_quantity: entry.minimum_quantity,
    maximum_quantity: entry.maximum_quantity,
    volume_rules: entry.volume_rules || [],
  }))
  if (entryRows.length) {
    const { error: insertError } = await supabase.from(TABLES.priceEntries).insert(entryRows)
    if (insertError) throw new Error(insertError.message)
  }
  return { ok: true, record: cloned, entryCount: entryRows.length }
}

async function deleteDraftPriceBook(id: string) {
  await requireAngelcare360OperatorPermission('operator.plans.update')
  const supabase = await getOperatorClient()
  const { data, error } = await supabase.from(TABLES.priceBooks).select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  if (asString((data as Row).status) !== 'draft') throw new Error('Seul un price book en brouillon peut être supprimé.')
  return { ok: true, record: await deleteRecord(TABLES.priceBooks, id, 'product.price_book.deleted_draft', TABLES.priceBooks) }
}

function automaticVersionCode(current: Row) {
  const code = asString(current.version_code, 'PACKAGE')
  const match = code.match(/^(.*?)(?:-V)(\d+)$/i)
  if (match) return `${match[1]}-V${Number(match[2]) + 1}`
  return `${code}-REV-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 12)}`
}

async function ensureScopedPackageVersion(packageVersionId: string, payload: Row) {
  const scope = adminChangeScope(payload)
  const impact = await packageVersionImpact(packageVersionId)
  if (!impact.subscriptions || ['all_active_subscriptions','immediate_authorized'].includes(scope)) {
    return { packageVersionId, originalPackageVersionId: packageVersionId, cloned: false, impact, reassignedSubscriptionIds: [] as string[] }
  }
  const current = await requirePackageVersion(packageVersionId)
  const cloneResult = await clonePackageVersion(packageVersionId, {
    versionCode: automaticVersionCode(current),
    name: asString(payload.name, asString(current.name)),
    effectiveFrom: optional(payload.effectiveAt) || optional(payload.effectiveFrom),
    reason: asString(payload.reason, `Révision automatique · portée ${scope}`),
  })
  const clone = toRecord(cloneResult.record)
  const cloneId = asString(clone.id)
  const targetStatus = ['existing_at_renewal','scheduled'].includes(scope) ? 'approved' : asString(current.status, 'published')
  await updateRecord(TABLES.packageVersions, cloneId, { status: targetStatus, lifecycle_note: asString(payload.reason, `Révision automatique · portée ${scope}`) }, 'product.package_version.auto_scoped', TABLES.packageVersions)
  let targetIds: string[] = []
  if (scope === 'selected_subscriptions') {
    targetIds = selectedSubscriptionIds(payload)
    if (!targetIds.length) throw new Error('Sélectionnez au moins un abonnement pour cette portée.')
  }
  if (targetIds.length) {
    const supabase = await getOperatorClient()
    const { error } = await supabase.from('angelcare360_operator_subscriptions').update({ package_version_id: cloneId, updated_at: new Date().toISOString() }).eq('package_version_id', packageVersionId).in('id', targetIds)
    if (error) throw new Error(error.message)
  }
  await createProductChangeJob(TABLES.packageVersions, cloneId, 'product.package_version.auto_scoped', payload, impact, { originalPackageVersionId: packageVersionId, reassignedSubscriptionIds: targetIds })
  return { packageVersionId: cloneId, originalPackageVersionId: packageVersionId, cloned: true, impact, reassignedSubscriptionIds: targetIds }
}

async function packageVersionImpact(id: string) {
  const supabase = await getOperatorClient()
  const [{ count: itemCount }, { data: subscriptions, error }] = await Promise.all([
    supabase.from(TABLES.packageItems).select('id', { count: 'exact', head: true }).eq('package_version_id', id),
    supabase.from('angelcare360_operator_subscriptions').select('id,client_id,tenant_id,status,package_version_id,subscription_code').eq('package_version_id', id),
  ])
  if (error) throw new Error(error.message)
  const rows = (subscriptions || []) as Row[]
  return {
    packageItems: itemCount || 0, subscriptions: rows.length,
    activeSubscriptions: rows.filter((row) => ['active','trial','grace_period'].includes(asString(row.status))).length,
    subscriptionIds: rows.map((row) => asString(row.id)),
    clientIds: [...new Set(rows.map((row) => asString(row.client_id)).filter(Boolean))],
    tenantIds: [...new Set(rows.map((row) => asString(row.tenant_id)).filter(Boolean))],
  }
}

async function synchronizeProductEntitySubscriptions(kind: VersionedProductKind, id: string, payload: Row) {
  const scope = adminChangeScope(payload)
  if (['catalogue_only','new_sales_only','existing_at_renewal','scheduled'].includes(scope)) return { requested: 0, succeeded: 0, failed: 0, deferred: true, scope }
  const supabase = await getOperatorClient()
  const { data: packageItems, error: itemError } = await supabase.from(TABLES.packageItems).select('package_version_id').eq('item_type', kind).eq('item_id', id)
  if (itemError) throw new Error(itemError.message)
  const packageIds = [...new Set(((packageItems || []) as Row[]).map((row) => asString(row.package_version_id)).filter(Boolean))]
  if (!packageIds.length) return { requested: 0, succeeded: 0, failed: 0, scope }
  let query = supabase.from('angelcare360_operator_subscriptions').select('id').in('package_version_id', packageIds)
  if (scope === 'selected_subscriptions') {
    const selected = selectedSubscriptionIds(payload)
    if (!selected.length) throw new Error('Sélectionnez au moins un abonnement à synchroniser.')
    query = query.in('id', selected)
  }
  const { data, error } = await query
  if (error) throw new Error(error.message)
  const ids = ((data || []) as Row[]).map((row) => asString(row.id)).filter(Boolean)
  if (!ids.length) return { requested: 0, succeeded: 0, failed: 0, scope }
  const result = await bulkCompileEntitlements({ subscriptionIds: ids })
  return { requested: ids.length, succeeded: result.succeeded, failed: result.failed, scope }
}

async function synchronizeChangedSubscriptions(packageVersionId: string, payload: Row) {
  const scope = adminChangeScope(payload)
  if (['catalogue_only','new_sales_only','existing_at_renewal','scheduled'].includes(scope)) {
    return { requested: 0, succeeded: 0, failed: 0, deferred: true, scope }
  }
  const supabase = await getOperatorClient()
  let query = supabase.from('angelcare360_operator_subscriptions').select('id').eq('package_version_id', packageVersionId)
  if (scope === 'selected_subscriptions') {
    const ids = selectedSubscriptionIds(payload)
    if (!ids.length) throw new Error('Sélectionnez au moins un abonnement à synchroniser.')
    query = query.in('id', ids)
  }
  const { data, error } = await query
  if (error) throw new Error(error.message)
  const ids = ((data || []) as Row[]).map((row) => asString(row.id)).filter(Boolean)
  if (!ids.length) return { requested: 0, succeeded: 0, failed: 0, scope }
  const result = await bulkCompileEntitlements({ subscriptionIds: ids })
  return { requested: ids.length, succeeded: result.succeeded, failed: result.failed, scope }
}

async function synchronizePackageBilling(packageVersionId: string, payload: Row) {
  const scope = adminChangeScope(payload)
  if (['catalogue_only','new_sales_only','existing_at_renewal','scheduled'].includes(scope)) return { requested: 0, updated: 0, deferred: true, scope }
  const supabase = await getOperatorClient()
  const version = await requirePackageVersion(packageVersionId)
  let query = supabase.from('angelcare360_operator_subscriptions').select('id,billing_cycle,billing_amount_mad').eq('package_version_id', packageVersionId)
  if (scope === 'selected_subscriptions') {
    const selected = selectedSubscriptionIds(payload)
    if (!selected.length) throw new Error('Sélectionnez au moins un abonnement pour appliquer la tarification.')
    query = query.in('id', selected)
  } else {
    query = query.in('status', ['active','trial','grace_period'])
  }
  const { data, error } = await query
  if (error) throw new Error(error.message)
  let updated = 0
  const errors: Row[] = []
  for (const subscription of (data || []) as Row[]) {
    const cycle = asString(subscription.billing_cycle, 'monthly')
    const amount = cycle === 'annual' ? asNumber(version.annual_price) : asNumber(version.monthly_price)
    const { error: updateError } = await supabase.from('angelcare360_operator_subscriptions').update({ billing_amount_mad: amount, updated_at: new Date().toISOString() }).eq('id', asString(subscription.id))
    if (updateError) errors.push({ id: subscription.id, error: updateError.message })
    else updated += 1
  }
  return { requested: (data || []).length, updated, failed: errors.length, errors, scope }
}

async function synchronizeAddonPricing(addonId: string, price: number, payload: Row) {
  const scope = adminChangeScope(payload)
  if (['catalogue_only','new_sales_only','existing_at_renewal','scheduled'].includes(scope)) return { requested: 0, updated: 0, deferred: true, scope }
  const supabase = await getOperatorClient()
  let query = supabase.from(TABLES.subscriptionAddons).select('id,subscription_id,status').eq('addon_id', addonId)
  if (scope === 'selected_subscriptions') {
    const selected = selectedSubscriptionIds(payload)
    if (!selected.length) throw new Error('Sélectionnez au moins un abonnement pour appliquer le prix add-on.')
    query = query.in('subscription_id', selected)
  } else query = query.in('status', ['active','scheduled','suspended'])
  const { data, error } = await query
  if (error) throw new Error(error.message)
  const ids = ((data || []) as Row[]).map((row) => asString(row.id)).filter(Boolean)
  if (!ids.length) return { requested: 0, updated: 0, scope }
  const { error: updateError } = await supabase.from(TABLES.subscriptionAddons).update({ unit_price: price, updated_at: new Date().toISOString() }).in('id', ids)
  if (updateError) throw new Error(updateError.message)
  return { requested: ids.length, updated: ids.length, scope }
}

async function synchronizePriceEntry(entry: Row, payload: Row) {
  const scope = adminChangeScope(payload)
  if (['catalogue_only','new_sales_only','existing_at_renewal','scheduled'].includes(scope)) return { requested: 0, updated: 0, deferred: true, scope }
  const itemType = asString(entry.item_type)
  const itemId = asString(entry.item_id)
  const unitPrice = asNumber(entry.unit_price)
  const billingCycle = asString(entry.billing_cycle)
  const supabase = await getOperatorClient()
  if (itemType === 'package_version') {
    let query = supabase.from('angelcare360_operator_subscriptions').select('id').eq('package_version_id', itemId).eq('billing_cycle', billingCycle)
    if (scope === 'selected_subscriptions') {
      const selected = selectedSubscriptionIds(payload)
      if (!selected.length) throw new Error('Sélectionnez au moins un abonnement pour appliquer ce prix.')
      query = query.in('id', selected)
    } else query = query.in('status', ['active','trial','grace_period'])
    const { data, error } = await query
    if (error) throw new Error(error.message)
    const ids = ((data || []) as Row[]).map((row) => asString(row.id)).filter(Boolean)
    if (ids.length) {
      const { error: updateError } = await supabase.from('angelcare360_operator_subscriptions').update({ billing_amount_mad: unitPrice, updated_at: new Date().toISOString() }).in('id', ids)
      if (updateError) throw new Error(updateError.message)
    }
    return { requested: ids.length, updated: ids.length, scope }
  }
  if (itemType === 'addon') return synchronizeAddonPricing(itemId, unitPrice, payload)
  if (itemType === 'meter') {
    let query = supabase.from(TABLES.topups).select('id,subscription_id,quantity,status').eq('meter_id', itemId)
    if (scope === 'selected_subscriptions') {
      const selected = selectedSubscriptionIds(payload)
      if (!selected.length) throw new Error('Sélectionnez au moins un abonnement pour appliquer ce tarif top-up.')
      query = query.in('subscription_id', selected)
    } else query = query.in('status', ['active','scheduled','suspended'])
    const { data, error } = await query
    if (error) throw new Error(error.message)
    let updated = 0
    for (const topup of (data || []) as Row[]) {
      const amount = asNumber(topup.quantity) * unitPrice
      const { error: updateError } = await supabase.from(TABLES.topups).update({ amount, updated_at: new Date().toISOString() }).eq('id', asString(topup.id))
      if (!updateError) updated += 1
    }
    return { requested: (data || []).length, updated, scope }
  }
  return { requested: 0, updated: 0, deferred: true, scope, reason: 'Aucune affectation directe pour ce type.' }
}

async function removeProductEntityWithStrategy(kind: VersionedProductKind, id: string, payload: Row) {
  await requireAngelcare360OperatorPermission('operator.plans.update')
  const strategy = asString(payload.strategy, 'archive')
  const replacementId = asString(payload.replacementId)
  const reason = required(payload, 'reason', 'La justification')
  const table = VERSIONED_PRODUCT_TABLES[kind]
  const current = await requireProductEntity(kind, id)
  const impact = await productEntityImpact(kind, id)
  const supabase = await getOperatorClient()
  if (strategy === 'archive' || strategy === 'schedule_retirement') {
    const status = strategy === 'archive' ? 'archived' : 'retired'
    const record = await updateRecordWithRevision(table, id, { status, lifecycle_note: reason }, `product.${kind}.${status}_by_admin`, table, payload, impact)
    return { ok: true, record, impact, strategy }
  }
  if (strategy === 'replace_and_delete') {
    if (!replacementId || replacementId === id) throw new Error('Sélectionnez un élément de remplacement valide.')
    await requireProductEntity(kind, replacementId)
    const { data: migrationResult, error: migrationError } = await supabase.rpc('angelcare360_operator_replace_product_entity', {
      p_kind: kind,
      p_source_id: id,
      p_replacement_id: replacementId,
    })
    if (migrationError) throw new Error(migrationError.message)
    await createProductRevision(table, id, `product.${kind}.replaced_and_deleted`, current, { deleted: true, replacementId }, payload, { ...impact, migrationResult })
    const record = await deleteRecord(table, id, `product.${kind}.replaced_and_deleted`, table)
    const sync = await synchronizeProductEntitySubscriptions(kind, replacementId, { ...payload, changeScope: 'all_active_subscriptions' })
    return { ok: true, record, impact, strategy, replacementId, migrationResult, sync }
  }
  if (strategy === 'detach_and_delete') {
    const blocking = Object.entries(impact).filter(([, value]) => typeof value === 'number' && Number(value) > 0)
    if (blocking.length) throw new Error(`Détachement automatique impossible sans remplacement: ${blocking.map(([key, value]) => `${key}=${value}`).join(' · ')}.`)
    await createProductRevision(table, id, `product.${kind}.detached_and_deleted`, current, { deleted: true }, payload, impact)
    return { ok: true, record: await deleteRecord(table, id, `product.${kind}.detached_and_deleted`, table), impact, strategy }
  }
  throw new Error(`Stratégie de suppression inconnue: ${strategy}.`)
}

async function removePackageVersionWithStrategy(id: string, payload: Row) {
  await requireAngelcare360OperatorPermission('operator.packages.update')
  const strategy = asString(payload.strategy, 'archive')
  const replacementId = asString(payload.replacementId)
  const reason = required(payload, 'reason', 'La justification')
  const current = await requirePackageVersion(id)
  const impact = await packageVersionImpact(id)
  const supabase = await getOperatorClient()
  if (strategy === 'archive' || strategy === 'schedule_retirement') {
    const status = strategy === 'archive' ? 'archived' : 'retired'
    const record = await updateRecordWithRevision(TABLES.packageVersions, id, { status, lifecycle_note: reason }, `product.package_version.${status}_by_admin`, TABLES.packageVersions, payload, impact)
    return { ok: true, record, impact, strategy }
  }
  if (strategy === 'replace_and_delete') {
    if (!replacementId || replacementId === id) throw new Error('Sélectionnez un package de remplacement.')
    await requirePackageVersion(replacementId)
    const { data: migratedIds, error: migrationError } = await supabase.rpc('angelcare360_operator_replace_package_version', {
      p_source_id: id,
      p_replacement_id: replacementId,
    })
    if (migrationError) throw new Error(migrationError.message)
    const ids = asArray(migratedIds).map((value) => asString(value)).filter(Boolean)
    await createProductRevision(TABLES.packageVersions, id, 'product.package_version.replaced_and_deleted', current, { deleted: true, replacementId }, payload, { ...impact, migratedSubscriptionIds: ids })
    const record = await deleteRecord(TABLES.packageVersions, id, 'product.package_version.replaced_and_deleted', TABLES.packageVersions)
    const sync = ids.length ? await bulkCompileEntitlements({ subscriptionIds: ids }) : { succeeded: 0, failed: 0 }
    const billingSync = await synchronizePackageBilling(replacementId, { ...payload, changeScope: 'all_active_subscriptions' })
    return { ok: true, record, impact, strategy, replacementId, sync, billingSync }
  }
  if (strategy === 'detach_and_delete') {
    const ids = selectedSubscriptionIds(payload)
    let query = supabase.from('angelcare360_operator_subscriptions').update({ package_version_id: null, updated_at: new Date().toISOString() }).eq('package_version_id', id)
    if (ids.length) query = query.in('id', ids)
    const { error } = await query
    if (error) throw new Error(error.message)
    const remaining = await countRows('angelcare360_operator_subscriptions', [['package_version_id', id]])
    if (remaining) throw new Error(`${remaining} abonnement(s) restent attachés à ce package.`)
    await createProductRevision(TABLES.packageVersions, id, 'product.package_version.detached_and_deleted', current, { deleted: true }, payload, impact)
    return { ok: true, record: await deleteRecord(TABLES.packageVersions, id, 'product.package_version.detached_and_deleted', TABLES.packageVersions), impact, strategy }
  }
  throw new Error(`Stratégie de suppression inconnue: ${strategy}.`)
}

async function removePriceBookWithStrategy(id: string, payload: Row) {
  await requireAngelcare360OperatorPermission('operator.plans.update')
  const strategy = asString(payload.strategy, 'archive')
  const reason = required(payload, 'reason', 'La justification')
  const supabase = await getOperatorClient()
  const { data, error } = await supabase.from(TABLES.priceBooks).select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  const impact = { entries: await countRows(TABLES.priceEntries, [['price_book_id', id]]) }
  if (strategy === 'archive' || strategy === 'schedule_retirement') {
    const status = strategy === 'archive' ? 'archived' : 'retired'
    const record = await updateRecordWithRevision(TABLES.priceBooks, id, { status, lifecycle_note: reason }, `product.price_book.${status}_by_admin`, TABLES.priceBooks, payload, impact)
    return { ok: true, record, impact, strategy }
  }
  if (strategy === 'detach_and_delete') {
    await createProductRevision(TABLES.priceBooks, id, 'product.price_book.deleted_by_admin', data as Row, { deleted: true }, payload, impact)
    return { ok: true, record: await deleteRecord(TABLES.priceBooks, id, 'product.price_book.deleted_by_admin', TABLES.priceBooks), impact, strategy }
  }
  throw new Error('Utilisez Archiver ou Supprimer définitivement pour ce price book.')
}

async function bulkCompileEntitlements(payload: Row) {
  await requireAngelcare360OperatorPermission('operator.features.update')
  const ids = asArray(payload.subscriptionIds).map((value) => asString(value)).filter(Boolean)
  if (!ids.length) throw new Error('Sélectionnez au moins un abonnement à compiler.')
  const results: Row[] = []
  for (const id of ids.slice(0, 100)) {
    try { results.push({ subscriptionId: id, ok: true, result: await compileForSubscription(id) }) }
    catch (error) { results.push({ subscriptionId: id, ok: false, error: error instanceof Error ? error.message : 'Compilation impossible' }) }
  }
  return { ok: true, total: results.length, succeeded: results.filter((row) => row.ok).length, failed: results.filter((row) => !row.ok).length, results }
}

export async function executeProductKernelOperation(operation: string, rawPayload: unknown) {
  const payload = toRecord(rawPayload)

  if (operation === 'scan.run') return runNativeProductScanner()
  if (operation === 'finding.adopt') return adoptScannerFinding(payload)
  if (operation === 'finding.reject') return updateScannerFindingStatus(payload, 'rejected')
  if (operation === 'finding.resolve') return updateScannerFindingStatus(payload, 'resolved')
  if (operation === 'finding.reopen') return updateScannerFindingStatus(payload, 'open')

  for (const kind of ['module', 'feature', 'addon', 'meter'] as const) {
    if (!operation.startsWith(`${kind}.`)) continue
    await requireAngelcare360OperatorPermission(operation === `${kind}.create` ? 'operator.plans.create' : 'operator.plans.update')
    if (operation === `${kind}.create`) {
      const payloadBuilder = kind === 'module' ? modulePayload : kind === 'feature' ? featurePayload : kind === 'addon' ? addonPayload : meterPayload
      const createdPayload = payloadBuilder(payload)
      createdPayload.status = 'draft'
      return { ok: true, record: await insertRecord(VERSIONED_PRODUCT_TABLES[kind], createdPayload, `product.${kind}.created`, VERSIONED_PRODUCT_TABLES[kind]) }
    }
    const id = required(payload, 'id', `L’élément ${kind}`)
    if (operation === `${kind}.update`) {
      await requireProductEntity(kind, id)
      const payloadBuilder = kind === 'module' ? modulePayload : kind === 'feature' ? featurePayload : kind === 'addon' ? addonPayload : meterPayload
      const updatedPayload = payloadBuilder(payload)
      const impact = await productEntityImpact(kind, id)
      const record = await updateRecordWithRevision(VERSIONED_PRODUCT_TABLES[kind], id, updatedPayload, `product.${kind}.admin_updated`, VERSIONED_PRODUCT_TABLES[kind], payload, impact)
      const sync = await synchronizeProductEntitySubscriptions(kind, id, payload)
      const billingSync = kind === 'addon' ? await synchronizeAddonPricing(id, asNumber(updatedPayload.list_price), payload) : null
      return { ok: true, record, impact, sync, billingSync, changeScope: adminChangeScope(payload) }
    }
    if (operation === `${kind}.clone`) return cloneVersionedProductEntity(kind, id, payload)
    if (operation === `${kind}.admin-remove`) return removeProductEntityWithStrategy(kind, id, payload)
    if (operation === `${kind}.delete-draft`) return deleteDraftProductEntity(kind, id)
    if (operation === `${kind}.impact`) return { ok: true, impact: await productEntityImpact(kind, id) }
    return transitionProductEntity(kind, id, payload)
  }

  if (operation.startsWith('package-version.')) {
    await requireAngelcare360OperatorPermission(operation === 'package-version.create' ? 'operator.packages.create' : 'operator.packages.update')
    if (operation === 'package-version.create') { const created = packageVersionPayload(payload); created.status = 'draft'; return { ok: true, record: await insertRecord(TABLES.packageVersions, created, 'product.package_version.created', TABLES.packageVersions) } }
    const id = required(payload, 'id', 'La version package')
    if (operation === 'package-version.update') {
      await requirePackageVersion(id)
      const scoped = await ensureScopedPackageVersion(id, payload)
      const workingId = scoped.packageVersionId
      const updated = packageVersionPayload(payload)
      if (scoped.cloned) {
        const workingVersion = await requirePackageVersion(workingId)
        updated.version_code = workingVersion.version_code
        updated.version_number = workingVersion.version_number
        updated.supersedes_id = workingVersion.supersedes_id || id
      }
      if (scoped.cloned && ['existing_at_renewal','scheduled'].includes(adminChangeScope(payload))) updated.status = 'approved'
      const record = await updateRecordWithRevision(TABLES.packageVersions, workingId, updated, 'product.package_version.admin_updated', TABLES.packageVersions, payload, scoped.impact)
      const sync = scoped.reassignedSubscriptionIds.length ? await bulkCompileEntitlements({ subscriptionIds: scoped.reassignedSubscriptionIds }) : await synchronizeChangedSubscriptions(workingId, payload)
      const billingSync = await synchronizePackageBilling(workingId, payload)
      return { ok: true, record, packageVersionId: workingId, originalPackageVersionId: id, cloned: scoped.cloned, impact: scoped.impact, sync, billingSync, changeScope: adminChangeScope(payload) }
    }
    if (operation === 'package-version.clone') return clonePackageVersion(id, payload)
    if (operation === 'package-version.admin-remove') return removePackageVersionWithStrategy(id, payload)
    if (operation === 'package-version.publish') return publishPackageVersion(id, payload)
    if (operation === 'package-version.validate') return validatePackageVersion(id)
    if (operation === 'package-version.delete-draft') return deleteDraftPackageVersion(id)
    const status = required(payload, 'status', 'Le statut')
    if (['deprecated', 'retired', 'suspended', 'archived'].includes(status) && !asString(payload.reason)) throw new Error('Une justification est requise pour cette transition.')
    const now = new Date().toISOString()
    const lifecycle: Row = { status, lifecycle_note: optional(payload.reason), last_reviewed_at: now }
    if (status === 'deprecated') lifecycle.deprecated_at = now
    if (status === 'retired') lifecycle.retired_at = now
    const impact = await packageVersionImpact(id)
    const record = await updateRecordWithRevision(TABLES.packageVersions, id, lifecycle, `product.package_version.${status}`, TABLES.packageVersions, payload, impact)
    const sync = await synchronizeChangedSubscriptions(id, payload)
    return { ok: true, record, impact, sync }
  }

  if (operation === 'package-item.upsert') return upsertPackageItem(payload)
  if (operation === 'package-item.delete') return deletePackageItem(payload)

  if (operation === 'price-book.create') {
    await requireAngelcare360OperatorPermission('operator.plans.create')
    const created = priceBookPayload(payload); created.status = 'draft'; return { ok: true, record: await insertRecord(TABLES.priceBooks, created, 'product.price_book.created', TABLES.priceBooks) }
  }
  if (operation === 'price-book.update') {
    await requireAngelcare360OperatorPermission('operator.plans.update')
    const id = required(payload, 'id', 'Le catalogue tarifaire')
    const supabase = await getOperatorClient()
    const { data, error } = await supabase.from(TABLES.priceBooks).select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    const updated = priceBookPayload(payload)
    const impact = { entries: await countRows(TABLES.priceEntries, [['price_book_id', id]]) }
    const record = await updateRecordWithRevision(TABLES.priceBooks, id, updated, 'product.price_book.admin_updated', TABLES.priceBooks, payload, impact)
    return { ok: true, record, previousStatus: asString((data as Row).status), impact, changeScope: adminChangeScope(payload) }
  }
  if (operation === 'price-book.status') {
    await requireAngelcare360OperatorPermission('operator.plans.update')
    const status = required(payload, 'status', 'Le statut')
    const now = new Date().toISOString()
    const next: Row = { status, lifecycle_note: optional(payload.reason), last_reviewed_at: now }
    if (status === 'active') next.published_at = now
    if (status === 'retired') next.retired_at = now
    const id = required(payload, 'id', 'Le catalogue tarifaire')
    const impact = { entries: await countRows(TABLES.priceEntries, [['price_book_id', id]]) }
    const record = await updateRecordWithRevision(TABLES.priceBooks, id, next, 'product.price_book.status_changed', TABLES.priceBooks, payload, impact)
    return { ok: true, record, impact }
  }
  if (operation === 'price-book.clone') return clonePriceBook(required(payload, 'id', 'Le catalogue tarifaire'), payload)
  if (operation === 'price-book.admin-remove') return removePriceBookWithStrategy(required(payload, 'id', 'Le catalogue tarifaire'), payload)
  if (operation === 'price-book.delete-draft') return deleteDraftPriceBook(required(payload, 'id', 'Le catalogue tarifaire'))
  if (operation === 'price-entry.upsert') return upsertPriceEntry(payload)
  if (operation === 'price-entry.delete') return deletePriceEntry(payload)

  if (operation === 'dependency.upsert') return upsertDependency(payload)
  if (operation === 'dependency.delete') {
    await requireAngelcare360OperatorPermission('operator.packages.update')
    return { ok: true, record: await deleteRecord(TABLES.dependencies, required(payload, 'id', 'La règle'), 'product.dependency.deleted', TABLES.dependencies) }
  }

  if (operation === 'subscription.package.assign') return assignPackageToSubscription(payload)
  if (operation === 'subscription-addon.assign') return assignAddon(payload)
  if (operation === 'subscription-addon.remove') return removeAddon(payload)
  if (operation === 'topup.assign') return assignTopup(payload)
  if (operation === 'topup.remove') return removeTopup(payload)
  if (operation === 'override.upsert') return upsertOverride(payload)
  if (operation === 'override.apply') return applyOverrideAndCompile(payload)
  if (operation === 'override.revoke') return revokeOverride(payload)
  if (operation === 'entitlements.compile') return compileTenantEntitlements(payload)
  if (operation === 'entitlements.bulk-compile') return bulkCompileEntitlements(payload)
  if (operation === 'tenant-baseline.restore') return restoreTenantBaseline(payload)
  if (operation === 'scheduled-change.create') return createScheduledChange(payload)
  if (operation === 'scheduled-change.cancel') return cancelScheduledChange(payload)

  throw new Error(`Opération Product Kernel inconnue: ${operation}`)
}

function stableProductKey(value: unknown, prefix: string) {
  const normalized = asString(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  return normalized || `${prefix}_${Date.now()}`
}

function modulePayload(payload: Row): Row {
  return {
    module_key: asString(payload.moduleKey) || stableProductKey(payload.name, 'module'), name: required(payload, 'name', 'Le nom'), short_name: optional(payload.shortName),
    description: optional(payload.description), commercial_summary: optional(payload.commercialSummary), category: asString(payload.category, 'core'),
    status: asString(payload.status, 'draft'), sellability: asString(payload.sellability, 'internal_only'), runtime_maturity: asString(payload.runtimeMaturity, 'unverified'),
    version: asString(payload.version, '1.0.0'), customer_route_prefix: optional(payload.customerRoutePrefix), api_prefix: optional(payload.apiPrefix),
    support_owner_role: optional(payload.supportOwnerRole), default_support_tier: asString(payload.defaultSupportTier, 'standard'), owner_role: optional(payload.ownerRole), lifecycle_note: optional(payload.lifecycleNote),
    configuration_schema: jsonObject(payload.configurationSchema), evidence: asArray(payload.evidence), region_availability: asArray(payload.regionAvailability).length ? asArray(payload.regionAvailability) : ['MA'],
  }
}
function featurePayload(payload: Row): Row {
  return {
    module_id: required(payload, 'moduleId', 'Le module'), feature_key: asString(payload.featureKey) || stableProductKey(payload.name, 'feature'), name: required(payload, 'name', 'Le nom'),
    description: optional(payload.description), version: asString(payload.version, '1.0.0'), feature_tier: asString(payload.featureTier, 'standard'), status: asString(payload.status, 'draft'),
    sellability: asString(payload.sellability, 'included'), runtime_maturity: asString(payload.runtimeMaturity, 'unverified'), customer_route: optional(payload.customerRoute), api_route: optional(payload.apiRoute),
    permission_keys: asArray(payload.permissionKeys), configuration_required: asBoolean(payload.configurationRequired), configuration_schema: jsonObject(payload.configurationSchema), evidence: asArray(payload.evidence), owner_role: optional(payload.ownerRole), lifecycle_note: optional(payload.lifecycleNote),
  }
}
function addonPayload(payload: Row): Row {
  return {
    addon_code: asString(payload.addonCode) || stableProductKey(payload.name, 'addon'), name: required(payload, 'name', 'Le nom'), description: optional(payload.description),
    module_id: optional(payload.moduleId), feature_id: optional(payload.featureId), version: asString(payload.version, '1.0.0'), addon_type: asString(payload.addonType, 'capability'), billing_model: asString(payload.billingModel, 'recurring'),
    status: asString(payload.status, 'draft'), currency: asString(payload.currency, 'MAD'), list_price: asNumber(payload.listPrice), included_quantity: payload.includedQuantity === null || payload.includedQuantity === '' ? null : asNumber(payload.includedQuantity),
    unit: optional(payload.unit), configuration_schema: jsonObject(payload.configurationSchema), region_availability: asArray(payload.regionAvailability).length ? asArray(payload.regionAvailability) : ['MA'], owner_role: optional(payload.ownerRole), lifecycle_note: optional(payload.lifecycleNote),
  }
}
function meterPayload(payload: Row): Row {
  return {
    meter_key: asString(payload.meterKey) || stableProductKey(payload.name, 'meter'), name: required(payload, 'name', 'Le nom'), description: optional(payload.description), version: asString(payload.version, '1.0.0'), unit: required(payload, 'unit', "L'unité"),
    meter_type: asString(payload.meterType, 'capacity'), reset_cycle: optional(payload.resetCycle), hard_limit: asBoolean(payload.hardLimit), warning_threshold_pct: Math.max(1, Math.min(100, asNumber(payload.warningThresholdPct, 80))),
    topup_enabled: asBoolean(payload.topupEnabled, true), topup_increment: payload.topupIncrement === null || payload.topupIncrement === '' ? null : asNumber(payload.topupIncrement),
    status: asString(payload.status, 'draft'), source_table: optional(payload.sourceTable), source_column: optional(payload.sourceColumn), owner_role: optional(payload.ownerRole), lifecycle_note: optional(payload.lifecycleNote),
  }
}
function packageVersionPayload(payload: Row): Row {
  return {
    package_id: optional(payload.packageId), version_code: asString(payload.versionCode) || `${stableProductKey(payload.name, 'package').toUpperCase()}-V1`, version_number: Math.max(1, Math.trunc(asNumber(payload.versionNumber, 1))),
    name: required(payload, 'name', 'Le nom package'), description: optional(payload.description), target_segment: optional(payload.targetSegment), status: asString(payload.status, 'draft'),
    currency: asString(payload.currency, 'MAD'), monthly_price: asNumber(payload.monthlyPrice), annual_price: asNumber(payload.annualPrice), setup_fee: asNumber(payload.setupFee),
    support_tier: asString(payload.supportTier, 'standard'), implementation_tier: asString(payload.implementationTier, 'standard'), effective_from: optional(payload.effectiveFrom), effective_to: optional(payload.effectiveTo),
    region_availability: asArray(payload.regionAvailability).length ? asArray(payload.regionAvailability) : ['MA'], metadata: jsonObject(payload.metadata), owner_role: optional(payload.ownerRole), lifecycle_note: optional(payload.lifecycleNote), supersedes_id: optional(payload.supersedesId),
  }
}
function priceBookPayload(payload: Row): Row {
  return { price_book_code: asString(payload.priceBookCode) || stableProductKey(payload.name, 'price_book').toUpperCase(), version_code: asString(payload.versionCode, '1.0'), name: required(payload, 'name', 'Le nom'), currency: asString(payload.currency, 'MAD'), region_code: asString(payload.regionCode, 'MA'), status: asString(payload.status, 'draft'), effective_from: optional(payload.effectiveFrom), effective_to: optional(payload.effectiveTo), owner_role: optional(payload.ownerRole), lifecycle_note: optional(payload.lifecycleNote), supersedes_id: optional(payload.supersedesId) }
}


async function upsertDependency(payload: Row) {
  await requireAngelcare360OperatorPermission('operator.packages.update')
  const row = {
    source_type: required(payload, 'sourceType', 'Le type source'),
    source_id: required(payload, 'sourceId', 'La source'),
    target_type: required(payload, 'targetType', 'Le type cible'),
    target_id: required(payload, 'targetId', 'La cible'),
    relation_type: required(payload, 'relationType', 'La relation'),
    required_state: optional(payload.requiredState),
    reason: optional(payload.reason),
  }
  const supabase = await getOperatorClient()
  const { data, error } = await supabase.from(TABLES.dependencies).upsert(row, { onConflict: 'source_type,source_id,target_type,target_id,relation_type' }).select('*').single()
  if (error) throw new Error(error.message)
  await audit('product.dependency.upserted', TABLES.dependencies, String((data as Row).id), row)
  return { ok: true, record: data }
}

async function clonePackageVersion(sourceId: string, payload: Row) {
  await requireAngelcare360OperatorPermission('operator.packages.create')
  const supabase = await getOperatorClient()
  const [{ data: source, error: sourceError }, { data: sourceItems, error: itemsError }] = await Promise.all([
    supabase.from(TABLES.packageVersions).select('*').eq('id', sourceId).single(),
    supabase.from(TABLES.packageItems).select('*').eq('package_version_id', sourceId),
  ])
  if (sourceError) throw new Error(sourceError.message)
  if (itemsError) throw new Error(itemsError.message)
  const sourceRow = source as Row
  const versionCode = asString(payload.versionCode, `${asString(sourceRow.version_code, 'PACKAGE')}-next`)
  const clonePayload: Row = {
    package_id: sourceRow.package_id || null,
    version_code: versionCode,
    version_number: Math.max(asNumber(sourceRow.version_number, 1) + 1, asNumber(payload.versionNumber, 0)),
    name: asString(payload.name, asString(sourceRow.name)),
    description: sourceRow.description || null,
    target_segment: sourceRow.target_segment || null,
    status: 'draft',
    currency: sourceRow.currency || 'MAD',
    monthly_price: sourceRow.monthly_price || 0,
    annual_price: sourceRow.annual_price || 0,
    setup_fee: sourceRow.setup_fee || 0,
    support_tier: sourceRow.support_tier || 'standard',
    implementation_tier: sourceRow.implementation_tier || 'standard',
    effective_from: optional(payload.effectiveFrom),
    effective_to: null,
    region_availability: sourceRow.region_availability || ['MA'],
    metadata: { ...jsonObject(sourceRow.metadata), cloned_from: sourceId },
    supersedes_id: sourceId,
    owner_role: sourceRow.owner_role || null,
    lifecycle_note: optional(payload.reason) || `Nouvelle version créée depuis ${asString(sourceRow.version_code)}`,
  }
  const cloned = await insertRecord(TABLES.packageVersions, clonePayload, 'product.package_version.cloned', TABLES.packageVersions)
  const itemRows = ((sourceItems || []) as Row[]).map((item: Row) => ({
    package_version_id: cloned.id,
    item_type: item.item_type,
    item_id: item.item_id,
    inclusion_type: item.inclusion_type,
    quantity: item.quantity,
    configuration: item.configuration || {},
    sort_order: item.sort_order || 0,
  }))
  if (itemRows.length) {
    const { error } = await supabase.from(TABLES.packageItems).insert(itemRows)
    if (error) throw new Error(error.message)
  }
  return { ok: true, record: cloned, itemCount: itemRows.length }
}

async function updateScannerFindingStatus(payload: Row, status: 'open' | 'rejected' | 'resolved') {
  await requireAngelcare360OperatorPermission('operator.plans.update')
  const id = required(payload, 'id', 'Le finding')
  return { ok: true, record: await updateRecord(TABLES.scannerFindings, id, { status }, `product.scanner_finding.${status}`, TABLES.scannerFindings) }
}

async function upsertPackageItem(payload: Row) {
  await requireAngelcare360OperatorPermission('operator.packages.update')
  const supabase = await getOperatorClient()
  const requestedPackageVersionId = required(payload, 'packageVersionId', 'La version package')
  const scoped = await ensureScopedPackageVersion(requestedPackageVersionId, payload)
  const packageVersionId = scoped.packageVersionId
  const packageVersion = await requirePackageVersion(packageVersionId)
  const { data: beforeItems, error: beforeError } = await supabase.from(TABLES.packageItems).select('*').eq('package_version_id', packageVersionId)
  if (beforeError) throw new Error(beforeError.message)
  const row = {
    package_version_id: packageVersionId, item_type: required(payload, 'itemType', 'Le type'), item_id: required(payload, 'itemId', "L'élément"),
    inclusion_type: asString(payload.inclusionType, 'included'), quantity: payload.quantity === null || payload.quantity === '' ? null : asNumber(payload.quantity), configuration: jsonObject(payload.configuration), sort_order: Math.trunc(asNumber(payload.sortOrder)), updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from(TABLES.packageItems).upsert(row, { onConflict: 'package_version_id,item_type,item_id' }).select('*').single()
  if (error) throw new Error(error.message)
  const { data: afterItems, error: afterError } = await supabase.from(TABLES.packageItems).select('*').eq('package_version_id', packageVersionId)
  if (afterError) throw new Error(afterError.message)
  const impact = await packageVersionImpact(packageVersionId)
  await createProductRevision(TABLES.packageVersions, packageVersionId, 'product.package_composition.updated', { package: packageVersion, items: beforeItems || [] }, { package: packageVersion, items: afterItems || [] }, payload, impact)
  await createProductChangeJob(TABLES.packageVersions, packageVersionId, 'product.package_composition.updated', payload, impact, { itemId: (data as Row).id })
  await audit('product.package_item.upserted', TABLES.packageItems, String((data as Row).id), row)
  const sync = await synchronizeChangedSubscriptions(packageVersionId, payload)
  return { ok: true, record: data, packageVersionId, originalPackageVersionId: requestedPackageVersionId, cloned: scoped.cloned, impact, sync }
}
async function deletePackageItem(payload: Row) {
  await requireAngelcare360OperatorPermission('operator.packages.update')
  const id = required(payload, 'id', "L'élément package")
  const supabase = await getOperatorClient()
  const { data: item, error: itemError } = await supabase.from(TABLES.packageItems).select('*').eq('id', id).single()
  if (itemError) throw new Error(itemError.message)
  const requestedPackageVersionId = asString((item as Row).package_version_id)
  const scoped = await ensureScopedPackageVersion(requestedPackageVersionId, payload)
  const packageVersionId = scoped.packageVersionId
  const packageVersion = await requirePackageVersion(packageVersionId)
  let workingItemId = id
  if (scoped.cloned) {
    const { data: clonedItem, error: clonedItemError } = await supabase.from(TABLES.packageItems).select('id').eq('package_version_id', packageVersionId).eq('item_type', (item as Row).item_type as never).eq('item_id', (item as Row).item_id as never).maybeSingle()
    if (clonedItemError) throw new Error(clonedItemError.message)
    if (!clonedItem) throw new Error('L’élément correspondant est introuvable dans la révision automatique.')
    workingItemId = asString((clonedItem as Row).id)
  }
  const { data: beforeItems, error: beforeError } = await supabase.from(TABLES.packageItems).select('*').eq('package_version_id', packageVersionId)
  if (beforeError) throw new Error(beforeError.message)
  const record = await deleteRecord(TABLES.packageItems, workingItemId, 'product.package_item.deleted', TABLES.packageItems)
  const { data: afterItems, error: afterError } = await supabase.from(TABLES.packageItems).select('*').eq('package_version_id', packageVersionId)
  if (afterError) throw new Error(afterError.message)
  const impact = await packageVersionImpact(packageVersionId)
  await createProductRevision(TABLES.packageVersions, packageVersionId, 'product.package_composition.item_removed', { package: packageVersion, items: beforeItems || [] }, { package: packageVersion, items: afterItems || [] }, payload, impact)
  await createProductChangeJob(TABLES.packageVersions, packageVersionId, 'product.package_composition.item_removed', payload, impact, { removedItemId: id })
  const sync = await synchronizeChangedSubscriptions(packageVersionId, payload)
  return { ok: true, record, packageVersionId, originalPackageVersionId: requestedPackageVersionId, cloned: scoped.cloned, impact, sync }
}

function tableForProductItem(type: string) {
  if (type === 'module') return TABLES.modules
  if (type === 'feature') return TABLES.features
  if (type === 'addon') return TABLES.addons
  if (type === 'meter') return TABLES.meters
  throw new Error(`Type catalogue non supporté: ${type}`)
}

async function validatePackageComposition(supabase: Awaited<ReturnType<typeof getOperatorClient>>, itemRows: Row[]) {
  const activeRows = itemRows.filter((item: Row) => item.inclusion_type !== 'excluded')
  if (!activeRows.some((item: Row) => item.item_type === 'module')) throw new Error('Un package publiable doit contenir au moins un module.')
  const includedKeys = new Set(activeRows.map((item: Row) => `${asString(item.item_type)}:${asString(item.item_id)}`))
  const statusErrors: string[] = []
  for (const type of ['module', 'feature', 'addon', 'meter']) {
    const ids = activeRows.filter((item: Row) => item.item_type === type).map((item: Row) => asString(item.item_id)).filter(Boolean)
    if (!ids.length) continue
    const { data, error } = await supabase.from(tableForProductItem(type)).select('id,name,status,runtime_maturity').in('id', ids)
    if (error) throw new Error(error.message)
    for (const row of (data || []) as Row[]) {
      if (asString(row.status) !== 'published') statusErrors.push(`${asString(row.name, asString(row.id))}: état ${asString(row.status)}`)
      if (['locked', 'deprecated', 'frontend_only'].includes(asString(row.runtime_maturity))) statusErrors.push(`${asString(row.name, asString(row.id))}: maturité ${asString(row.runtime_maturity)}`)
    }
  }
  if (statusErrors.length) throw new Error(`Contenu non publiable: ${statusErrors.join(' · ')}`)
  const sourceIds = activeRows.map((item: Row) => asString(item.item_id)).filter(Boolean)
  if (sourceIds.length) {
    const { data: dependencies, error } = await supabase.from(TABLES.dependencies).select('*').in('source_id', sourceIds)
    if (error) throw new Error(error.message)
    const errors: string[] = []
    for (const dependency of (dependencies || []) as Row[]) {
      const targetKey = `${asString(dependency.target_type)}:${asString(dependency.target_id)}`
      if (dependency.relation_type === 'requires' && !includedKeys.has(targetKey)) errors.push(`Dépendance obligatoire absente: ${targetKey}`)
      if (dependency.relation_type === 'conflicts' && includedKeys.has(targetKey)) errors.push(`Conflit détecté: ${targetKey}`)
    }
    if (errors.length) throw new Error(errors.join(' · '))
  }
  return { activeCount: activeRows.length }
}

async function publishPackageVersion(id: string, changePayload: Row = {}) {
  const session = await requireAngelcare360OperatorPermission('operator.packages.update')
  const supabase = await getOperatorClient()
  const { data: version, error: versionError } = await supabase.from(TABLES.packageVersions).select('*').eq('id', id).single()
  if (versionError) throw new Error(versionError.message)
  const { data: items, error: itemError } = await supabase.from(TABLES.packageItems).select('*').eq('package_version_id', id)
  if (itemError) throw new Error(itemError.message)
  if (!items?.length) throw new Error('Ajoutez au moins un module, une fonctionnalité, un add-on ou une capacité avant publication.')
  const itemRows = (items || []) as Row[]
  const missingRequired = itemRows.filter((item: Row) => item.inclusion_type === 'required' && !item.item_id)
  if (missingRequired.length) throw new Error('Le package contient des dépendances obligatoires incomplètes.')
  let validationWarning: string | null = null
  try { await validatePackageComposition(supabase, itemRows) }
  catch (error) {
    validationWarning = error instanceof Error ? error.message : 'Validation incomplète'
    if (!asString(changePayload.reason)) throw error
  }
  const payload = { status: 'published', published_at: new Date().toISOString(), published_by: session.user.id, updated_at: new Date().toISOString(), lifecycle_note: optional(changePayload.reason) }
  const { data, error } = await supabase.from(TABLES.packageVersions).update(payload).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)
  if ((version as Row).package_id) {
    const moduleIds = itemRows.filter((item: Row) => item.item_type === 'module' && item.inclusion_type !== 'excluded').map((item: Row) => asString(item.item_id)).filter(Boolean)
    const featureIds = itemRows.filter((item: Row) => item.item_type === 'feature' && item.inclusion_type !== 'excluded').map((item: Row) => asString(item.item_id)).filter(Boolean)
    const [{ data: modules }, { data: features }] = await Promise.all([
      moduleIds.length ? supabase.from(TABLES.modules).select('module_key').in('id', moduleIds) : Promise.resolve({ data: [] as Row[] }),
      featureIds.length ? supabase.from(TABLES.features).select('feature_key').in('id', featureIds) : Promise.resolve({ data: [] as Row[] }),
    ])
    await supabase.from('angelcare360_operator_packages').update({ module_keys: ((modules || []) as Row[]).map((row: Row) => asString(row.module_key)).filter(Boolean), feature_keys: ((features || []) as Row[]).map((row: Row) => asString(row.feature_key)).filter(Boolean), status: 'active', updated_at: new Date().toISOString() }).eq('id', (version as Row).package_id as never)
  }
  await supabase.from(TABLES.publications).insert({ entity_type: 'package_version', entity_id: id, action: 'published', version_label: asString((version as Row).version_code), impact_summary: { item_count: itemRows.length }, published_by: session.user.id })
  const impact = await packageVersionImpact(id)
  await createProductRevision(TABLES.packageVersions, id, 'product.package_version.published', toRecord(version) || {}, data as Row, changePayload, { ...impact, validationWarning })
  await audit('product.package_version.published', TABLES.packageVersions, id, payload, toRecord(version))
  return { ok: true, record: data, validationWarning, impact }
}
async function upsertPriceEntry(payload: Row) {
  await requireAngelcare360OperatorPermission('operator.plans.update')
  const supabase = await getOperatorClient()
  const priceBookId = required(payload, 'priceBookId', 'Le catalogue tarifaire')
  const { data: book, error: bookError } = await supabase.from(TABLES.priceBooks).select('*').eq('id', priceBookId).single()
  if (bookError) throw new Error(bookError.message)
  const { data: beforeEntries, error: beforeError } = await supabase.from(TABLES.priceEntries).select('*').eq('price_book_id', priceBookId)
  if (beforeError) throw new Error(beforeError.message)
  const row = { price_book_id: priceBookId, item_type: required(payload, 'itemType', 'Le type'), item_id: required(payload, 'itemId', "L'élément"), billing_cycle: asString(payload.billingCycle, 'monthly'), unit_price: asNumber(payload.unitPrice), setup_fee: asNumber(payload.setupFee), minimum_quantity: payload.minimumQuantity === '' ? null : asNumber(payload.minimumQuantity), maximum_quantity: payload.maximumQuantity === '' ? null : asNumber(payload.maximumQuantity), volume_rules: asArray(payload.volumeRules), updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from(TABLES.priceEntries).upsert(row, { onConflict: 'price_book_id,item_type,item_id,billing_cycle' }).select('*').single()
  if (error) throw new Error(error.message)
  const { data: afterEntries, error: afterError } = await supabase.from(TABLES.priceEntries).select('*').eq('price_book_id', priceBookId)
  if (afterError) throw new Error(afterError.message)
  const impact = { entries: (afterEntries || []).length, selectedSubscriptions: selectedSubscriptionIds(payload).length }
  await createProductRevision(TABLES.priceBooks, priceBookId, 'product.price_entry.admin_updated', { book, entries: beforeEntries || [] }, { book, entries: afterEntries || [] }, payload, impact)
  await createProductChangeJob(TABLES.priceBooks, priceBookId, 'product.price_entry.admin_updated', payload, impact, { priceEntryId: (data as Row).id })
  await audit('product.price_entry.upserted', TABLES.priceEntries, String((data as Row).id), row)
  const billingSync = await synchronizePriceEntry(row, payload)
  return { ok: true, record: data, impact, billingSync, changeScope: adminChangeScope(payload) }
}

async function deletePriceEntry(payload: Row) {
  await requireAngelcare360OperatorPermission('operator.plans.update')
  const id = required(payload, 'id', 'Le tarif')
  const reason = required(payload, 'reason', 'La justification')
  const supabase = await getOperatorClient()
  const { data: entry, error: entryError } = await supabase.from(TABLES.priceEntries).select('*').eq('id', id).single()
  if (entryError) throw new Error(entryError.message)
  const priceBookId = asString((entry as Row).price_book_id)
  const { data: book, error: bookError } = await supabase.from(TABLES.priceBooks).select('*').eq('id', priceBookId).single()
  if (bookError) throw new Error(bookError.message)
  const { data: beforeEntries, error: beforeError } = await supabase.from(TABLES.priceEntries).select('*').eq('price_book_id', priceBookId)
  if (beforeError) throw new Error(beforeError.message)
  const record = await deleteRecord(TABLES.priceEntries, id, 'product.price_entry.deleted_by_admin', TABLES.priceEntries)
  const { data: afterEntries, error: afterError } = await supabase.from(TABLES.priceEntries).select('*').eq('price_book_id', priceBookId)
  if (afterError) throw new Error(afterError.message)
  const impact = { entriesBefore: (beforeEntries || []).length, entriesAfter: (afterEntries || []).length }
  await createProductRevision(TABLES.priceBooks, priceBookId, 'product.price_entry.deleted_by_admin', { book, entries: beforeEntries || [] }, { book, entries: afterEntries || [] }, { ...payload, reason }, impact)
  await createProductChangeJob(TABLES.priceBooks, priceBookId, 'product.price_entry.deleted_by_admin', { ...payload, reason }, impact, { deletedPriceEntryId: id })
  return { ok: true, record, impact }
}

async function assignPackageToSubscription(payload: Row) {
  await requireAngelcare360OperatorPermission('operator.subscriptions.update')
  await requireAngelcare360OperatorPermission('operator.features.update')
  const subscriptionId = required(payload, 'subscriptionId', "L'abonnement")
  const packageVersionId = required(payload, 'packageVersionId', 'La version package')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_subscriptions').select('*').eq('id', subscriptionId).single()
  const { data: version, error: versionError } = await supabase.from(TABLES.packageVersions).select('*').eq('id', packageVersionId).single()
  if (versionError) throw new Error(versionError.message)
  if ((version as Row).status !== 'published') throw new Error('Seule une version package publiée peut être affectée à un abonnement.')
  const billingCycle = asString(payload.billingCycle, asString((before as Row).billing_cycle, 'monthly'))
  const amount = payload.billingAmount === undefined || payload.billingAmount === null || payload.billingAmount === '' ? (billingCycle === 'annual' ? asNumber((version as Row).annual_price) : asNumber((version as Row).monthly_price)) : asNumber(payload.billingAmount)
  const next = { package_version_id: packageVersionId, billing_cycle: billingCycle, billing_amount_mad: amount, updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from('angelcare360_operator_subscriptions').update(next).eq('id', subscriptionId).select('*').single()
  if (error) throw new Error(error.message)
  await audit('product.subscription.package_assigned', 'angelcare360_operator_subscriptions', subscriptionId, next, toRecord(before), { clientId: asString((before as Row).client_id), tenantId: asString((before as Row).tenant_id) })
  if (asBoolean(payload.compileNow, true) && (data as Row).tenant_id) await compileTenantEntitlements({ clientId: (data as Row).client_id, tenantId: (data as Row).tenant_id, subscriptionId, packageVersionId })
  return { ok: true, record: data }
}
async function compileForSubscription(subscriptionId: string) {
  const supabase = await getOperatorClient()
  const { data, error } = await supabase.from('angelcare360_operator_subscriptions').select('id,client_id,tenant_id,package_version_id').eq('id', subscriptionId).single()
  if (error) throw new Error(error.message)
  const row = data as Row
  if (!row.tenant_id || !row.package_version_id) return { ok: true, compiled: false, reason: 'Tenant ou package version non affecté.' }
  const result = await compileTenantEntitlements({ clientId: row.client_id, tenantId: row.tenant_id, subscriptionId, packageVersionId: row.package_version_id })
  return { ok: true, compiled: true, result }
}

async function assignAddon(payload: Row) {
  await requireAngelcare360OperatorPermission('operator.subscriptions.update')
  await requireAngelcare360OperatorPermission('operator.features.update')
  const row = { subscription_id: required(payload, 'subscriptionId', "L'abonnement"), addon_id: required(payload, 'addonId', "L'add-on"), status: asString(payload.status, 'active'), quantity: Math.max(1, asNumber(payload.quantity, 1)), unit_price: asNumber(payload.unitPrice), start_date: asString(payload.startDate, new Date().toISOString().slice(0, 10)), end_date: optional(payload.endDate), notes: optional(payload.notes), updated_at: new Date().toISOString() }
  const supabase = await getOperatorClient()
  const { data, error } = await supabase.from(TABLES.subscriptionAddons).upsert(row, { onConflict: 'subscription_id,addon_id,start_date' }).select('*').single()
  if (error) throw new Error(error.message)
  await audit('product.subscription_addon.assigned', TABLES.subscriptionAddons, String((data as Row).id), row)
  const compilation = await compileForSubscription(row.subscription_id)
  return { ok: true, record: data, compilation }
}
async function removeAddon(payload: Row) {
  await requireAngelcare360OperatorPermission('operator.subscriptions.update')
  await requireAngelcare360OperatorPermission('operator.features.update')
  const id = required(payload, 'id', "L'add-on abonnement")
  const supabase = await getOperatorClient()
  const { data: before, error } = await supabase.from(TABLES.subscriptionAddons).select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  const record = await updateRecord(TABLES.subscriptionAddons, id, { status: 'cancelled', end_date: new Date().toISOString().slice(0, 10) }, 'product.subscription_addon.cancelled', TABLES.subscriptionAddons)
  const compilation = await compileForSubscription(asString((before as Row).subscription_id))
  return { ok: true, record, compilation }
}
async function assignTopup(payload: Row) {
  await requireAngelcare360OperatorPermission('operator.usage.update')
  await requireAngelcare360OperatorPermission('operator.features.update')
  const row = { subscription_id: required(payload, 'subscriptionId', "L'abonnement"), tenant_id: optional(payload.tenantId), meter_id: required(payload, 'meterId', 'La capacité'), quantity: asNumber(payload.quantity), amount: asNumber(payload.amount), currency: asString(payload.currency, 'MAD'), status: asString(payload.status, 'active'), starts_at: asString(payload.startsAt, new Date().toISOString()), expires_at: optional(payload.expiresAt), reason: optional(payload.reason) }
  const record = await insertRecord(TABLES.topups, row, 'product.capacity_topup.assigned', TABLES.topups)
  const compilation = await compileForSubscription(row.subscription_id)
  return { ok: true, record, compilation }
}
async function removeTopup(payload: Row) {
  await requireAngelcare360OperatorPermission('operator.usage.update')
  await requireAngelcare360OperatorPermission('operator.features.update')
  const id = required(payload, 'id', 'Le top-up')
  const supabase = await getOperatorClient()
  const { data: before, error } = await supabase.from(TABLES.topups).select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  const record = await updateRecord(TABLES.topups, id, { status: 'cancelled' }, 'product.capacity_topup.cancelled', TABLES.topups)
  const compilation = await compileForSubscription(asString((before as Row).subscription_id))
  return { ok: true, record, compilation }
}

async function upsertOverride(payload: Row) {
  const session = await requireAngelcare360OperatorPermission('operator.features.update')
  const row = { client_id: required(payload, 'clientId', 'Le client'), tenant_id: required(payload, 'tenantId', 'Le tenant'), item_type: required(payload, 'itemType', 'Le type'), item_id: optional(payload.itemId), item_key: required(payload, 'itemKey', 'La clé'), override_state: required(payload, 'overrideState', "L'état"), quantity_override: payload.quantityOverride === '' ? null : asNumber(payload.quantityOverride), reason: required(payload, 'reason', 'La raison'), approval_status: asString(payload.approvalStatus, 'approved'), starts_at: asString(payload.startsAt, new Date().toISOString()), expires_at: optional(payload.expiresAt), status: asString(payload.status, 'active'), created_by: session.user.id, updated_at: new Date().toISOString() }
  const supabase = await getOperatorClient()
  const id = asString(payload.id)
  if (id) return { ok: true, record: await updateRecord(TABLES.overrides, id, row, 'product.tenant_override.updated', TABLES.overrides, { clientId: row.client_id, tenantId: row.tenant_id }) }
  const record = await insertRecord(TABLES.overrides, row, 'product.tenant_override.created', TABLES.overrides)
  return { ok: true, record }
}
async function applyOverrideAndCompile(payload: Row) {
  await requireAngelcare360OperatorPermission('operator.features.update')
  const result = await upsertOverride(payload)
  const compilation = await compileTenantEntitlements({ clientId: payload.clientId, tenantId: payload.tenantId, subscriptionId: payload.subscriptionId, packageVersionId: payload.packageVersionId })
  return { ok: true, record: result.record, compilation }
}

async function revokeOverride(payload: Row) {
  await requireAngelcare360OperatorPermission('operator.features.update')
  const id = required(payload, 'id', "L'override")
  const record = await updateRecord(TABLES.overrides, id, { status: 'revoked' }, 'product.tenant_override.revoked', TABLES.overrides)
  const compilation = payload.subscriptionId ? await compileTenantEntitlements({ clientId: payload.clientId, tenantId: payload.tenantId, subscriptionId: payload.subscriptionId, packageVersionId: payload.packageVersionId }) : null
  return { ok: true, record, compilation }
}
async function createScheduledChange(payload: Row) {
  const session = await requireAngelcare360OperatorPermission('operator.features.update')
  const row = { client_id: required(payload, 'clientId', 'Le client'), tenant_id: required(payload, 'tenantId', 'Le tenant'), subscription_id: optional(payload.subscriptionId), change_type: required(payload, 'changeType', 'Le type de changement'), payload: jsonObject(payload.changePayload), scheduled_for: required(payload, 'scheduledFor', 'La date'), status: 'scheduled', reason: optional(payload.reason), created_by: session.user.id }
  return { ok: true, record: await insertRecord('angelcare360_operator_entitlement_change_schedule', row, 'product.entitlement_change.scheduled', 'angelcare360_operator_entitlement_change_schedule') }
}
async function cancelScheduledChange(payload: Row) {
  await requireAngelcare360OperatorPermission('operator.features.update')
  return { ok: true, record: await updateRecord('angelcare360_operator_entitlement_change_schedule', required(payload, 'id', 'Le changement'), { status: 'cancelled' }, 'product.entitlement_change.cancelled', 'angelcare360_operator_entitlement_change_schedule') }
}

async function restoreTenantBaseline(payload: Row) {
  const session = await requireAngelcare360OperatorPermission('operator.features.update')
  const clientId = required(payload, 'clientId', 'Le client')
  const tenantId = required(payload, 'tenantId', 'Le tenant')
  const subscriptionId = required(payload, 'subscriptionId', "L'abonnement")
  const supabase = await getOperatorClient()
  const now = new Date().toISOString()
  const { data: activeOverrides, error: overrideReadError } = await supabase.from(TABLES.overrides).select('*').eq('tenant_id', tenantId).eq('status', 'active')
  if (overrideReadError) throw new Error(overrideReadError.message)
  const overrideRows = (activeOverrides || []) as Row[]
  if (overrideRows.length) {
    const { error } = await supabase.from(TABLES.overrides).update({ status: 'revoked', updated_at: now }).eq('tenant_id', tenantId).eq('status', 'active')
    if (error) throw new Error(error.message)
  }
  const result = await compileTenantEntitlements({ clientId, tenantId, subscriptionId, packageVersionId: payload.packageVersionId })
  await audit('product.tenant_baseline.restored', TABLES.entitlementSnapshots, asString(toRecord(result.snapshot).id), { revoked_overrides: overrideRows.length, restored_by: session.user.id }, null, { clientId, tenantId })
  return { ...result, ok: true, revokedOverrides: overrideRows.length }
}

export async function compileTenantEntitlements(
  rawPayload: unknown,
  trustedAuthority?: { actorUserId: string; client?: Awaited<ReturnType<typeof getOperatorClient>>; skipOperatorAudit?: boolean },
) {
  const payload = toRecord(rawPayload)
  const session = trustedAuthority
    ? { user: { id: trustedAuthority.actorUserId } }
    : await requireAngelcare360OperatorPermission('operator.features.update')
  const clientId = required(payload, 'clientId', 'Le client')
  const tenantId = required(payload, 'tenantId', 'Le tenant')
  const subscriptionId = required(payload, 'subscriptionId', "L'abonnement")
  const supabase = trustedAuthority?.client ?? await getOperatorClient()
  const [{ data: subscription, error: subscriptionError }, { data: tenant, error: tenantError }] = await Promise.all([
    supabase.from('angelcare360_operator_subscriptions').select('*').eq('id', subscriptionId).single(),
    supabase.from('angelcare360_operator_tenants').select('*').eq('id', tenantId).single(),
  ])
  if (subscriptionError) throw new Error(subscriptionError.message)
  if (tenantError) throw new Error(tenantError.message)
  const subscriptionRow = subscription as Row
  if (asString(subscriptionRow.client_id) !== clientId || asString(subscriptionRow.tenant_id) !== tenantId) throw new Error("L'abonnement ne correspond pas au client et au tenant sélectionnés.")
  const packageVersionId = asString(payload.packageVersionId, asString(subscriptionRow.package_version_id))
  if (!packageVersionId) throw new Error("Aucune version package n'est affectée à cet abonnement.")
  const [{ data: packageVersion, error: packageError }, { data: packageItems, error: itemError }, { data: subscriptionAddons }, { data: topups }, { data: overrides }] = await Promise.all([
    supabase.from(TABLES.packageVersions).select('*').eq('id', packageVersionId).single(),
    supabase.from(TABLES.packageItems).select('*').eq('package_version_id', packageVersionId),
    supabase.from(TABLES.subscriptionAddons).select('*').eq('subscription_id', subscriptionId).eq('status', 'active'),
    supabase.from(TABLES.topups).select('*').eq('subscription_id', subscriptionId).eq('status', 'active'),
    supabase.from(TABLES.overrides).select('*').eq('tenant_id', tenantId).eq('status', 'active'),
  ])
  if (packageError) throw new Error(packageError.message)
  if (itemError) throw new Error(itemError.message)
  const packageVersionRow = packageVersion as Row
  if (asString(packageVersionRow.status) !== 'published') throw new Error('Le tenant ne peut être compilé que depuis une version package publiée.')
  const now = Date.now()
  const packageItemRows = ((packageItems || []) as Row[]).filter((item: Row) => item.inclusion_type !== 'excluded')
  const subscriptionAddonRows = ((subscriptionAddons || []) as Row[]).filter((item: Row) => !item.end_date || Date.parse(asString(item.end_date)) >= now)
  const topupRows = ((topups || []) as Row[]).filter((item: Row) => !item.expires_at || Date.parse(asString(item.expires_at)) >= now)
  const overrideRows = ((overrides || []) as Row[]).filter((item: Row) => !item.expires_at || Date.parse(asString(item.expires_at)) >= now)

  const moduleIds = packageItemRows.filter((item: Row) => item.item_type === 'module').map((item: Row) => asString(item.item_id)).filter(Boolean)
  const capabilityIds = packageItemRows.filter((item: Row) => item.item_type === 'capability').map((item: Row) => asString(item.item_id)).filter(Boolean)
  const directFeatureIds = packageItemRows.filter((item: Row) => item.item_type === 'feature').map((item: Row) => asString(item.item_id)).filter(Boolean)
  const serviceIds = packageItemRows.filter((item: Row) => item.item_type === 'service').map((item: Row) => asString(item.item_id)).filter(Boolean)
  const modules = await fetchByIds(supabase, TABLES.modules, moduleIds)
  const capabilities = await fetchByIds(supabase, TABLES.capabilities, capabilityIds)
  const services = await fetchByIds(supabase, TABLES.services, serviceIds)
  const directFeatures = await fetchByIds(supabase, TABLES.features, directFeatureIds)
  let inheritedFeatures: Row[] = []
  if (moduleIds.length) {
    const { data, error } = await supabase.from(TABLES.features).select('*').in('module_id', moduleIds).eq('status', 'published').in('sellability', ['included', 'customer_sellable'])
    if (error) throw new Error(error.message)
    inheritedFeatures = (data || []) as Row[]
  }
  const featureMap = new Map<string, Row>()
  for (const feature of [...inheritedFeatures, ...directFeatures]) featureMap.set(asString(feature.id), feature)
  const features = [...featureMap.values()]
  const addons = await fetchByIds(supabase, TABLES.addons, [...packageItemRows.filter((item: Row) => item.item_type === 'addon').map((item: Row) => asString(item.item_id)), ...subscriptionAddonRows.map((item: Row) => asString(item.addon_id))].filter(Boolean))
  const meters = await fetchByIds(supabase, TABLES.meters, [...packageItemRows.filter((item: Row) => item.item_type === 'meter').map((item: Row) => asString(item.item_id)), ...topupRows.map((item: Row) => asString(item.meter_id))].filter(Boolean))
  const packageItemMap = new Map<string, Row>(packageItemRows.map((item: Row) => [`${asString(item.item_type)}:${asString(item.item_id)}`, item]))
  const moduleById = new Map<string, Row>(modules.map((module: Row) => [asString(module.id), module]))
  const rows: Row[] = []
  for (const module of modules) rows.push(entitlementRow('module', module, packageItemMap.get(`module:${asString(module.id)}`), 'package'))
  for (const capability of capabilities) rows.push(entitlementRow('capability', capability, packageItemMap.get(`capability:${asString(capability.id)}`), 'package'))
  for (const service of services) rows.push(entitlementRow('service', service, packageItemMap.get(`service:${asString(service.id)}`), 'package'))
  for (const feature of features) {
    const directItem = packageItemMap.get(`feature:${asString(feature.id)}`)
    const row = entitlementRow('feature', feature, directItem, directItem ? 'package' : 'module_inheritance')
    row.module_key = asString(moduleById.get(asString(feature.module_id))?.module_key, 'product')
    rows.push(row)
  }
  for (const addon of addons) {
    const subscriptionAddon = subscriptionAddonRows.find((row: Row) => asString(row.addon_id) === asString(addon.id))
    rows.push(entitlementRow('addon', addon, packageItemMap.get(`addon:${asString(addon.id)}`), subscriptionAddon ? 'addon' : 'package', asNumber(subscriptionAddon?.quantity, asNumber(packageItemMap.get(`addon:${asString(addon.id)}`)?.quantity, 1))))
  }
  for (const meter of meters) {
    const base = packageItemMap.get(`meter:${asString(meter.id)}`)
    const topupQuantity = topupRows.filter((row: Row) => asString(row.meter_id) === asString(meter.id)).reduce((sum: number, row: Row) => sum + asNumber(row.quantity), 0)
    rows.push(entitlementRow('meter', meter, base, topupQuantity ? 'topup' : 'package', asNumber(base?.quantity) + topupQuantity))
  }
  for (const override of overrideRows) {
    const key = asString(override.item_key)
    const existing = rows.find((row) => row.item_type === override.item_type && row.item_key === key)
    if (existing) {
      existing.effective_state = override.override_state
      existing.origin = 'override'
      existing.reason = override.reason
      if (override.quantity_override !== null && override.quantity_override !== undefined) existing.quantity = override.quantity_override
    } else {
      rows.push({ item_type: override.item_type, item_id: override.item_id, item_key: key, item_label: key, module_key: null, effective_state: override.override_state, origin: 'override', quantity: override.quantity_override, configuration: {}, reason: override.reason })
    }
  }

  const subscriptionStatus = asString(subscriptionRow.status)
  const tenantStatus = asString((tenant as Row).status)
  const accessSuspended = ['suspended', 'cancelled', 'expired', 'archived'].includes(subscriptionStatus) || ['suspended', 'archived'].includes(tenantStatus)
  if (accessSuspended) {
    for (const row of rows) {
      if (['module', 'capability', 'feature', 'service'].includes(asString(row.item_type))) {
        row.effective_state = 'suspended'
        row.origin = 'payment_gate'
        row.reason = `Accès suspendu: abonnement ${subscriptionStatus}, tenant ${tenantStatus}.`
      }
    }
  }

  const signaturePayload = { packageVersionId, packageItems: packageItemRows, inheritedFeatureIds: inheritedFeatures.map((row: Row) => row.id), subscriptionAddons: subscriptionAddonRows, topups: topupRows, overrides: overrideRows, subscriptionStatus, tenantStatus }
  const signature = createHash('sha256').update(JSON.stringify(signaturePayload)).digest('hex')
  const { data: snapshot, error: snapshotError } = await supabase.from(TABLES.entitlementSnapshots).insert({ client_id: clientId, tenant_id: tenantId, subscription_id: subscriptionId, package_version_id: packageVersionId, status: 'compiled', source_signature: signature, compiled_payload: { package: packageVersionRow.version_code, item_count: rows.length, compiled_by: session.user.id, subscription_status: subscriptionStatus, tenant_status: tenantStatus }, compiled_at: new Date().toISOString() }).select('*').single()
  if (snapshotError) throw new Error(snapshotError.message)
  const snapshotId = String((snapshot as Row).id)
  const withSnapshot = rows.map((row) => ({ ...row, snapshot_id: snapshotId }))
  const { error: rowsError } = await supabase.from(TABLES.entitlementItems).insert(withSnapshot)
  if (rowsError) {
    await supabase.from(TABLES.entitlementSnapshots).update({ status: 'failed', compiled_payload: { error: rowsError.message } }).eq('id', snapshotId)
    throw new Error(rowsError.message)
  }
  try {
    await syncLegacyRuntime(supabase, clientId, tenantId, rows)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Synchronisation runtime impossible.'
    await supabase.from(TABLES.entitlementSnapshots).update({ status: 'failed', compiled_payload: { error: message } }).eq('id', snapshotId)
    throw error
  }
  await supabase.from(TABLES.entitlementSnapshots).update({ status: 'superseded', superseded_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('status', 'active').neq('id', snapshotId)
  await supabase.from(TABLES.entitlementSnapshots).update({ status: 'active', activated_at: new Date().toISOString() }).eq('id', snapshotId)
  if (!trustedAuthority?.skipOperatorAudit) {
    await audit('product.entitlements.compiled', TABLES.entitlementSnapshots, snapshotId, { source_signature: signature, item_count: rows.length }, null, { clientId, tenantId })
  }
  return { ok: true, snapshot: { ...(snapshot as Row), status: 'active' }, itemCount: rows.length, sourceSignature: signature }
}

async function fetchByIds(supabase: Awaited<ReturnType<typeof getOperatorClient>>, table: string, ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))]
  if (!unique.length) return [] as Row[]
  const { data, error } = await supabase.from(table).select('*').in('id', unique)
  if (error) throw new Error(error.message)
  return (data || []) as Row[]
}
function entitlementRow(type: ProductKernelItemType, record: Row, item: Row | undefined, origin: string, quantity?: number): Row {
  const key = type === 'module'
    ? asString(record.module_key)
    : type === 'capability'
      ? asString(record.capability_key)
      : type === 'feature'
        ? asString(record.feature_key)
        : type === 'service'
          ? asString(record.service_key, asString(record.service_code))
          : type === 'addon'
            ? asString(record.addon_code)
            : asString(record.meter_key)
  const moduleKey = type === 'module'
    ? key
    : asString(record.module_key, asString(record.parent_module_key)) || null
  return { item_type: type, item_id: record.id, item_key: key, item_label: asString(record.name, key), module_key: moduleKey, effective_state: record.configuration_required ? 'requires_configuration' : 'enabled', origin, quantity: quantity ?? item?.quantity ?? null, unit: type === 'meter' ? asString(record.unit) || null : null, configuration: item?.configuration || {}, reason: null }
}
async function syncLegacyRuntime(supabase: Awaited<ReturnType<typeof getOperatorClient>>, clientId: string, tenantId: string, rows: Row[]) {
  const featureRows = rows.filter((row) => ['module', 'capability', 'feature', 'service'].includes(asString(row.item_type))).map((row) => {
    const effectiveState = asString(row.effective_state)
    const legacyStatus = effectiveState === 'enabled' ? 'enabled' : effectiveState === 'requires_configuration' ? 'requires_configuration' : effectiveState === 'locked' || effectiveState === 'suspended' ? 'locked' : 'disabled'
    return {
      client_id: clientId,
      tenant_id: tenantId,
      feature_key: row.item_key,
      feature_label: row.item_label,
      module_key: row.item_type === 'module' ? row.item_key : asString(row.module_key, 'product'),
      status: legacyStatus,
      enabled: effectiveState === 'enabled',
      locked_reason: row.reason || (effectiveState === 'suspended' ? 'Suspension commerciale ou opérationnelle.' : null),
      activated_at: effectiveState === 'enabled' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }
  })
  if (featureRows.length) {
    const { error } = await supabase.from('angelcare360_operator_feature_flags').upsert(featureRows, { onConflict: 'client_id,tenant_id,feature_key' })
    if (error) throw new Error(`Synchronisation feature flags: ${error.message}`)
  }
  const { data: existingLimits, error: limitReadError } = await supabase.from('angelcare360_operator_usage_limits').select('limit_key,current_value,unit,reset_cycle').eq('client_id', clientId).eq('tenant_id', tenantId)
  if (limitReadError) throw new Error(`Lecture usage limits: ${limitReadError.message}`)
  const existingMap = new Map<string, Row>(((existingLimits || []) as Row[]).map((row: Row) => [asString(row.limit_key), row]))
  const limitRows = rows.filter((row) => row.item_type === 'meter').map((row) => {
    const existing = existingMap.get(asString(row.item_key))
    return {
      client_id: clientId,
      tenant_id: tenantId,
      limit_key: row.item_key,
      label: row.item_label,
      allowed_value: row.quantity === null ? null : Math.trunc(asNumber(row.quantity)),
      current_value: Math.trunc(asNumber(existing?.current_value, 0)),
      unit: asString(existing?.unit, 'unités'),
      status: row.effective_state === 'suspended' || row.effective_state === 'disabled' ? 'paused' : 'active',
      reset_cycle: existing?.reset_cycle || null,
      updated_at: new Date().toISOString(),
    }
  })
  if (limitRows.length) {
    const { error } = await supabase.from('angelcare360_operator_usage_limits').upsert(limitRows, { onConflict: 'client_id,tenant_id,limit_key' })
    if (error) throw new Error(`Synchronisation usage limits: ${error.message}`)
  }
}

export async function runNativeProductScanner() {
  const session = await requireAngelcare360OperatorPermission('operator.plans.update')
  const supabase = await getOperatorClient()
  const { data: run, error: runError } = await supabase.from(TABLES.scannerRuns).insert({ status: 'running', initiated_by: session.user.id }).select('*').single()
  if (runError) throw new Error(runError.message)
  const runId = String((run as Row).id)
  try {
    const root = process.cwd()
    const customerRoot = path.join(root, 'app', '(protected)', 'angelcare-360-command-center')
    const apiRoot = path.join(root, 'app', 'api', 'angelcare360')
    const migrationRoot = path.join(root, 'supabase', 'migrations')
    const [customerFiles, apiFiles, migrationFiles] = await Promise.all([walk(customerRoot), walk(apiRoot), walk(migrationRoot)])
    const permissionFiles = [...customerFiles, ...apiFiles].filter((file) => /\.(ts|tsx)$/.test(file))
    const permissionText = (await Promise.all(permissionFiles.slice(0, 500).map((file) => readFile(file, 'utf8').catch(() => '')))).join('\n')
    const modules = inferModules(customerRoot, customerFiles, apiRoot, apiFiles, permissionText, migrationFiles)
    const findings: Row[] = []
    for (const module of modules) {
      findings.push({ run_id: runId, finding_type: 'module', finding_key: module.moduleKey, title: module.name, description: module.summary, classification: module.classification, confidence: module.confidence, evidence: module.evidence, suggestion: module.suggestion, status: 'open' })
      for (const feature of module.features) findings.push({ run_id: runId, finding_type: 'feature', finding_key: feature.featureKey, title: feature.name, description: `Fonctionnalité détectée sous ${module.name}.`, classification: feature.classification, confidence: feature.confidence, evidence: feature.evidence, suggestion: feature.suggestion, status: 'open' })
      for (const meter of module.meters) findings.push({ run_id: runId, finding_type: 'meter', finding_key: meter[0], title: meter[1], description: `Capacité suggérée pour ${module.name}.`, classification: 'capacity_controlled', confidence: 78, evidence: module.evidence.slice(0, 4), suggestion: { meterKey: meter[0], name: meter[1], unit: meter[2], meterType: 'capacity', status: 'draft', topupEnabled: true }, status: 'open' })
    }
    const signature = createHash('sha256').update(JSON.stringify({ customerFiles: customerFiles.map(relative(root)), apiFiles: apiFiles.map(relative(root)), migrationFiles: migrationFiles.map(relative(root)) })).digest('hex')
    if (findings.length) {
      const { error } = await supabase.from(TABLES.scannerFindings).insert(findings)
      if (error) throw new Error(error.message)
    }
    const summary = { modules: modules.length, features: modules.reduce((sum, module) => sum + module.features.length, 0), findings: findings.length, customer_files: customerFiles.length, api_files: apiFiles.length, migration_files: migrationFiles.length }
    await supabase.from(TABLES.scannerRuns).update({ status: 'completed', completed_at: new Date().toISOString(), repository_signature: signature, summary }).eq('id', runId)
    await audit('product.scanner.completed', TABLES.scannerRuns, runId, { repository_signature: signature, summary })
    return { ok: true, runId, repositorySignature: signature, summary, findings }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur scanner native.'
    await supabase.from(TABLES.scannerRuns).update({ status: 'failed', completed_at: new Date().toISOString(), error_message: message }).eq('id', runId)
    return { ok: false, error: message, runId }
  }
}

async function adoptScannerFinding(payload: Row) {
  await requireAngelcare360OperatorPermission('operator.plans.create')
  const id = required(payload, 'id', 'Le finding')
  const supabase = await getOperatorClient()
  const { data: finding, error } = await supabase.from(TABLES.scannerFindings).select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  const suggestion = toRecord((finding as Row).suggestion)
  let adopted: Row
  if ((finding as Row).finding_type === 'module') adopted = await insertRecord(TABLES.modules, modulePayload(suggestion), 'product.module.adopted_from_scanner', TABLES.modules)
  else if ((finding as Row).finding_type === 'feature') adopted = await insertRecord(TABLES.features, featurePayload({ ...suggestion, moduleId: payload.moduleId || suggestion.moduleId }), 'product.feature.adopted_from_scanner', TABLES.features)
  else if ((finding as Row).finding_type === 'meter') adopted = await insertRecord(TABLES.meters, meterPayload(suggestion), 'product.meter.adopted_from_scanner', TABLES.meters)
  else throw new Error('Ce finding nécessite une qualification manuelle avant adoption.')
  await supabase.from(TABLES.scannerFindings).update({ status: 'accepted', adopted_entity_type: (finding as Row).finding_type, adopted_entity_id: adopted.id, updated_at: new Date().toISOString() }).eq('id', id)
  return { ok: true, record: adopted }
}

async function walk(root: string): Promise<string[]> {
  const output: string[] = []
  async function visit(current: string) {
    try {
      const entries = await readdir(current, { withFileTypes: true, encoding: 'utf8' })
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '.next') continue
        const full = path.join(current, entry.name)
        if (entry.isDirectory()) await visit(full)
        else output.push(full)
      }
    } catch { return }
  }
  await visit(root)
  return output
}
function relative(root: string) { return (file: string) => path.relative(root, file).replaceAll(path.sep, '/') }
function humanizeKey(value: string) { return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) }
function inferModules(customerRoot: string, customerFiles: string[], apiRoot: string, apiFiles: string[], permissionText: string, migrationFiles: string[]) {
  const topLevels = new Map<string, string[]>()
  for (const file of customerFiles.filter((item) => /page\.tsx$/.test(item))) {
    const rel = path.relative(customerRoot, file).replaceAll(path.sep, '/')
    const top = rel.split('/')[0]
    if (!top || top.startsWith('[') || top === 'page.tsx') continue
    topLevels.set(top, [...(topLevels.get(top) || []), rel])
  }
  const alias: Record<string, string> = { administration: 'administration', personnes: 'people', people: 'people', admissions: 'admissions', presences: 'attendance', attendance: 'attendance', academique: 'academics', academics: 'academics', finance: 'finance', paie: 'payroll', payroll: 'payroll', transport: 'transport', bibliotheque: 'library', library: 'library', inventaire: 'inventory', inventory: 'inventory', messagerie: 'communications', notifications: 'communications', reclamations: 'communications', rapports: 'reports', reports: 'reports' }
  const grouped = new Map<string, string[]>()
  for (const [route, files] of topLevels) {
    const key = alias[route] || route
    grouped.set(key, [...(grouped.get(key) || []), ...files])
  }
  return [...grouped.entries()].map(([moduleKey, routeFiles]) => {
    const known = KNOWN_MODULES[moduleKey]
    const apiMatches = apiFiles.filter((file) => file.toLowerCase().includes(moduleKey.toLowerCase()) || routeFiles.some((route) => file.toLowerCase().includes(route.split('/')[0].toLowerCase())))
    const routePrefix = `/angelcare-360-command-center/${routeFiles[0]?.split('/')[0] || moduleKey}`
    const permissions = [...new Set((permissionText.match(new RegExp(`angelcare360\\.${moduleKey.replace(/[-_]/g, '[._-]?')}[\\w.*-]*`, 'gi')) || []).slice(0, 30))]
    const evidence = [...routeFiles.slice(0, 15).map((file) => ({ type: 'customer_route', path: `app/(protected)/angelcare-360-command-center/${file}` })), ...apiMatches.slice(0, 10).map((file) => ({ type: 'api', path: path.relative(process.cwd(), file).replaceAll(path.sep, '/') }))]
    const features = [...new Set(routeFiles.map((file) => file.split('/').slice(0, -1).join('/')).filter((file) => file && file !== routeFiles[0]?.split('/')[0]))].slice(0, 30).map((featurePath) => {
      const tail = featurePath.split('/').at(-1) || featurePath
      const featureKey = `${moduleKey}.${tail.replace(/\[|\]/g, '').replace(/[^a-zA-Z0-9]+/g, '_')}`.toLowerCase()
      return { featureKey, name: humanizeKey(tail), classification: apiMatches.length ? 'customer_sellable' : 'frontend_only', confidence: apiMatches.length ? 88 : 68, evidence: [{ type: 'customer_route', path: `app/(protected)/angelcare-360-command-center/${featurePath}` }], suggestion: { featureKey, name: humanizeKey(tail), featureTier: 'standard', sellability: 'included', runtimeMaturity: apiMatches.length ? 'operational' : 'frontend_only', customerRoute: `${routePrefix}/${featurePath.split('/').slice(1).join('/')}`, permissionKeys: permissions, status: 'draft' } }
    })
    return {
      moduleKey,
      name: known?.name || humanizeKey(moduleKey),
      summary: known?.summary || `Domaine détecté dans le Customer Command Center: ${routeFiles.length} route(s).`,
      classification: apiMatches.length ? 'customer_sellable' : 'configuration_dependent',
      confidence: Math.min(98, 62 + Math.min(routeFiles.length, 15) + Math.min(apiMatches.length * 4, 20)),
      evidence,
      meters: known?.meters || [],
      features,
      suggestion: {
        moduleKey, name: known?.name || humanizeKey(moduleKey), description: known?.summary || `Module détecté depuis ${routePrefix}.`, commercialSummary: known?.summary || `Capacité AngelCare 360 couvrant ${routeFiles.length} surfaces opérationnelles.`, category: known?.category || 'core', status: 'draft', sellability: 'customer_sellable', runtimeMaturity: apiMatches.length ? 'operational' : 'configuration_dependent', version: '1.0.0', customerRoutePrefix: routePrefix, apiPrefix: apiMatches.length ? `/api/angelcare360/${moduleKey}` : null, permissionKeys: permissions, evidence, regionAvailability: ['MA'], dependencies: known?.dependencies || [],
      },
    }
  }).sort((a, b) => a.name.localeCompare(b.name))
}
