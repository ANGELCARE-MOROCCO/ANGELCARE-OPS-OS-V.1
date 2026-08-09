import type { ReactNode } from 'react'
import type { CategoryExperienceBlueprint, CategoryExperienceSection } from '@/types/homeservice-category-experience'

export interface ConceptLayoutProps {
  blueprint: CategoryExperienceBlueprint
  activeSection: string
  onSectionChange: (code: string) => void
  renderSection: (section: CategoryExperienceSection) => ReactNode
}
