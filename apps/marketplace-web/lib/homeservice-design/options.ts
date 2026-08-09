export interface OptionItem {
  code: string
  labelFr: string
  descriptionFr?: string
  categoryCodes?: string[]
  minAgeMonths?: number
  maxAgeMonths?: number
  metadata?: Record<string, unknown>
}

export const BENEFICIARY_PROFILES: OptionItem[] = [
  { code: 'newborn', labelFr: 'Nouveau-né', minAgeMonths: 0, maxAgeMonths: 3 },
  { code: 'infant', labelFr: 'Bébé', minAgeMonths: 3, maxAgeMonths: 12 },
  { code: 'toddler', labelFr: 'Tout-petit', minAgeMonths: 12, maxAgeMonths: 36 },
  { code: 'preschool', labelFr: 'Âge préscolaire', minAgeMonths: 36, maxAgeMonths: 72 },
  { code: 'school_age', labelFr: 'Âge scolaire', minAgeMonths: 72, maxAgeMonths: 144 },
  { code: 'adolescent', labelFr: 'Adolescent', minAgeMonths: 144, maxAgeMonths: 216 },
  { code: 'special_support', labelFr: 'Bénéficiaire nécessitant un accompagnement adapté' },
  { code: 'dependent_adult', labelFr: 'Adulte dépendant' },
  { code: 'senior', labelFr: 'Senior nécessitant confort ou compagnie' },
  { code: 'group_children', labelFr: 'Groupe d’enfants' },
]

export const CUSTOMER_PROFILES: OptionItem[] = [
  { code: 'parent', labelFr: 'Parent' }, { code: 'guardian', labelFr: 'Tuteur' },
  { code: 'family', labelFr: 'Famille' }, { code: 'school', labelFr: 'École' },
  { code: 'kindergarten', labelFr: 'Crèche / maternelle' }, { code: 'hotel', labelFr: 'Hôtel / resort' },
  { code: 'clinic', labelFr: 'Clinique / structure de santé' }, { code: 'corporate', labelFr: 'Entreprise' },
  { code: 'event_organizer', labelFr: 'Organisateur d’événement' }, { code: 'ngo', labelFr: 'Association / ONG' },
]

export const USAGE_SITUATIONS: OptionItem[] = [
  { code: 'parent_work', labelFr: 'Parent en activité professionnelle' },
  { code: 'parent_rest', labelFr: 'Repos ou récupération du parent' },
  { code: 'postpartum_recovery', labelFr: 'Récupération post-partum' },
  { code: 'family_emergency', labelFr: 'Urgence ou indisponibilité familiale' },
  { code: 'school_closure', labelFr: 'Fermeture scolaire' },
  { code: 'holiday', labelFr: 'Vacances / congés' },
  { code: 'evening_engagement', labelFr: 'Engagement en soirée' },
  { code: 'family_event', labelFr: 'Événement familial' },
  { code: 'hotel_stay', labelFr: 'Séjour hôtelier' },
  { code: 'travel', labelFr: 'Voyage ou déplacement' },
  { code: 'recurring_routine', labelFr: 'Routine récurrente' },
  { code: 'temporary_replacement', labelFr: 'Remplacement temporaire' },
  { code: 'specialist_support', labelFr: 'Accompagnement spécialisé' },
]

export const SERVICE_OBJECTIVES: OptionItem[] = [
  { code: 'safety', labelFr: 'Sécurité et supervision' },
  { code: 'parent_respite', labelFr: 'Répit parental' },
  { code: 'routine_continuity', labelFr: 'Continuité des routines' },
  { code: 'play', labelFr: 'Jeu et épanouissement' },
  { code: 'language', labelFr: 'Langage et communication' },
  { code: 'learning', labelFr: 'Apprentissage' },
  { code: 'social', labelFr: 'Participation sociale' },
  { code: 'emotional', labelFr: 'Soutien émotionnel' },
  { code: 'autonomy', labelFr: 'Autonomie' },
  { code: 'school_readiness', labelFr: 'Préparation scolaire' },
  { code: 'mobility', labelFr: 'Mobilité et accompagnement' },
  { code: 'family_confidence', labelFr: 'Confiance et sérénité familiale' },
]

export const MISSION_FORMATS: OptionItem[] = [
  { code: 'single', labelFr: 'Mission unique' },
  { code: 'repeat_identical', labelFr: 'Missions répétées identiques' },
  { code: 'multi_day_varied', labelFr: 'Programme multi-jours varié' },
  { code: 'weekly_recurring', labelFr: 'Récurrence hebdomadaire' },
  { code: 'weekend', labelFr: 'Pack week-end' },
  { code: 'holiday', labelFr: 'Pack vacances' },
  { code: 'night', labelFr: 'Pack nuit' },
  { code: 'event', labelFr: 'Pack événement' },
  { code: 'phased', labelFr: 'Programme progressif' },
  { code: 'pilot', labelFr: 'Pilote' },
  { code: 'multi_site', labelFr: 'Déploiement multi-sites' },
  { code: 'emergency', labelFr: 'Service urgent' },
]

export const CITIES: OptionItem[] = [
  { code: 'rabat', labelFr: 'Rabat' }, { code: 'sale', labelFr: 'Salé' },
  { code: 'temara', labelFr: 'Témara' }, { code: 'kenitra', labelFr: 'Kénitra' },
  { code: 'casablanca', labelFr: 'Casablanca' }, { code: 'marrakech', labelFr: 'Marrakech' },
  { code: 'tanger', labelFr: 'Tanger' }, { code: 'fes', labelFr: 'Fès' },
  { code: 'agadir', labelFr: 'Agadir' },
]

export const SYSTEM_OPTION_SETS = {
  beneficiary_profiles: BENEFICIARY_PROFILES,
  customer_profiles: CUSTOMER_PROFILES,
  usage_situations: USAGE_SITUATIONS,
  service_objectives: SERVICE_OBJECTIVES,
  mission_formats: MISSION_FORMATS,
  cities: CITIES,
}
