import { createClient } from '@/lib/supabase/server'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from './context'
import { recordAngelcare360AuditEventServer } from './audit'
import {
  angelcare360InventoryAuditQueryFiltersSchema,
  angelcare360InventoryCategoryCreateSchema,
  angelcare360InventoryCategoryUpdateSchema,
  angelcare360InventoryItemCreateSchema,
  angelcare360InventoryItemUpdateSchema,
  angelcare360InventoryMovementCreateSchema,
} from '@/lib/angelcare360/validation'
import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'
import type {
  Angelcare360InventoryAuditFilter,
  Angelcare360InventoryCategoryListRecord,
  Angelcare360InventoryCategoryRecord,
  Angelcare360InventoryItemListRecord,
  Angelcare360InventoryItemRecord,
  Angelcare360InventoryMovementListRecord,
  Angelcare360InventoryMovementRecord,
  Angelcare360InventoryMutationResult,
  Angelcare360InventoryOverviewRecord,
  Angelcare360InventoryResponsibleCoverageRecord,
} from '@/types/angelcare360/inventory'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>
type Row = Record<string, any>

const INVENTORY_MODULE = 'inventaire'
const BLOCKED_EXPORT_MESSAGE = 'L’export PDF sera activé dans la phase Rapports & Exports.'
const BLOCKED_BARCODE_MESSAGE = 'La lecture code-barres nécessite une intégration dédiée.'

function asString(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function asOptionalString(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  return typeof value === 'string' ? value : String(value)
}

function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value)
  return null
}

function buildHref(basePath: string, id: string) {
  return `${basePath}/${id}`
}

function baseRecordFields(row: Row) {
  const createdAt = asString(row.created_at || new Date().toISOString())
  return {
    created_at: createdAt,
    updated_at: asString(row.updated_at || row.created_at || createdAt),
  }
}

async function getContextOrThrow(permissionKey: string, schoolId?: string | null) {
  const context = await requireAngelcare360Permission(permissionKey, { schoolId })
  if (!context.school) {
    throw new Error('Aucun établissement actif n’est disponible.')
  }
  return context
}

async function auditInventoryEvent(input: {
  action: string
  severity?: 'debug' | 'info' | 'notice' | 'warning' | 'critical'
  schoolId: string
  entityType: string
  entityId: string
  beforeData?: Record<string, unknown>
  afterData?: Record<string, unknown>
  metadata?: Record<string, unknown>
}) {
  return recordAngelcare360AuditEventServer({
    category: 'inventory',
    module: INVENTORY_MODULE,
    action: input.action,
    schoolId: input.schoolId,
    entityType: input.entityType,
    entityId: input.entityId,
    severity: input.severity || 'info',
    beforeData: input.beforeData,
    afterData: input.afterData,
    metadata: input.metadata,
  })
}

async function countRows(client: SupabaseClient, table: string, schoolId: string, filters?: Array<[string, 'eq' | 'gte' | 'lte' | 'in', unknown]>) {
  let query = client.from(table).select('id', { count: 'exact', head: true }).eq('school_id', schoolId)
  for (const [column, operator, value] of filters || []) {
    if (operator === 'eq') query = query.eq(column, value as never)
    if (operator === 'gte') query = query.gte(column, value as never)
    if (operator === 'lte') query = query.lte(column, value as never)
    if (operator === 'in' && Array.isArray(value)) query = query.in(column, value as never[])
  }
  const { count } = await query
  return count ?? 0
}

function computedItemStatus(currentStock: number, reorderLevel: number, status: string) {
  if (['damaged', 'lost', 'archived', 'inactive'].includes(status)) return status
  if (currentStock <= 0) return 'out_of_stock'
  if (reorderLevel >= 0 && currentStock <= reorderLevel) return 'low_stock'
  return 'active'
}

function mapCategoryRecord(row: Row, itemCount: number): Angelcare360InventoryCategoryListRecord {
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    category_code: asString(row.category_code),
    label: asString(row.label),
    description: row.description ? asString(row.description) : null,
    status: asString(row.status),
    item_count: itemCount,
  }
}

