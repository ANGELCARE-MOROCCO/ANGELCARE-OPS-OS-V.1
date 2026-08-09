import type { CategoryExperienceBlueprint } from '@/types/homeservice-category-experience'
import { CATEGORY_EXPERIENCE_BLUEPRINTS } from './registry'

export function getCompiledCategoryBlueprint(categoryCode: string): CategoryExperienceBlueprint | null {
  return CATEGORY_EXPERIENCE_BLUEPRINTS[categoryCode as keyof typeof CATEGORY_EXPERIENCE_BLUEPRINTS] || null
}

export function listCompiledCategoryBlueprints(): CategoryExperienceBlueprint[] {
  return Object.values(CATEGORY_EXPERIENCE_BLUEPRINTS)
}
