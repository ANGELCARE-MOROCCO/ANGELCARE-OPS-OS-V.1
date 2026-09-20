import type { StudioBlockProps } from './types'

export type StudioVisualFamily = 'hero' | 'discovery' | 'commerce' | 'campaign' | 'journey' | 'trust' | 'editorial' | 'ecosystem' | 'conversion' | 'navigation'

export interface StudioVisualExperienceDefinition {
  key: string
  label: string
  description: string
  categoryKey: string
  categoryTitle: string
  family: StudioVisualFamily
  canonicalType: string
  variant: string
  keywords: string[]
}

export interface StudioVisualCategory {
  key: string
  title: string
  family: StudioVisualFamily
  lead: string
  order: number
  componentKeys: string[]
}

export const ANGELCARE_STUDIO_VISUAL_EXPERIENCES = [
  {
    "key": "visual_01_ecosystem_flagship",
    "label": "Écosystème AngelCare",
    "description": "Présenter immédiatement la promesse AngelCare avec une composition premium et orientée besoin.",
    "categoryKey": "01-ouvertures",
    "categoryTitle": "Ouvertures & Heroes",
    "family": "hero",
    "canonicalType": "hero",
    "variant": "v1",
    "keywords": [
      "écosystème",
      "angelcare"
    ]
  },
  {
    "key": "visual_01_home_care",
    "label": "Garde & accompagnement à domicile",
    "description": "Présenter immédiatement la promesse AngelCare avec une composition premium et orientée besoin.",
    "categoryKey": "01-ouvertures",
    "categoryTitle": "Ouvertures & Heroes",
    "family": "hero",
    "canonicalType": "split_hero",
    "variant": "v2",
    "keywords": [
      "garde",
      "accompagnement",
      "domicile"
    ]
  },
  {
    "key": "visual_01_parents_relax",
    "label": "Parents Relax Weekend",
    "description": "Présenter immédiatement la promesse AngelCare avec une composition premium et orientée besoin.",
    "categoryKey": "01-ouvertures",
    "categoryTitle": "Ouvertures & Heroes",
    "family": "hero",
    "canonicalType": "hero",
    "variant": "v3",
    "keywords": [
      "parents",
      "relax",
      "weekend"
    ]
  },
  {
    "key": "visual_01_travel_kids_care",
    "label": "Travel Kids Care",
    "description": "Présenter immédiatement la promesse AngelCare avec une composition premium et orientée besoin.",
    "categoryKey": "01-ouvertures",
    "categoryTitle": "Ouvertures & Heroes",
    "family": "hero",
    "canonicalType": "split_hero",
    "variant": "v4",
    "keywords": [
      "travel",
      "kids",
      "care"
    ]
  },
  {
    "key": "visual_01_postpartum",
    "label": "Postpartum Maman & Bébé",
    "description": "Présenter immédiatement la promesse AngelCare avec une composition premium et orientée besoin.",
    "categoryKey": "01-ouvertures",
    "categoryTitle": "Ouvertures & Heroes",
    "family": "hero",
    "canonicalType": "split_hero",
    "variant": "v5",
    "keywords": [
      "postpartum",
      "maman",
      "bébé"
    ]
  },
  {
    "key": "visual_01_montessori_2_6",
    "label": "Montessori & éveil 2–6 ans",
    "description": "Présenter immédiatement la promesse AngelCare avec une composition premium et orientée besoin.",
    "categoryKey": "01-ouvertures",
    "categoryTitle": "Ouvertures & Heroes",
    "family": "hero",
    "canonicalType": "hero",
    "variant": "v6",
    "keywords": [
      "montessori",
      "éveil",
      "2–6",
      "ans"
    ]
  },
  {
    "key": "visual_01_special_needs",
    "label": "Besoins spécifiques",
    "description": "Présenter immédiatement la promesse AngelCare avec une composition premium et orientée besoin.",
    "categoryKey": "01-ouvertures",
    "categoryTitle": "Ouvertures & Heroes",
    "family": "hero",
    "canonicalType": "split_hero",
    "variant": "v7",
    "keywords": [
      "besoins",
      "spécifiques"
    ]
  },
  {
    "key": "visual_01_urgent_care",
    "label": "Garde urgente",
    "description": "Présenter immédiatement la promesse AngelCare avec une composition premium et orientée besoin.",
    "categoryKey": "01-ouvertures",
    "categoryTitle": "Ouvertures & Heroes",
    "family": "hero",
    "canonicalType": "hero",
    "variant": "v8",
    "keywords": [
      "garde",
      "urgente"
    ]
  },
  {
    "key": "visual_01_pro_institutions",
    "label": "AngelCare Pro & institutions",
    "description": "Présenter immédiatement la promesse AngelCare avec une composition premium et orientée besoin.",
    "categoryKey": "01-ouvertures",
    "categoryTitle": "Ouvertures & Heroes",
    "family": "hero",
    "canonicalType": "hero",
    "variant": "v9",
    "keywords": [
      "angelcare",
      "pro",
      "institutions"
    ]
  },
  {
    "key": "visual_01_mega_command",
    "label": "Mega Command Hero",
    "description": "Présenter immédiatement la promesse AngelCare avec une composition premium et orientée besoin.",
    "categoryKey": "01-ouvertures",
    "categoryTitle": "Ouvertures & Heroes",
    "family": "hero",
    "canonicalType": "hero",
    "variant": "v10",
    "keywords": [
      "mega",
      "command",
      "hero"
    ]
  },
  {
    "key": "visual_02_family_need",
    "label": "Découverte par besoin familial",
    "description": "Aider les familles et organisations à trouver le bon parcours sans inventer disponibilité ni couverture.",
    "categoryKey": "02-decouverte",
    "categoryTitle": "Services & découverte",
    "family": "discovery",
    "canonicalType": "audience_router",
    "variant": "v1",
    "keywords": [
      "découverte",
      "par",
      "besoin",
      "familial"
    ]
  },
  {
    "key": "visual_02_child_age",
    "label": "Découverte par âge de l’enfant",
    "description": "Aider les familles et organisations à trouver le bon parcours sans inventer disponibilité ni couverture.",
    "categoryKey": "02-decouverte",
    "categoryTitle": "Services & découverte",
    "family": "discovery",
    "canonicalType": "category_grid",
    "variant": "v2",
    "keywords": [
      "découverte",
      "par",
      "âge",
      "l’enfant"
    ]
  },
  {
    "key": "visual_02_moment_schedule",
    "label": "Découverte par moment & horaire",
    "description": "Aider les familles et organisations à trouver le bon parcours sans inventer disponibilité ni couverture.",
    "categoryKey": "02-decouverte",
    "categoryTitle": "Services & découverte",
    "family": "discovery",
    "canonicalType": "service_grid",
    "variant": "v3",
    "keywords": [
      "découverte",
      "par",
      "moment",
      "horaire"
    ]
  },
  {
    "key": "visual_02_care_context",
    "label": "Découverte par contexte de garde",
    "description": "Aider les familles et organisations à trouver le bon parcours sans inventer disponibilité ni couverture.",
    "categoryKey": "02-decouverte",
    "categoryTitle": "Services & découverte",
    "family": "discovery",
    "canonicalType": "category_grid",
    "variant": "v4",
    "keywords": [
      "découverte",
      "par",
      "contexte",
      "garde"
    ]
  },
  {
    "key": "visual_02_parent_objective",
    "label": "Découverte par objectif parent",
    "description": "Aider les familles et organisations à trouver le bon parcours sans inventer disponibilité ni couverture.",
    "categoryKey": "02-decouverte",
    "categoryTitle": "Services & découverte",
    "family": "discovery",
    "canonicalType": "audience_router",
    "variant": "v5",
    "keywords": [
      "découverte",
      "par",
      "objectif",
      "parent"
    ]
  },
  {
    "key": "visual_02_home_school_travel",
    "label": "Maison · école · voyage",
    "description": "Aider les familles et organisations à trouver le bon parcours sans inventer disponibilité ni couverture.",
    "categoryKey": "02-decouverte",
    "categoryTitle": "Services & découverte",
    "family": "discovery",
    "canonicalType": "service_grid",
    "variant": "v6",
    "keywords": [
      "maison",
      "école",
      "voyage"
    ]
  },
  {
    "key": "visual_02_postpartum",
    "label": "Parcours postpartum",
    "description": "Aider les familles et organisations à trouver le bon parcours sans inventer disponibilité ni couverture.",
    "categoryKey": "02-decouverte",
    "categoryTitle": "Services & découverte",
    "family": "discovery",
    "canonicalType": "service_grid",
    "variant": "v7",
    "keywords": [
      "parcours",
      "postpartum"
    ]
  },
  {
    "key": "visual_02_special_needs",
    "label": "Parcours besoins spécifiques",
    "description": "Aider les familles et organisations à trouver le bon parcours sans inventer disponibilité ni couverture.",
    "categoryKey": "02-decouverte",
    "categoryTitle": "Services & découverte",
    "family": "discovery",
    "canonicalType": "service_grid",
    "variant": "v8",
    "keywords": [
      "parcours",
      "besoins",
      "spécifiques"
    ]
  },
  {
    "key": "visual_02_institution",
    "label": "Découverte institutions",
    "description": "Aider les familles et organisations à trouver le bon parcours sans inventer disponibilité ni couverture.",
    "categoryKey": "02-decouverte",
    "categoryTitle": "Services & découverte",
    "family": "discovery",
    "canonicalType": "audience_router",
    "variant": "v9",
    "keywords": [
      "découverte",
      "institutions"
    ]
  },
  {
    "key": "visual_02_mega_explorer",
    "label": "Mega Explorer AngelCare",
    "description": "Aider les familles et organisations à trouver le bon parcours sans inventer disponibilité ni couverture.",
    "categoryKey": "02-decouverte",
    "categoryTitle": "Services & découverte",
    "family": "discovery",
    "canonicalType": "category_grid",
    "variant": "v10",
    "keywords": [
      "mega",
      "explorer",
      "angelcare"
    ]
  },
  {
    "key": "visual_03_home_care_rail",
    "label": "Rail Garde à domicile",
    "description": "Mettre en valeur les offres réelles du Marketplace, leurs collections et catégories administrées.",
    "categoryKey": "03-offres",
    "categoryTitle": "Offres & merchandising",
    "family": "commerce",
    "canonicalType": "product_grid",
    "variant": "v1",
    "keywords": [
      "rail",
      "garde",
      "domicile"
    ]
  },
  {
    "key": "visual_03_parents_relax_packages",
    "label": "Packages Parents Relax",
    "description": "Mettre en valeur les offres réelles du Marketplace, leurs collections et catégories administrées.",
    "categoryKey": "03-offres",
    "categoryTitle": "Offres & merchandising",
    "family": "commerce",
    "canonicalType": "collection_rail",
    "variant": "v2",
    "keywords": [
      "packages",
      "parents",
      "relax"
    ]
  },
  {
    "key": "visual_03_postpartum_packages",
    "label": "Packages postpartum",
    "description": "Mettre en valeur les offres réelles du Marketplace, leurs collections et catégories administrées.",
    "categoryKey": "03-offres",
    "categoryTitle": "Offres & merchandising",
    "family": "commerce",
    "canonicalType": "collection_rail",
    "variant": "v3",
    "keywords": [
      "packages",
      "postpartum"
    ]
  },
  {
    "key": "visual_03_travel_packages",
    "label": "Packages Travel Kids Care",
    "description": "Mettre en valeur les offres réelles du Marketplace, leurs collections et catégories administrées.",
    "categoryKey": "03-offres",
    "categoryTitle": "Offres & merchandising",
    "family": "commerce",
    "canonicalType": "product_grid",
    "variant": "v4",
    "keywords": [
      "packages",
      "travel",
      "kids",
      "care"
    ]
  },
  {
    "key": "visual_03_montessori_packages",
    "label": "Packages Montessori & activités",
    "description": "Mettre en valeur les offres réelles du Marketplace, leurs collections et catégories administrées.",
    "categoryKey": "03-offres",
    "categoryTitle": "Offres & merchandising",
    "family": "commerce",
    "canonicalType": "product_grid",
    "variant": "v5",
    "keywords": [
      "packages",
      "montessori",
      "activités"
    ]
  },
  {
    "key": "visual_03_special_needs_packages",
    "label": "Packages besoins spécifiques",
    "description": "Mettre en valeur les offres réelles du Marketplace, leurs collections et catégories administrées.",
    "categoryKey": "03-offres",
    "categoryTitle": "Offres & merchandising",
    "family": "commerce",
    "canonicalType": "product_grid",
    "variant": "v6",
    "keywords": [
      "packages",
      "besoins",
      "spécifiques"
    ]
  },
  {
    "key": "visual_03_academy_programs",
    "label": "Programmes Academy",
    "description": "Mettre en valeur les offres réelles du Marketplace, leurs collections et catégories administrées.",
    "categoryKey": "03-offres",
    "categoryTitle": "Offres & merchandising",
    "family": "commerce",
    "canonicalType": "collection_rail",
    "variant": "v7",
    "keywords": [
      "programmes",
      "academy"
    ]
  },
  {
    "key": "visual_03_flashcards_printables",
    "label": "Flashcartes & printables",
    "description": "Mettre en valeur les offres réelles du Marketplace, leurs collections et catégories administrées.",
    "categoryKey": "03-offres",
    "categoryTitle": "Offres & merchandising",
    "family": "commerce",
    "canonicalType": "product_grid",
    "variant": "v8",
    "keywords": [
      "flashcartes",
      "printables"
    ]
  },
  {
    "key": "visual_03_institution_packages",
    "label": "Solutions institutions",
    "description": "Mettre en valeur les offres réelles du Marketplace, leurs collections et catégories administrées.",
    "categoryKey": "03-offres",
    "categoryTitle": "Offres & merchandising",
    "family": "commerce",
    "canonicalType": "pricing",
    "variant": "v9",
    "keywords": [
      "solutions",
      "institutions"
    ]
  },
  {
    "key": "visual_03_mega_solutions",
    "label": "Mega Solutions AngelCare",
    "description": "Mettre en valeur les offres réelles du Marketplace, leurs collections et catégories administrées.",
    "categoryKey": "03-offres",
    "categoryTitle": "Offres & merchandising",
    "family": "commerce",
    "canonicalType": "collection_rail",
    "variant": "v10",
    "keywords": [
      "mega",
      "solutions",
      "angelcare"
    ]
  },
  {
    "key": "visual_04_rentree",
    "label": "Campagne rentrée",
    "description": "Créer des campagnes éditoriales fortes sans données commerciales fictives.",
    "categoryKey": "04-campagnes",
    "categoryTitle": "Campagnes",
    "family": "campaign",
    "canonicalType": "cta_band",
    "variant": "v1",
    "keywords": [
      "campagne",
      "rentrée"
    ]
  },
  {
    "key": "visual_04_summer_travel",
    "label": "Campagne été & voyage",
    "description": "Créer des campagnes éditoriales fortes sans données commerciales fictives.",
    "categoryKey": "04-campagnes",
    "categoryTitle": "Campagnes",
    "family": "campaign",
    "canonicalType": "cta_band",
    "variant": "v2",
    "keywords": [
      "campagne",
      "été",
      "voyage"
    ]
  },
  {
    "key": "visual_04_parents_relax",
    "label": "Campagne Parents Relax",
    "description": "Créer des campagnes éditoriales fortes sans données commerciales fictives.",
    "categoryKey": "04-campagnes",
    "categoryTitle": "Campagnes",
    "family": "campaign",
    "canonicalType": "cta_band",
    "variant": "v3",
    "keywords": [
      "campagne",
      "parents",
      "relax"
    ]
  },
  {
    "key": "visual_04_postpartum",
    "label": "Campagne postpartum",
    "description": "Créer des campagnes éditoriales fortes sans données commerciales fictives.",
    "categoryKey": "04-campagnes",
    "categoryTitle": "Campagnes",
    "family": "campaign",
    "canonicalType": "cta_band",
    "variant": "v4",
    "keywords": [
      "campagne",
      "postpartum"
    ]
  },
  {
    "key": "visual_04_academy_enrollment",
    "label": "Campagne inscriptions Academy",
    "description": "Créer des campagnes éditoriales fortes sans données commerciales fictives.",
    "categoryKey": "04-campagnes",
    "categoryTitle": "Campagnes",
    "family": "campaign",
    "canonicalType": "cta_band",
    "variant": "v5",
    "keywords": [
      "campagne",
      "inscriptions",
      "academy"
    ]
  },
  {
    "key": "visual_04_holiday_family",
    "label": "Campagne vacances & soutien familial",
    "description": "Créer des campagnes éditoriales fortes sans données commerciales fictives.",
    "categoryKey": "04-campagnes",
    "categoryTitle": "Campagnes",
    "family": "campaign",
    "canonicalType": "cta_band",
    "variant": "v6",
    "keywords": [
      "campagne",
      "vacances",
      "soutien",
      "familial"
    ]
  },
  {
    "key": "visual_04_emergency_coverage",
    "label": "Campagne couverture urgente",
    "description": "Créer des campagnes éditoriales fortes sans données commerciales fictives.",
    "categoryKey": "04-campagnes",
    "categoryTitle": "Campagnes",
    "family": "campaign",
    "canonicalType": "cta_band",
    "variant": "v7",
    "keywords": [
      "campagne",
      "couverture",
      "urgente"
    ]
  },
  {
    "key": "visual_04_preschool_enrollment",
    "label": "Campagne inscriptions crèche & préscolaire",
    "description": "Créer des campagnes éditoriales fortes sans données commerciales fictives.",
    "categoryKey": "04-campagnes",
    "categoryTitle": "Campagnes",
    "family": "campaign",
    "canonicalType": "cta_band",
    "variant": "v8",
    "keywords": [
      "campagne",
      "inscriptions",
      "crèche",
      "préscolaire"
    ]
  },
  {
    "key": "visual_04_b2b_institution",
    "label": "Campagne B2B institutions",
    "description": "Créer des campagnes éditoriales fortes sans données commerciales fictives.",
    "categoryKey": "04-campagnes",
    "categoryTitle": "Campagnes",
    "family": "campaign",
    "canonicalType": "cta_band",
    "variant": "v9",
    "keywords": [
      "campagne",
      "b2b",
      "institutions"
    ]
  },
  {
    "key": "visual_04_mega_seasonal",
    "label": "Mega Seasonal Command Center",
    "description": "Créer des campagnes éditoriales fortes sans données commerciales fictives.",
    "categoryKey": "04-campagnes",
    "categoryTitle": "Campagnes",
    "family": "campaign",
    "canonicalType": "cta_band",
    "variant": "v10",
    "keywords": [
      "mega",
      "seasonal",
      "command",
      "center"
    ]
  },
  {
    "key": "visual_05_home_care",
    "label": "Parcours garde à domicile",
    "description": "Expliquer clairement les étapes d’un service ou d’une demande AngelCare.",
    "categoryKey": "05-parcours",
    "categoryTitle": "Parcours de service",
    "family": "journey",
    "canonicalType": "process",
    "variant": "v1",
    "keywords": [
      "parcours",
      "garde",
      "domicile"
    ]
  },
  {
    "key": "visual_05_urgent",
    "label": "Parcours urgence",
    "description": "Expliquer clairement les étapes d’un service ou d’une demande AngelCare.",
    "categoryKey": "05-parcours",
    "categoryTitle": "Parcours de service",
    "family": "journey",
    "canonicalType": "timeline",
    "variant": "v2",
    "keywords": [
      "parcours",
      "urgence"
    ]
  },
  {
    "key": "visual_05_postpartum",
    "label": "Parcours postpartum",
    "description": "Expliquer clairement les étapes d’un service ou d’une demande AngelCare.",
    "categoryKey": "05-parcours",
    "categoryTitle": "Parcours de service",
    "family": "journey",
    "canonicalType": "process",
    "variant": "v3",
    "keywords": [
      "parcours",
      "postpartum"
    ]
  },
  {
    "key": "visual_05_parents_relax",
    "label": "Parcours Parents Relax",
    "description": "Expliquer clairement les étapes d’un service ou d’une demande AngelCare.",
    "categoryKey": "05-parcours",
    "categoryTitle": "Parcours de service",
    "family": "journey",
    "canonicalType": "timeline",
    "variant": "v4",
    "keywords": [
      "parcours",
      "parents",
      "relax"
    ]
  },
  {
    "key": "visual_05_travel",
    "label": "Parcours Travel Kids Care",
    "description": "Expliquer clairement les étapes d’un service ou d’une demande AngelCare.",
    "categoryKey": "05-parcours",
    "categoryTitle": "Parcours de service",
    "family": "journey",
    "canonicalType": "process",
    "variant": "v5",
    "keywords": [
      "parcours",
      "travel",
      "kids",
      "care"
    ]
  },
  {
    "key": "visual_05_montessori",
    "label": "Parcours Montessori",
    "description": "Expliquer clairement les étapes d’un service ou d’une demande AngelCare.",
    "categoryKey": "05-parcours",
    "categoryTitle": "Parcours de service",
    "family": "journey",
    "canonicalType": "timeline",
    "variant": "v6",
    "keywords": [
      "parcours",
      "montessori"
    ]
  },
  {
    "key": "visual_05_special_needs",
    "label": "Parcours besoins spécifiques",
    "description": "Expliquer clairement les étapes d’un service ou d’une demande AngelCare.",
    "categoryKey": "05-parcours",
    "categoryTitle": "Parcours de service",
    "family": "journey",
    "canonicalType": "process",
    "variant": "v7",
    "keywords": [
      "parcours",
      "besoins",
      "spécifiques"
    ]
  },
  {
    "key": "visual_05_school_accompaniment",
    "label": "Parcours accompagnement scolaire",
    "description": "Expliquer clairement les étapes d’un service ou d’une demande AngelCare.",
    "categoryKey": "05-parcours",
    "categoryTitle": "Parcours de service",
    "family": "journey",
    "canonicalType": "timeline",
    "variant": "v8",
    "keywords": [
      "parcours",
      "accompagnement",
      "scolaire"
    ]
  },
  {
    "key": "visual_05_institutional",
    "label": "Parcours institutionnel",
    "description": "Expliquer clairement les étapes d’un service ou d’une demande AngelCare.",
    "categoryKey": "05-parcours",
    "categoryTitle": "Parcours de service",
    "family": "journey",
    "canonicalType": "process",
    "variant": "v9",
    "keywords": [
      "parcours",
      "institutionnel"
    ]
  },
  {
    "key": "visual_05_mega_care_command",
    "label": "Mega Care Experience Command Center",
    "description": "Expliquer clairement les étapes d’un service ou d’une demande AngelCare.",
    "categoryKey": "05-parcours",
    "categoryTitle": "Parcours de service",
    "family": "journey",
    "canonicalType": "timeline",
    "variant": "v10",
    "keywords": [
      "mega",
      "care",
      "experience",
      "command",
      "center"
    ]
  },
  {
    "key": "visual_06_trust_command",
    "label": "Trust Command Bar",
    "description": "Renforcer la confiance avec uniquement des preuves, engagements et contenus réellement administrés.",
    "categoryKey": "06-confiance",
    "categoryTitle": "Confiance, sécurité & preuves",
    "family": "trust",
    "canonicalType": "trust_strip",
    "variant": "v1",
    "keywords": [
      "trust",
      "command",
      "bar"
    ]
  },
  {
    "key": "visual_06_caregiver_verification",
    "label": "Vérification intervenants",
    "description": "Renforcer la confiance avec uniquement des preuves, engagements et contenus réellement administrés.",
    "categoryKey": "06-confiance",
    "categoryTitle": "Confiance, sécurité & preuves",
    "family": "trust",
    "canonicalType": "proof_grid",
    "variant": "v2",
    "keywords": [
      "vérification",
      "intervenants"
    ]
  },
  {
    "key": "visual_06_safety_authority",
    "label": "Safety Authority Wall",
    "description": "Renforcer la confiance avec uniquement des preuves, engagements et contenus réellement administrés.",
    "categoryKey": "06-confiance",
    "categoryTitle": "Confiance, sécurité & preuves",
    "family": "trust",
    "canonicalType": "proof_grid",
    "variant": "v3",
    "keywords": [
      "safety",
      "authority",
      "wall"
    ]
  },
  {
    "key": "visual_06_parent_reviews",
    "label": "Avis parents administrés",
    "description": "Renforcer la confiance avec uniquement des preuves, engagements et contenus réellement administrés.",
    "categoryKey": "06-confiance",
    "categoryTitle": "Confiance, sécurité & preuves",
    "family": "trust",
    "canonicalType": "testimonials",
    "variant": "v4",
    "keywords": [
      "avis",
      "parents",
      "administrés"
    ]
  },
  {
    "key": "visual_06_care_methodology",
    "label": "Méthodologie de garde",
    "description": "Renforcer la confiance avec uniquement des preuves, engagements et contenus réellement administrés.",
    "categoryKey": "06-confiance",
    "categoryTitle": "Confiance, sécurité & preuves",
    "family": "trust",
    "canonicalType": "editorial",
    "variant": "v5",
    "keywords": [
      "méthodologie",
      "garde"
    ]
  },
  {
    "key": "visual_06_expert_profile",
    "label": "Profil confiance intervenant / expert",
    "description": "Renforcer la confiance avec uniquement des preuves, engagements et contenus réellement administrés.",
    "categoryKey": "06-confiance",
    "categoryTitle": "Confiance, sécurité & preuves",
    "family": "trust",
    "canonicalType": "story",
    "variant": "v6",
    "keywords": [
      "profil",
      "confiance",
      "intervenant",
      "expert"
    ]
  },
  {
    "key": "visual_06_success_story",
    "label": "Histoire parent / enfant",
    "description": "Renforcer la confiance avec uniquement des preuves, engagements et contenus réellement administrés.",
    "categoryKey": "06-confiance",
    "categoryTitle": "Confiance, sécurité & preuves",
    "family": "trust",
    "canonicalType": "story",
    "variant": "v7",
    "keywords": [
      "histoire",
      "parent",
      "enfant"
    ]
  },
  {
    "key": "visual_06_service_guarantee",
    "label": "Garantie & support service",
    "description": "Renforcer la confiance avec uniquement des preuves, engagements et contenus réellement administrés.",
    "categoryKey": "06-confiance",
    "categoryTitle": "Confiance, sécurité & preuves",
    "family": "trust",
    "canonicalType": "trust_strip",
    "variant": "v8",
    "keywords": [
      "garantie",
      "support",
      "service"
    ]
  },
  {
    "key": "visual_06_training_confidence",
    "label": "Qualification & formation",
    "description": "Renforcer la confiance avec uniquement des preuves, engagements et contenus réellement administrés.",
    "categoryKey": "06-confiance",
    "categoryTitle": "Confiance, sécurité & preuves",
    "family": "trust",
    "canonicalType": "proof_grid",
    "variant": "v9",
    "keywords": [
      "qualification",
      "formation"
    ]
  },
  {
    "key": "visual_06_mega_trust",
    "label": "Mega Trust Command Center",
    "description": "Renforcer la confiance avec uniquement des preuves, engagements et contenus réellement administrés.",
    "categoryKey": "06-confiance",
    "categoryTitle": "Confiance, sécurité & preuves",
    "family": "trust",
    "canonicalType": "proof_grid",
    "variant": "v10",
    "keywords": [
      "mega",
      "trust",
      "command",
      "center"
    ]
  },
  {
    "key": "visual_07_guide_hero",
    "label": "Hero guide parent",
    "description": "Informer, guider et rassurer avec des contenus éditoriaux AngelCare structurés.",
    "categoryKey": "07-guides",
    "categoryTitle": "Guides & parentalité",
    "family": "editorial",
    "canonicalType": "editorial",
    "variant": "v1",
    "keywords": [
      "hero",
      "guide",
      "parent"
    ]
  },
  {
    "key": "visual_07_guided_choice",
    "label": "Choix guidé du service",
    "description": "Informer, guider et rassurer avec des contenus éditoriaux AngelCare structurés.",
    "categoryKey": "07-guides",
    "categoryTitle": "Guides & parentalité",
    "family": "editorial",
    "canonicalType": "comparison",
    "variant": "v2",
    "keywords": [
      "choix",
      "guidé",
      "service"
    ]
  },
  {
    "key": "visual_07_premium_parenting",
    "label": "Guide parental premium",
    "description": "Informer, guider et rassurer avec des contenus éditoriaux AngelCare structurés.",
    "categoryKey": "07-guides",
    "categoryTitle": "Guides & parentalité",
    "family": "editorial",
    "canonicalType": "editorial",
    "variant": "v3",
    "keywords": [
      "guide",
      "parental",
      "premium"
    ]
  },
  {
    "key": "visual_07_child_development",
    "label": "Développement de l’enfant",
    "description": "Informer, guider et rassurer avec des contenus éditoriaux AngelCare structurés.",
    "categoryKey": "07-guides",
    "categoryTitle": "Guides & parentalité",
    "family": "editorial",
    "canonicalType": "editorial",
    "variant": "v4",
    "keywords": [
      "développement",
      "l’enfant"
    ]
  },
  {
    "key": "visual_07_care_comparison",
    "label": "Comparaison des options de garde",
    "description": "Informer, guider et rassurer avec des contenus éditoriaux AngelCare structurés.",
    "categoryKey": "07-guides",
    "categoryTitle": "Guides & parentalité",
    "family": "editorial",
    "canonicalType": "comparison",
    "variant": "v5",
    "keywords": [
      "comparaison",
      "des",
      "options",
      "garde"
    ]
  },
  {
    "key": "visual_07_activities_gallery",
    "label": "Galerie activités & inspiration",
    "description": "Informer, guider et rassurer avec des contenus éditoriaux AngelCare structurés.",
    "categoryKey": "07-guides",
    "categoryTitle": "Guides & parentalité",
    "family": "editorial",
    "canonicalType": "media_gallery",
    "variant": "v6",
    "keywords": [
      "galerie",
      "activités",
      "inspiration"
    ]
  },
  {
    "key": "visual_07_knowledge_hub",
    "label": "Knowledge Hub parentalité & développement",
    "description": "Informer, guider et rassurer avec des contenus éditoriaux AngelCare structurés.",
    "categoryKey": "07-guides",
    "categoryTitle": "Guides & parentalité",
    "family": "editorial",
    "canonicalType": "editorial",
    "variant": "v7",
    "keywords": [
      "knowledge",
      "hub",
      "parentalité",
      "développement"
    ]
  },
  {
    "key": "visual_07_how_to_journey",
    "label": "Parcours How-To famille",
    "description": "Informer, guider et rassurer avec des contenus éditoriaux AngelCare structurés.",
    "categoryKey": "07-guides",
    "categoryTitle": "Guides & parentalité",
    "family": "editorial",
    "canonicalType": "process",
    "variant": "v8",
    "keywords": [
      "parcours",
      "how-to",
      "famille"
    ]
  },
  {
    "key": "visual_07_faq_expert",
    "label": "FAQ & centre expert",
    "description": "Informer, guider et rassurer avec des contenus éditoriaux AngelCare structurés.",
    "categoryKey": "07-guides",
    "categoryTitle": "Guides & parentalité",
    "family": "editorial",
    "canonicalType": "faq",
    "variant": "v9",
    "keywords": [
      "faq",
      "centre",
      "expert"
    ]
  },
  {
    "key": "visual_07_mega_editorial",
    "label": "Mega Editorial-Care Command Center",
    "description": "Informer, guider et rassurer avec des contenus éditoriaux AngelCare structurés.",
    "categoryKey": "07-guides",
    "categoryTitle": "Guides & parentalité",
    "family": "editorial",
    "canonicalType": "editorial",
    "variant": "v10",
    "keywords": [
      "mega",
      "editorial-care",
      "command",
      "center"
    ]
  },
  {
    "key": "visual_08_preschool_partner",
    "label": "Partenaire crèche & préscolaire",
    "description": "Présenter les partenariats et réseaux uniquement à partir de données et médias validés.",
    "categoryKey": "08-ecosysteme",
    "categoryTitle": "Partenaires & écosystème",
    "family": "ecosystem",
    "canonicalType": "story",
    "variant": "v1",
    "keywords": [
      "partenaire",
      "crèche",
      "préscolaire"
    ]
  },
  {
    "key": "visual_08_maternity_partner",
    "label": "Partenaire maternité & clinique",
    "description": "Présenter les partenariats et réseaux uniquement à partir de données et médias validés.",
    "categoryKey": "08-ecosysteme",
    "categoryTitle": "Partenaires & écosystème",
    "family": "ecosystem",
    "canonicalType": "story",
    "variant": "v2",
    "keywords": [
      "partenaire",
      "maternité",
      "clinique"
    ]
  },
  {
    "key": "visual_08_hotel_travel_partner",
    "label": "Partenaire hôtel & voyage",
    "description": "Présenter les partenariats et réseaux uniquement à partir de données et médias validés.",
    "categoryKey": "08-ecosysteme",
    "categoryTitle": "Partenaires & écosystème",
    "family": "ecosystem",
    "canonicalType": "story",
    "variant": "v3",
    "keywords": [
      "partenaire",
      "hôtel",
      "voyage"
    ]
  },
  {
    "key": "visual_08_corporate_family",
    "label": "Soutien familles en entreprise",
    "description": "Présenter les partenariats et réseaux uniquement à partir de données et médias validés.",
    "categoryKey": "08-ecosysteme",
    "categoryTitle": "Partenaires & écosystème",
    "family": "ecosystem",
    "canonicalType": "story",
    "variant": "v4",
    "keywords": [
      "soutien",
      "familles",
      "entreprise"
    ]
  },
  {
    "key": "visual_08_ngo",
    "label": "Associations & ONG",
    "description": "Présenter les partenariats et réseaux uniquement à partir de données et médias validés.",
    "categoryKey": "08-ecosysteme",
    "categoryTitle": "Partenaires & écosystème",
    "family": "ecosystem",
    "canonicalType": "story",
    "variant": "v5",
    "keywords": [
      "associations",
      "ong"
    ]
  },
  {
    "key": "visual_08_professional_network",
    "label": "Réseau intervenants & professionnels",
    "description": "Présenter les partenariats et réseaux uniquement à partir de données et médias validés.",
    "categoryKey": "08-ecosysteme",
    "categoryTitle": "Partenaires & écosystème",
    "family": "ecosystem",
    "canonicalType": "audience_router",
    "variant": "v6",
    "keywords": [
      "réseau",
      "intervenants",
      "professionnels"
    ]
  },
  {
    "key": "visual_08_academy_trainer",
    "label": "Formateurs & prestataires Academy",
    "description": "Présenter les partenariats et réseaux uniquement à partir de données et médias validés.",
    "categoryKey": "08-ecosysteme",
    "categoryTitle": "Partenaires & écosystème",
    "family": "ecosystem",
    "canonicalType": "partner_logos",
    "variant": "v7",
    "keywords": [
      "formateurs",
      "prestataires",
      "academy"
    ]
  },
  {
    "key": "visual_08_b2b_takeover",
    "label": "B2B Partner Takeover",
    "description": "Présenter les partenariats et réseaux uniquement à partir de données et médias validés.",
    "categoryKey": "08-ecosysteme",
    "categoryTitle": "Partenaires & écosystème",
    "family": "ecosystem",
    "canonicalType": "partner_logos",
    "variant": "v8",
    "keywords": [
      "b2b",
      "partner",
      "takeover"
    ]
  },
  {
    "key": "visual_08_ecosystem_story",
    "label": "Histoire de l’écosystème",
    "description": "Présenter les partenariats et réseaux uniquement à partir de données et médias validés.",
    "categoryKey": "08-ecosysteme",
    "categoryTitle": "Partenaires & écosystème",
    "family": "ecosystem",
    "canonicalType": "story",
    "variant": "v9",
    "keywords": [
      "histoire",
      "l’écosystème"
    ]
  },
  {
    "key": "visual_08_mega_partner",
    "label": "Mega Partner Ecosystem",
    "description": "Présenter les partenariats et réseaux uniquement à partir de données et médias validés.",
    "categoryKey": "08-ecosysteme",
    "categoryTitle": "Partenaires & écosystème",
    "family": "ecosystem",
    "canonicalType": "partner_logos",
    "variant": "v10",
    "keywords": [
      "mega",
      "partner",
      "ecosystem"
    ]
  },
  {
    "key": "visual_09_smart_action",
    "label": "Smart Action Command Center",
    "description": "Transformer l’intérêt en demande claire vers un workflow AngelCare approuvé.",
    "categoryKey": "09-conversion",
    "categoryTitle": "Conversion & demandes",
    "family": "conversion",
    "canonicalType": "cta_band",
    "variant": "v1",
    "keywords": [
      "smart",
      "action",
      "command",
      "center"
    ]
  },
  {
    "key": "visual_09_request_care",
    "label": "Demander une garde / information",
    "description": "Transformer l’intérêt en demande claire vers un workflow AngelCare approuvé.",
    "categoryKey": "09-conversion",
    "categoryTitle": "Conversion & demandes",
    "family": "conversion",
    "canonicalType": "inquiry_form",
    "variant": "v2",
    "keywords": [
      "demander",
      "une",
      "garde",
      "information"
    ]
  },
  {
    "key": "visual_09_qualification_wizard",
    "label": "Qualification du besoin familial",
    "description": "Transformer l’intérêt en demande claire vers un workflow AngelCare approuvé.",
    "categoryKey": "09-conversion",
    "categoryTitle": "Conversion & demandes",
    "family": "conversion",
    "canonicalType": "studio_form",
    "variant": "v3",
    "keywords": [
      "qualification",
      "besoin",
      "familial"
    ]
  },
  {
    "key": "visual_09_availability_request",
    "label": "Demande de disponibilité",
    "description": "Transformer l’intérêt en demande claire vers un workflow AngelCare approuvé.",
    "categoryKey": "09-conversion",
    "categoryTitle": "Conversion & demandes",
    "family": "conversion",
    "canonicalType": "inquiry_form",
    "variant": "v4",
    "keywords": [
      "demande",
      "disponibilité"
    ]
  },
  {
    "key": "visual_09_callback_advisor",
    "label": "Rappel conseiller famille",
    "description": "Transformer l’intérêt en demande claire vers un workflow AngelCare approuvé.",
    "categoryKey": "09-conversion",
    "categoryTitle": "Conversion & demandes",
    "family": "conversion",
    "canonicalType": "contact",
    "variant": "v5",
    "keywords": [
      "rappel",
      "conseiller",
      "famille"
    ]
  },
  {
    "key": "visual_09_b2b_quote",
    "label": "Demande de devis B2B",
    "description": "Transformer l’intérêt en demande claire vers un workflow AngelCare approuvé.",
    "categoryKey": "09-conversion",
    "categoryTitle": "Conversion & demandes",
    "family": "conversion",
    "canonicalType": "inquiry_form",
    "variant": "v6",
    "keywords": [
      "demande",
      "devis",
      "b2b"
    ]
  },
  {
    "key": "visual_09_academy_interest",
    "label": "Intérêt inscription Academy",
    "description": "Transformer l’intérêt en demande claire vers un workflow AngelCare approuvé.",
    "categoryKey": "09-conversion",
    "categoryTitle": "Conversion & demandes",
    "family": "conversion",
    "canonicalType": "inquiry_form",
    "variant": "v7",
    "keywords": [
      "intérêt",
      "inscription",
      "academy"
    ]
  },
  {
    "key": "visual_09_save_continue",
    "label": "Sauvegarder & continuer le parcours",
    "description": "Transformer l’intérêt en demande claire vers un workflow AngelCare approuvé.",
    "categoryKey": "09-conversion",
    "categoryTitle": "Conversion & demandes",
    "family": "conversion",
    "canonicalType": "cta_band",
    "variant": "v8",
    "keywords": [
      "sauvegarder",
      "continuer",
      "parcours"
    ]
  },
  {
    "key": "visual_09_availability_alert",
    "label": "Alerte disponibilité / programme",
    "description": "Transformer l’intérêt en demande claire vers un workflow AngelCare approuvé.",
    "categoryKey": "09-conversion",
    "categoryTitle": "Conversion & demandes",
    "family": "conversion",
    "canonicalType": "studio_form",
    "variant": "v9",
    "keywords": [
      "alerte",
      "disponibilité",
      "programme"
    ]
  },
  {
    "key": "visual_09_mega_conversion",
    "label": "Mega Conversion Command Center",
    "description": "Transformer l’intérêt en demande claire vers un workflow AngelCare approuvé.",
    "categoryKey": "09-conversion",
    "categoryTitle": "Conversion & demandes",
    "family": "conversion",
    "canonicalType": "cta_band",
    "variant": "v10",
    "keywords": [
      "mega",
      "conversion",
      "command",
      "center"
    ]
  },
  {
    "key": "visual_10_marketplace_header",
    "label": "Marketplace Header",
    "description": "Composer des repères de navigation page-locaux sans remplacer automatiquement le shell global.",
    "categoryKey": "10-navigation",
    "categoryTitle": "Navigation & chrome global",
    "family": "navigation",
    "canonicalType": "studio_menu",
    "variant": "v1",
    "keywords": [
      "marketplace",
      "header"
    ]
  },
  {
    "key": "visual_10_mega_services_nav",
    "label": "Mega navigation services",
    "description": "Composer des repères de navigation page-locaux sans remplacer automatiquement le shell global.",
    "categoryKey": "10-navigation",
    "categoryTitle": "Navigation & chrome global",
    "family": "navigation",
    "canonicalType": "studio_menu",
    "variant": "v2",
    "keywords": [
      "mega",
      "navigation",
      "services"
    ]
  },
  {
    "key": "visual_10_search_discovery",
    "label": "Search & Discovery Command",
    "description": "Composer des repères de navigation page-locaux sans remplacer automatiquement le shell global.",
    "categoryKey": "10-navigation",
    "categoryTitle": "Navigation & chrome global",
    "family": "navigation",
    "canonicalType": "category_grid",
    "variant": "v3",
    "keywords": [
      "search",
      "discovery",
      "command"
    ]
  },
  {
    "key": "visual_10_announcement_bar",
    "label": "Announcement & Utility Bar",
    "description": "Composer des repères de navigation page-locaux sans remplacer automatiquement le shell global.",
    "categoryKey": "10-navigation",
    "categoryTitle": "Navigation & chrome global",
    "family": "navigation",
    "canonicalType": "studio_text",
    "variant": "v4",
    "keywords": [
      "announcement",
      "utility",
      "bar"
    ]
  },
  {
    "key": "visual_10_context_rail",
    "label": "Context Navigation Rail",
    "description": "Composer des repères de navigation page-locaux sans remplacer automatiquement le shell global.",
    "categoryKey": "10-navigation",
    "categoryTitle": "Navigation & chrome global",
    "family": "navigation",
    "canonicalType": "studio_menu",
    "variant": "v5",
    "keywords": [
      "context",
      "navigation",
      "rail"
    ]
  },
  {
    "key": "visual_10_quick_access",
    "label": "Quick Access Dock",
    "description": "Composer des repères de navigation page-locaux sans remplacer automatiquement le shell global.",
    "categoryKey": "10-navigation",
    "categoryTitle": "Navigation & chrome global",
    "family": "navigation",
    "canonicalType": "studio_menu",
    "variant": "v6",
    "keywords": [
      "quick",
      "access",
      "dock"
    ]
  },
  {
    "key": "visual_10_continue_journey",
    "label": "Continuer le parcours",
    "description": "Composer des repères de navigation page-locaux sans remplacer automatiquement le shell global.",
    "categoryKey": "10-navigation",
    "categoryTitle": "Navigation & chrome global",
    "family": "navigation",
    "canonicalType": "cta_band",
    "variant": "v7",
    "keywords": [
      "continuer",
      "parcours"
    ]
  },
  {
    "key": "visual_10_mobile_navigation",
    "label": "Mobile Navigation OS",
    "description": "Composer des repères de navigation page-locaux sans remplacer automatiquement le shell global.",
    "categoryKey": "10-navigation",
    "categoryTitle": "Navigation & chrome global",
    "family": "navigation",
    "canonicalType": "studio_menu",
    "variant": "v8",
    "keywords": [
      "mobile",
      "navigation"
    ]
  },
  {
    "key": "visual_10_page_end_continuation",
    "label": "Continuation fin de page",
    "description": "Composer des repères de navigation page-locaux sans remplacer automatiquement le shell global.",
    "categoryKey": "10-navigation",
    "categoryTitle": "Navigation & chrome global",
    "family": "navigation",
    "canonicalType": "cta_band",
    "variant": "v9",
    "keywords": [
      "continuation",
      "fin",
      "page"
    ]
  },
  {
    "key": "visual_10_mega_footer",
    "label": "Mega Footer",
    "description": "Composer des repères de navigation page-locaux sans remplacer automatiquement le shell global.",
    "categoryKey": "10-navigation",
    "categoryTitle": "Navigation & chrome global",
    "family": "navigation",
    "canonicalType": "studio_menu",
    "variant": "v10",
    "keywords": [
      "mega",
      "footer"
    ]
  }
] as const satisfies readonly StudioVisualExperienceDefinition[]

