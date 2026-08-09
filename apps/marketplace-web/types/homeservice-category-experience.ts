import type { FactoryMode, FactoryUniverse } from '@/types/homeservice-factory'

export type CategoryExperienceConcept =
  | 'family_care'
  | 'newborn_calm'
  | 'adapted_precision'
  | 'learning_studio'
  | 'event_control'
  | 'hospitality_suite'
  | 'route_safety'
  | 'comfort_dignity'
  | 'household_flow'
  | 'enterprise_deployment'

export type CategoryExperienceFieldType = 'single' | 'multi' | 'toggle' | 'stepper' | 'number' | 'scale'
export type CategoryExperienceSectionLayout = 'profile' | 'cards' | 'matrix' | 'journey' | 'safety'
export type CategoryExperienceSemantic = 'age' | 'objective' | 'context' | 'pain' | 'outcome' | 'routine'

export interface CategoryExperienceOption {
  code: string
  label: string
  description?: string
}

export interface CategoryExperienceField {
  code: string
  label: string
  type: CategoryExperienceFieldType
  description: string
  required: boolean
  options: CategoryExperienceOption[]
  defaultValue?: unknown
  min?: number
  max?: number
  unit?: string
  semantic?: CategoryExperienceSemantic
}

export interface CategoryExperienceSection {
  code: string
  title: string
  description: string
  layout: CategoryExperienceSectionLayout
  fields: CategoryExperienceField[]
}

export interface CategoryExperiencePreset {
  code: string
  name: string
  description: string
  badge: string
  mode: FactoryMode
  universe: FactoryUniverse
  fieldValues: Record<string, unknown>
  defaultStartTime: string
  defaultEndTime: string
  defaultDayCount: number
  scenarioCount: number
  maxActivitiesPerDay: number
  maxOptions: number
}

export interface CategoryExperienceBlueprint {
  code: string
  categoryCode: string
  categoryName: string
  concept: CategoryExperienceConcept
  conceptTitle: string
  title: string
  subtitle: string
  heroStatement: string
  accent: string
  icon: string
  audience: 'b2c' | 'b2b' | 'both'
  version: number
  zeroTypingPromise: string
  sections: CategoryExperienceSection[]
  presets: CategoryExperiencePreset[]
  aiCompositionProfile: {
    purpose: string
    forbidden: string[]
    priorities: string[]
  }
}

export interface CategoryExperienceSelection {
  blueprintCode: string
  blueprintVersion: number
  presetCode: string
  fieldValues: Record<string, unknown>
}

export interface CategoryExperienceCatalogueItem {
  categoryId: string
  categoryCode: string
  categoryName: string
  familyName: string
  audience: string
  status: string
  activityCount: number
  optionCount: number
  blueprint: CategoryExperienceBlueprint
}