function mapItemRecord(row: Row, movementCount = 0): Angelcare360InventoryItemListRecord {
  const currentStock = asNumber(row.current_stock) || 0
  const reorderLevel = asNumber(row.reorder_level) || 0
  const status = computedItemStatus(currentStock, reorderLevel, asString(row.status))
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    category_id: asString(row.category_id),
    item_code: asString(row.item_code),
    label: asString(row.label),
    unit_of_measure: asString(row.unit_of_measure || 'unit'),
    barcode: row.barcode ? asString(row.barcode) : null,
    current_stock: currentStock,
    reorder_level: reorderLevel,
    purchase_price: asNumber(row.purchase_price) || 0,
    responsible_staff_id: row.responsible_staff_id ? asString(row.responsible_staff_id) : null,
    status,
    category_label: row.category?.label ? asString(row.category.label) : null,
    category_code: row.category?.category_code ? asString(row.category.category_code) : null,
    responsible_staff_full_name: row.responsible_staff?.full_name ? asString(row.responsible_staff.full_name) : null,
    movement_count: movementCount,
    low_stock: status === 'low_stock',
    out_of_stock: status === 'out_of_stock',
    detail_href: buildHref('/angelcare-360-command-center/inventaire/articles', asString(row.id)),
  }
}

function mapMovementRecord(row: Row): Angelcare360InventoryMovementListRecord {
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    item_id: asString(row.item_id),
    movement_code: asString(row.movement_code),
    movement_type: asString(row.movement_type),
    quantity: asNumber(row.quantity) || 0,
    movement_date: asString(row.movement_date),
    reference_type: row.reference_type ? asString(row.reference_type) : null,
    reference_id: row.reference_id ? asString(row.reference_id) : null,
    performed_by: row.performed_by ? asString(row.performed_by) : null,
    notes: row.notes ? asString(row.notes) : null,
    status: asString(row.status),
    item_code: row.item?.item_code ? asString(row.item.item_code) : null,
    item_label: row.item?.label ? asString(row.item.label) : null,
    category_label: row.item?.category?.label ? asString(row.item.category.label) : null,
    responsible_staff_full_name: row.performed_by_staff?.full_name ? asString(row.performed_by_staff.full_name) : null,
  }
}

