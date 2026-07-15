import type { ServiceCharacteristic } from './types'

const MATRIX: ServiceCharacteristic[] = [
  {
    serviceType: "Garde et accompagnement d'enfants à domicile",
    serviceFamily: 'childcare_home',
    requiredFields: ['child_age', 'parent_instructions', 'emergency_contact', 'food_hydration_rules'],
    requiredSkills: ['childcare', 'home_safety', 'child_activity_supervision'],
    requiredDocuments: ['identity_verified', 'academy_childcare_certificate'],
    defaultChecklist: ['confirm_parent_instructions', 'check_home_safety', 'track_meal_hydration', 'record_activities', 'handover_summary'],
    reportTemplate: ['activities_completed', 'mood_behavior', 'meals_hydration', 'handover_notes', 'incident_flag'],
    riskRules: ['missing_emergency_contact', 'special_needs_without_training', 'unverified_caregiver'],
    internalProcedure: 'childcare_home_standard',
    allowedAssignmentRoles: ['caregiver', 'childcare_specialist'],
  },
  {
    serviceType: "Garde et accompagnement bébé post accouchement",
    serviceFamily: 'postpartum_baby_care',
    requiredFields: ['baby_age', 'mother_instructions', 'feeding_instructions', 'emergency_contact'],
    requiredSkills: ['baby_care', 'postpartum_support', 'hygiene_basics'],
    requiredDocuments: ['identity_verified', 'academy_babycare_certificate'],
    defaultChecklist: ['confirm_feeding_rules', 'sanitize_environment', 'track_baby_care', 'support_mother_instructions', 'handover_summary'],
    reportTemplate: ['baby_care_summary', 'feeding_notes', 'hygiene_notes', 'parent_handover', 'incident_flag'],
    riskRules: ['newborn_sensitive_profile', 'medical_instruction_missing'],
    internalProcedure: 'postpartum_baby_care_sensitive',
    allowedAssignmentRoles: ['caregiver', 'childcare_specialist'],
  },
  {
    serviceType: "Garde et accompagnement d'enfant spécial à l'école",
    serviceFamily: 'special_child_school',
    requiredFields: ['school_name', 'school_contact', 'special_needs_profile', 'authorized_scope', 'transport_details'],
    requiredSkills: ['special_needs_support', 'school_accompaniment', 'family_school_communication'],
    requiredDocuments: ['identity_verified', 'academy_special_needs_certificate'],
    defaultChecklist: ['confirm_school_contact', 'arrival_at_school', 'support_child', 'teacher_handover', 'parent_update'],
    reportTemplate: ['school_context', 'support_notes', 'teacher_feedback', 'parent_update', 'incident_flag'],
    riskRules: ['higher_sensitivity', 'requires_trained_specialist', 'transport_missing'],
    internalProcedure: 'special_child_school_high_sensitivity',
    allowedAssignmentRoles: ['childcare_specialist', 'special_needs_specialist'],
  },
  {
    serviceType: 'Animation anniversaire',
    serviceFamily: 'event_animation',
    requiredFields: ['children_count', 'event_location', 'theme', 'materials', 'event_schedule'],
    requiredSkills: ['animation', 'group_supervision', 'child_engagement'],
    requiredDocuments: ['identity_verified'],
    defaultChecklist: ['prepare_materials', 'confirm_activity_sequence', 'supervise_safety', 'handover_to_parent'],
    reportTemplate: ['activities_done', 'attendance_observations', 'materials_used', 'incident_flag'],
    riskRules: ['large_group', 'missing_event_location', 'missing_materials'],
    internalProcedure: 'birthday_animation_standard',
    allowedAssignmentRoles: ['childcare_specialist', 'animation_agent'],
  },
  {
    serviceType: 'Excursion',
    serviceFamily: 'excursion',
    requiredFields: ['departure_point', 'destination', 'route', 'participant_count', 'transport_provider', 'emergency_contacts'],
    requiredSkills: ['group_supervision', 'transport_coordination', 'safety_management'],
    requiredDocuments: ['identity_verified', 'transport_authorization_if_required'],
    defaultChecklist: ['departure_check', 'attendance_tracking', 'transit_supervision', 'arrival_confirmation', 'return_handover'],
    reportTemplate: ['departure_return_times', 'attendance_notes', 'transport_notes', 'activity_notes', 'incident_flag'],
    riskRules: ['transport_required', 'large_group', 'external_location'],
    internalProcedure: 'excursion_high_control',
    allowedAssignmentRoles: ['childcare_specialist', 'field_agent', 'operations_agent'],
  },
]

export function getServiceCharacteristic(serviceType?: string | null): ServiceCharacteristic {
  const match = MATRIX.find((item) => item.serviceType === serviceType)
  if (match) return match
  return {
    serviceType: serviceType || 'Service AngelCare',
    serviceFamily: 'general_service',
    requiredFields: ['family_id', 'mission_date', 'service_type'],
    requiredSkills: [],
    requiredDocuments: ['identity_verified'],
    defaultChecklist: ['confirm_instructions', 'confirm_arrival', 'complete_service', 'submit_report'],
    reportTemplate: ['summary', 'observations', 'incident_flag'],
    riskRules: ['missing_assignment', 'missing_schedule'],
    internalProcedure: 'general_mission_standard',
    allowedAssignmentRoles: ['caregiver', 'field_agent', 'childcare_specialist'],
  }
}

export function listServiceCharacteristics(): ServiceCharacteristic[] {
  return MATRIX
}
