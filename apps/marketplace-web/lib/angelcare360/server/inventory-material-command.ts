import { randomUUID } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from '@/lib/angelcare360/server/context'
import { recordAngelcare360AuditEventServer } from '@/lib/angelcare360/server/audit'
import type {
  MaterialAuditEvent,
  MaterialCategory,
  MaterialIntegrityStatus,
  MaterialItem,
  MaterialItemDossier,
  MaterialMovement,
  MaterialMutationResult,
  MaterialSnapshot,
  MaterialStaff,
  MaterialStewardship,
} from '@/types/angelcare360/material-control'

type Row = Record<string, any>
type Supabase = Awaited<ReturnType<typeof createClient>>

const MODULE = 'inventaire'
const INTEGRITY_FUNCTION = 'angelcare360_inventory_integrity_status_v1'
const MOVEMENT_FUNCTION = 'angelcare360_inventory_apply_movement_v1'
const BASE = '/angelcare-360-command-center/inventaire'

function text(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback
  return String(value)
}

function nullableText(value: unknown): string | null {
  const result = text(value).trim()
  return result ? result : null
}

function num(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function normalizeMovementType(value: unknown): 'in' | 'out' | 'adjust' | 'transfer' | 'loss' | 'damage' | null {
  const raw = text(value).trim().toLowerCase()
  if (raw === 'in' || raw === 'entry') return 'in'
  if (raw === 'out' || raw === 'exit') return 'out'
  if (raw === 'adjust' || raw === 'adjustment') return 'adjust'
  if (raw === 'transfer') return 'transfer'
  if (raw === 'loss') return 'loss'
  if (raw === 'damage') return 'damage'
  return null
}

function healthFor(item: { currentStock: number; reorderLevel: number; status: string }) {
  if (item.status === 'inactive' || item.status === 'archived') return 'inactive' as const
  if (item.status === 'damaged' || item.status === 'lost') return 'exception' as const
  if (item.currentStock <= 0 || item.status === 'out_of_stock') return 'critical' as const
  if (item.currentStock <= item.reorderLevel || item.status === 'low_stock') return 'pressure' as const
  return 'healthy' as const
}

async function context(permission: string, schoolId?: string | null) {
  const resolved = await requireAngelcare360Permission(permission, { schoolId })
  if (!resolved.school) throw new Error('Aucun établissement actif n’est disponible.')
  return resolved
}

async function audit(input: {
  schoolId: string
  action: string
  entityType: string
  entityId: string
  severity?: 'debug' | 'info' | 'notice' | 'warning' | 'critical'
  beforeData?: Record<string, unknown>
  afterData?: Record<string, unknown>
  metadata?: Record<string, unknown>
}) {
  return recordAngelcare360AuditEventServer({
    category: 'inventory',
    module: MODULE,
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

function mapMovement(row: Row): MaterialMovement {
  return {
    id: text(row.id),
    schoolId: text(row.school_id),
    itemId: text(row.item_id),
    movementCode: text(row.movement_code),
    movementType: text(row.movement_type),
    quantity: num(row.quantity),
    movementDate: text(row.movement_date),
    referenceType: nullableText(row.reference_type),
    referenceId: nullableText(row.reference_id),
    performedBy: nullableText(row.performed_by),
    performerName: nullableText(row.performer?.full_name || row.performed_by_staff?.full_name),
    notes: nullableText(row.notes),
    status: text(row.status, 'active'),
    metadata: object(row.metadata_json),
    itemCode: nullableText(row.item?.item_code),
    itemLabel: nullableText(row.item?.label),
    categoryLabel: nullableText(row.item?.category?.label),
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at || row.created_at),
  }
}

function mapAudit(row: Row): MaterialAuditEvent {
  return {
    id: text(row.id),
    actorUserId: nullableText(row.actor_user_id),
    actorRole: nullableText(row.actor_role),
    module: text(row.module),
    action: text(row.action),
    entityType: nullableText(row.entity_type),
    entityId: nullableText(row.entity_id),
    severity: text(row.severity, 'info'),
    beforeData: object(row.before_data),
    afterData: object(row.after_data),
    metadata: object(row.metadata),
    createdAt: text(row.created_at),
  }
}

function movementWhen(row: Row | undefined) {
  if (!row) return { at: null as string | null, type: null as string | null }
  return {
    at: nullableText(row.created_at || row.movement_date),
    type: nullableText(row.movement_type),
  }
}

function mapItem(row: Row, movements: Row[] = []): MaterialItem {
  const currentStock = num(row.current_stock)
  const reorderLevel = num(row.reorder_level)
  const purchasePrice = num(row.purchase_price)
  const status = text(row.status, 'active')
  const latest = movementWhen(movements[0])
  return {
    id: text(row.id),
    schoolId: text(row.school_id),
    categoryId: text(row.category_id),
    categoryCode: nullableText(row.category?.category_code),
    categoryLabel: nullableText(row.category?.label),
    code: text(row.item_code),
    label: text(row.label),
    unit: text(row.unit_of_measure, 'unit'),
    barcode: nullableText(row.barcode),
    currentStock,
    reorderLevel,
    purchasePrice,
    indicativeValue: Math.max(0, currentStock) * Math.max(0, purchasePrice),
    responsibleStaffId: nullableText(row.responsible_staff_id),
    responsibleStaffName: nullableText(row.responsible_staff?.full_name),
    status,
    health: healthFor({ currentStock, reorderLevel, status }),
    thresholdDelta: currentStock - reorderLevel,
    thresholdRatio: reorderLevel > 0 ? currentStock / reorderLevel : null,
    movementCount: movements.length,
    lastMovementAt: latest.at,
    lastMovementType: latest.type,
    detailHref: `${BASE}/articles/${text(row.id)}`,
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at || row.created_at),
  }
}

async function fetchItems(client: Supabase, schoolId: string) {
  const [itemsResponse, movementsResponse] = await Promise.all([
    client
      .from('angelcare360_inventory_items')
      .select('id, school_id, category_id, item_code, label, unit_of_measure, barcode, current_stock, reorder_level, purchase_price, responsible_staff_id, status, metadata_json, created_at, updated_at, category:angelcare360_inventory_categories(id, category_code, label), responsible_staff:angelcare360_staff(id, staff_code, full_name, department, status)')
      .eq('school_id', schoolId)
      .order('label', { ascending: true }),
    client
      .from('angelcare360_inventory_movements')
      .select('id, item_id, movement_type, movement_date, created_at')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
      .limit(5000),
  ])
  if (itemsResponse.error) throw new Error(itemsResponse.error.message)
  const movementByItem = new Map<string, Row[]>()
  for (const movement of (movementsResponse.data || []) as Row[]) {
    const id = text(movement.item_id)
    const list = movementByItem.get(id) || []
    list.push(movement)
    movementByItem.set(id, list)
  }
  return ((itemsResponse.data || []) as Row[]).map((row) => mapItem(row, movementByItem.get(text(row.id)) || []))
}

async function fetchCategories(client: Supabase, schoolId: string, items: MaterialItem[]) {
  const { data, error } = await client
    .from('angelcare360_inventory_categories')
    .select('id, school_id, category_code, label, description, status, created_at, updated_at')
    .eq('school_id', schoolId)
    .order('label', { ascending: true })
  if (error) throw new Error(error.message)
  return ((data || []) as Row[]).map((row): MaterialCategory => {
    const scoped = items.filter((item) => item.categoryId === text(row.id))
    return {
      id: text(row.id),
      schoolId: text(row.school_id),
      code: text(row.category_code),
      label: text(row.label),
      description: nullableText(row.description),
      status: text(row.status),
      createdAt: text(row.created_at),
      updatedAt: text(row.updated_at || row.created_at),
      itemCount: scoped.length,
      pressureCount: scoped.filter((item) => item.health === 'pressure').length,
      criticalCount: scoped.filter((item) => item.health === 'critical' || item.health === 'exception').length,
      indicativeValue: scoped.reduce((sum, item) => sum + item.indicativeValue, 0),
    }
  })
}

async function fetchMovements(client: Supabase, schoolId: string, limit = 500, filters?: { itemId?: string; movementId?: string }) {
  const selection = 'id, school_id, item_id, movement_code, movement_type, quantity, movement_date, reference_type, reference_id, performed_by, notes, status, metadata_json, created_at, updated_at, item:angelcare360_inventory_items(id, item_code, label, category:angelcare360_inventory_categories(id, label)), performer:app_users(id, full_name)'
  let query = client.from('angelcare360_inventory_movements').select(selection).eq('school_id', schoolId)
  if (filters?.itemId) query = query.eq('item_id', filters.itemId)
  if (filters?.movementId) query = query.eq('id', filters.movementId)
  const response = await query.order('created_at', { ascending: false }).limit(limit)
  if (response.error) {
    // Some historical schemas do not expose app_users.full_name through PostgREST relationships.
    const fallbackSelection = 'id, school_id, item_id, movement_code, movement_type, quantity, movement_date, reference_type, reference_id, performed_by, notes, status, metadata_json, created_at, updated_at, item:angelcare360_inventory_items(id, item_code, label, category:angelcare360_inventory_categories(id, label))'
    let fallbackQuery = client.from('angelcare360_inventory_movements').select(fallbackSelection).eq('school_id', schoolId)
    if (filters?.itemId) fallbackQuery = fallbackQuery.eq('item_id', filters.itemId)
    if (filters?.movementId) fallbackQuery = fallbackQuery.eq('id', filters.movementId)
    const fallback = await fallbackQuery.order('created_at', { ascending: false }).limit(limit)
    if (fallback.error) throw new Error(fallback.error.message)
    return ((fallback.data || []) as Row[]).map(mapMovement)
  }
  return ((response.data || []) as Row[]).map(mapMovement)
}

async function fetchStaff(client: Supabase, schoolId: string): Promise<MaterialStaff[]> {
  const { data, error } = await client
    .from('angelcare360_staff')
    .select('id, staff_code, full_name, department, status')
    .eq('school_id', schoolId)
    .in('status', ['active', 'on_leave'])
    .order('full_name', { ascending: true })
  if (error) throw new Error(error.message)
  return ((data || []) as Row[]).map((row) => ({
    id: text(row.id),
    staffCode: text(row.staff_code),
    fullName: text(row.full_name),
    department: nullableText(row.department),
    status: text(row.status),
  }))
}

function stewardship(items: MaterialItem[], staff: MaterialStaff[]): MaterialStewardship[] {
  const staffById = new Map(staff.map((person) => [person.id, person]))
  const groups = new Map<string, MaterialStewardship>()
  for (const item of items) {
    const key = item.responsibleStaffId || '__unassigned__'
    const person = item.responsibleStaffId ? staffById.get(item.responsibleStaffId) : null
    const current = groups.get(key) || {
      staffId: item.responsibleStaffId,
      staffName: person?.fullName || item.responsibleStaffName || 'Matériel sans responsable',
      department: person?.department || null,
      itemCount: 0,
      pressureCount: 0,
      criticalCount: 0,
      exceptionCount: 0,
      indicativeValue: 0,
      unassigned: !item.responsibleStaffId,
    }
    current.itemCount += 1
    current.indicativeValue += item.indicativeValue
    if (item.health === 'pressure') current.pressureCount += 1
    if (item.health === 'critical') current.criticalCount += 1
    if (item.health === 'exception') current.exceptionCount += 1
    groups.set(key, current)
  }
  return Array.from(groups.values()).sort((a, b) => Number(b.unassigned) - Number(a.unassigned) || b.criticalCount - a.criticalCount || b.pressureCount - a.pressureCount || a.staffName.localeCompare(b.staffName, 'fr'))
}

export async function getMaterialIntegrityStatus(): Promise<MaterialIntegrityStatus> {
  try {
    const client = await createClient()
    const { data, error } = await client.rpc(INTEGRITY_FUNCTION)
    if (error) {
      return { ready: false, version: null, reason: 'Migration d’intégrité inventaire requise avant les mouvements de stock.' }
    }
    const payload = object(data)
    return {
      ready: payload.ready === true,
      version: nullableText(payload.version),
      reason: payload.ready === true ? null : nullableText(payload.reason) || 'Autorité transactionnelle inventaire indisponible.',
    }
  } catch {
    return { ready: false, version: null, reason: 'Autorité transactionnelle inventaire indisponible.' }
  }
}

export async function listMaterialStaff(options?: { schoolId?: string | null }) {
  const resolved = await context('inventaire.view', options?.schoolId)
  const client = await createClient()
  return fetchStaff(client, resolved.school!.id)
}

export async function getMaterialSnapshot(options?: { schoolId?: string | null }): Promise<MaterialSnapshot | null> {
  const resolved = await getAngelcare360AccessContext({ schoolId: options?.schoolId })
  if (!resolved?.school) return null
  await requireAngelcare360Permission('inventaire.view', { context: resolved })
  const client = await createClient()
  const schoolId = resolved.school.id
  const [items, movements, staff, integrity] = await Promise.all([
    fetchItems(client, schoolId),
    fetchMovements(client, schoolId, 180),
    fetchStaff(client, schoolId),
    getMaterialIntegrityStatus(),
  ])
  const categories = await fetchCategories(client, schoolId, items)
  const { data: auditRows } = await client
    .from('angelcare360_audit_logs')
    .select('id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, before_data, after_data, metadata, created_at')
    .eq('school_id', schoolId)
    .or('module.eq.inventaire,module.eq.inventory')
    .order('created_at', { ascending: false })
    .limit(80)
  const auditEvents = ((auditRows || []) as Row[]).map(mapAudit)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  return {
    schoolId,
    schoolName: resolved.school.name,
    academicYearLabel: resolved.academicYear?.label || null,
    integrity,
    categories,
    items,
    movements,
    stewardship: stewardship(items, staff),
    audit: auditEvents,
    totals: {
      categories: categories.length,
      items: items.length,
      healthy: items.filter((item) => item.health === 'healthy').length,
      pressure: items.filter((item) => item.health === 'pressure').length,
      critical: items.filter((item) => item.health === 'critical').length,
      outOfStock: items.filter((item) => item.currentStock <= 0 || item.status === 'out_of_stock').length,
      damaged: items.filter((item) => item.status === 'damaged').length,
      lost: items.filter((item) => item.status === 'lost').length,
      unassigned: items.filter((item) => !item.responsibleStaffId).length,
      movements: movements.length,
      indicativeValue: items.reduce((sum, item) => sum + item.indicativeValue, 0),
      damageLossEvents30d: movements.filter((movement) => ['damage', 'loss'].includes(text(movement.movementType)) && new Date(movement.createdAt).getTime() >= thirtyDaysAgo).length,
    },
  }
}

export async function listMaterialCategories(options?: { schoolId?: string | null }) {
  const resolved = await context('inventaire.view', options?.schoolId)
  const client = await createClient()
  const items = await fetchItems(client, resolved.school!.id)
  return fetchCategories(client, resolved.school!.id, items)
}

export async function listMaterialItems(options?: { schoolId?: string | null }) {
  const resolved = await context('inventaire.view', options?.schoolId)
  const client = await createClient()
  return fetchItems(client, resolved.school!.id)
}

export async function listMaterialMovements(options?: { schoolId?: string | null; limit?: number }) {
  const resolved = await context('inventaire.view', options?.schoolId)
  const client = await createClient()
  return fetchMovements(client, resolved.school!.id, Math.min(Math.max(options?.limit || 500, 1), 1000))
}

export async function getMaterialMovementById(id: string, options?: { schoolId?: string | null }) {
  const resolved = await context('inventaire.view', options?.schoolId)
  const client = await createClient()
  const movements = await fetchMovements(client, resolved.school!.id, 1, { movementId: id })
  return movements[0] || null
}

export async function listMaterialLowStock(options?: { schoolId?: string | null }) {
  const items = await listMaterialItems(options)
  return items.filter((item) => item.health === 'pressure' || item.health === 'critical' || item.health === 'exception')
}

export async function listMaterialStewardship(options?: { schoolId?: string | null }) {
  const resolved = await context('inventaire.view', options?.schoolId)
  const client = await createClient()
  const [items, staff] = await Promise.all([fetchItems(client, resolved.school!.id), fetchStaff(client, resolved.school!.id)])
  return stewardship(items, staff)
}

export async function listMaterialAudit(options?: { schoolId?: string | null; limit?: number }) {
  const resolved = await context('audit.view', options?.schoolId)
  const client = await createClient()
  const { data, error } = await client
    .from('angelcare360_audit_logs')
    .select('id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, before_data, after_data, metadata, created_at')
    .eq('school_id', resolved.school!.id)
    .or('module.eq.inventaire,module.eq.inventory')
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(options?.limit || 300, 1), 1000))
  if (error) throw new Error(error.message)
  return ((data || []) as Row[]).map(mapAudit)
}

