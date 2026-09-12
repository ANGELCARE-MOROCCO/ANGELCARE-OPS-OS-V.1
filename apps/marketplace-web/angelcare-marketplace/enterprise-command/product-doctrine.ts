import type { ProductDoctrineDefinition, ProductDoctrineKey } from './types'

const baseColumns = [
  'item_key', 'slug', 'name_fr', 'short_description_fr', 'description_fr', 'price_mode', 'price_amount',
  'currency_label', 'availability_status', 'category_keys', 'territory_codes', 'status',
]

const field = (
  key: string,
  label: string,
  required: boolean,
  group: ProductDoctrineDefinition['fields'][number]['group'],
  type: ProductDoctrineDefinition['fields'][number]['type'] = 'text',
  options?: string[],
  description?: string,
): ProductDoctrineDefinition['fields'][number] => ({ key, label, required, group, type, options, description })

const doctrine = (
  key: ProductDoctrineKey,
  label: string,
  description: string,
  catalogKind: ProductDoctrineDefinition['catalogKind'],
  defaultPriceMode: ProductDoctrineDefinition['defaultPriceMode'],
  fields: ProductDoctrineDefinition['fields'],
  extraRequired: string[] = [],
  extraOptional: string[] = [],
): ProductDoctrineDefinition => ({
  key, label, description, catalogKind, defaultPriceMode,
  defaultAvailability: 'configuration_required',
  fields,
  requiredColumns: [...baseColumns.filter((column) => ['item_key', 'slug', 'name_fr'].includes(column)), ...extraRequired],
  optionalColumns: [...baseColumns.filter((column) => !['item_key', 'slug', 'name_fr'].includes(column)), ...extraOptional],
})

