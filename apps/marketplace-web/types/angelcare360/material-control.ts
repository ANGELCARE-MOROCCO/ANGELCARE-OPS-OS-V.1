export type MaterialStatus = 'active' | 'low_stock' | 'out_of_stock' | 'damaged' | 'lost' | 'inactive' | 'archived' | string
export type MaterialMovementType = 'in' | 'out' | 'adjust' | 'transfer' | 'loss' | 'damage' | 'entry' | 'exit' | 'adjustment' | string

export type MaterialCategory = {
  id: string
  schoolId: string
  code: string
  label: string
  description: string | null
  status: string
  createdAt: string
  updatedAt: string
  itemCount: number
  pressureCount: number
  criticalCount: number
  indicativeValue: number
}

export type MaterialItem = {
  id: string
  schoolId: string
  categoryId: string
  categoryCode: string | null
  categoryLabel: string | null
  code: string
  label: string
  unit: string
  barcode: string | null
  currentStock: number
  reorderLevel: number
  purchasePrice: number
  indicativeValue: number
  responsibleStaffId: string | null
  responsibleStaffName: string | null
  status: MaterialStatus
  health: 'healthy' | 'pressure' | 'critical' | 'exception' | 'inactive'
  thresholdDelta: number
  thresholdRatio: number | null
  movementCount: number
  lastMovementAt: string | null
  lastMovementType: string | null
  detailHref: string
  createdAt: string
  updatedAt: string
}

export type MaterialMovement = {
  id: string
  schoolId: string
  itemId: string
  movementCode: string
  movementType: MaterialMovementType
  quantity: number
  movementDate: string
  referenceType: string | null
  referenceId: string | null
  performedBy: string | null
  performerName: string | null
  notes: string | null
  status: string
  metadata: Record<string, unknown>
  itemCode: string | null
  itemLabel: string | null
  categoryLabel: string | null
  createdAt: string
  updatedAt: string
}

export type MaterialStaff = {
  id: string
  staffCode: string
  fullName: string
  department: string | null
  status: string
}

export type MaterialStewardship = {
  staffId: string | null
  staffName: string
  department: string | null
  itemCount: number
  pressureCount: number
  criticalCount: number
  exceptionCount: number
  indicativeValue: number
  unassigned: boolean
}

export type MaterialAuditEvent = {
  id: string
  actorUserId: string | null
  actorRole: string | null
  module: string
  action: string
  entityType: string | null
  entityId: string | null
  severity: string
  beforeData: Record<string, unknown>
  afterData: Record<string, unknown>
  metadata: Record<string, unknown>
  createdAt: string
}

export type MaterialIntegrityStatus = {
  ready: boolean
  version: string | null
  reason: string | null
}

export type MaterialSnapshot = {
  schoolId: string
  schoolName: string
  academicYearLabel: string | null
  integrity: MaterialIntegrityStatus
  categories: MaterialCategory[]
  items: MaterialItem[]
  movements: MaterialMovement[]
  stewardship: MaterialStewardship[]
  audit: MaterialAuditEvent[]
  totals: {
    categories: number
    items: number
    healthy: number
    pressure: number
    critical: number
    outOfStock: number
    damaged: number
    lost: number
    unassigned: number
    movements: number
    indicativeValue: number
    damageLossEvents30d: number
  }
}

export type MaterialItemDossier = {
  item: MaterialItem
  movements: MaterialMovement[]
  audit: MaterialAuditEvent[]
}

export type MaterialMutationResult<T = unknown> = {
  ok: boolean
  record?: T
  error?: string
  reason?: string
  locked?: boolean
  idempotent?: boolean
  warning?: string
  stockBefore?: number
  stockAfter?: number
  stockDelta?: number
}
