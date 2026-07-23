'use client'

import { useEffect, useMemo, useState, type ElementType } from 'react'
import {
  ArrowRight, Boxes, Building2, CalendarClock, CircleDollarSign, Gauge, GitBranch, Layers3,
  Link2, Loader2, MapPin, Package, RadioTower, Route, Save, ShieldCheck, Sparkles,
  Target, TrendingUp, UserRoundCog, UsersRound,
} from 'lucide-react'
import type { RevenueTwinEditableEntity, RevenueTwinMutationInput } from '@/lib/revenue-command-os/types'
import {
  DrawerActionFooter, DrawerBadge, DrawerCloseButton, DrawerExecutiveBrief, DrawerMetric,
  DrawerPrimaryAction, DrawerSecondaryAction, DrawerSection, SovereignDrawerOverlay,
  SovereignDrawerPanel, drawerStyles, type DrawerTone,
} from '../../_components/drawer-sovereignty/DrawerPrimitives'
import { useDigitalTwin } from './DigitalTwinContext'

type Field = { key: string; label: string; type?: 'text' | 'textarea' | 'number' | 'list' | 'select'; required?: boolean; options?: string[]; placeholder?: string }

const fields: Record<RevenueTwinEditableEntity, Field[]> = {
  'business-unit': [
    { key: 'code', label: 'Code', required: true, placeholder: 'BU-...' }, { key: 'name', label: 'Nom commercial', required: true }, { key: 'tagline', label: 'Promesse / tagline' },
    { key: 'purpose', label: 'Rôle dans le modèle revenus', type: 'textarea', required: true }, { key: 'revenue_model', label: 'Modèle de revenus', type: 'textarea', required: true },
    { key: 'delivery_model', label: 'Modèle de livraison', type: 'textarea', required: true }, { key: 'owner_role', label: 'Rôle propriétaire', required: true },
    { key: 'commercial_priority', label: 'Priorité commerciale', type: 'number' }, { key: 'territories', label: 'Codes territoires', type: 'list' }, { key: 'dependencies', label: 'Dépendances', type: 'list' },
    { key: 'status', label: 'Statut', type: 'select', options: ['draft', 'needs-validation', 'validated', 'active', 'inactive'] },
  ],
  offer: [
    { key: 'code', label: 'Code offre', required: true }, { key: 'business_unit_code', label: 'Business unit', required: true }, { key: 'family', label: 'Famille' },
    { key: 'name', label: 'Nom interne', required: true }, { key: 'commercial_name', label: 'Nom commercial', required: true }, { key: 'customer_problem', label: 'Problème client', type: 'textarea', required: true },
    { key: 'value_proposition', label: 'Proposition de valeur', type: 'textarea', required: true }, { key: 'delivery_formats', label: 'Formats de livraison', type: 'list' },
    { key: 'target_segment_codes', label: 'Segments cibles', type: 'list' }, { key: 'decision_maker_codes', label: 'Décideurs', type: 'list' }, { key: 'territory_codes', label: 'Territoires', type: 'list' },
    { key: 'required_capacity_codes', label: 'Capacités requises', type: 'list' }, { key: 'pricing_model', label: 'Modèle tarifaire' }, { key: 'sales_cycle_days', label: 'Cycle de vente (jours)', type: 'number' },
    { key: 'status', label: 'Statut', type: 'select', options: ['draft', 'needs-validation', 'validated', 'active', 'inactive'] }, { key: 'availability', label: 'Disponibilité', type: 'select', options: ['available', 'conditional', 'unavailable', 'planned'] },
  ],
  bundle: [
    { key: 'code', label: 'Code bundle', required: true }, { key: 'name', label: 'Nom', required: true },
    { key: 'commercial_promise', label: 'Promesse commerciale', type: 'textarea', required: true },
    { key: 'segment_codes', label: 'Segments cibles', type: 'list' }, { key: 'offer_codes', label: 'Offres composantes', type: 'list' },
    { key: 'bundle_type', label: 'Rôle bundle', type: 'select', options: ['entry', 'growth', 'premium', 'retention', 'seasonal'] },
    { key: 'pricing_logic', label: 'Logique tarifaire', type: 'textarea' }, { key: 'protected_margin_pct', label: 'Marge protégée %', type: 'number' },
    { key: 'status', label: 'Statut', type: 'select', options: ['draft', 'needs-validation', 'validated', 'active', 'inactive'] },
  ],
  'offer-relationship': [
    { key: 'code', label: 'Code relation', required: true }, { key: 'source_offer_code', label: 'Offre source', required: true },
    { key: 'target_offer_code', label: 'Offre cible', required: true }, { key: 'relationship_type', label: 'Type', required: true, type: 'select', options: ['prerequisite', 'complement', 'entry', 'premium', 'retention', 'cross-sell', 'upsell'] },
    { key: 'rationale', label: 'Justification', type: 'textarea' }, { key: 'eligibility_rules', label: 'Règles d’éligibilité', type: 'list' },
    { key: 'timing', label: 'Timing recommandé' }, { key: 'priority_score', label: 'Priorité', type: 'number' },
  ],
  segment: [
    { key: 'code', label: 'Code segment', required: true }, { key: 'name', label: 'Nom', required: true }, { key: 'category', label: 'Catégorie' }, { key: 'profile', label: 'Profil', type: 'textarea', required: true },
    { key: 'pain_points', label: 'Douleurs', type: 'list' }, { key: 'buying_triggers', label: 'Déclencheurs d’achat', type: 'list' }, { key: 'trust_requirements', label: 'Exigences de confiance', type: 'list' },
    { key: 'likely_objections', label: 'Objections probables', type: 'list' }, { key: 'preferred_channels', label: 'Canaux préférés', type: 'list' }, { key: 'best_fit_offer_codes', label: 'Offres adaptées', type: 'list' },
    { key: 'commercial_priority', label: 'Priorité', type: 'number' }, { key: 'status', label: 'Statut', type: 'select', options: ['draft', 'needs-validation', 'validated', 'active', 'inactive'] },
  ],
  'decision-maker': [
    { key: 'code', label: 'Code', required: true }, { key: 'role_name', label: 'Rôle décideur', required: true }, { key: 'organization_types', label: 'Types d’organisation', type: 'list' },
    { key: 'authority_level', label: 'Autorité', type: 'select', options: ['influencer', 'recommender', 'co-decider', 'final-decider', 'gatekeeper'] }, { key: 'primary_concerns', label: 'Préoccupations', type: 'list' },
    { key: 'motivations', label: 'Motivations', type: 'list' }, { key: 'required_evidence', label: 'Preuves attendues', type: 'list' }, { key: 'objections', label: 'Objections', type: 'list' },
    { key: 'preferred_style', label: 'Style recommandé', type: 'textarea' }, { key: 'relevant_offer_codes', label: 'Offres pertinentes', type: 'list' }, { key: 'contact_strategy', label: 'Stratégie de contact', type: 'textarea' },
    { key: 'status', label: 'Statut', type: 'select', options: ['draft', 'needs-validation', 'validated', 'active', 'inactive'] },
  ],
  market: [
    { key: 'code', label: 'Code marché', required: true }, { key: 'country', label: 'Pays', required: true }, { key: 'region', label: 'Région' }, { key: 'city', label: 'Ville', required: true }, { key: 'zones', label: 'Zones', type: 'list' },
    { key: 'market_maturity', label: 'Maturité', type: 'select', options: ['emerging', 'developing', 'established', 'strategic'] }, { key: 'priority', label: 'Priorité', type: 'number' },
    { key: 'active_business_unit_codes', label: 'Business units actives', type: 'list' }, { key: 'immediately_deliverable_offer_codes', label: 'Offres livrables', type: 'list' },
    { key: 'conditional_offer_codes', label: 'Offres conditionnelles', type: 'list' }, { key: 'delivery_constraints', label: 'Contraintes', type: 'list' },
    { key: 'status', label: 'Statut', type: 'select', options: ['draft', 'needs-validation', 'validated', 'active', 'inactive'] },
  ],
  capacity: [
    { key: 'code', label: 'Code capacité', required: true }, { key: 'name', label: 'Nom', required: true }, { key: 'capacity_type', label: 'Type', type: 'select', options: ['trainer', 'caregiver', 'commercial', 'operations', 'inventory', 'transport', 'digital', 'venue'] },
    { key: 'unit', label: 'Unité' }, { key: 'available_quantity', label: 'Disponible', type: 'number' }, { key: 'reserved_quantity', label: 'Réservé', type: 'number' }, { key: 'maximum_quantity', label: 'Maximum', type: 'number' },
    { key: 'territory_codes', label: 'Territoires', type: 'list' }, { key: 'offer_codes', label: 'Offres supportées', type: 'list' }, { key: 'lead_time_days', label: 'Lead time (jours)', type: 'number' }, { key: 'constraints', label: 'Contraintes', type: 'list' },
    { key: 'availability', label: 'Disponibilité', type: 'select', options: ['available', 'conditional', 'unavailable', 'planned'] },
  ],
  channel: [{ key: 'code', label: 'Code', required: true }, { key: 'name', label: 'Nom', required: true }, { key: 'channel_type', label: 'Type', required: true }, { key: 'best_for_stages', label: 'Étapes adaptées', type: 'list' }, { key: 'best_for_segments', label: 'Segments adaptés', type: 'list' }, { key: 'governance', label: 'Gouvernance', type: 'textarea' }, { key: 'measurement', label: 'Mesures', type: 'list' }, { key: 'status', label: 'Statut', type: 'select', options: ['draft', 'needs-validation', 'validated', 'active', 'inactive'] }],
  journey: [{ key: 'code', label: 'Code', required: true }, { key: 'name', label: 'Nom', required: true }, { key: 'objective', label: 'Objectif', type: 'textarea' }, { key: 'business_unit_codes', label: 'Business units', type: 'list' }, { key: 'segment_codes', label: 'Segments', type: 'list' }, { key: 'offer_codes', label: 'Offres', type: 'list' }, { key: 'status', label: 'Statut', type: 'select', options: ['draft', 'needs-validation', 'validated', 'active', 'inactive'] }],
  'price-rule': [{ key: 'code', label: 'Code', required: true }, { key: 'offer_code', label: 'Offre', required: true }, { key: 'price_book', label: 'Price book' }, { key: 'pricing_model', label: 'Modèle' }, { key: 'public_price', label: 'Prix public', type: 'number' }, { key: 'partner_price', label: 'Prix partenaire', type: 'number' }, { key: 'internal_cost', label: 'Coût interne', type: 'number' }, { key: 'minimum_protected_price', label: 'Prix minimum protégé', type: 'number' }, { key: 'target_margin_pct', label: 'Marge cible %', type: 'number' }, { key: 'max_discount_pct', label: 'Remise max %', type: 'number' }, { key: 'approval_role', label: 'Autorité', required: true }, { key: 'effective_from', label: 'Date effet' }, { key: 'status', label: 'Statut', type: 'select', options: ['draft', 'needs-validation', 'validated', 'active', 'inactive'] }],
  'seasonal-window': [{ key: 'code', label: 'Code', required: true }, { key: 'name', label: 'Nom', required: true }, { key: 'start_month_day', label: 'Début MM-JJ' }, { key: 'end_month_day', label: 'Fin MM-JJ' }, { key: 'segment_codes', label: 'Segments', type: 'list' }, { key: 'offer_codes', label: 'Offres', type: 'list' }, { key: 'opportunity', label: 'Opportunité', type: 'textarea' }, { key: 'urgency', label: 'Urgence', type: 'select', options: ['low', 'medium', 'high', 'critical'] }, { key: 'preparation_lead_days', label: 'Préparation jours', type: 'number' }, { key: 'risk_of_delay', label: 'Risque du retard', type: 'textarea' }, { key: 'recommended_actions', label: 'Actions recommandées', type: 'list' }, { key: 'status', label: 'Statut', type: 'select', options: ['draft', 'needs-validation', 'validated', 'active', 'inactive'] }],
  'growth-path': [{ key: 'code', label: 'Code', required: true }, { key: 'path_type', label: 'Type', type: 'select', options: ['cross-sell', 'upsell', 'renewal', 'referral'] }, { key: 'source_offer_code', label: 'Offre source', required: true }, { key: 'destination_offer_code', label: 'Offre destination', required: true }, { key: 'trigger_signals', label: 'Signaux', type: 'list' }, { key: 'eligibility_rules', label: 'Éligibilité', type: 'list' }, { key: 'recommended_timing', label: 'Timing' }, { key: 'rationale', label: 'Rationale', type: 'textarea' }, { key: 'priority_score', label: 'Priorité', type: 'number' }, { key: 'status', label: 'Statut', type: 'select', options: ['draft', 'needs-validation', 'validated', 'active', 'inactive'] }],
  dependency: [{ key: 'code', label: 'Code', required: true }, { key: 'source_type', label: 'Type source' }, { key: 'source_code', label: 'Code source', required: true }, { key: 'dependency_type', label: 'Type dépendance', required: true }, { key: 'target_type', label: 'Type cible' }, { key: 'target_code', label: 'Code cible', required: true }, { key: 'rule', label: 'Règle', type: 'textarea' }, { key: 'failure_effect', label: 'Effet en cas d’échec', type: 'textarea' }, { key: 'recovery_action', label: 'Action de récupération', type: 'textarea' }],
}