export const ANGELCARE_STUDIO_VISUAL_CATEGORIES = [
  {
    "key": "01-ouvertures",
    "title": "Ouvertures & Heroes",
    "family": "hero",
    "lead": "Présenter immédiatement la promesse AngelCare avec une composition premium et orientée besoin.",
    "order": 1,
    "componentKeys": [
      "visual_01_ecosystem_flagship",
      "visual_01_home_care",
      "visual_01_parents_relax",
      "visual_01_travel_kids_care",
      "visual_01_postpartum",
      "visual_01_montessori_2_6",
      "visual_01_special_needs",
      "visual_01_urgent_care",
      "visual_01_pro_institutions",
      "visual_01_mega_command"
    ]
  },
  {
    "key": "02-decouverte",
    "title": "Services & découverte",
    "family": "discovery",
    "lead": "Aider les familles et organisations à trouver le bon parcours sans inventer disponibilité ni couverture.",
    "order": 2,
    "componentKeys": [
      "visual_02_family_need",
      "visual_02_child_age",
      "visual_02_moment_schedule",
      "visual_02_care_context",
      "visual_02_parent_objective",
      "visual_02_home_school_travel",
      "visual_02_postpartum",
      "visual_02_special_needs",
      "visual_02_institution",
      "visual_02_mega_explorer"
    ]
  },
  {
    "key": "03-offres",
    "title": "Offres & merchandising",
    "family": "commerce",
    "lead": "Mettre en valeur les offres réelles du Marketplace, leurs collections et catégories administrées.",
    "order": 3,
    "componentKeys": [
      "visual_03_home_care_rail",
      "visual_03_parents_relax_packages",
      "visual_03_postpartum_packages",
      "visual_03_travel_packages",
      "visual_03_montessori_packages",
      "visual_03_special_needs_packages",
      "visual_03_academy_programs",
      "visual_03_flashcards_printables",
      "visual_03_institution_packages",
      "visual_03_mega_solutions"
    ]
  },
  {
    "key": "04-campagnes",
    "title": "Campagnes",
    "family": "campaign",
    "lead": "Créer des campagnes éditoriales fortes sans données commerciales fictives.",
    "order": 4,
    "componentKeys": [
      "visual_04_rentree",
      "visual_04_summer_travel",
      "visual_04_parents_relax",
      "visual_04_postpartum",
      "visual_04_academy_enrollment",
      "visual_04_holiday_family",
      "visual_04_emergency_coverage",
      "visual_04_preschool_enrollment",
      "visual_04_b2b_institution",
      "visual_04_mega_seasonal"
    ]
  },
  {
    "key": "05-parcours",
    "title": "Parcours de service",
    "family": "journey",
    "lead": "Expliquer clairement les étapes d’un service ou d’une demande AngelCare.",
    "order": 5,
    "componentKeys": [
      "visual_05_home_care",
      "visual_05_urgent",
      "visual_05_postpartum",
      "visual_05_parents_relax",
      "visual_05_travel",
      "visual_05_montessori",
      "visual_05_special_needs",
      "visual_05_school_accompaniment",
      "visual_05_institutional",
      "visual_05_mega_care_command"
    ]
  },
  {
    "key": "06-confiance",
    "title": "Confiance, sécurité & preuves",
    "family": "trust",
    "lead": "Renforcer la confiance avec uniquement des preuves, engagements et contenus réellement administrés.",
    "order": 6,
    "componentKeys": [
      "visual_06_trust_command",
      "visual_06_caregiver_verification",
      "visual_06_safety_authority",
      "visual_06_parent_reviews",
      "visual_06_care_methodology",
      "visual_06_expert_profile",
      "visual_06_success_story",
      "visual_06_service_guarantee",
      "visual_06_training_confidence",
      "visual_06_mega_trust"
    ]
  },
  {
    "key": "07-guides",
    "title": "Guides & parentalité",
    "family": "editorial",
    "lead": "Informer, guider et rassurer avec des contenus éditoriaux AngelCare structurés.",
    "order": 7,
    "componentKeys": [
      "visual_07_guide_hero",
      "visual_07_guided_choice",
      "visual_07_premium_parenting",
      "visual_07_child_development",
      "visual_07_care_comparison",
      "visual_07_activities_gallery",
      "visual_07_knowledge_hub",
      "visual_07_how_to_journey",
      "visual_07_faq_expert",
      "visual_07_mega_editorial"
    ]
  },
  {
    "key": "08-ecosysteme",
    "title": "Partenaires & écosystème",
    "family": "ecosystem",
    "lead": "Présenter les partenariats et réseaux uniquement à partir de données et médias validés.",
    "order": 8,
    "componentKeys": [
      "visual_08_preschool_partner",
      "visual_08_maternity_partner",
      "visual_08_hotel_travel_partner",
      "visual_08_corporate_family",
      "visual_08_ngo",
      "visual_08_professional_network",
      "visual_08_academy_trainer",
      "visual_08_b2b_takeover",
      "visual_08_ecosystem_story",
      "visual_08_mega_partner"
    ]
  },
  {
    "key": "09-conversion",
    "title": "Conversion & demandes",
    "family": "conversion",
    "lead": "Transformer l’intérêt en demande claire vers un workflow AngelCare approuvé.",
    "order": 9,
    "componentKeys": [
      "visual_09_smart_action",
      "visual_09_request_care",
      "visual_09_qualification_wizard",
      "visual_09_availability_request",
      "visual_09_callback_advisor",
      "visual_09_b2b_quote",
      "visual_09_academy_interest",
      "visual_09_save_continue",
      "visual_09_availability_alert",
      "visual_09_mega_conversion"
    ]
  },
  {
    "key": "10-navigation",
    "title": "Navigation & chrome global",
    "family": "navigation",
    "lead": "Composer des repères de navigation page-locaux sans remplacer automatiquement le shell global.",
    "order": 10,
    "componentKeys": [
      "visual_10_marketplace_header",
      "visual_10_mega_services_nav",
      "visual_10_search_discovery",
      "visual_10_announcement_bar",
      "visual_10_context_rail",
      "visual_10_quick_access",
      "visual_10_continue_journey",
      "visual_10_mobile_navigation",
      "visual_10_page_end_continuation",
      "visual_10_mega_footer"
    ]
  }
] as const satisfies readonly StudioVisualCategory[]