export async function getMaterialItemDossier(id: string, options?: { schoolId?: string | null }): Promise<MaterialItemDossier | null> {
  const resolved = await context('inventaire.view', options?.schoolId)
  const client = await createClient()
  const { data, error } = await client
    .from('angelcare360_inventory_items')
    .select('id, school_id, category_id, item_code, label, unit_of_measure, barcode, current_stock, reorder_level, purchase_price, responsible_staff_id, status, metadata_json, created_at, updated_at, category:angelcare360_inventory_categories(id, category_code, label), responsible_staff:angelcare360_staff(id, staff_code, full_name, department, status)')
    .eq('school_id', resolved.school!.id)
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  const [scopedMovements, auditEvents] = await Promise.all([
    fetchMovements(client, resolved.school!.id, 500, { itemId: id }),
    listMaterialAudit({ schoolId: resolved.school!.id, limit: 500 }),
  ])
  return {
    item: mapItem(data as Row, scopedMovements.map((movement) => ({ movement_type: movement.movementType, created_at: movement.createdAt, movement_date: movement.movementDate }))),
    movements: scopedMovements,
    audit: auditEvents.filter((event) => event.entityId === id || object(event.metadata).item_id === id),
  }
}

export async function lookupMaterialByBarcode(barcode: string, options?: { schoolId?: string | null }) {
  const resolved = await context('inventaire.view', options?.schoolId)
  const client = await createClient()
  const clean = barcode.trim()
  if (!clean) return null
  const { data, error } = await client
    .from('angelcare360_inventory_items')
    .select('id, school_id, category_id, item_code, label, unit_of_measure, barcode, current_stock, reorder_level, purchase_price, responsible_staff_id, status, metadata_json, created_at, updated_at, category:angelcare360_inventory_categories(id, category_code, label), responsible_staff:angelcare360_staff(id, staff_code, full_name, department, status)')
    .eq('school_id', resolved.school!.id)
    .eq('barcode', clean)
    .limit(2)
  if (error) throw new Error(error.message)
  if ((data || []).length > 1) throw new Error('Ce code-barres correspond à plusieurs articles. Réconciliez les doublons avant utilisation scanner.')
  return data?.[0] ? mapItem(data[0] as Row) : null
}

