import type { FactoryCataloguePayload } from '@/types/homeservice-factory'

export const FACTORY_ROUTE = '/carelink-ops/service-design/factory'
export const FACTORY_PROVIDER_ROUTE = 'openrouter/free' as const
export const FACTORY_MAX_SCENARIOS = 10
export const FACTORY_MAX_DAYS = 60

export const FACTORY_OBJECTIVES: FactoryCataloguePayload['objectives'] = [
  { code: 'safe_supervision', label: 'Supervision sécurisée' },
  { code: 'parent_work_coverage', label: 'Couverture pendant le travail du parent' },
  { code: 'parent_rest', label: 'Repos et répit parental' },
  { code: 'routine_continuity', label: 'Continuité des routines' },
  { code: 'play_engagement', label: 'Jeu et engagement' },
  { code: 'language_development', label: 'Développement linguistique' },
  { code: 'creative_development', label: 'Créativité et arts' },
  { code: 'school_readiness', label: 'Préparation scolaire' },
  { code: 'independence', label: 'Autonomie' },
  { code: 'social_participation', label: 'Participation sociale' },
  { code: 'sensory_regulation', label: 'Régulation sensorielle' },
  { code: 'event_coverage', label: 'Couverture événementielle' },
  { code: 'outing_support', label: 'Accompagnement sortie / excursion' },
  { code: 'postpartum_support', label: 'Soutien postpartum et familial' },
]

export const FACTORY_CONTEXTS: FactoryCataloguePayload['contexts'] = [
  { code: 'parent_present', label: 'Parent présent' },
  { code: 'parent_absent', label: 'Parent absent' },
  { code: 'home_daytime', label: 'Domicile · journée' },
  { code: 'home_evening', label: 'Domicile · soirée' },
  { code: 'weekend', label: 'Weekend' },
  { code: 'school_pickup', label: 'Sortie école et transition maison' },
  { code: 'hotel', label: 'Hôtel / séjour' },
  { code: 'event', label: 'Événement familial ou corporate' },
  { code: 'outing', label: 'Sortie / excursion' },
  { code: 'recurring', label: 'Programme récurrent' },
  { code: 'holiday', label: 'Vacances scolaires' },
  { code: 'emergency_replacement', label: 'Remplacement urgent' },
]

export const FACTORY_PAIN_POINTS: FactoryCataloguePayload['painPoints'] = [
  { code: 'lack_of_time', label: 'Manque de temps du parent' },
  { code: 'care_gap', label: 'Rupture de garde' },
  { code: 'routine_instability', label: 'Routine instable' },
  { code: 'low_engagement', label: 'Faible engagement de l’enfant' },
  { code: 'language_delay_concern', label: 'Besoin de stimulation linguistique' },
  { code: 'screen_overuse', label: 'Excès d’écran' },
  { code: 'social_isolation', label: 'Isolement / faible interaction' },
  { code: 'sensory_overload', label: 'Surcharge sensorielle' },
  { code: 'parent_fatigue', label: 'Fatigue parentale' },
  { code: 'event_complexity', label: 'Complexité événementielle' },
  { code: 'transport_coordination', label: 'Coordination transport' },
  { code: 'special_support_need', label: 'Besoin d’accompagnement adapté' },
]

export const FACTORY_OUTCOMES: FactoryCataloguePayload['outcomes'] = [
  { code: 'safe_coverage_completed', label: 'Couverture sûre réalisée' },
  { code: 'parent_reassured', label: 'Parent rassuré' },
  { code: 'routine_completed', label: 'Routine accomplie' },
  { code: 'activities_completed', label: 'Activités réalisées' },
  { code: 'beneficiary_engaged', label: 'Bénéficiaire engagé' },
  { code: 'language_participation', label: 'Participation linguistique' },
  { code: 'creative_output', label: 'Production créative' },
  { code: 'independence_participation', label: 'Participation autonome' },
  { code: 'calm_transition', label: 'Transition apaisée' },
  { code: 'successful_handover', label: 'Transmission parentale réussie' },
  { code: 'rebooking_ready', label: 'Programme reproductible / réservable' },
]

export const DIRECT_IMPORT_TYPES = [
  { code: 'doctrine_rules', label: 'Doctrine & règles', categoryRequired: true },
  { code: 'capacity_rules', label: 'Capacité & horaires', categoryRequired: true },
  { code: 'activities', label: 'Activités & blocs mission', categoryRequired: true },
  { code: 'features', label: 'Fonctions incluses', categoryRequired: true },
  { code: 'topups', label: 'Top-ups', categoryRequired: true },
  { code: 'upsells', label: 'Upsells', categoryRequired: true },
  { code: 'competencies', label: 'Compétences', categoryRequired: true },
  { code: 'materials', label: 'Matériels', categoryRequired: true },
  { code: 'risks', label: 'Risques & contrôles', categoryRequired: true },
  { code: 'checklists', label: 'Checklists', categoryRequired: true },
  { code: 'report_fields', label: 'Champs de rapport', categoryRequired: true },
  { code: 'pricing', label: 'Tarification', categoryRequired: true },
  { code: 'experience_blueprints', label: 'Blueprint expérience', categoryRequired: true },
  { code: 'experience_sections', label: 'Sections du formulaire', categoryRequired: true },
  { code: 'experience_fields', label: 'Champs contrôlés', categoryRequired: true },
  { code: 'experience_options', label: 'Options de sélection', categoryRequired: true },
  { code: 'experience_presets', label: 'Scénarios préremplis', categoryRequired: true },
] as const
