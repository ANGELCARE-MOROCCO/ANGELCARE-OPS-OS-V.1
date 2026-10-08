import type { StudioSourceReference } from '@/angelcare-marketplace/studio-source-registry/types'

export const STUDIO_TEMPLATE_ASSIGNMENT_VERSION = 1 as const
export const STUDIO_TEMPLATE_PRECEDENCE = [
  'exact_item',
  'placement',
  'collection',
  'experience_schema',
  'category',
  'family',
  'marketplace_default',
] as const

export type StudioTemplateAssignmentScope = typeof STUDIO_TEMPLATE_PRECEDENCE[number]

export interface StudioTemplateReference extends StudioSourceReference {
  sourceId: 'content.templates'
}

export interface StudioTemplateAssignment {
  version: typeof STUDIO_TEMPLATE_ASSIGNMENT_VERSION
  scope: StudioTemplateAssignmentScope
  template: StudioTemplateReference
  target?: StudioSourceReference | null
  familyKey?: string | null
  placementId?: string | null
  enabled: boolean
}

export interface StudioTemplateAssignmentWriteInput {
  scope: StudioTemplateAssignmentScope
  template: StudioTemplateReference | null
  target?: StudioSourceReference | null
  familyKey?: string | null
  placementId?: string | null
  reason: string
}

export interface StudioTemplateAssignmentRecord extends StudioTemplateAssignment {
  authority: string
  targetLabel: string
  templateLabel?: string | null
  updatedAt?: string | null
}

export interface StudioTemplateResolutionCandidate {
  scope: StudioTemplateAssignmentScope
  authority: string
  assignment: StudioTemplateAssignment | null
  status: 'MISS' | 'VALID' | 'TEMPLATE_MISSING' | 'TEMPLATE_UNPUBLISHED' | 'TARGET_MISMATCH'
  detail: string
}

export interface StudioResolvedTemplate {
  status: 'RESOLVED' | 'FALLBACK_NATIVE'
  assignment: StudioTemplateAssignment | null
  templateId: string | null
  templateKey: string | null
  templateRevisionId: string | null
  matchedScope: StudioTemplateAssignmentScope | null
  provenance: StudioTemplateResolutionCandidate[]
  item: {
    id: string
    slug: string
    kind: string
    sellableType: string
    schemaKey: string | null
    categoryId: string | null
    categoryKey: string | null
  }
}

export interface StudioTemplateFamilyOption {
  key: string
  label: string
  source: 'category-native' | 'catalog'
  count: number
}

export interface StudioTemplatePlacementOption {
  id: string
  key: string
  label: string
  status: string
  locale: string
  collectionLabel?: string | null
  itemLabel?: string | null
}