export type StudioVisualExperienceKey = (typeof ANGELCARE_STUDIO_VISUAL_EXPERIENCES)[number]['key']

const aliasMap = new Map<string, StudioVisualExperienceDefinition>(ANGELCARE_STUDIO_VISUAL_EXPERIENCES.map((row) => [row.key, row]))
const categoryMap = new Map<string, StudioVisualCategory>(ANGELCARE_STUDIO_VISUAL_CATEGORIES.map((row) => [row.key, row]))

export const ANGELCARE_STUDIO_VISUAL_EXPERIENCE_COUNT = ANGELCARE_STUDIO_VISUAL_EXPERIENCES.length
export const ANGELCARE_STUDIO_VISUAL_CATEGORY_COUNT = ANGELCARE_STUDIO_VISUAL_CATEGORIES.length

export function studioVisualExperience(value: unknown): StudioVisualExperienceDefinition | null {
  return typeof value === 'string' ? aliasMap.get(value) || null : null
}

export function studioVisualCategory(value: unknown): StudioVisualCategory | null {
  return typeof value === 'string' ? categoryMap.get(value) || null : null
}

export function canonicalStudioBlockType(value: unknown): string {
  const alias = studioVisualExperience(value)
  return alias?.canonicalType || String(value || '')
}

export function isStudioVisualExperience(value: unknown): value is StudioVisualExperienceKey {
  return typeof value === 'string' && aliasMap.has(value)
}

