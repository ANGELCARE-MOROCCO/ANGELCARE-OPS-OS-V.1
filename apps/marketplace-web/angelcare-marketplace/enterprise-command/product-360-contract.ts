import type { ProductDoctrineDefinition, ProductImportPreview, ProductImportPreviewRow } from './types'
import { requireProductDoctrine } from './product-doctrine'

export type ProductImportMode = 'create' | 'update' | 'upsert'
export type Product360FieldKind = 'text' | 'number' | 'boolean' | 'list' | 'json' | 'date'
export type Product360FieldGroup =
  | 'identity' | 'content' | 'commercial' | 'pricing' | 'media' | 'categories' | 'variants'
  | 'availability' | 'territory' | 'fulfillment' | 'sourcing' | 'trust' | 'relations'
  | 'merchandising' | 'seo' | 'discovery' | 'presentation' | 'governance'

export type Product360ImportField = {
  key: string
  label: string
  group: Product360FieldGroup
  kind: Product360FieldKind
  required?: boolean
  publishRequired?: boolean
  options?: string[]
  aliases?: string[]
  help?: string
}

const f = (
  key: string,
  label: string,
  group: Product360FieldGroup,
  kind: Product360FieldKind = 'text',
  extra: Omit<Product360ImportField, 'key' | 'label' | 'group' | 'kind'> = {},
): Product360ImportField => ({ key, label, group, kind, ...extra })