type BlueprintSection = { id: string; eyebrow: string; title: string; description: string; fields: string[] }
type DrawerBlueprint = {
  id: string
  noun: string
  concept: string
  purpose: string
  authority: string
  tone: DrawerTone
  icon: ElementType
  identityKeys: string[]
  sections: BlueprintSection[]
  primaryAction: string
}

const blueprints: Record<RevenueTwinEditableEntity, DrawerBlueprint> = {
  'business-unit': {
    id: 'MZ23-DRAWER-04-BUSINESS-UNIT', noun: 'unité commerciale', concept: 'Commercial Entity Command Card', tone: 'blue', icon: Building2,
    purpose: 'Définir le mandat, le modèle de revenus, la capacité de livraison et le périmètre de responsabilité de l’unité.',
    authority: 'Architecture commerciale · mutation auditée', identityKeys: ['code', 'name', 'tagline'], primaryAction: 'Enregistrer l’unité',
    sections: [
      { id: 'identity', eyebrow: 'Identité', title: 'Signature de l’unité', description: 'Le nom, le code et la promesse qui identifient cette entité dans le world model.', fields: ['code', 'name', 'tagline'] },
      { id: 'mandate', eyebrow: 'Mandat', title: 'Rôle économique et livraison', description: 'Le système doit comprendre comment l’unité crée du revenu et tient sa promesse.', fields: ['purpose', 'revenue_model', 'delivery_model'] },
      { id: 'governance', eyebrow: 'Gouvernance', title: 'Autorité et priorité', description: 'Responsabilité, priorité commerciale et état de validation.', fields: ['owner_role', 'commercial_priority', 'status'] },
      { id: 'reach', eyebrow: 'Périmètre', title: 'Territoires et dépendances', description: 'Zones couvertes et prérequis qui conditionnent l’exécution.', fields: ['territories', 'dependencies'] },
    ],
  },
  offer: {
    id: 'MZ23-DRAWER-05-OFFER', noun: 'offre', concept: 'Offer Portfolio Dossier', tone: 'cyan', icon: Package,
    purpose: 'Structurer une offre exploitable par la stratégie, la vente, la capacité et la gouvernance tarifaire.',
    authority: 'Portfolio commercial · aucune donnée inventée', identityKeys: ['code', 'commercial_name', 'business_unit_code'], primaryAction: 'Enregistrer l’offre',
    sections: [
      { id: 'identity', eyebrow: 'Portfolio', title: 'Identité et posture de l’offre', description: 'Ancrage dans la business unit, famille, disponibilité et statut.', fields: ['code', 'business_unit_code', 'family', 'name', 'commercial_name', 'status', 'availability'] },
      { id: 'value', eyebrow: 'Valeur', title: 'Problème client et proposition', description: 'La raison précise pour laquelle le marché doit considérer cette offre.', fields: ['customer_problem', 'value_proposition'] },
      { id: 'delivery', eyebrow: 'Faisabilité', title: 'Formats, capacité et cycle', description: 'Conditions de livraison et durée commerciale réellement supportables.', fields: ['delivery_formats', 'required_capacity_codes', 'sales_cycle_days'] },
      { id: 'market', eyebrow: 'Ciblage', title: 'Segments, décideurs et territoires', description: 'Les publics et zones pour lesquels l’offre est conçue.', fields: ['target_segment_codes', 'decision_maker_codes', 'territory_codes'] },
      { id: 'pricing', eyebrow: 'Monétisation', title: 'Architecture tarifaire', description: 'Modèle tarifaire de référence avant application des règles de prix.', fields: ['pricing_model'] },
    ],
  },
  bundle: {
    id: 'MZ23-DRAWER-06-BUNDLE', noun: 'bundle', concept: 'Commercial Packaging Studio', tone: 'violet', icon: Boxes,
    purpose: 'Composer une combinaison d’offres cohérente, lisible, rentable et gouvernée.',
    authority: 'Packaging commercial · marge protégée', identityKeys: ['code', 'name', 'bundle_type'], primaryAction: 'Enregistrer le bundle',
    sections: [
      { id: 'identity', eyebrow: 'Packaging', title: 'Identité du bundle', description: 'Positionnement, rôle commercial et statut de cette combinaison.', fields: ['code', 'name', 'bundle_type', 'status'] },
      { id: 'promise', eyebrow: 'Promesse', title: 'Valeur commerciale consolidée', description: 'Le bénéfice que l’ensemble doit apporter au client.', fields: ['commercial_promise'] },
      { id: 'composition', eyebrow: 'Composition', title: 'Segments et offres composantes', description: 'Les éléments autorisés dans le package et les clients visés.', fields: ['segment_codes', 'offer_codes'] },
      { id: 'economics', eyebrow: 'Économie', title: 'Prix et marge protégée', description: 'Règles économiques qui empêchent un assemblage destructeur de valeur.', fields: ['pricing_logic', 'protected_margin_pct'] },
    ],
  },
  'offer-relationship': {
    id: 'MZ23-DRAWER-07-OFFER-RELATIONSHIP', noun: 'relation d’offres', concept: 'Relationship Logic Matrix', tone: 'violet', icon: GitBranch,
    purpose: 'Formaliser les relations de prérequis, complément, cross-sell ou montée en gamme entre deux offres.',
    authority: 'Doctrine relationnelle · compatibilité contrôlée', identityKeys: ['code', 'relationship_type', 'source_offer_code'], primaryAction: 'Enregistrer la relation',
    sections: [
      { id: 'link', eyebrow: 'Relation', title: 'Source, destination et type', description: 'Le lien commercial exact que le moteur pourra utiliser.', fields: ['code', 'source_offer_code', 'target_offer_code', 'relationship_type'] },
      { id: 'rationale', eyebrow: 'Justification', title: 'Logique de la relation', description: 'Pourquoi ce lien existe et dans quel contexte il est pertinent.', fields: ['rationale', 'timing'] },
      { id: 'rules', eyebrow: 'Éligibilité', title: 'Gates et priorité', description: 'Conditions obligatoires avant de recommander la relation.', fields: ['eligibility_rules', 'priority_score'] },
    ],
  },
  segment: {
    id: 'MZ23-DRAWER-08-SEGMENT', noun: 'segment client', concept: 'Segment Intelligence Dossier', tone: 'cyan', icon: UsersRound,
    purpose: 'Décrire la logique d’achat, les exigences de confiance et l’adéquation commerciale d’un segment.',
    authority: 'Market intelligence · ciblage explicable', identityKeys: ['code', 'name', 'category'], primaryAction: 'Enregistrer le segment',
    sections: [
      { id: 'identity', eyebrow: 'Profil', title: 'Identité et réalité du segment', description: 'Définition claire du public et de son contexte.', fields: ['code', 'name', 'category', 'profile'] },
      { id: 'drivers', eyebrow: 'Comportement', title: 'Douleurs et déclencheurs', description: 'Ce qui crée le besoin et provoque une décision.', fields: ['pain_points', 'buying_triggers'] },
      { id: 'trust', eyebrow: 'Confiance', title: 'Preuves, objections et canaux', description: 'Les conditions qui rendent l’approche crédible et acceptable.', fields: ['trust_requirements', 'likely_objections', 'preferred_channels'] },
      { id: 'fit', eyebrow: 'Adéquation', title: 'Offres et priorité commerciale', description: 'Les offres les plus pertinentes et le niveau d’attention à consacrer.', fields: ['best_fit_offer_codes', 'commercial_priority', 'status'] },
    ],
  },
  'decision-maker': {
    id: 'MZ23-DRAWER-09-DECISION-MAKER', noun: 'profil décideur', concept: 'Commercial Influence Profile', tone: 'violet', icon: UserRoundCog,
    purpose: 'Cartographier l’autorité, les motivations, les preuves attendues et la stratégie de contact appropriée.',
    authority: 'Stakeholder intelligence · influence gouvernée', identityKeys: ['code', 'role_name', 'authority_level'], primaryAction: 'Enregistrer le décideur',
    sections: [
      { id: 'authority', eyebrow: 'Autorité', title: 'Rôle et pouvoir de décision', description: 'Position réelle dans le processus d’achat.', fields: ['code', 'role_name', 'organization_types', 'authority_level', 'status'] },
      { id: 'mindset', eyebrow: 'Lecture', title: 'Préoccupations et motivations', description: 'Ce qui peut accélérer, ralentir ou bloquer la décision.', fields: ['primary_concerns', 'motivations', 'objections'] },
      { id: 'proof', eyebrow: 'Confiance', title: 'Preuves et offres pertinentes', description: 'Les éléments nécessaires pour obtenir une décision crédible.', fields: ['required_evidence', 'relevant_offer_codes'] },
      { id: 'approach', eyebrow: 'Approche', title: 'Style et stratégie de contact', description: 'Cadre relationnel recommandé, sans automatisation externe implicite.', fields: ['preferred_style', 'contact_strategy'] },
    ],
  },
  market: {
    id: 'MZ23-DRAWER-10-MARKET', noun: 'marché ou territoire', concept: 'Territory Intelligence Brief', tone: 'blue', icon: MapPin,
    purpose: 'Définir un territoire, sa maturité, ses offres livrables et les contraintes qui encadrent la promesse.',
    authority: 'Territory intelligence · faisabilité visible', identityKeys: ['code', 'city', 'country'], primaryAction: 'Enregistrer le territoire',
    sections: [
      { id: 'identity', eyebrow: 'Territoire', title: 'Identité géographique', description: 'Pays, région, ville et zones opérationnelles.', fields: ['code', 'country', 'region', 'city', 'zones'] },
      { id: 'maturity', eyebrow: 'Priorité', title: 'Maturité et posture stratégique', description: 'Importance commerciale et état de validation du territoire.', fields: ['market_maturity', 'priority', 'status'] },
      { id: 'coverage', eyebrow: 'Couverture', title: 'Business units et offres livrables', description: 'Ce qui peut être activé immédiatement ou sous condition.', fields: ['active_business_unit_codes', 'immediately_deliverable_offer_codes', 'conditional_offer_codes'] },
      { id: 'constraints', eyebrow: 'Contraintes', title: 'Limites de livraison', description: 'Les facteurs qui empêchent une promesse ferme.', fields: ['delivery_constraints'] },
    ],
  },
  capacity: {
    id: 'MZ23-DRAWER-12-CAPACITY', noun: 'capacité de livraison', concept: 'Constraint Pressure Dossier', tone: 'emerald', icon: Gauge,
    purpose: 'Rendre visible la capacité disponible, réservée, maximale et les contraintes de livraison associées.',
    authority: 'Feasibility intelligence · promesse protégée', identityKeys: ['code', 'name', 'capacity_type'], primaryAction: 'Enregistrer la capacité',
    sections: [
      { id: 'identity', eyebrow: 'Capacité', title: 'Identité opérationnelle', description: 'Nature, unité de mesure et posture de disponibilité.', fields: ['code', 'name', 'capacity_type', 'unit', 'availability'] },
      { id: 'volume', eyebrow: 'Volume', title: 'Disponible, réservé et maximum', description: 'La quantité réellement mobilisable par le système.', fields: ['available_quantity', 'reserved_quantity', 'maximum_quantity', 'lead_time_days'] },
      { id: 'reach', eyebrow: 'Couverture', title: 'Territoires et offres supportées', description: 'Où et pour quoi cette capacité peut être engagée.', fields: ['territory_codes', 'offer_codes'] },
      { id: 'constraints', eyebrow: 'Pression', title: 'Contraintes et limites', description: 'Les conditions qui rendent la capacité conditionnelle ou indisponible.', fields: ['constraints'] },
    ],
  },
  channel: {
    id: 'MZ23-DRAWER-13-CHANNEL', noun: 'canal commercial', concept: 'Route-to-Market Control Card', tone: 'cyan', icon: RadioTower,
    purpose: 'Définir le rôle du canal, les étapes où il est pertinent, ses segments et sa gouvernance de mesure.',
    authority: 'Route-to-market · usage encadré', identityKeys: ['code', 'name', 'channel_type'], primaryAction: 'Enregistrer le canal',
    sections: [
      { id: 'identity', eyebrow: 'Canal', title: 'Identité et type', description: 'Le rôle du canal dans l’architecture commerciale.', fields: ['code', 'name', 'channel_type', 'status'] },
      { id: 'fit', eyebrow: 'Adéquation', title: 'Étapes et segments adaptés', description: 'Quand et auprès de qui ce canal doit être privilégié.', fields: ['best_for_stages', 'best_for_segments'] },
      { id: 'governance', eyebrow: 'Gouvernance', title: 'Règles d’usage et mesure', description: 'Cadre de contrôle et indicateurs attendus.', fields: ['governance', 'measurement'] },
    ],
  },
  journey: {
    id: 'MZ23-DRAWER-14-JOURNEY', noun: 'parcours commercial', concept: 'Commercial Journey Blueprint', tone: 'blue', icon: Route,
    purpose: 'Structurer le parcours qui relie l’objectif, les segments, les offres et les unités commerciales.',
    authority: 'Journey architecture · séquence gouvernée', identityKeys: ['code', 'name', 'status'], primaryAction: 'Enregistrer le parcours',
    sections: [
      { id: 'identity', eyebrow: 'Parcours', title: 'Identité et objectif', description: 'La finalité opérationnelle de la séquence commerciale.', fields: ['code', 'name', 'objective', 'status'] },
      { id: 'scope', eyebrow: 'Périmètre', title: 'Unités, segments et offres', description: 'Les objets du world model concernés par le parcours.', fields: ['business_unit_codes', 'segment_codes', 'offer_codes'] },
    ],
  },
  'price-rule': {
    id: 'MZ23-DRAWER-11-PRICE-RULE', noun: 'règle de prix', concept: 'Commercial Pricing Governance Card', tone: 'emerald', icon: CircleDollarSign,
    purpose: 'Protéger le prix, la marge, la remise maximale et l’autorité requise pour toute décision tarifaire.',
    authority: 'Pricing governance · seuils protégés', identityKeys: ['code', 'offer_code', 'price_book'], primaryAction: 'Enregistrer la règle',
    sections: [
      { id: 'identity', eyebrow: 'Référentiel', title: 'Identité et périmètre tarifaire', description: 'Offre, price book, modèle et état de la règle.', fields: ['code', 'offer_code', 'price_book', 'pricing_model', 'status'] },
      { id: 'prices', eyebrow: 'Architecture', title: 'Prix publics, partenaires et coûts', description: 'Les valeurs de référence qui structurent l’économie de l’offre.', fields: ['public_price', 'partner_price', 'internal_cost'] },
      { id: 'protection', eyebrow: 'Protection', title: 'Plancher, marge et remise', description: 'Les limites qui ne peuvent pas être improvisées.', fields: ['minimum_protected_price', 'target_margin_pct', 'max_discount_pct'] },
      { id: 'authority', eyebrow: 'Autorité', title: 'Approbation et date d’effet', description: 'Qui peut engager la décision et à partir de quand.', fields: ['approval_role', 'effective_from'] },
    ],
  },
  'seasonal-window': {
    id: 'MZ23-DRAWER-15-SEASONAL-WINDOW', noun: 'fenêtre saisonnière', concept: 'Seasonal Opportunity Window', tone: 'amber', icon: CalendarClock,
    purpose: 'Définir la période d’opportunité, le coût du retard et les actions de préparation nécessaires.',
    authority: 'Timing intelligence · coût de l’inaction visible', identityKeys: ['code', 'name', 'urgency'], primaryAction: 'Enregistrer la fenêtre',
    sections: [
      { id: 'timing', eyebrow: 'Fenêtre', title: 'Identité, dates et urgence', description: 'La période exacte où l’action commerciale conserve sa valeur.', fields: ['code', 'name', 'start_month_day', 'end_month_day', 'urgency', 'status'] },
      { id: 'opportunity', eyebrow: 'Opportunité', title: 'Valeur et risque du retard', description: 'Ce qui devient possible et ce qui est perdu en cas d’inaction.', fields: ['opportunity', 'risk_of_delay', 'preparation_lead_days'] },
      { id: 'reach', eyebrow: 'Ciblage', title: 'Segments et offres concernés', description: 'Les objets du portefeuille touchés par cette fenêtre.', fields: ['segment_codes', 'offer_codes'] },
      { id: 'actions', eyebrow: 'Préparation', title: 'Actions recommandées', description: 'Les gestes nécessaires avant l’ouverture de la période.', fields: ['recommended_actions'] },
    ],
  },
  'growth-path': {
    id: 'MZ23-DRAWER-16-GROWTH-PATH', noun: 'chemin de croissance', concept: 'Strategic Expansion Path', tone: 'violet', icon: TrendingUp,
    purpose: 'Formaliser la progression entre deux offres avec ses signaux, règles d’éligibilité et timing recommandé.',
    authority: 'Lifetime value · expansion explicable', identityKeys: ['code', 'path_type', 'source_offer_code'], primaryAction: 'Enregistrer le chemin',
    sections: [
      { id: 'trajectory', eyebrow: 'Trajectoire', title: 'Type, source et destination', description: 'Le mouvement commercial autorisé dans le portefeuille.', fields: ['code', 'path_type', 'source_offer_code', 'destination_offer_code', 'status'] },
      { id: 'eligibility', eyebrow: 'Déclenchement', title: 'Signaux et éligibilité', description: 'Les conditions qui rendent le chemin pertinent.', fields: ['trigger_signals', 'eligibility_rules'] },
      { id: 'timing', eyebrow: 'Décision', title: 'Timing, justification et priorité', description: 'Pourquoi agir, quand agir et avec quel niveau d’attention.', fields: ['recommended_timing', 'rationale', 'priority_score'] },
    ],
  },
  dependency: {
    id: 'MZ23-DRAWER-17-DEPENDENCY', noun: 'dépendance critique', concept: 'Critical Dependency Ledger', tone: 'rose', icon: Link2,
    purpose: 'Rendre explicite le lien bloquant ou habilitant, son effet d’échec et l’action de récupération.',
    authority: 'Revenue gates · sécurité de faisabilité', identityKeys: ['code', 'source_code', 'target_code'], primaryAction: 'Enregistrer la dépendance',
    sections: [
      { id: 'link', eyebrow: 'Ledger', title: 'Source, cible et type de dépendance', description: 'Le lien qui conditionne la faisabilité de l’objet commercial.', fields: ['code', 'source_type', 'source_code', 'dependency_type', 'target_type', 'target_code'] },
      { id: 'rule', eyebrow: 'Gate', title: 'Règle et effet d’échec', description: 'La condition à respecter et la conséquence en cas de rupture.', fields: ['rule', 'failure_effect'] },
      { id: 'recovery', eyebrow: 'Récupération', title: 'Action de restauration', description: 'Le chemin contrôlé pour rétablir la faisabilité.', fields: ['recovery_action'] },
    ],
  },
}