export function visualAliasFromMetadata(settings: unknown, content: unknown): StudioVisualExperienceKey | null {
  const s = settings && typeof settings === 'object' && !Array.isArray(settings) ? settings as Record<string, unknown> : {}
  const c = content && typeof content === 'object' && !Array.isArray(content) ? content as Record<string, unknown> : {}
  const value = s.studioVisualAlias || c.__studioVisualAlias
  return isStudioVisualExperience(value) ? value : null
}

const SAFE_DEFAULT_LEADS: Record<StudioVisualFamily, string> = {
  hero: 'Des services AngelCare pensés pour accompagner les familles avec clarté, attention et continuité.',
  discovery: 'Explorez les services AngelCare selon votre besoin, votre contexte et le parcours recherché.',
  commerce: 'Découvrez les offres et sélections réellement publiées dans le Marketplace AngelCare.',
  campaign: 'Une sélection AngelCare pensée pour ce moment de vie et les besoins qui l’accompagnent.',
  journey: 'Comprenez le parcours, les étapes et les points de contact avant de faire votre demande.',
  trust: 'Des repères clairs pour comprendre les engagements, méthodes et preuves publiées par AngelCare.',
  editorial: 'Des contenus utiles pour mieux comprendre les besoins des enfants et les solutions disponibles.',
  ecosystem: 'AngelCare relie familles, professionnels et organisations autour de parcours de qualité.',
  conversion: 'Exprimez votre besoin et poursuivez vers le workflow AngelCare adapté.',
  navigation: 'Accédez rapidement aux univers, services et contenus disponibles dans AngelCare.',
}