export const PRODUCT_360_IMPORT_FIELDS: Product360ImportField[] = [
  f('item_key','Clé canonique','identity','text',{required:true,aliases:['product_key','reference_key','reference','reference_produit','cle_produit','clé_produit']}),
  f('slug','Slug','identity','text',{required:true,aliases:['url_slug']}),
  f('sku','SKU / référence','identity','text',{aliases:['reference_sku','référence_sku']}),
  f('kind','Famille technique','identity'),
  f('sellable_type','Doctrine / type commercial','identity'),
  f('name_fr','Nom FR','content','text',{required:true,aliases:['nom','nom_fr','titre','titre_fr']}),
  f('name_en','Nom EN','content'), f('name_ar','Nom AR','content'),
  f('short_description_fr','Description courte FR','content','text',{publishRequired:true,aliases:['description_courte','description_courte_fr','resume_fr','résumé_fr']}),
  f('short_description_en','Description courte EN','content'), f('short_description_ar','Description courte AR','content'),
  f('description_fr','Description complète FR','content','text',{publishRequired:true,aliases:['description','description_complete','description_complete_fr','description_complète_fr']}),
  f('description_en','Description complète EN','content'), f('description_ar','Description complète AR','content'),

  f('commercial_promise','Promesse commerciale','commercial'),
  f('commercial_highlights','Points forts','commercial'), f('commercial_inclusions','Inclus','commercial'),
  f('commercial_exclusions','Non inclus','commercial'), f('commercial_eligibility','Éligibilité','commercial'),
  f('commercial_preparation','Préparation client','commercial'), f('commercial_cancellation_copy','Explication annulation','commercial'),
  f('commercial_after_purchase','Après achat','commercial'),

  f('price_mode','Mode de prix','pricing','text',{options:['fixed','starting_from','quote_only','subscription']}),
  f('price_amount','Prix affiché','pricing','number',{aliases:['prix','prix_affiche','prix_affiché','montant']}), f('currency_label','Devise','pricing','text',{aliases:['devise','currency']}),
  f('price_rule_price_book','Price book (ID / référence / nom)','pricing'),
  f('price_rule_model','Modèle Finance','pricing','text',{options:['fixed','hourly','daily','per_child','per_employee','per_room','per_site','per_session','per_learner','per_assessment','subscription','usage_based','tiered','package','custom_approved']}),
  f('price_rule_unit','Unité Finance','pricing'), f('price_rule_minimum','Prix minimum','pricing','number'),
  f('price_rule_standard','Prix standard','pricing','number'), f('price_rule_maximum','Prix maximum','pricing','number'),
  f('price_rule_cost_basis','Coût de base','pricing','number'), f('price_rule_target_margin','Marge cible','pricing','number'),
  f('price_rule_floor_margin','Marge plancher','pricing','number'), f('price_rule_maximum_discount','Remise max','pricing','number'),
  f('price_rule_commission_rate','Commission','pricing','number'),
  f('price_rules_json','Règles Finance structurées JSON','pricing','json',{help:'Tableau de règles Finance pour parité complète avec le dossier Product 360. Remplace le set de règles importables pour ce produit.'}),

  f('primary_image_reference','Image principale (asset_key ou URL)','media','text',{publishRequired:true,aliases:['primary_media','primary_image','image_principale','visuel_principal']}),
  f('gallery_references','Galerie (asset_key/URL séparés par |)','media','list'),
  f('media_json','Médias structurés JSON','media','json'),

  f('category_keys','Catégories canoniques','categories','list',{publishRequired:true,aliases:['categories','catégories','categories_cles','catégories_clés']}),
  f('primary_category_key','Catégorie principale','categories'),

  f('variants_json','Variantes structurées JSON','variants','json'),

  f('availability_status','État global de disponibilité','availability','text',{options:['available','unavailable','configuration_required','out_of_stock','territory_restricted']}),
  f('territory_codes','Territoires','availability','list',{aliases:['territories','territoires','zones','codes_territoires']}),
  f('availability_audience','Audience disponibilité','availability'),
  f('availability_capacity','Capacité','availability','number'),
  f('availability_starts_at','Disponibilité début','availability','date'), f('availability_ends_at','Disponibilité fin','availability','date'),
  f('availability_reason','Motif disponibilité','availability'), f('availability_json','Disponibilités structurées JSON','availability','json'),

  f('territory_mode','Mode de couverture','territory','text',{options:['national','selected_territories','remote_only','site_specific']}),
  f('territory_fallback_behavior','Comportement hors territoire','territory','text',{options:['hide','show_unavailable','request_quote','collect_interest']}),
  f('territory_delivery_radius_km','Rayon km','territory','number'), f('territory_message','Message territoire','territory'),

  f('fulfillment_mode','Modèle fulfillment','fulfillment','text',{publishRequired:true,options:['angelcare_internal','provider','vendor','academy','digital','shipment','hybrid']}),
  f('fulfillment_lead_time','Délai / lead time','fulfillment','text',{publishRequired:true}),
  f('fulfillment_delivery_method','Méthode de délivrance','fulfillment','text',{publishRequired:true}),
  f('fulfillment_capacity_model','Modèle de capacité','fulfillment','text',{publishRequired:true,options:['unlimited','stock','slots','provider_capacity','cohort_capacity']}),
  f('fulfillment_customer_handover','Déroulé client','fulfillment','text',{publishRequired:true}),
  f('fulfillment_notes','Instructions opérations','fulfillment'),

  f('sourcing_source_type','Source exécution','sourcing','text',{options:['internal','provider_pool','vendor','academy_trainer','mixed']}),
  f('sourcing_preferred_provider_refs','Providers préférés','sourcing','list'),
  f('sourcing_preferred_vendor_refs','Vendors préférés','sourcing','list'),
  f('sourcing_required_capabilities','Capacités requises','sourcing','list'),
  f('sourcing_assignment_strategy','Stratégie sourcing','sourcing','text',{options:['manual','best_available','territory_first','quality_first','cost_first']}),
  f('sourcing_notes','Instructions sourcing','sourcing'),

  f('trust_headline','Promesse de confiance','trust','text',{publishRequired:true}),
  f('trust_certifications','Certifications / preuves','trust','text',{publishRequired:true}),
  f('trust_guarantees','Garanties','trust','text',{publishRequired:true}),
  f('trust_safety_information','Sécurité / limites','trust','text',{publishRequired:true}),
  f('trust_provider_requirements','Exigences prestataire','trust','text',{publishRequired:true}),
  f('trust_proof_urls','Liens de preuve','trust','list'),

  f('relation_cross_sell_refs','Cross-sell produits','relations','list'), f('relation_upsell_refs','Upsell produits','relations','list'),
  f('relation_alternative_refs','Alternatives','relations','list'), f('relation_bundle_refs','Bundles','relations','list'),
  f('relation_message','Message de recommandation','relations'),

  f('merchandising_badge','Badge commercial','merchandising'), f('merchandising_priority','Priorité merchandising','merchandising','number'),
  f('merchandising_card_variant','Variante de card','merchandising','text',{options:['default','premium','editorial','compact','wide']}),
  f('merchandising_featured_copy','Copy de mise en avant','merchandising'), f('merchandising_seasonal_label','Label saisonnier','merchandising'),
  f('featured','Featured','merchandising','boolean'), f('popular','Popular','merchandising','boolean'), f('best_pick','Best pick','merchandising','boolean'),

  f('seo_title_fr','Meta title FR','seo','text',{publishRequired:true}), f('seo_description_fr','Meta description FR','seo','text',{publishRequired:true}),
  f('seo_title_en','Meta title EN','seo'), f('seo_description_en','Meta description EN','seo'),
  f('seo_title_ar','Meta title AR','seo'), f('seo_description_ar','Meta description AR','seo'),
  f('seo_canonical_url','Canonical URL','seo'), f('seo_social_title','Social title','seo'), f('seo_social_description','Social description','seo'),

  f('discovery_age_range','Âge / audience','discovery'), f('discovery_duration','Durée','discovery'),
  f('discovery_format','Format','discovery'), f('discovery_language','Langue','discovery'),
  f('discovery_keywords','Mots-clés','discovery','list'), f('discovery_filter_tags','Tags filtres','discovery','list'),

  f('presentation_hero_variant','Hero','presentation','text',{options:['default','editorial','service','product','academy','b2b']}),
  f('presentation_decision_headline','Headline de décision','presentation'), f('presentation_decision_support','Pourquoi choisir','presentation'),
  f('presentation_what_happens_next','Ce qui se passe ensuite','presentation'), f('presentation_comparison_message','Comparaison / différence','presentation'),
  f('presentation_faq_summary','FAQ / objections','presentation'),

  f('status','Statut demandé','governance','text',{options:['draft','review','approved','published','paused','archived'],aliases:['statut','etat','état']}),
  f('import_note','Note opérateur','governance'),
]

