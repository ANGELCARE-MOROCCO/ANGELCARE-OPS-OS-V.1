import type { CategoryExperienceConcept } from '@/types/homeservice-category-experience'
import type { ConceptLayoutProps } from './types'
import { FamilyCareConcept } from './concepts/FamilyCareConcept'
import { NewbornCalmConcept } from './concepts/NewbornCalmConcept'
import { AdaptedPrecisionConcept } from './concepts/AdaptedPrecisionConcept'
import { LearningStudioConcept } from './concepts/LearningStudioConcept'
import { EventControlConcept } from './concepts/EventControlConcept'
import { HospitalitySuiteConcept } from './concepts/HospitalitySuiteConcept'
import { RouteSafetyConcept } from './concepts/RouteSafetyConcept'
import { ComfortDignityConcept } from './concepts/ComfortDignityConcept'
import { HouseholdFlowConcept } from './concepts/HouseholdFlowConcept'
import { EnterpriseDeploymentConcept } from './concepts/EnterpriseDeploymentConcept'

type ConceptLayout = (props: ConceptLayoutProps) => any

export const CONCEPT_LAYOUTS: Record<CategoryExperienceConcept, ConceptLayout> = {
  family_care: FamilyCareConcept,
  newborn_calm: NewbornCalmConcept,
  adapted_precision: AdaptedPrecisionConcept,
  learning_studio: LearningStudioConcept,
  event_control: EventControlConcept,
  hospitality_suite: HospitalitySuiteConcept,
  route_safety: RouteSafetyConcept,
  comfort_dignity: ComfortDignityConcept,
  household_flow: HouseholdFlowConcept,
  enterprise_deployment: EnterpriseDeploymentConcept,
}