export function studioVisualDefaultProps(definition: StudioVisualExperienceDefinition): StudioBlockProps {
  return {
    id: '',
    eyebrow: definition.categoryTitle.toUpperCase(),
    title: definition.label,
    lead: SAFE_DEFAULT_LEADS[definition.family],
    body: '',
    items: [],
    primaryCtaLabel: '',
    primaryCtaHref: '',
    secondaryCtaLabel: '',
    secondaryCtaHref: '',
    mediaAssetKey: '',
    mediaUrl: '',
    mediaAlt: '',
    sourceDesign: {},
    responsive: { mobileVisible: true, tabletVisible: true, desktopVisible: true },
    hidden: false,
    locked: false,
    __studioVisualAlias: definition.key,
    __studioVisualCategory: definition.categoryKey,
    __studioVisualVariant: definition.variant,
  } as StudioBlockProps
}

export function visualSearchText(definition: StudioVisualExperienceDefinition) {
  return [definition.label, definition.description, definition.categoryTitle, definition.family, ...definition.keywords].join(' ').toLocaleLowerCase('fr')
}

export function validateStudioVisualCatalogue() {
  const errors: string[] = []
  if (ANGELCARE_STUDIO_VISUAL_CATEGORIES.length !== 10) errors.push('Le catalogue doit contenir exactement 10 catégories visuelles.')
  if (ANGELCARE_STUDIO_VISUAL_EXPERIENCES.length !== 100) errors.push('Le catalogue doit contenir exactement 100 expériences visuelles.')
  const keys = new Set<string>()
  for (const row of ANGELCARE_STUDIO_VISUAL_EXPERIENCES) {
    if (keys.has(row.key)) errors.push(`Alias dupliqué: ${row.key}`)
    keys.add(row.key)
    if (!categoryMap.has(row.categoryKey)) errors.push(`Catégorie inconnue: ${row.categoryKey}`)
  }
  for (const category of ANGELCARE_STUDIO_VISUAL_CATEGORIES) {
    if (category.componentKeys.length !== 10) errors.push(`${category.key}: ${category.componentKeys.length} expériences au lieu de 10.`)
  }
  return errors
}
