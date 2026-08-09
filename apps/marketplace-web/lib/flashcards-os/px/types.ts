export type PxWorkbenchKind = 'collection' | 'package' | 'journey' | 'command' | 'document'
export type PxWorkbenchStatus = 'draft' | 'active' | 'completed'
export type PxUniverse = 'b2c' | 'b2b' | 'internal'

export type PxActor = {
  id: string
  name: string
  role: string
}

export type PxWorkbench = {
  id: string
  kind: PxWorkbenchKind
  sourceId: string | null
  sourceType: string | null
  title: string
  status: PxWorkbenchStatus
  universe: PxUniverse
  versionNo: number
  payload: Record<string, any>
  sourceSnapshot: Record<string, any>
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
}

export type PxWorkbenchItem = {
  id: string
  workbenchId: string
  parentId: string | null
  itemKind: 'collection' | 'tier' | 'day' | 'session' | 'activity' | 'section' | 'note'
  sourceRef: string | null
  sourceVersion: string | null
  title: string
  sortOrder: number
  startMinute: number | null
  durationMinutes: number | null
  quantity: number
  locked: boolean
  payload: Record<string, any>
  createdAt: string
  updatedAt: string
}

export type PxFavorite = {
  id: string
  entityType: string
  entityId: string
  label: string
  href: string | null
  metadata: Record<string, any>
  createdAt: string
}

export type PxSavedView = {
  id: string
  name: string
  workspace: string
  query: Record<string, any>
  display: Record<string, any>
  createdAt: string
  updatedAt: string
}

export type PxAnnotation = {
  id: string
  entityType: string
  entityId: string
  anchor: string | null
  body: string
  resolved: boolean
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
}

export type PxDocumentRecord = {
  id: string
  sourceType: string
  sourceId: string
  templateCode: string
  title: string
  fileName: string
  checksumSha256: string
  audience: string
  confidentiality: string
  orientation: 'portrait' | 'landscape'
  density: 'compact' | 'standard' | 'detailed'
  metadata: Record<string, any>
  createdAt: string
}

export type PxRecentItem = {
  id: string
  entityType: string
  entityId: string
  label: string
  href: string
  metadata: Record<string, any>
  lastOpenedAt: string
}