function toInitial(entity: RevenueTwinEditableEntity, item?: Record<string, unknown>) {
  const next: Record<string, string> = {}
  for (const field of fields[entity]) {
    const value = item?.[field.key]
    next[field.key] = Array.isArray(value) ? value.join(', ') : value == null ? '' : String(value)
  }
  if (!next.status && fields[entity].some((field) => field.key === 'status')) next.status = 'needs-validation'
  return next
}

function displayOption(value: string) {
  return value.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function entityIdentity(blueprint: DrawerBlueprint, form: Record<string, string>) {
  const values = blueprint.identityKeys.map((key) => form[key]?.trim()).filter(Boolean)
  return values.length ? values.join(' · ') : 'Nouvel objet — identité à compléter'
}

function completion(definition: Field[], form: Record<string, string>) {
  const required = definition.filter((field) => field.required)
  if (!required.length) return 100
  return Math.round((required.filter((field) => form[field.key]?.trim()).length / required.length) * 100)
}

function EntitySignature({ entity }: { entity: RevenueTwinEditableEntity }) {
  const core = 'border-white/15 bg-white/10 text-white'
  const node = 'absolute grid h-10 w-10 place-items-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-lg backdrop-blur'
  if (entity === 'business-unit') return <div className="relative h-36"><span className={`${node} left-[42%] top-10 h-14 w-14`}><Building2 size={22}/></span><span className={`${node} left-4 top-4`}><CircleDollarSign size={16}/></span><span className={`${node} right-4 top-4`}><Target size={16}/></span><span className={`${node} bottom-2 left-10`}><MapPin size={16}/></span><span className={`${node} bottom-2 right-10`}><ShieldCheck size={16}/></span><span className="absolute left-[23%] right-[23%] top-[48%] h-px bg-white/20"/></div>
  if (entity === 'offer') return <div className="relative h-36"><span className={`absolute left-1/2 top-5 grid h-20 w-20 -translate-x-1/2 place-items-center rounded-[28px] border ${core}`}><Package size={28}/></span><span className="absolute bottom-5 left-7 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[9px] font-black text-white">PROBLÈME</span><span className="absolute bottom-5 right-7 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[9px] font-black text-white">VALEUR</span><ArrowRight className="absolute bottom-7 left-1/2 -translate-x-1/2 text-white/60" size={18}/></div>
  if (entity === 'bundle') return <div className="relative flex h-36 items-center justify-center gap-3"><span className={`grid h-16 w-16 place-items-center rounded-[24px] border ${core}`}><Package size={22}/></span><span className={`grid h-20 w-20 place-items-center rounded-[28px] border ${core}`}><Boxes size={28}/></span><span className={`grid h-16 w-16 place-items-center rounded-[24px] border ${core}`}><Package size={22}/></span></div>
  if (entity === 'offer-relationship') return <div className="relative h-36"><span className={`${node} left-5 top-12`}><Package size={17}/></span><span className={`${node} right-5 top-12`}><Package size={17}/></span><div className="absolute left-16 right-16 top-[47%] h-1 rounded-full bg-white/15"><div className="h-full w-2/3 rounded-full bg-white/65"/></div><GitBranch className="absolute left-1/2 top-[42%] -translate-x-1/2 text-white" size={23}/></div>
  if (entity === 'segment') return <div className="relative h-36"><span className={`absolute left-1/2 top-7 grid h-20 w-20 -translate-x-1/2 place-items-center rounded-full border ${core}`}><UsersRound size={28}/></span>{['BESOIN','CONFIANCE','CANAL'].map((label,index)=><span key={label} className="absolute bottom-3 rounded-xl border border-white/15 bg-white/10 px-2.5 py-2 text-[8px] font-black text-white" style={{left:`${8+index*32}%`}}>{label}</span>)}</div>
  if (entity === 'decision-maker') return <div className="relative h-36"><span className={`absolute left-1/2 top-5 grid h-20 w-20 -translate-x-1/2 place-items-center rounded-[30px] border ${core}`}><UserRoundCog size={30}/></span><span className="absolute bottom-5 left-4 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[8px] font-black text-white">AUTORITÉ</span><span className="absolute bottom-5 right-4 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[8px] font-black text-white">PREUVE</span></div>
  if (entity === 'market') return <div className="relative h-36"><div className="absolute inset-x-7 top-4 h-24 rounded-[50%] border border-white/20"/><MapPin className="absolute left-1/2 top-10 -translate-x-1/2 text-white" size={30}/><span className="absolute bottom-3 left-7 h-2 w-2 rounded-full bg-white"/><span className="absolute bottom-8 right-10 h-2 w-2 rounded-full bg-white/70"/><span className="absolute left-12 top-8 h-2 w-2 rounded-full bg-white/50"/></div>
  if (entity === 'capacity') return <div className="relative h-36"><span className={`absolute left-1/2 top-4 grid h-20 w-20 -translate-x-1/2 place-items-center rounded-full border ${core}`}><Gauge size={31}/></span><div className="absolute inset-x-8 bottom-5 grid grid-cols-3 gap-2">{['DISPO','RÉSERVÉ','MAX'].map((label,index)=><div key={label} className="rounded-xl border border-white/15 bg-white/10 p-2 text-center"><p className="text-sm font-black text-white">{index+1}</p><p className="text-[7px] font-black text-white/70">{label}</p></div>)}</div></div>
  if (entity === 'channel') return <div className="relative h-36"><RadioTower className="absolute left-1/2 top-8 -translate-x-1/2 text-white" size={34}/>{[52,82,112].map((size)=><span key={size} className="absolute left-1/2 top-[47%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15" style={{width:size,height:size}}/>)}<span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-black text-white/75">ROUTE-TO-MARKET</span></div>
  if (entity === 'journey') return <div className="relative h-36"><div className="absolute left-5 right-5 top-1/2 h-px bg-white/20"/>{[12,39,66,88].map((left,index)=><span key={left} className="absolute top-[38%] grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-white/10 text-[9px] font-black text-white" style={{left:`${left}%`}}>{index+1}</span>)}<Route className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white" size={19}/></div>
  if (entity === 'price-rule') return <div className="relative h-36"><span className={`absolute left-1/2 top-4 grid h-20 w-20 -translate-x-1/2 place-items-center rounded-full border ${core}`}><CircleDollarSign size={32}/></span><div className="absolute inset-x-5 bottom-3 flex items-end justify-center gap-2">{[32,52,76,44].map((height,index)=><span key={height} className="w-7 rounded-t-lg bg-white/20" style={{height}}><span className="block h-1/2 rounded-t-lg bg-white/55"/></span>)}</div></div>
  if (entity === 'seasonal-window') return <div className="relative h-36"><span className={`absolute left-1/2 top-4 grid h-20 w-20 -translate-x-1/2 place-items-center rounded-[28px] border ${core}`}><CalendarClock size={30}/></span><div className="absolute inset-x-6 bottom-4 h-2 rounded-full bg-white/15"><div className="ml-[18%] h-full w-[48%] rounded-full bg-white/65"/></div><span className="absolute bottom-0 left-6 text-[7px] font-black text-white/60">OUVERTURE</span><span className="absolute bottom-0 right-6 text-[7px] font-black text-white/60">CLÔTURE</span></div>
  if (entity === 'growth-path') return <div className="relative h-36"><span className={`${node} bottom-5 left-5`}><Package size={16}/></span><span className={`${node} right-5 top-5 h-14 w-14`}><Target size={20}/></span><TrendingUp className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white" size={44}/><span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-black text-white/70">EXPANSION PATH</span></div>
  return <div className="relative h-36"><span className={`${node} left-5 top-10`}><Layers3 size={17}/></span><span className={`${node} right-5 top-10`}><ShieldCheck size={17}/></span><Link2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white" size={36}/><span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-black text-white/70">CRITICAL GATE</span></div>
}

function FieldControl({ field, value, onChange }: { field: Field; value: string; onChange: (value: string) => void }) {
  const common = `w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 ${drawerStyles.fieldFocus}`
  if (field.type === 'textarea') return <textarea rows={4} value={value} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} className={`${common} min-h-[112px] resize-y leading-6`} />
  if (field.type === 'select') return <select value={value || field.options?.[0] || ''} onChange={(event) => onChange(event.target.value)} className={common}>{field.options?.map((option) => <option key={option} value={option}>{displayOption(option)}</option>)}</select>
  return <input type={field.type === 'number' ? 'number' : 'text'} value={value} placeholder={field.placeholder || (field.type === 'list' ? 'Valeurs séparées par des virgules' : '')} onChange={(event) => onChange(event.target.value)} className={common} />
}

