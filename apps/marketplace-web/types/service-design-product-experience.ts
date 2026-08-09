export type ProductExperienceEntityType =
  | 'workbench_draft' | 'timeline_day' | 'timeline_block' | 'scenario_composition'
  | 'favorite' | 'saved_view' | 'annotation' | 'document_entry'
  | 'factory_request' | 'factory_scenario' | 'unpublished_sellable'

export type ProductExperienceAudience = 'designer' | 'b2c' | 'b2b' | 'field' | 'carelink' | 'a4'
export type ProductExperienceSaveState = 'idle' | 'saving' | 'saved' | 'error'

export interface ProductExperienceTimelineBlock {
  id: string
  dayId: string
  sourceActivityId: string | null
  sourceCode: string | null
  blockType: 'activity' | 'routine' | 'meal' | 'rest' | 'handover' | 'travel' | 'break' | 'custom'
  label: string
  objective: string
  startMinute: number
  durationMinutes: number
  locked: boolean
  sortOrder: number
  metadata: Record<string, unknown>
}

export interface ProductExperienceTimelineDay {
  id: string
  draftId: string
  sourceDayId: string | null
  serviceDate: string | null
  label: string
  startMinute: number
  endMinute: number
  sortOrder: number
  metadata: Record<string, unknown>
  blocks: ProductExperienceTimelineBlock[]
}

export interface ProductExperienceDraft {
  id: string
  workspaceKey: string
  sourceType: string
  sourceId: string | null
  title: string
  state: Record<string, unknown>
  revision: number
  isDirty: boolean
  lastOpenedAt: string
  createdAt: string
  updatedAt: string
  days: ProductExperienceTimelineDay[]
}

export interface ProductExperienceFavorite {
  id: string
  entityType: string
  entityId: string
  label: string
  href: string
  metadata: Record<string, unknown>
  sortOrder: number
  createdAt: string
}

export interface ProductExperienceSavedView {
  id: string
  name: string
  scope: string
  filters: Record<string, unknown>
  presentation: Record<string, unknown>
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductExperienceRecentItem {
  id: string
  entityType: string
  entityId: string
  label: string
  href: string
  metadata: Record<string, unknown>
  lastOpenedAt: string
}

export interface ProductExperienceScenario {
  id: string
  requestId: string | null
  name: string
  promise: string
  rationale: string
  categoryCode: string
  universe: 'b2c' | 'b2b'
  source: Record<string, unknown>
  days: Array<Record<string, unknown>>
  selectedActivityIds: string[]
  selectedOptionIds: string[]
  customerTotalDh: number | null
  costTotalDh: number | null
  marginPercent: number | null
  warnings: string[]
}

export interface ProductExperienceDiff {
  key: string
  label: string
  values: Record<string, string | number | boolean | null>
  bestScenarioId?: string
}

export interface ProductExperienceInspector {
  entityType: string
  entityId: string
  title: string
  subtitle: string
  fields: Array<{ label: string; value: string }>
  actions: Array<'open' | 'edit' | 'favorite' | 'replace' | 'duplicate' | 'delete'>
  raw: Record<string, unknown>
}

export interface ProductExperienceDeletePreview {
  entityType: ProductExperienceEntityType
  entityId: string
  label: string
  canDelete: boolean
  dependencies: Array<{ type: string; count: number; detail: string }>
  consequences: string[]
  reason?: string
}