function requiredString(input: Record<string, unknown>, key: string, label: string) {
  const value = text(input[key]).trim()
  if (!value) throw new Error(`${label} est requis.`)
  return value
}

function nonNegative(input: Record<string, unknown>, key: string, label: string, fallback = 0) {
  if (input[key] === undefined || input[key] === null || input[key] === '') return fallback
  const value = num(input[key], Number.NaN)
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} doit être positif ou nul.`)
  return value
}

export async function createMaterialCategory(input: Record<string, unknown>): Promise<MaterialMutationResult> {
  try {
    const resolved = await context('inventaire.create', nullableText(input.schoolId))
    const code = requiredString(input, 'code', 'Le code catégorie')
    const label = requiredString(input, 'label', 'Le libellé')
    const client = await createClient()
    const { data: existing } = await client.from('angelcare360_inventory_categories').select('*').eq('school_id', resolved.school!.id).eq('category_code', code).maybeSingle()
    if (existing) return { ok: true, record: existing, idempotent: true, warning: 'Cette catégorie existe déjà.' }
    const { data, error } = await client.from('angelcare360_inventory_categories').insert({
      school_id: resolved.school!.id,
      category_code: code,
      label,
      description: nullableText(input.description),
      status: 'active',
      created_by: resolved.user.id,
      updated_by: resolved.user.id,
    }).select('*').single()
    if (error || !data) return { ok: false, error: error?.message || 'Impossible de créer la catégorie.' }
    await audit({ schoolId: resolved.school!.id, action: 'material_category.created', entityType: 'inventory_category', entityId: text(data.id), afterData: data as Row })
    return { ok: true, record: data }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Création impossible.' }
  }
}

export async function updateMaterialCategory(input: Record<string, unknown>): Promise<MaterialMutationResult> {
  try {
    const resolved = await context('inventaire.update', nullableText(input.schoolId))
    const id = requiredString(input, 'id', 'La catégorie')
    const code = requiredString(input, 'code', 'Le code catégorie')
    const label = requiredString(input, 'label', 'Le libellé')
    const status = ['active', 'inactive', 'archived'].includes(text(input.status)) ? text(input.status) : 'active'
    const client = await createClient()
    const { data: before } = await client.from('angelcare360_inventory_categories').select('*').eq('school_id', resolved.school!.id).eq('id', id).maybeSingle()
    if (!before) return { ok: false, error: 'Catégorie introuvable.' }
    const { data, error } = await client.from('angelcare360_inventory_categories').update({
      category_code: code,
      label,
      description: nullableText(input.description),
      status,
      updated_by: resolved.user.id,
    }).eq('school_id', resolved.school!.id).eq('id', id).select('*').single()
    if (error || !data) return { ok: false, error: error?.message || 'Impossible de modifier la catégorie.' }
    await audit({ schoolId: resolved.school!.id, action: 'material_category.updated', entityType: 'inventory_category', entityId: id, beforeData: before as Row, afterData: data as Row })
    return { ok: true, record: data }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Modification impossible.' }
  }
}

export async function createMaterialItem(input: Record<string, unknown>): Promise<MaterialMutationResult> {
  try {
    const resolved = await context('inventaire.create', nullableText(input.schoolId))
    const categoryId = requiredString(input, 'categoryId', 'La catégorie')
    const code = requiredString(input, 'code', 'Le code article')
    const label = requiredString(input, 'label', 'Le libellé')
    const initialStock = nonNegative(input, 'initialStock', 'Le stock initial')
    const reorderLevel = nonNegative(input, 'reorderLevel', 'Le seuil')
    const purchasePrice = nonNegative(input, 'purchasePrice', 'Le prix d’achat')
    const client = await createClient()
    const [{ data: existing }, { data: category }, staffCheck] = await Promise.all([
      client.from('angelcare360_inventory_items').select('*').eq('school_id', resolved.school!.id).eq('item_code', code).maybeSingle(),
      client.from('angelcare360_inventory_categories').select('id').eq('school_id', resolved.school!.id).eq('id', categoryId).maybeSingle(),
      nullableText(input.responsibleStaffId)
        ? client.from('angelcare360_staff').select('id').eq('school_id', resolved.school!.id).eq('id', nullableText(input.responsibleStaffId)!).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ])
    if (existing) return { ok: true, record: existing, idempotent: true, warning: 'Cet article existe déjà.' }
    if (!category) return { ok: false, error: 'La catégorie sélectionnée n’appartient pas à cet établissement.' }
    if (nullableText(input.responsibleStaffId) && !staffCheck.data) return { ok: false, error: 'Le responsable sélectionné n’appartient pas à cet établissement.' }
    const barcode = nullableText(input.barcode)
    if (barcode) {
      const { data: duplicateBarcode } = await client.from('angelcare360_inventory_items').select('id').eq('school_id', resolved.school!.id).eq('barcode', barcode).limit(1)
      if ((duplicateBarcode || []).length) return { ok: false, error: 'Ce code-barres est déjà attribué à un autre article de cet établissement.' }
    }
    if (initialStock > 0) {
      const integrity = await getMaterialIntegrityStatus()
      if (!integrity.ready) return { ok: false, locked: true, reason: integrity.reason || 'Migration d’intégrité requise.' }
    }
    const { data, error } = await client.from('angelcare360_inventory_items').insert({
      school_id: resolved.school!.id,
      category_id: categoryId,
      item_code: code,
      label,
      unit_of_measure: nullableText(input.unit) || 'unit',
      barcode,
      current_stock: 0,
      reorder_level: reorderLevel,
      purchase_price: purchasePrice,
      responsible_staff_id: nullableText(input.responsibleStaffId),
      status: 'out_of_stock',
      created_by: resolved.user.id,
      updated_by: resolved.user.id,
      metadata_json: { created_via: 'sanila_material_command_v1' },
    }).select('*').single()
    if (error || !data) return { ok: false, error: error?.message || 'Impossible de créer l’article.' }
    if (initialStock > 0) {
      const movement = await applyMaterialMovement({
        schoolId: resolved.school!.id,
        itemId: text(data.id),
        movementType: 'in',
        quantity: initialStock,
        notes: 'Stock initial lors de la création de l’article.',
        metadata: { openingBalance: true },
      })
      if (!movement.ok) {
        await client.from('angelcare360_inventory_items').delete().eq('school_id', resolved.school!.id).eq('id', data.id)
        return movement
      }
    }
    await audit({ schoolId: resolved.school!.id, action: 'material_item.created', entityType: 'inventory_item', entityId: text(data.id), afterData: data as Row, metadata: { initial_stock: initialStock } })
    return { ok: true, record: data }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Création impossible.' }
  }
}

export async function updateMaterialItem(input: Record<string, unknown>): Promise<MaterialMutationResult> {
  try {
    const resolved = await context('inventaire.update', nullableText(input.schoolId))
    const id = requiredString(input, 'id', 'L’article')
    const categoryId = requiredString(input, 'categoryId', 'La catégorie')
    const code = requiredString(input, 'code', 'Le code article')
    const label = requiredString(input, 'label', 'Le libellé')
    const reorderLevel = nonNegative(input, 'reorderLevel', 'Le seuil')
    const purchasePrice = nonNegative(input, 'purchasePrice', 'Le prix d’achat')
    const lifecycleStatus = ['active', 'inactive', 'archived'].includes(text(input.status)) ? text(input.status) : 'active'
    const client = await createClient()
    const { data: before } = await client.from('angelcare360_inventory_items').select('*').eq('school_id', resolved.school!.id).eq('id', id).maybeSingle()
    if (!before) return { ok: false, error: 'Article introuvable.' }
    const [{ data: category }, staffCheck] = await Promise.all([
      client.from('angelcare360_inventory_categories').select('id').eq('school_id', resolved.school!.id).eq('id', categoryId).maybeSingle(),
      nullableText(input.responsibleStaffId)
        ? client.from('angelcare360_staff').select('id').eq('school_id', resolved.school!.id).eq('id', nullableText(input.responsibleStaffId)!).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ])
    if (!category) return { ok: false, error: 'La catégorie sélectionnée n’appartient pas à cet établissement.' }
    if (nullableText(input.responsibleStaffId) && !staffCheck.data) return { ok: false, error: 'Le responsable sélectionné n’appartient pas à cet établissement.' }
    const barcode = nullableText(input.barcode)
    if (barcode) {
      const { data: duplicateBarcode } = await client.from('angelcare360_inventory_items').select('id').eq('school_id', resolved.school!.id).eq('barcode', barcode).neq('id', id).limit(1)
      if ((duplicateBarcode || []).length) return { ok: false, error: 'Ce code-barres est déjà attribué à un autre article de cet établissement.' }
    }
    let nextStatus = lifecycleStatus
    if (lifecycleStatus === 'active') {
      const stock = num(before.current_stock)
      nextStatus = stock <= 0 ? 'out_of_stock' : stock <= reorderLevel ? 'low_stock' : 'active'
    }
    const { data, error } = await client.from('angelcare360_inventory_items').update({
      category_id: categoryId,
      item_code: code,
      label,
      unit_of_measure: nullableText(input.unit) || 'unit',
      barcode,
      reorder_level: reorderLevel,
      purchase_price: purchasePrice,
      responsible_staff_id: nullableText(input.responsibleStaffId),
      status: nextStatus,
      updated_by: resolved.user.id,
    }).eq('school_id', resolved.school!.id).eq('id', id).select('*').single()
    if (error || !data) return { ok: false, error: error?.message || 'Impossible de modifier l’article.' }
    await audit({ schoolId: resolved.school!.id, action: 'material_item.updated', entityType: 'inventory_item', entityId: id, beforeData: before as Row, afterData: data as Row })
    return { ok: true, record: data }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Modification impossible.' }
  }
}

export async function assignMaterialResponsible(input: Record<string, unknown>): Promise<MaterialMutationResult> {
  try {
    const resolved = await context('inventaire.update', nullableText(input.schoolId))
    const id = requiredString(input, 'id', 'L’article')
    const staffId = nullableText(input.responsibleStaffId)
    const client = await createClient()
    const { data: before } = await client.from('angelcare360_inventory_items').select('*').eq('school_id', resolved.school!.id).eq('id', id).maybeSingle()
    if (!before) return { ok: false, error: 'Article introuvable.' }
    if (staffId) {
      const { data: staff } = await client.from('angelcare360_staff').select('id').eq('school_id', resolved.school!.id).eq('id', staffId).maybeSingle()
      if (!staff) return { ok: false, error: 'Le responsable sélectionné n’appartient pas à cet établissement.' }
    }
    const { data, error } = await client.from('angelcare360_inventory_items').update({ responsible_staff_id: staffId, updated_by: resolved.user.id }).eq('school_id', resolved.school!.id).eq('id', id).select('*').single()
    if (error || !data) return { ok: false, error: error?.message || 'Impossible de modifier la responsabilité.' }
    await audit({ schoolId: resolved.school!.id, action: 'material_stewardship.changed', entityType: 'inventory_item', entityId: id, beforeData: before as Row, afterData: data as Row })
    return { ok: true, record: data }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Affectation impossible.' }
  }
}

export async function applyMaterialMovement(input: Record<string, unknown>): Promise<MaterialMutationResult> {
  try {
    const resolved = await context('inventaire.create', nullableText(input.schoolId))
    const itemId = requiredString(input, 'itemId', 'L’article')
    const movementType = normalizeMovementType(input.movementType)
    if (!movementType) return { ok: false, error: 'Le type de mouvement est invalide.' }
    const quantity = input.quantity === undefined || input.quantity === null || input.quantity === '' ? null : num(input.quantity, Number.NaN)
    const observedStock = input.observedStock === undefined || input.observedStock === null || input.observedStock === '' ? null : num(input.observedStock, Number.NaN)
    if (movementType === 'adjust') {
      if (observedStock === null || !Number.isFinite(observedStock) || observedStock < 0) return { ok: false, error: 'Le stock observé doit être positif ou nul.' }
    } else if (quantity === null || !Number.isFinite(quantity) || quantity <= 0) {
      return { ok: false, error: 'La quantité doit être strictement positive.' }
    }
    const notes = nullableText(input.notes)
    if (['adjust', 'loss', 'damage'].includes(movementType) && !notes) return { ok: false, error: 'Un motif est obligatoire pour cette opération.' }
    const metadata = object(input.metadata)
    if (movementType === 'transfer') {
      const source = nullableText(metadata.sourceLabel)
      const destination = nullableText(metadata.destinationLabel)
      if (!source || !destination) return { ok: false, error: 'La source et la destination sont requises pour journaliser un transfert.' }
    }
    const integrity = await getMaterialIntegrityStatus()
    if (!integrity.ready) return { ok: false, locked: true, reason: integrity.reason || 'Migration d’intégrité inventaire requise.' }
    const client = await createClient()
    const movementCode = nullableText(input.movementCode) || `MOV-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomUUID().slice(0, 8).toUpperCase()}`
    const { data, error } = await client.rpc(MOVEMENT_FUNCTION, {
      p_school_id: resolved.school!.id,
      p_item_id: itemId,
      p_movement_code: movementCode,
      p_movement_type: movementType,
      p_quantity: quantity,
      p_observed_stock: observedStock,
      p_movement_date: nullableText(input.movementDate) || new Date().toISOString().slice(0, 10),
      p_reference_type: nullableText(input.referenceType),
      p_reference_id: nullableText(input.referenceId),
      p_performed_by: nullableText(input.performedBy) || resolved.user.id,
      p_actor_user_id: resolved.user.id,
      p_notes: notes,
      p_metadata_json: metadata,
    })
    if (error) {
      const message = error.message || 'Le mouvement n’a pas été enregistré.'
      if (message.includes('inventory_negative_stock_blocked')) {
        await audit({ schoolId: resolved.school!.id, action: 'material_stock.negative_blocked', entityType: 'inventory_item', entityId: itemId, severity: 'warning', metadata: { movement_type: movementType, quantity } })
        return { ok: false, locked: true, reason: 'Le mouvement est bloqué car le stock deviendrait négatif.' }
      }
      return { ok: false, error: message }
    }
    const payload = object(data)
    if (payload.ok !== true) return { ok: false, error: nullableText(payload.error) || 'Le mouvement n’a pas été enregistré.' }
    const movement = object(payload.movement)
    await audit({
      schoolId: resolved.school!.id,
      action: payload.idempotent === true ? 'material_movement.idempotent' : 'material_movement.created',
      entityType: 'inventory_movement',
      entityId: nullableText(movement.id) || itemId,
      afterData: movement,
      metadata: {
        item_id: itemId,
        stock_before: payload.stockBefore,
        stock_after: payload.stockAfter,
        stock_delta: payload.stockDelta,
        transfer_scope: movementType === 'transfer' ? 'journal_only_no_location_balance' : null,
      },
    })
    return {
      ok: true,
      record: movement,
      idempotent: payload.idempotent === true,
      stockBefore: num(payload.stockBefore),
      stockAfter: num(payload.stockAfter),
      stockDelta: num(payload.stockDelta),
      warning: movementType === 'transfer' ? 'Le transfert est journalisé sans balance de stock par emplacement; le stock global de l’établissement reste inchangé.' : undefined,
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Mouvement impossible.' }
  }
}