const normalizeHeaderKey = (value: string): string => value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'')
const FIELD_BY_KEY = new Map(PRODUCT_360_IMPORT_FIELDS.map((field) => [field.key, field]))
const ALIAS_TO_KEY = new Map<string,string>()
for (const field of PRODUCT_360_IMPORT_FIELDS) {
  ALIAS_TO_KEY.set(normalizeHeaderKey(field.key), field.key)
  for (const alias of field.aliases || []) ALIAS_TO_KEY.set(normalizeHeaderKey(alias), field.key)
}

const text = (value: unknown): string => String(value ?? '').trim()
const present = (value: unknown): boolean => {
  if (value === null || value === undefined) return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value as Record<string,unknown>).length > 0
  return text(value).length > 0
}
const list = (value: unknown): string[] => Array.isArray(value)
  ? value.map(text).filter(Boolean)
  : text(value).split(/[|;,]+/).map((entry) => entry.trim()).filter(Boolean)
const bool = (value: unknown): boolean | null => {
  if (typeof value === 'boolean') return value
  const v = text(value).toLowerCase()
  if (!v) return null
  if (['true','1','yes','oui','on'].includes(v)) return true
  if (['false','0','no','non','off'].includes(v)) return false
  return null
}
const number = (value: unknown): number | null => {
  if (value === '' || value === null || value === undefined) return null
  const n = Number(typeof value === 'string' ? value.replace(/\s/g,'').replace(',','.') : value)
  return Number.isFinite(n) ? n : null
}
const validDate = (value: unknown): boolean => !present(value) || !Number.isNaN(Date.parse(text(value)))
const uuidLike = (value: unknown): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text(value))
const json = (value: unknown): unknown => {
  if (value && typeof value === 'object') return value
  const source = text(value)
  if (!source) return null
  try { return JSON.parse(source) } catch { return undefined }
}
const sourceKeyFor = (raw: Record<string,unknown>, canonicalKey: string): string | undefined => Object.keys(raw).find((key) => canonicalProductImportKey(key) === canonicalKey)
const sourceHas = (raw: Record<string,unknown>, canonicalKey: string): boolean => sourceKeyFor(raw, canonicalKey) !== undefined
const sourceRaw = (raw: Record<string,unknown>, canonicalKey: string): unknown => { const key=sourceKeyFor(raw,canonicalKey); return key===undefined?undefined:raw[key] }

export function canonicalProductImportKey(rawKey: string): string {
  const trimmed = rawKey.trim()
  const normalized = normalizeHeaderKey(trimmed)
  return ALIAS_TO_KEY.get(normalized) || trimmed
}

export function productImportColumns(definition: ProductDoctrineDefinition): string[] {
  return [...new Set([
    ...PRODUCT_360_IMPORT_FIELDS.map((field) => field.key),
    ...definition.requiredColumns,
    ...definition.optionalColumns,
    ...definition.fields.map((field) => field.key),
  ])]
}


/**
 * Human/audit-readable canonical destination for every supported import column.
 * This is intentionally kept beside the contract so UI, API evidence and tests can
 * prove that no accepted column is a shadow field with nowhere to persist.
 */