export default function DigitalTwinEntityDrawer({ entity, item, onClose }: { entity: RevenueTwinEditableEntity | null; item?: Record<string, unknown>; onClose: () => void }) {
  const { mutate, busy } = useDigitalTwin()
  const definition = entity ? fields[entity] : []
  const blueprint = entity ? blueprints[entity] : null
  const [form, setForm] = useState<Record<string, string>>({})
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => { if (entity) { setForm(toInitial(entity, item)); setLocalError(null) } }, [entity, item])
  const mode = item ? 'Modification gouvernée' : 'Création gouvernée'
  const completionScore = useMemo(() => completion(definition, form), [definition, form])
  if (!entity || !blueprint) return null
  const activeEntity: RevenueTwinEditableEntity = entity
  const activeBlueprint = blueprint
  const ActiveIcon = activeBlueprint.icon

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLocalError(null)
    const missing = definition.find((field) => field.required && !form[field.key]?.trim())
    if (missing) { setLocalError(`${missing.label} est requis pour enregistrer ${activeBlueprint.noun}.`); return }
    const payload: Record<string, unknown> = {}
    for (const field of definition) {
      const raw = form[field.key]?.trim() || ''
      if (!raw) continue
      payload[field.key] = field.type === 'list' ? raw.split(',').map((part) => part.trim()).filter(Boolean) : field.type === 'number' ? Number(raw) : raw
    }
    try {
      const input: RevenueTwinMutationInput = { entity: activeEntity, operation: item ? 'update' : 'create', id: item?.id ? String(item.id) : undefined, payload }
      await mutate(input)
      onClose()
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Enregistrement impossible.')
    }
  }

  return <SovereignDrawerOverlay onClose={onClose} label={`${mode} — ${activeBlueprint.noun}`}>
    <SovereignDrawerPanel width="max-w-[940px]" dataId={activeBlueprint.id}>
      <form onSubmit={submit} className="flex h-full min-h-0 flex-col">
        <header className="relative overflow-hidden bg-[linear-gradient(135deg,#07111f_0%,#0f2550_55%,#14213d_100%)] px-5 py-6 text-white sm:px-7 sm:py-7">
          <div className={`absolute inset-0 opacity-45 ${drawerStyles.fineGrid}`} />
          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_300px] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2"><DrawerBadge inverted>ANGELCARE · REVENUE COMMAND OS</DrawerBadge><DrawerBadge inverted>{mode}</DrawerBadge></div>
              <div className="mt-5 flex items-start gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[22px] border border-white/15 bg-white/10 text-white shadow-xl"><ActiveIcon size={24} /></span>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[.2em] text-cyan-200">{activeBlueprint.concept}</p>
                  <h2 className="mt-2 text-3xl font-black tracking-[-.045em] text-white sm:text-4xl">{item ? `Modifier ${activeBlueprint.noun}` : `Créer ${activeBlueprint.noun}`}</h2>
                  <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-200">{activeBlueprint.purpose}</p>
                </div>
              </div>
              <div className="mt-5"><DrawerExecutiveBrief dark tone={activeBlueprint.tone}>{entityIdentity(blueprint, form)}</DrawerExecutiveBrief></div>
              <div className="mt-4 flex flex-wrap items-center gap-2"><DrawerBadge inverted>{activeBlueprint.authority}</DrawerBadge><DrawerBadge inverted>{completionScore}% requis complétés</DrawerBadge></div>
            </div>
            <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[.06] p-4 backdrop-blur-xl"><EntitySignature entity={entity} /></div>
          </div>
          <div className="absolute right-5 top-5"><DrawerCloseButton onClose={onClose} inverted /></div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/75 px-5 py-6 sm:px-7 sm:py-7">
          <div className="grid gap-3 sm:grid-cols-3">
            <DrawerMetric label="Mode" value={item ? 'Modification' : 'Création'} note="Mutation via le service existant" icon={Sparkles} tone={activeBlueprint.tone} />
            <DrawerMetric label="Champs obligatoires" value={`${definition.filter((field) => field.required).length}`} note="Contrôlés avant enregistrement" icon={ShieldCheck} tone={activeBlueprint.tone} />
            <DrawerMetric label="Complétude requise" value={`${completionScore}%`} note={completionScore === 100 ? 'Prêt à soumettre' : 'Informations à compléter'} icon={Target} tone={completionScore === 100 ? 'emerald' : 'amber'} />
          </div>

          <div className="mt-6 space-y-5">
            {activeBlueprint.sections.map((section, sectionIndex) => {
              const sectionFields = section.fields.map((key) => definition.find((field) => field.key === key)).filter((field): field is Field => Boolean(field))
              if (!sectionFields.length) return null
              return <DrawerSection key={section.id} eyebrow={`${String(sectionIndex + 1).padStart(2, '0')} · ${section.eyebrow}`} title={section.title} icon={sectionIndex === 0 ? ActiveIcon : sectionIndex === activeBlueprint.sections.length - 1 ? ShieldCheck : Layers3} tone={activeBlueprint.tone}>
                <p className="mb-5 text-xs font-semibold leading-5 text-slate-600">{section.description}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {sectionFields.map((field) => <label key={field.key} className={field.type === 'textarea' || field.type === 'list' ? 'sm:col-span-2' : ''}>
                    <span className="mb-2 flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[.12em] text-slate-700"><span>{field.label}</span>{field.required ? <span className="rounded-full bg-rose-50 px-2 py-1 text-[8px] text-rose-700">Requis</span> : <span className="text-[8px] text-slate-400">Optionnel</span>}</span>
                    <FieldControl field={field} value={form[field.key] || ''} onChange={(value) => setForm((current) => ({ ...current, [field.key]: value }))} />
                    {field.type === 'list' ? <span className="mt-2 block text-[10px] font-semibold text-slate-500">Séparez chaque valeur par une virgule.</span> : null}
                  </label>)}
                </div>
              </DrawerSection>
            })}
          </div>

          {localError ? <div role="alert" className="mt-5 rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-black text-rose-800">{localError}</div> : null}
        </div>

        <DrawerActionFooter note="L’enregistrement utilise exclusivement la mutation Digital Twin existante. Aucun effet commercial externe n’est activé.">
          <DrawerSecondaryAction onClick={onClose}>Annuler</DrawerSecondaryAction>
          <DrawerPrimaryAction type="submit" disabled={busy} tone={activeBlueprint.tone}>{busy ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}{busy ? 'Enregistrement…' : activeBlueprint.primaryAction}<ArrowRight size={15} /></DrawerPrimaryAction>
        </DrawerActionFooter>
      </form>
    </SovereignDrawerPanel>
  </SovereignDrawerOverlay>
}
