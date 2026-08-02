import type { ComponentType } from 'react'
import type { CategoryExperienceConcept } from '@/types/homeservice-category-experience'
import type { ConceptLayoutProps } from '../types'
import { FamilyCareConcept } from './FamilyCareConcept'
import { NewbornCalmConcept } from './NewbornCalmConcept'
import { AdaptedPrecisionConcept } from './AdaptedPrecisionConcept'
import { LearningStudioConcept } from './LearningStudioConcept'
import { EventControlConcept } from './EventControlConcept'
import { HospitalitySuiteConcept } from './HospitalitySuiteConcept'
import { RouteSafetyConcept } from './RouteSafetyConcept'
import { ComfortDignityConcept } from './ComfortDignityConcept'
import { HouseholdFlowConcept } from './HouseholdFlowConcept'
import { EnterpriseDeploymentConcept } from './EnterpriseDeploymentConcept'

export const CONCEPT_LAYOUTS: Record<CategoryExperienceConcept, ComponentType<ConceptLayoutProps>> = {
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