export function product360CanonicalDestination(rawKey: string, definition: ProductDoctrineDefinition): string {
  const key = canonicalProductImportKey(rawKey)
  if (!FIELD_BY_KEY.has(key) && definition.fields.some((field) => field.key === key)) return `catalog_items.attributes.${key}`
  if (['item_key','slug','sku','kind','sellable_type','name_fr','name_en','name_ar','short_description_fr','short_description_en','short_description_ar','description_fr','description_en','description_ar','price_mode','price_amount','currency_label','availability_status','featured','status'].includes(key)) return `catalog_items.${key}`
  if (key === 'import_note') return 'catalog_items.commercial_metadata.import_note'
  if (key.startsWith('commercial_')) return `catalog_items.commercial_metadata.${key.replace(/^commercial_/,'')}`
  if (key === 'price_rules_json' || key.startsWith('price_rule_')) return 'finance_price_rules'
  if (['primary_image_reference','gallery_references','media_json'].includes(key)) return 'catalog_item_media'
  if (['category_keys','primary_category_key'].includes(key)) return 'catalog_item_categories'
  if (key === 'variants_json') return 'catalog_variants'
  if (key === 'territory_codes') return 'catalog_availability + catalog_items.territory_config.territory_codes'
  if (key.startsWith('availability_')) return 'catalog_availability'
  if (key.startsWith('territory_')) return `catalog_items.territory_config.${key.replace(/^territory_/,'')}`
  if (key.startsWith('fulfillment_')) return `catalog_items.fulfillment_config.${key.replace(/^fulfillment_/,'')}`
  if (key.startsWith('sourcing_')) return `catalog_items.fulfillment_config.${key.replace(/^sourcing_/,'')}`
  if (key.startsWith('trust_')) return `catalog_items.trust_config.${key.replace(/^trust_/,'')}`
  if (key.startsWith('relation_')) return `catalog_items.relation_config.${key.replace(/^relation_/,'')}`
  if (['popular','best_pick'].includes(key)) return 'homepage_placements'
  if (key.startsWith('merchandising_')) return `catalog_items.experience_config.${key.replace(/^merchandising_/,'')}`
  if (key.startsWith('seo_')) return `catalog_items.seo_metadata.${key.replace(/^seo_/,'')}`
  if (key.startsWith('discovery_')) return `catalog_items.attributes.${key.replace(/^discovery_/,'')}`
  if (key.startsWith('presentation_')) return `catalog_items.experience_config.${key.replace(/^presentation_/,'')}`
  return ''
}

export function product360DestinationMatrix(definition: ProductDoctrineDefinition): Record<string,string> {
  return Object.fromEntries(productImportColumns(definition).map((key) => [key, product360CanonicalDestination(key, definition)]))
}

export function normalizeProductImportRow(raw: Record<string, unknown>, definition: ProductDoctrineDefinition): Record<string, unknown> {
  const normalized: Record<string, unknown> = {}
  for (const [rawKey, rawValue] of Object.entries(raw)) {
    const key = canonicalProductImportKey(rawKey)
    const field = FIELD_BY_KEY.get(key)
    if (!field) {
      const doctrineField = definition.fields.find((entry) => entry.key === key)
      if (doctrineField?.type === 'json') normalized[key] = json(rawValue)
      else if (doctrineField?.type === 'number') normalized[key] = number(rawValue)
      else if (doctrineField?.type === 'boolean') normalized[key] = bool(rawValue)
      else normalized[key] = typeof rawValue === 'string' ? rawValue.trim() : rawValue
      continue
    }
    if (field.kind === 'list') normalized[key] = list(rawValue)
    else if (field.kind === 'json') normalized[key] = json(rawValue)
    else if (field.kind === 'number') normalized[key] = number(rawValue)
    else if (field.kind === 'boolean') normalized[key] = bool(rawValue)
    else normalized[key] = typeof rawValue === 'string' ? rawValue.trim() : rawValue
  }
  normalized.sellable_type = definition.key
  normalized.kind = definition.catalogKind
  if (!present(normalized.price_mode)) normalized.price_mode = definition.defaultPriceMode
  if (!present(normalized.currency_label)) normalized.currency_label = 'Dh'
  if (!present(normalized.availability_status)) normalized.availability_status = definition.defaultAvailability
  if (!present(normalized.status)) normalized.status = 'draft'
  normalized.name_fr = text(normalized.name_fr)
  normalized.item_key = text(normalized.item_key)
  normalized.slug = text(normalized.slug)
  return normalized
}

function pushUnique(target: string[], message: string) { if (!target.includes(message)) target.push(message) }