export async function getAngelcare360InventoryOverview(options?: { schoolId?: string | null }): Promise<Angelcare360InventoryOverviewRecord | null> {
  const context = await getAngelcare360AccessContext({ schoolId: options?.schoolId })
  if (!context?.school) return null
  const supabase = await createClient()
  const schoolId = context.school.id
  const [categoryCount, itemCount, movementCount, lowStockCount, outOfStockCount, damagedItemCount, lostItemCount, unassignedItemCount, auditRows] = await Promise.all([
    countRows(supabase, 'angelcare360_inventory_categories', schoolId, [['status', 'eq', 'active']]),
    countRows(supabase, 'angelcare360_inventory_items', schoolId),
    countRows(supabase, 'angelcare360_inventory_movements', schoolId),
    countRows(supabase, 'angelcare360_inventory_items', schoolId, [['current_stock', 'lte', 0]]),
    countRows(supabase, 'angelcare360_inventory_items', schoolId, [['status', 'eq', 'out_of_stock']]),
    countRows(supabase, 'angelcare360_inventory_items', schoolId, [['status', 'eq', 'damaged']]),
    countRows(supabase, 'angelcare360_inventory_items', schoolId, [['status', 'eq', 'lost']]),
    countRows(supabase, 'angelcare360_inventory_items', schoolId, [['responsible_staff_id', 'eq', null]]),
    supabase
      .from('angelcare360_audit_logs')
      .select('id, school_id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, request_id, metadata, created_at')
      .eq('school_id', schoolId)
      .or('module.eq.inventaire,module.eq.inventory')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const risks = []
  if (lowStockCount > 0) risks.push(`${lowStockCount} article(s) sous le seuil de stock.`)
  if (outOfStockCount > 0) risks.push(`${outOfStockCount} article(s) en rupture.`)
  if (damagedItemCount > 0) risks.push(`${damagedItemCount} article(s) endommagé(s).`)
  if (lostItemCount > 0) risks.push(`${lostItemCount} article(s) perdu(s).`)
  if (unassignedItemCount > 0) risks.push(`${unassignedItemCount} article(s) sans responsable.`)
  risks.push(BLOCKED_EXPORT_MESSAGE)
  risks.push(BLOCKED_BARCODE_MESSAGE)

  return {
    schoolId: schoolId as Angelcare360InventoryOverviewRecord['schoolId'],
    schoolName: context.school.name,
    activeAcademicYearId: context.academicYear?.id || null,
    activeAcademicYearLabel: context.academicYear?.label || null,
    categoryCount,
    itemCount,
    movementCount,
    lowStockCount,
    outOfStockCount,
    damagedItemCount,
    lostItemCount,
    unassignedItemCount,
    latestAuditEvents: (auditRows.data || []) as Angelcare360AuditRecord[],
    risks,
  }
}

export async function listAngelcare360InventoryCategories(options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('inventaire.view', options?.schoolId)
  const supabase = await createClient()
  const [categoriesResponse, itemsResponse] = await Promise.all([
    supabase.from('angelcare360_inventory_categories').select('id, school_id, category_code, label, description, status, created_at, updated_at').eq('school_id', context.school!.id).order('label', { ascending: true }),
    supabase.from('angelcare360_inventory_items').select('id, category_id').eq('school_id', context.school!.id),
  ])
  const itemCountByCategory = new Map<string, number>()
  for (const row of itemsResponse.data || []) {
    const item = row as Row
    const current = itemCountByCategory.get(asString(item.category_id)) || 0
    itemCountByCategory.set(asString(item.category_id), current + 1)
  }
  return ((categoriesResponse.data || []) as Row[]).map((row) => mapCategoryRecord(row, itemCountByCategory.get(asString(row.id)) || 0))
}

export async function createAngelcare360InventoryCategory(input: Record<string, unknown>): Promise<Angelcare360InventoryMutationResult<Angelcare360InventoryCategoryRecord>> {
  const parsed = angelcare360InventoryCategoryCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Catégorie invalide.' }
  const context = await getContextOrThrow('inventaire.create', parsed.data.schoolId)
  const supabase = await createClient()
  const { data: existing } = await supabase.from('angelcare360_inventory_categories').select('*').eq('school_id', context.school!.id).eq('category_code', parsed.data.categoryCode).maybeSingle()
  if (existing) return { ok: true, record: existing as Angelcare360InventoryCategoryRecord, warning: 'La catégorie existe déjà. Aucun doublon créé.', idempotent: true }
  const payload = {
    school_id: context.school!.id,
    category_code: parsed.data.categoryCode,
    label: parsed.data.label,
    description: parsed.data.description || null,
    status: parsed.data.status || 'active',
    created_by: context.user.id,
    updated_by: context.user.id,
  }
  const { data, error } = await supabase.from('angelcare360_inventory_categories').insert(payload).select('*').single()
  if (error || !data) return { ok: false, error: error?.message || 'Impossible d’enregistrer la catégorie.' }
  await auditInventoryEvent({
    action: 'inventory_category.created',
    schoolId: context.school!.id,
    entityType: 'inventory_category',
    entityId: String(data.id),
    afterData: data as Record<string, unknown>,
  })
  return { ok: true, record: data as Angelcare360InventoryCategoryRecord }
}

export async function updateAngelcare360InventoryCategory(input: Record<string, unknown>): Promise<Angelcare360InventoryMutationResult<Angelcare360InventoryCategoryRecord>> {
  const parsed = angelcare360InventoryCategoryUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Catégorie invalide.' }
  const context = await getContextOrThrow('inventaire.update', parsed.data.schoolId)
  const supabase = await createClient()
  const { data: current } = await supabase.from('angelcare360_inventory_categories').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!current) return { ok: false, error: 'Catégorie introuvable.' }
  const { data, error } = await supabase
    .from('angelcare360_inventory_categories')
    .update({
      category_code: parsed.data.categoryCode,
      label: parsed.data.label,
      description: parsed.data.description || null,
      status: parsed.data.status || 'active',
      updated_by: context.user.id,
    })
    .eq('school_id', context.school!.id)
    .eq('id', parsed.data.id)
    .select('*')
    .single()
  if (error || !data) return { ok: false, error: error?.message || 'Impossible d’enregistrer la catégorie.' }
  await auditInventoryEvent({
    action: 'inventory_category.updated',
    schoolId: context.school!.id,
    entityType: 'inventory_category',
    entityId: String(data.id),
    beforeData: current as Record<string, unknown>,
    afterData: data as Record<string, unknown>,
  })
  return { ok: true, record: data as Angelcare360InventoryCategoryRecord }
}

export async function listAngelcare360InventoryItems(options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('inventaire.view', options?.schoolId)
  const supabase = await createClient()
  const [itemsResponse, movementsResponse] = await Promise.all([
    supabase
      .from('angelcare360_inventory_items')
      .select('id, school_id, category_id, item_code, label, unit_of_measure, barcode, current_stock, reorder_level, purchase_price, responsible_staff_id, status, created_at, updated_at, category:angelcare360_inventory_categories(id, category_code, label), responsible_staff:angelcare360_staff(id, staff_code, full_name)')
      .eq('school_id', context.school!.id)
      .order('label', { ascending: true }),
    supabase.from('angelcare360_inventory_movements').select('id, item_id').eq('school_id', context.school!.id),
  ])
  const movementCountByItem = new Map<string, number>()
  for (const row of movementsResponse.data || []) {
    const movement = row as Row
    const current = movementCountByItem.get(asString(movement.item_id)) || 0
    movementCountByItem.set(asString(movement.item_id), current + 1)
  }
  return ((itemsResponse.data || []) as Row[]).map((row) => mapItemRecord(row, movementCountByItem.get(asString(row.id)) || 0))
}

export async function getAngelcare360InventoryItemById(id: string, options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('inventaire.view', options?.schoolId)
  const supabase = await createClient()
  const { data } = await supabase
    .from('angelcare360_inventory_items')
    .select('id, school_id, category_id, item_code, label, unit_of_measure, barcode, current_stock, reorder_level, purchase_price, responsible_staff_id, status, created_at, updated_at, category:angelcare360_inventory_categories(id, category_code, label), responsible_staff:angelcare360_staff(id, staff_code, full_name)')
    .eq('school_id', context.school!.id)
    .eq('id', id)
    .maybeSingle()
  if (!data) return null
  const movements = await supabase
    .from('angelcare360_inventory_movements')
    .select('id')
    .eq('school_id', context.school!.id)
    .eq('item_id', id)
  return {
    ...mapItemRecord(data as Row, movements.data?.length || 0),
    movements: movements.data || [],
  }
}

async function upsertInventoryItem(input: ReturnType<typeof angelcare360InventoryItemCreateSchema.parse>, existingId?: string | null): Promise<Angelcare360InventoryMutationResult<Angelcare360InventoryItemRecord>> {
  const context = await getContextOrThrow(existingId ? 'inventaire.update' : 'inventaire.create', input.schoolId)
  const supabase = await createClient()
  const { data: existing } = await supabase.from('angelcare360_inventory_items').select('*').eq('school_id', context.school!.id).eq('item_code', input.itemCode).maybeSingle()
  if (existing && !existingId) return { ok: true, record: existing as Angelcare360InventoryItemRecord, warning: 'L’article existe déjà. Aucun doublon créé.', idempotent: true }
  const payload = {
    school_id: context.school!.id,
    category_id: input.categoryId,
    item_code: input.itemCode,
    label: input.label,
    unit_of_measure: input.unitOfMeasure || 'unit',
    barcode: input.barcode || null,
    current_stock: input.currentStock,
    reorder_level: input.reorderLevel ?? 0,
    purchase_price: input.purchasePrice ?? 0,
    responsible_staff_id: input.responsibleStaffId || null,
    status: input.status || 'active',
    created_by: context.user.id,
    updated_by: context.user.id,
  }
  const query = existingId
    ? supabase.from('angelcare360_inventory_items').update(payload).eq('school_id', context.school!.id).eq('id', existingId)
    : supabase.from('angelcare360_inventory_items').insert(payload)
  const { data, error } = await query.select('*').single()
  if (error || !data) return { ok: false, error: error?.message || 'Impossible d’enregistrer l’article.' }
  await auditInventoryEvent({
    action: existingId ? 'inventory_item.updated' : 'inventory_item.created',
    schoolId: context.school!.id,
    entityType: 'inventory_item',
    entityId: String(data.id),
    afterData: data as Record<string, unknown>,
  })
  return { ok: true, record: data as Angelcare360InventoryItemRecord }
}

export async function createAngelcare360InventoryItem(input: Record<string, unknown>) {
  const parsed = angelcare360InventoryItemCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Article invalide.' }
  return upsertInventoryItem(parsed.data)
}

export async function updateAngelcare360InventoryItem(input: Record<string, unknown>) {
  const parsed = angelcare360InventoryItemUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Article invalide.' }
  return upsertInventoryItem(parsed.data, parsed.data.id)
}

export async function listAngelcare360InventoryMovements(options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('inventaire.view', options?.schoolId)
  const supabase = await createClient()
  const { data } = await supabase
    .from('angelcare360_inventory_movements')
    .select('id, school_id, item_id, movement_code, movement_type, quantity, movement_date, reference_type, reference_id, performed_by, notes, status, created_at, updated_at, item:angelcare360_inventory_items(id, item_code, label, category:angelcare360_inventory_categories(id, category_code, label)), performed_by_staff:angelcare360_staff(id, staff_code, full_name)')
    .eq('school_id', context.school!.id)
    .order('movement_date', { ascending: false })
    .limit(500)
  return ((data || []) as Row[]).map((row) => mapMovementRecord(row))
}

export async function createAngelcare360InventoryMovement(input: Record<string, unknown>): Promise<Angelcare360InventoryMutationResult<Angelcare360InventoryMovementRecord>> {
  const parsed = angelcare360InventoryMovementCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Mouvement invalide.' }
  const context = await getContextOrThrow('inventaire.create', parsed.data.schoolId)
  const supabase = await createClient()
  const { data: item } = await supabase.from('angelcare360_inventory_items').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.itemId).maybeSingle()
  if (!item) return { ok: false, error: 'Article introuvable.' }
  const movementType = parsed.data.movementType
  const stockDelta = (() => {
    if (movementType === 'in' || movementType === 'entry') return parsed.data.quantity
    if (movementType === 'out' || movementType === 'exit' || movementType === 'loss' || movementType === 'damage') return -parsed.data.quantity
    if (movementType === 'adjust' || movementType === 'adjustment' || movementType === 'transfer') return parsed.data.quantity
    return parsed.data.quantity
  })()
  const nextStock = (asNumber(item.current_stock) || 0) + stockDelta
  if (nextStock < 0) {
    await auditInventoryEvent({
      action: 'inventory_stock.negative_blocked',
      schoolId: context.school!.id,
      entityType: 'inventory_item',
      entityId: String(item.id),
      severity: 'warning',
      metadata: { movementType, quantity: parsed.data.quantity, nextStock },
    })
    return { ok: false, locked: true, reason: 'Le mouvement est bloqué car le stock deviendrait négatif.' }
  }

  const { data: movement, error } = await supabase.from('angelcare360_inventory_movements').insert({
    school_id: context.school!.id,
    item_id: parsed.data.itemId,
    movement_code: parsed.data.movementCode,
    movement_type: movementType,
    quantity: parsed.data.quantity,
    movement_date: parsed.data.movementDate || new Date().toISOString().slice(0, 10),
    reference_type: parsed.data.referenceType || null,
    reference_id: parsed.data.referenceId || null,
    performed_by: parsed.data.performedBy || context.user.id,
    notes: parsed.data.notes || null,
    status: parsed.data.status || 'active',
    created_by: context.user.id,
    updated_by: context.user.id,
  }).select('*').single()
  if (error || !movement) return { ok: false, error: error?.message || 'Impossible d’enregistrer le mouvement.' }
  const { error: updateError } = await supabase
    .from('angelcare360_inventory_items')
    .update({
      current_stock: nextStock,
      status: computedItemStatus(nextStock, asNumber(item.reorder_level) || 0, asString(item.status)),
      updated_by: context.user.id,
    })
    .eq('school_id', context.school!.id)
    .eq('id', parsed.data.itemId)
  if (updateError) return { ok: false, error: updateError.message }
  await auditInventoryEvent({
    action: 'inventory_movement.created',
    schoolId: context.school!.id,
    entityType: 'inventory_movement',
    entityId: String(movement.id),
    afterData: movement as Record<string, unknown>,
    metadata: { nextStock, movementType },
  })
  return { ok: true, record: movement as Angelcare360InventoryMovementRecord }
}