export const PRODUCT_DOCTRINES: Record<ProductDoctrineKey, ProductDoctrineDefinition> = {
  physical_product: doctrine('physical_product', 'Produit physique', 'SKU, stock, logistique, sécurité, merchandising et livraison.', 'product', 'fixed', [
    field('sku', 'SKU', true, 'identity'), field('inventory_mode', 'Mode inventaire', true, 'operations', 'enum', ['stocked', 'on_demand', 'external_supplier']),
    field('weight_kg', 'Poids kg', false, 'fulfillment', 'number'), field('dimensions', 'Dimensions', false, 'fulfillment'),
    field('safety_notes', 'Sécurité / précautions', false, 'trust'), field('delivery_mode', 'Livraison', true, 'fulfillment', 'enum', ['delivery', 'pickup', 'digital_none']),
  ], ['sku', 'inventory_mode', 'delivery_mode'], ['weight_kg', 'dimensions', 'safety_notes']),
  kit: doctrine('kit', 'Kit & matériel', 'Composition, stock, usages, sécurité et livraison.', 'kit', 'fixed', [
    field('sku', 'SKU', true, 'identity'), field('kit_contents', 'Contenu du kit', true, 'operations', 'json'), field('age_range', 'Âge', false, 'commercial'),
    field('safety_notes', 'Sécurité', false, 'trust'), field('delivery_mode', 'Livraison', true, 'fulfillment', 'enum', ['delivery', 'pickup']),
  ], ['sku', 'kit_contents', 'delivery_mode'], ['age_range', 'safety_notes']),
  one_time_service: doctrine('one_time_service', 'Service ponctuel', 'Durée, zone, créneau, capacité, provider et conditions d’exécution.', 'service', 'starting_from', [
    field('duration_minutes', 'Durée minutes', true, 'commercial', 'number'), field('booking_lead_hours', 'Préavis réservation (h)', true, 'availability', 'number'),
    field('provider_capability', 'Capability provider', true, 'operations'), field('service_area', 'Zone de service', true, 'availability'),
    field('cancellation_policy', 'Politique annulation', true, 'trust'), field('customer_preparation', 'Préparation client', false, 'fulfillment'),
  ], ['duration_minutes', 'booking_lead_hours', 'provider_capability', 'service_area'], ['cancellation_policy', 'customer_preparation']),
  recurring_service: doctrine('recurring_service', 'Service récurrent', 'Fréquence, engagement, renouvellement et capacité récurrente.', 'service', 'subscription', [
    field('frequency', 'Fréquence', true, 'commercial', 'enum', ['weekly', 'biweekly', 'monthly', 'custom']), field('minimum_cycles', 'Cycles minimum', false, 'commercial', 'number'),
    field('provider_capability', 'Capability provider', true, 'operations'), field('service_area', 'Zone de service', true, 'availability'),
    field('renewal_mode', 'Renouvellement', true, 'commercial', 'enum', ['automatic', 'manual']), field('cancellation_policy', 'Politique annulation', true, 'trust'),
  ], ['frequency', 'provider_capability', 'service_area', 'renewal_mode'], ['minimum_cycles', 'cancellation_policy']),
  family_service: doctrine('family_service', 'Service famille', 'Contexte enfant/famille, âge, durée, planning et sécurité.', 'service', 'starting_from', [
    field('age_range', 'Tranche d’âge', true, 'commercial'), field('duration_minutes', 'Durée minutes', true, 'commercial', 'number'),
    field('max_children', 'Nombre max enfants', false, 'operations', 'number'), field('provider_capability', 'Capability provider', true, 'operations'),
    field('safety_protocol', 'Protocole sécurité', true, 'trust'), field('service_area', 'Zone de service', true, 'availability'),
  ], ['age_range', 'duration_minutes', 'provider_capability', 'safety_protocol'], ['max_children', 'service_area']),
  development_activity: doctrine('development_activity', 'Activité développement', 'Objectif, âge, protocole, matériel et mesure de progression.', 'service', 'fixed', [
    field('age_range', 'Âge', true, 'commercial'), field('development_goal', 'Objectif développement', true, 'commercial'), field('protocol', 'Protocole', true, 'operations'),
    field('duration_minutes', 'Durée', true, 'commercial', 'number'), field('materials', 'Matériel', false, 'operations', 'json'), field('progress_measure', 'Mesure progression', false, 'trust'),
  ], ['age_range', 'development_goal', 'protocol', 'duration_minutes'], ['materials', 'progress_measure']),
  montessori_programme: doctrine('montessori_programme', 'Programme Montessori', 'Âge, objectifs, séquence, matériel, durée et accompagnement.', 'training', 'fixed', [
    field('age_range', 'Âge', true, 'commercial'), field('learning_objectives', 'Objectifs', true, 'commercial', 'json'), field('session_count', 'Sessions', true, 'commercial', 'number'),
    field('materials', 'Matériel', true, 'operations', 'json'), field('facilitator_profile', 'Profil facilitateur', false, 'operations'), field('assessment_method', 'Évaluation', false, 'trust'),
  ], ['age_range', 'learning_objectives', 'session_count', 'materials']),
  academy_programme: doctrine('academy_programme', 'Programme Academy', 'Programme, format, cohorte, formateur, certification et enrollment.', 'training', 'fixed', [
    field('audience', 'Audience', true, 'commercial'), field('format', 'Format', true, 'commercial', 'enum', ['onsite', 'online', 'hybrid']), field('duration_hours', 'Durée h', true, 'commercial', 'number'),
    field('certificate', 'Certification', false, 'trust', 'boolean'), field('trainer_profile', 'Profil formateur', false, 'operations'), field('capacity', 'Capacité', false, 'availability', 'number'),
  ], ['audience', 'format', 'duration_hours']),
  course: doctrine('course', 'Cours', 'Cours individuel ou catalogue Academy.', 'training', 'fixed', [
    field('audience', 'Audience', true, 'commercial'), field('format', 'Format', true, 'commercial'), field('duration_hours', 'Durée h', true, 'commercial', 'number'),
    field('learning_outcomes', 'Résultats attendus', true, 'commercial', 'json'), field('certificate', 'Certificat', false, 'trust', 'boolean'),
  ], ['audience', 'format', 'duration_hours', 'learning_outcomes']),
  cohort: doctrine('cohort', 'Cohorte', 'Cohorte datée, capacité, enrollment et formateur.', 'training', 'fixed', [
    field('starts_at', 'Début', true, 'availability', 'date'), field('ends_at', 'Fin', true, 'availability', 'date'), field('capacity', 'Capacité', true, 'availability', 'number'),
    field('trainer_profile', 'Formateur', false, 'operations'), field('format', 'Format', true, 'commercial'),
  ], ['starts_at', 'ends_at', 'capacity', 'format']),
  b2b_solution: doctrine('b2b_solution', 'Solution B2B', 'Scope, pricing sur devis, sites, volume, déploiement et livrables.', 'service', 'quote_only', [
    field('buyer_type', 'Type acheteur', true, 'commercial'), field('scope', 'Scope', true, 'commercial'), field('deliverables', 'Livrables', true, 'operations', 'json'),
    field('deployment_model', 'Déploiement', true, 'fulfillment'), field('minimum_volume', 'Volume minimum', false, 'commercial', 'number'),
  ], ['buyer_type', 'scope', 'deliverables', 'deployment_model']),
  establishment_programme: doctrine('establishment_programme', 'Programme établissement', 'Crèche/école, site, population, services, cadence et reporting.', 'service', 'quote_only', [
    field('establishment_type', 'Type établissement', true, 'commercial'), field('site_scope', 'Scope site', true, 'operations'), field('service_modules', 'Modules', true, 'operations', 'json'),
    field('reporting_cadence', 'Reporting', false, 'fulfillment'), field('implementation_lead_days', 'Délai déploiement jours', false, 'availability', 'number'),
  ], ['establishment_type', 'site_scope', 'service_modules']),
  hospitality_programme: doctrine('hospitality_programme', 'Programme Hospitality', 'Hôtel, chambre/site, disponibilité, staffing et expérience famille.', 'service', 'quote_only', [
    field('property_type', 'Type établissement', true, 'commercial'), field('service_windows', 'Fenêtres de service', true, 'availability', 'json'),
    field('staffing_model', 'Staffing', true, 'operations'), field('guest_experience', 'Expérience client', true, 'commercial'), field('service_area', 'Zone', true, 'availability'),
  ], ['property_type', 'service_windows', 'staffing_model', 'guest_experience']),
  health_adjacent_programme: doctrine('health_adjacent_programme', 'Programme Health Partner', 'Service non médical, referral, sécurité et coordination.', 'service', 'quote_only', [
    field('partner_type', 'Type partenaire', true, 'commercial'), field('referral_flow', 'Parcours referral', true, 'operations'), field('non_medical_scope', 'Périmètre non médical', true, 'trust'),
    field('safety_protocol', 'Sécurité', true, 'trust'), field('service_area', 'Zone', true, 'availability'),
  ], ['partner_type', 'referral_flow', 'non_medical_scope', 'safety_protocol']),
  corporate_benefit: doctrine('corporate_benefit', 'Corporate Benefit', 'Eligibilité collaborateurs, budget, catalogue, usage et reporting entreprise.', 'service', 'subscription', [
    field('eligibility_model', 'Eligibilité', true, 'commercial'), field('benefit_budget', 'Budget avantage', false, 'commercial', 'number'), field('catalog_scope', 'Catalogue', true, 'commercial'),
    field('usage_rules', 'Règles usage', true, 'operations', 'json'), field('reporting_model', 'Reporting', false, 'fulfillment'),
  ], ['eligibility_model', 'catalog_scope', 'usage_rules']),
  partner_os_plan: doctrine('partner_os_plan', 'Partner OS Plan', 'Plan partenaire, fonctionnalités, activation et abonnement.', 'saas_module', 'subscription', [
    field('plan_key', 'Plan key', true, 'identity'), field('feature_bundle', 'Fonctionnalités', true, 'commercial', 'json'), field('billing_period', 'Période', true, 'commercial'),
    field('activation_flow', 'Activation', true, 'fulfillment'), field('support_tier', 'Support', false, 'commercial'),
  ], ['plan_key', 'feature_bundle', 'billing_period', 'activation_flow']),
  saas_add_on: doctrine('saas_add_on', 'SaaS Add-on', 'Add-on logiciel, compatibilité, activation et billing.', 'saas_module', 'subscription', [
    field('module_key', 'Module key', true, 'identity'), field('compatible_plans', 'Plans compatibles', true, 'commercial', 'json'), field('activation_flow', 'Activation', true, 'fulfillment'),
    field('billing_period', 'Période', true, 'commercial'),
  ], ['module_key', 'compatible_plans', 'activation_flow']),
  quality_assessment: doctrine('quality_assessment', 'Quality Check 360', 'Audit terrain, site, grille, evidence et rapport.', 'audit', 'fixed', [
    field('assessment_scope', 'Périmètre', true, 'commercial'), field('site_type', 'Type site', true, 'commercial'), field('evidence_requirements', 'Preuves', true, 'trust', 'json'),
    field('report_template', 'Template rapport', true, 'fulfillment'), field('duration_hours', 'Durée h', false, 'commercial', 'number'),
  ], ['assessment_scope', 'site_type', 'evidence_requirements', 'report_template']),
  audit: doctrine('audit', 'Audit', 'Audit professionnel, evidence, scoring et rapport.', 'audit', 'quote_only', [
    field('audit_scope', 'Scope audit', true, 'commercial'), field('evidence_requirements', 'Preuves', true, 'trust', 'json'), field('scoring_model', 'Scoring', true, 'trust'),
    field('report_template', 'Rapport', true, 'fulfillment'), field('site_required', 'Visite site', false, 'operations', 'boolean'),
  ], ['audit_scope', 'evidence_requirements', 'scoring_model', 'report_template']),
  bundle: doctrine('bundle', 'Bundle', 'Composition de produits/services, prix bundle et règles.', 'kit', 'fixed', [
    field('bundle_items', 'Éléments', true, 'commercial', 'json'), field('bundle_rule', 'Règle', true, 'commercial'), field('fulfillment_strategy', 'Fulfillment', true, 'fulfillment'),
  ], ['bundle_items', 'bundle_rule', 'fulfillment_strategy']),

  digital_product: doctrine('digital_product', 'Produit digital', 'Ressource numérique, licence, formats, preview et délivrance digitale.', 'product', 'fixed', [
    field('resource_type', 'Type de ressource', true, 'commercial'),
    field('file_formats', 'Formats de fichier', true, 'operations', 'json'),
    field('license_type', 'Type de licence', true, 'commercial'),
    field('digital_preview_reference', 'Référence preview digital', true, 'trust'),
  ], ['resource_type', 'file_formats', 'license_type', 'digital_preview_reference']),
  admission_programme: doctrine('admission_programme', 'Programme admission', 'Admission établissement avec campus, année, intake, niveau, capacité, frais et documents requis.', 'training', 'quote_only', [
    field('establishment_code', 'Code établissement', true, 'identity'),
    field('campus_code', 'Code campus', true, 'identity'),
    field('academic_year', 'Année académique', true, 'commercial'),
    field('intake_period', 'Période d’admission', true, 'commercial'),
    field('class_level', 'Niveau / classe', true, 'commercial'),
    field('age_min', 'Âge minimum', true, 'commercial', 'number'),
    field('age_max', 'Âge maximum', true, 'commercial', 'number'),
    field('capacity', 'Capacité', true, 'availability', 'number'),
    field('tuition_display', 'Affichage frais', true, 'commercial'),
    field('required_documents', 'Documents requis', true, 'operations', 'json'),
  ], ['establishment_code','campus_code','academic_year','intake_period','class_level','age_min','age_max','capacity','tuition_display','required_documents']),
  certification_pathway: doctrine('certification_pathway', 'Parcours certifiant', 'Parcours de certification avec cours composants, séquence, évaluation, retake et assiduité.', 'training', 'fixed', [
    field('component_course_keys', 'Cours composants', true, 'operations', 'json'),
    field('required_sequence', 'Séquence requise', true, 'operations', 'json'),
    field('assessment_requirements', 'Exigences d’évaluation', true, 'trust', 'json'),
    field('retake_policy', 'Politique de rattrapage', true, 'trust'),
    field('attendance_threshold', 'Seuil d’assiduité', true, 'trust', 'number'),
  ], ['component_course_keys','required_sequence','assessment_requirements','retake_policy','attendance_threshold']),
  quote_only_solution: doctrine('quote_only_solution', 'Solution sur devis', 'Solution configurée et qualifiée avant prix final.', 'service', 'quote_only', [
    field('qualification_questions', 'Questions qualification', true, 'commercial', 'json'), field('scope', 'Scope', true, 'commercial'), field('deliverables', 'Livrables', true, 'fulfillment', 'json'),
  ], ['qualification_questions', 'scope', 'deliverables']),
}

export function findProductDoctrine(key: string): ProductDoctrineDefinition | null {
  return PRODUCT_DOCTRINES[key as ProductDoctrineKey] || null
}

/**
 * Strict doctrine resolver for mutation/import paths. Unknown doctrine keys must
 * fail closed; silently borrowing another doctrine would make readiness and
 * persistence disagree with the operator's source file.
 */
export function requireProductDoctrine(key: string): ProductDoctrineDefinition {
  const definition = findProductDoctrine(key)
  if (!definition) throw new Error(`Doctrine Product 360 inconnue : ${key || '(vide)'}.`)
  return definition
}

/**
 * Legacy/read-only resolver kept for existing callers that historically expect
 * a fallback. New mutation/readiness code must use find/requireProductDoctrine.
 */
export function productDoctrine(key: string): ProductDoctrineDefinition {
  return findProductDoctrine(key) || PRODUCT_DOCTRINES.one_time_service
}