export function validateProduct360NormalizedRow(input: {
  raw: Record<string, unknown>
  normalized: Record<string, unknown>
  definition: ProductDoctrineDefinition
  existing: boolean
  mode: ProductImportMode
}): { errors: string[]; warnings: string[]; action: ProductImportPreviewRow['action'] } {
  const { raw, normalized, definition, existing, mode } = input
  const errors: string[] = []
  const warnings: string[] = []
  const allowed = new Set(productImportColumns(definition))
  // kind/sellable_type are doctrine-derived. Accept them only as assertions, never as
  // shadow inputs that can disagree with the selected doctrine and then be ignored.
  if (sourceHas(raw,'kind') && present(sourceRaw(raw,'kind')) && text(sourceRaw(raw,'kind')) !== definition.catalogKind)
    pushUnique(errors, `kind=${text(sourceRaw(raw,'kind'))} contredit la doctrine ${definition.key} (attendu ${definition.catalogKind}).`)
  if (sourceHas(raw,'sellable_type') && present(sourceRaw(raw,'sellable_type')) && text(sourceRaw(raw,'sellable_type')) !== definition.key)
    pushUnique(errors, `sellable_type=${text(sourceRaw(raw,'sellable_type'))} contredit la doctrine sélectionnée ${definition.key}.`)
  for (const key of Object.keys(raw).map(canonicalProductImportKey)) if (!allowed.has(key)) pushUnique(errors, `Colonne inconnue "${key}" : aucune destination Product 360 canonique n’est définie.`)
  const updatingExisting = existing && mode !== 'create'
  if (!present(normalized.item_key)) pushUnique(errors, 'Clé canonique est requise.')
  if (!updatingExisting) {
    const doctrineFieldKeys=new Set(definition.fields.map((entry)=>entry.key))
    for (const required of definition.requiredColumns) if (!doctrineFieldKeys.has(required) && !present(normalized[required])) pushUnique(errors, `${required} est requis.`)
    for (const doctrineField of definition.fields.filter((entry) => entry.required)) if (!present(normalized[doctrineField.key])) pushUnique(errors, `${doctrineField.label} est requis par la doctrine ${definition.label}.`)
  } else {
    const doctrineFieldKeys=new Set(definition.fields.map((entry)=>entry.key))
    for (const required of definition.requiredColumns) if (!doctrineFieldKeys.has(required) && sourceHas(raw,required) && !present(normalized[required])) pushUnique(errors, `${required} ne peut pas être vidé lors d’une mise à jour.`)
    for (const doctrineField of definition.fields.filter((entry) => entry.required)) if (sourceHas(raw,doctrineField.key) && !present(normalized[doctrineField.key])) pushUnique(errors, `${doctrineField.label} ne peut pas être vidé lors d’une mise à jour.`)
  }
  for (const field of PRODUCT_360_IMPORT_FIELDS) {
    if (field.required && !updatingExisting && !present(normalized[field.key])) pushUnique(errors, `${field.label} est requis.`)
    if (field.required && updatingExisting && sourceHas(raw,field.key) && !present(normalized[field.key])) pushUnique(errors, `${field.label} ne peut pas être vidé lors d’une mise à jour.`)
    if (field.options?.length && sourceHas(raw,field.key) && present(normalized[field.key]) && !field.options.includes(text(normalized[field.key]))) pushUnique(errors, `${field.label} doit être l’une des valeurs : ${field.options.join(', ')}.`)
    if (field.kind === 'number' && sourceHas(raw,field.key) && text(sourceRaw(raw,field.key)) && normalized[field.key] === null) pushUnique(errors, `${field.label} doit être numérique.`)
    if (field.kind === 'boolean' && sourceHas(raw,field.key) && text(sourceRaw(raw,field.key)) && normalized[field.key] === null) pushUnique(errors, `${field.label} doit être booléen (oui/non, true/false, 1/0).`)
    if (field.kind === 'json' && sourceHas(raw,field.key) && text(sourceRaw(raw,field.key)) && normalized[field.key] === undefined) pushUnique(errors, `${field.label} contient un JSON invalide.`)
    if (field.kind === 'date' && sourceHas(raw,field.key) && !validDate(normalized[field.key])) pushUnique(errors, `${field.label} doit être une date ISO exploitable.`)
  }
  for(const doctrineField of definition.fields){
    if(!sourceHas(raw,doctrineField.key))continue
    const supplied=sourceRaw(raw,doctrineField.key)
    if(doctrineField.type==='number'&&text(supplied)&&normalized[doctrineField.key]===null)pushUnique(errors,`${doctrineField.label} doit être numérique.`)
    if(doctrineField.type==='boolean'&&text(supplied)&&normalized[doctrineField.key]===null)pushUnique(errors,`${doctrineField.label} doit être booléen.`)
    if(doctrineField.type==='json'&&text(supplied)&&normalized[doctrineField.key]===undefined)pushUnique(errors,`${doctrineField.label} contient un JSON invalide.`)
    if(doctrineField.type==='date'&&!validDate(normalized[doctrineField.key]))pushUnique(errors,`${doctrineField.label} doit être une date ISO exploitable.`)
    if(doctrineField.type==='enum'&&doctrineField.options?.length&&present(normalized[doctrineField.key])&&!doctrineField.options.includes(text(normalized[doctrineField.key])))pushUnique(errors,`${doctrineField.label} doit être l’une des valeurs : ${doctrineField.options.join(', ')}.`)
  }
  const mediaRows=Array.isArray(normalized.media_json)?normalized.media_json as Array<Record<string,unknown>>:[]
  if(sourceHas(raw,'media_json')){
    const mediaKeys=mediaRows.map((entry,index)=>text(entry.media_key)||`#${index+1}`)
    const duplicateMedia=mediaKeys.filter((key,index)=>mediaKeys.indexOf(key)!==index)
    if(duplicateMedia.length)pushUnique(errors,`media_json contient des media_key dupliqués : ${[...new Set(duplicateMedia)].join(', ')}.`)
    for(const [index,entry] of mediaRows.entries()){
      if(!present(entry.reference)&&!present(entry.asset_key)&&!present(entry.asset_url)&&!present(entry.url))pushUnique(errors,`media_json #${index+1} doit fournir reference, asset_key, asset_url ou url.`)
      if(present(entry.status)&&!['active','paused','archived'].includes(text(entry.status)))pushUnique(errors,`media_json #${index+1}: status invalide.`)
    }
  }
  const variantRows=Array.isArray(normalized.variants_json)?normalized.variants_json as Array<Record<string,unknown>>:[]
  if(sourceHas(raw,'variants_json')){
    const variantKeys=variantRows.map((entry,index)=>text(entry.variant_key)||text(entry.sku)||`#${index+1}`)
    const duplicateVariantKeys=variantKeys.filter((key,index)=>variantKeys.indexOf(key)!==index)
    if(duplicateVariantKeys.length)pushUnique(errors,`variants_json contient des identités dupliquées : ${[...new Set(duplicateVariantKeys)].join(', ')}.`)
    for(const [index,entry] of variantRows.entries()){
      if(!present(entry.name_fr))pushUnique(errors,`variants_json #${index+1}: name_fr est requis.`)
      if(present(entry.status)&&!['active','paused','archived'].includes(text(entry.status)))pushUnique(errors,`variants_json #${index+1}: status invalide.`)
      if(present(entry.price_delta)&&number(entry.price_delta)===null)pushUnique(errors,`variants_json #${index+1}: price_delta doit être numérique.`)
      if(present(entry.price_override)&&number(entry.price_override)===null)pushUnique(errors,`variants_json #${index+1}: price_override doit être numérique.`)
      if(present(entry.sort_order)&&number(entry.sort_order)===null)pushUnique(errors,`variants_json #${index+1}: sort_order doit être numérique.`)
      if(present(entry.available)&&bool(entry.available)===null)pushUnique(errors,`variants_json #${index+1}: available doit être booléen.`)
      if(present(entry.media_asset_id)&&!uuidLike(entry.media_asset_id))pushUnique(errors,`variants_json #${index+1}: media_asset_id doit être un UUID valide.`)
      if(present(entry.territory_id)&&!uuidLike(entry.territory_id))pushUnique(errors,`variants_json #${index+1}: territory_id doit être un UUID valide.`)
    }
  }
  const availabilityRows=Array.isArray(normalized.availability_json)?normalized.availability_json as Array<Record<string,unknown>>:[]
  if(sourceHas(raw,'availability_json')){
    const identities:string[]=[]
    for(const [index,entry] of availabilityRows.entries()){
      if(!present(entry.territory_code)&&!present(entry.territory_id))pushUnique(errors,`availability_json #${index+1}: territory_code ou territory_id est requis.`)
      if(present(entry.territory_id)&&!uuidLike(entry.territory_id))pushUnique(errors,`availability_json #${index+1}: territory_id doit être un UUID valide.`)
      if(present(entry.city_zone_id)&&!uuidLike(entry.city_zone_id))pushUnique(errors,`availability_json #${index+1}: city_zone_id doit être un UUID valide.`)
      if(present(entry.capacity_limit)&&number(entry.capacity_limit)===null)pushUnique(errors,`availability_json #${index+1}: capacity_limit doit être numérique.`)
      if(number(entry.capacity_limit)!==null&&(number(entry.capacity_limit) as number)<0)pushUnique(errors,`availability_json #${index+1}: capacity_limit ne peut pas être négatif.`)
      if(present(entry.available)&&bool(entry.available)===null)pushUnique(errors,`availability_json #${index+1}: available doit être booléen.`)
      if(!validDate(entry.starts_at)||!validDate(entry.ends_at))pushUnique(errors,`availability_json #${index+1}: starts_at / ends_at doivent être des dates ISO exploitables.`)
      if(present(entry.starts_at)&&present(entry.ends_at)&&Date.parse(text(entry.starts_at))>Date.parse(text(entry.ends_at)))pushUnique(errors,`availability_json #${index+1}: starts_at doit précéder ends_at.`)
      const identity=`${text(entry.territory_code||entry.territory_id)}::${text(entry.city_zone_id)}::${text(entry.audience)||'all'}`
      if(identities.includes(identity))pushUnique(errors,`availability_json contient une cible dupliquée ${identity}.`);identities.push(identity)
    }
  }
  const priceRuleRows=Array.isArray(normalized.price_rules_json)?normalized.price_rules_json as Array<Record<string,unknown>>:[]
  if(sourceHas(raw,'price_rules_json')){
    const identities:string[]=[]
    for(const [index,entry] of priceRuleRows.entries()){
      const book=text(entry.price_book||entry.price_book_reference||entry.price_book_id)
      const model=text(entry.pricing_model||entry.model)||'fixed'
      if(!book)pushUnique(errors,`price_rules_json #${index+1}: price_book / price_book_reference / price_book_id est requis.`)
      if(number(entry.standard_price??entry.standard)===null)pushUnique(errors,`price_rules_json #${index+1}: standard_price est requis et doit être numérique.`)
      const allowedModels=['fixed','hourly','daily','per_child','per_employee','per_room','per_site','per_session','per_learner','per_assessment','subscription','usage_based','tiered','package','custom_approved']
      if(!allowedModels.includes(model))pushUnique(errors,`price_rules_json #${index+1}: pricing_model invalide.`)
      if(present(entry.status)&&!['draft','active','archived'].includes(text(entry.status)))pushUnique(errors,`price_rules_json #${index+1}: status invalide.`)
      const min=number(entry.minimum_price??entry.minimum),std=number(entry.standard_price??entry.standard),max=number(entry.maximum_price??entry.maximum)
      if(min!==null&&std!==null&&min>std)pushUnique(errors,`price_rules_json #${index+1}: minimum_price ne peut pas dépasser standard_price.`)
      if(max!==null&&std!==null&&max<std)pushUnique(errors,`price_rules_json #${index+1}: maximum_price ne peut pas être inférieur à standard_price.`)
      for(const [label,value] of [['minimum_price',min],['standard_price',std],['maximum_price',max]] as const)if(value!==null&&value<0)pushUnique(errors,`price_rules_json #${index+1}: ${label} ne peut pas être négatif.`)
      for(const key of ['cost_basis','target_margin','floor_margin','maximum_discount','commission_rate'] as const) if(present(entry[key])&&number(entry[key])===null)pushUnique(errors,`price_rules_json #${index+1}: ${key} doit être numérique.`)
      const identity=`${book}::${model}`;if(book&&identities.includes(identity))pushUnique(errors,`price_rules_json contient une règle dupliquée ${identity}.`);identities.push(identity)
    }
  }
  const availabilityDetails=['availability_audience','availability_capacity','availability_starts_at','availability_ends_at','availability_reason']
  if(availabilityDetails.some((key)=>sourceHas(raw,key))&&!sourceHas(raw,'territory_codes')&&!sourceHas(raw,'availability_json')) pushUnique(errors,'Les détails de disponibilité exigent territory_codes ou availability_json afin d’éviter une mutation ambiguë.')
  if(number(normalized.availability_capacity)!==null&&(number(normalized.availability_capacity) as number)<0)pushUnique(errors,'availability_capacity ne peut pas être négative.')
  if(present(normalized.availability_starts_at)&&present(normalized.availability_ends_at)&&Date.parse(text(normalized.availability_starts_at))>Date.parse(text(normalized.availability_ends_at)))pushUnique(errors,'availability_starts_at doit précéder availability_ends_at.')
  const amount = number(normalized.price_amount)
  if (amount !== null && amount < 0) pushUnique(errors, 'price_amount doit être positif ou nul.')
  if (!['quote_only'].includes(text(normalized.price_mode)) && amount === null) warnings.push('Prix visible sans price_amount : le dossier restera non publiable tant qu’aucune règle Finance active ne fournit un prix.')
  if (mode === 'create' && existing) pushUnique(errors, `Le produit ${text(normalized.item_key)} existe déjà : mode création uniquement.`)
  if (mode === 'update' && !existing) pushUnique(errors, `Le produit ${text(normalized.item_key)} n’existe pas : mode mise à jour uniquement.`)

  const requestedStatus = text(normalized.status)
  if (requestedStatus === 'published' && !updatingExisting) {
    for (const field of PRODUCT_360_IMPORT_FIELDS.filter((entry) => entry.publishRequired && !['primary_image_reference','category_keys'].includes(entry.key))) {
      if (!present(normalized[field.key])) pushUnique(errors, `${field.label} est obligatoire pour une publication directe.`)
    }
    const categoryKeys = list(normalized.category_keys)
    if (!categoryKeys.length && !present(normalized.primary_category_key)) pushUnique(errors, 'Au moins une catégorie canonique est obligatoire pour publier.')
    const hasMedia = present(normalized.primary_image_reference) || mediaRows.some((entry)=>text(entry.media_key)==='primary')
    if (!hasMedia) pushUnique(errors, 'Un média principal explicite (primary_image_reference ou media_json.media_key=primary) est obligatoire pour publier.')
    const hasAvailability = text(normalized.availability_status) === 'available' || list(normalized.territory_codes).length > 0 || (Array.isArray(normalized.availability_json) && (normalized.availability_json as unknown[]).length > 0)
    if (!hasAvailability) pushUnique(errors, 'Une disponibilité exploitable est obligatoire pour publier.')
  } else if (requestedStatus === 'published' && updatingExisting) {
    warnings.push('Publication demandée sur une mise à jour partielle : le readiness gate Product 360 vérifiera le dossier canonique fusionné avant toute publication.')
  } else {
    if (!present(normalized.short_description_fr)) warnings.push('Description courte FR absente.')
    if (!present(normalized.description_fr)) warnings.push('Description complète FR absente.')
    if (!list(normalized.category_keys).length) warnings.push('Aucune catégorie fournie : le produit restera hors storefront jusqu’à assignation.')
    if (!present(normalized.primary_image_reference) && !present(normalized.media_json)) warnings.push('Aucun média principal fourni.')
  }
  const action: ProductImportPreviewRow['action'] = errors.length ? 'reject' : existing ? 'update' : 'create'
  return { errors, warnings, action }
}

