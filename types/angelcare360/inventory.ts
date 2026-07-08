import type { Angelcare360AuditRecord } from './audit'
import type { Angelcare360BaseRecord, Angelcare360UUID } from './database'

export type Angelcare360InventoryItemStatus = 'active' | 'low_stock' | 'out_of_stock' | 'damaged' | 'lost' | 'inactive' | 'archived'
export type Angelcare360InventoryMovementType = 'in' | 'out' | 'adjust' | 'transfer' | 'entry' | 'exit' | 'adjustment' | 'loss' | 'damage'

export interface Angelcare360InventoryCategoryRecord extends Angelcare360BaseRecord {
  school_id: Angelcare360UUID
  category_code: string
  label: string
  description?: string | null
  status: string
}

export interface Angelcare360InventoryCategoryListRecord extends Angelcare360InventoryCategoryRecord {
  item_count?: number
}

export interface Angelcare360InventoryItemRecord extends Angelcare360BaseRecord {
  school_id: Angelcare360UUID
  category_id: Angelcare360UUID
  item_code: string
  label: string
  unit_of_measure: string
  barcode?: string | null
  current_stock: number
  reorder_level: number
  purchase_price: number
  responsible_staff_id?: Angelcare360UUID | null
  status: Angelcare360InventoryItemStatus | string
}

export interface Angelcare360InventoryItemListRecord extends Angelcare360InventoryItemRecord {
  category_label?: string | null
  category_code?: string | null
  responsible_staff_full_name?: string | null
  movement_count?: number
  low_stock?: boolean
  out_of_stock?: boolean
  detail_href?: string
}

export interface Angelcare360InventoryMovementRecord extends Angelcare360BaseRecord {
  school_id: Angelcare360UUID
  item_id: Angelcare360UUID
  movement_code: string
  movement_type: Angelcare360InventoryMovementType | string
  quantity: number
  movement_date: string
  reference_type?: string | null
  reference_id?: Angelcare360UUID | null
  performed_by?: Angelcare360UUID | null
  notes?: string | null
  status: string
}

export interface Angelcare360InventoryMovementListRecord extends Angelcare360InventoryMovementRecord {
  item_code?: string | null
  item_label?: string | null
  category_label?: string | null
  responsible_staff_full_name?: string | null
}

export interface Angelcare360InventoryResponsibleCoverageRecord {
  school_id: Angelcare360UUID
  responsible_staff_id?: Angelcare360UUID | null
  responsible_staff_full_name?: string | null
  item_count: number
  low_stock_count: number
  unassigned_item_count: number
}

export interface Angelcare360InventoryOverviewRecord {
  schoolId: Angelcare360UUID
  schoolName: string
  activeAcademicYearId?: Angelcare360UUID | null
  activeAcademicYearLabel?: string | null
  categoryCount: number
  itemCount: number
  movementCount: number
  lowStockCount: number
  outOfStockCount: number
  damagedItemCount: number
  lostItemCount: number
  unassignedItemCount: number
  latestAuditEvents: Angelcare360AuditRecord[]
  risks: string[]
}

export interface Angelcare360InventoryAuditFilter {
  schoolId?: Angelcare360UUID | null
  module?: string | null
  action?: string | null
  severity?: string | null
  entityType?: string | null
  entityId?: Angelcare360UUID | null
  actorUserId?: Angelcare360UUID | null
  status?: string | null
  search?: string | null
  from?: string | null
  to?: string | null
}

export interface Angelcare360InventoryMutationResult<T = unknown> {
  ok: boolean
  record?: T | null
  records?: T[]
  error?: string
  warning?: string | null
  idempotent?: boolean
  locked?: boolean
  reason?: string | null
}