export async function listAngelcare360LowStockItems(options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('inventaire.view', options?.schoolId)
  const items = await listAngelcare360InventoryItems({ schoolId: context.school!.id })
  return items.filter((item) => item.low_stock || item.out_of_stock)
}

export async function listAngelcare360InventoryResponsibleCoverage(options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('inventaire.view', options?.schoolId)
  const items = await listAngelcare360InventoryItems({ schoolId: context.school!.id })
  const byResponsible = new Map<string, Angelcare360InventoryResponsibleCoverageRecord>()
  for (const item of items) {
    const key = item.responsible_staff_id || 'unassigned'
    const current = byResponsible.get(key) || {
      school_id: context.school!.id,
      responsible_staff_id: item.responsible_staff_id || null,
      responsible_staff_full_name: item.responsible_staff_full_name || null,
      item_count: 0,
      low_stock_count: 0,
      unassigned_item_count: 0,
    }
    current.item_count += 1
    if (!item.responsible_staff_id) current.unassigned_item_count += 1
    if (item.low_stock || item.out_of_stock) current.low_stock_count += 1
    byResponsible.set(key, current)
  }
  return Array.from(byResponsible.values())
}

export async function listAngelcare360InventoryAuditEvents(options?: { schoolId?: string | null; filters?: Partial<Angelcare360InventoryAuditFilter> }) {
  const context = await getContextOrThrow('audit.view', options?.schoolId)
  const supabase = await createClient()
  const filters = options?.filters || {}
  let query = supabase
    .from('angelcare360_audit_logs')
    .select('id, school_id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, request_id, before_data, after_data, metadata, created_at')
    .eq('school_id', context.school!.id)
    .or('module.eq.inventaire,module.eq.inventory')
    .order('created_at', { ascending: false })
    .limit(200)
  if (filters.module) query = query.eq('module', filters.module)
  if (filters.action) query = query.eq('action', filters.action)
  if (filters.severity) query = query.eq('severity', filters.severity)
  if (filters.entityType) query = query.eq('entity_type', filters.entityType)
  if (filters.entityId) query = query.eq('entity_id', filters.entityId)
  if (filters.actorUserId) query = query.eq('actor_user_id', filters.actorUserId)
  const { data } = await query
  return (data || []) as Angelcare360AuditRecord[]
}

export async function blockAngelcare360InventoryExport(options?: { schoolId?: string | null; reason?: string | null }) {
  const context = await getContextOrThrow('inventaire.view', options?.schoolId)
  await auditInventoryEvent({
    action: 'inventory_export.blocked_not_available',
    schoolId: context.school!.id,
    entityType: 'inventory_export',
    entityId: context.school!.id,
    severity: 'warning',
    metadata: { reason: options?.reason || BLOCKED_EXPORT_MESSAGE },
  })
  return { ok: true, locked: true, reason: BLOCKED_EXPORT_MESSAGE }
}

export async function blockAngelcare360InventoryBarcode(options?: { schoolId?: string | null; reason?: string | null }) {
  const context = await getContextOrThrow('inventaire.view', options?.schoolId)
  await auditInventoryEvent({
    action: 'inventory_barcode.blocked_not_available',
    schoolId: context.school!.id,
    entityType: 'inventory_barcode',
    entityId: context.school!.id,
    severity: 'warning',
    metadata: { reason: options?.reason || BLOCKED_BARCODE_MESSAGE },
  })
  return { ok: true, locked: true, reason: BLOCKED_BARCODE_MESSAGE }
}