export function validateProductImportRows(input: {
  doctrineKey: string
  rows: Record<string, unknown>[]
  existingKeys?: Set<string>
  mode?: ProductImportMode
}): ProductImportPreview {
  const definition = requireProductDoctrine(input.doctrineKey)
  const existingKeys = input.existingKeys || new Set<string>()
  const mode = input.mode || 'upsert'
  const rows: ProductImportPreviewRow[] = input.rows.map((raw, index) => {
    const normalized = normalizeProductImportRow(raw, definition)
    const key = text(normalized.item_key)
    const validation = validateProduct360NormalizedRow({ raw, normalized, definition, existing: existingKeys.has(key), mode })
    return {
      row: index + 1,
      valid: validation.errors.length === 0,
      action: validation.action,
      key,
      name: text(normalized.name_fr) || `Ligne ${index + 1}`,
      errors: validation.errors,
      warnings: validation.warnings,
      normalized,
    }
  })
  return {
    doctrine: definition,
    rows,
    valid: rows.filter((row) => row.valid).length,
    rejected: rows.filter((row) => !row.valid).length,
    creates: rows.filter((row) => row.valid && row.action === 'create').length,
    updates: rows.filter((row) => row.valid && row.action === 'update').length,
  }
}

export function product360ContractSummary(definition: ProductDoctrineDefinition) {
  const groups = [...new Set(PRODUCT_360_IMPORT_FIELDS.map((field) => field.group))]
  const columns = productImportColumns(definition)
  return {
    doctrine: definition.key,
    columns,
    columnCount: columns.length,
    groups,
    groupCount: groups.length,
    doctrineRequired: [...new Set([...definition.requiredColumns, ...definition.fields.filter((field) => field.required).map((field) => field.key)])],
    publishRequired: PRODUCT_360_IMPORT_FIELDS.filter((field) => field.publishRequired).map((field) => field.key),
    destinations: product360DestinationMatrix(definition),
  }
}
