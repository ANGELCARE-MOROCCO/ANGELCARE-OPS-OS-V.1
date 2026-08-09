import 'server-only'

import { createServiceClient } from '@/lib/supabase/server'
import catalogueSeedJson from '@/lib/flashcards-os/catalogue-2022.seed.json'
import type {
  CatalogueSeed,
  CatalogueSeedCategory,
  CatalogueSeedCollection,
  CollectionCard,
  CollectionDossier,
  CollectionMutationInput,
  CollectionSummary,
  FlashcardsDashboardData,
  ImportIssue,
  TaxonomyNode,
} from '@/lib/flashcards-os/types'

const seed = catalogueSeedJson as CatalogueSeed
function catalogueSeedAllowed(){return process.env.FLASHCARDS_OS_DEMO_MODE==='true'&&process.env.NODE_ENV!=='production'}
function catalogueUnavailable(area:string){const ref=`FC-CATALOGUE-${Date.now().toString(36).toUpperCase()}`;return new Error(`Catalogue Flashcards indisponible (${area}). Référence ${ref}. Aucune donnée de démonstration n’a été substituée.`)}
const VIEW_PREFIX = 'fc_os_'
const TENANT_KEY = 'angelcare-internal'

function table(client: Awaited<ReturnType<typeof createServiceClient>>, name: string) {
  return client.from(`${VIEW_PREFIX}${name}`)
}

function categoryMaps(categories: CatalogueSeedCategory[]) {
  const byId = new Map(categories.map((category) => [category.id, category]))
  return { byId }
}

function collectionSummaryFromSeed(item: CatalogueSeedCollection): CollectionSummary {
  const { byId } = categoryMaps(seed.categories)
  const category = byId.get(item.categoryId)
  const parent = category?.parentId ? byId.get(category.parentId) : category
  return {
    ...item,
    categoryName: category?.name || 'Catégorie non classée',
    parentCategoryName: parent?.name || category?.name || 'Portefeuille',
    issueCount: item.issues.length,
  }
}

function allSeedSummaries() {
  return seed.collections.map(collectionSummaryFromSeed)
}

function importIssueExplanation(type: string) {
  if (type === 'duplicate_name') return 'Le même intitulé apparaît plusieurs fois dans le catalogue source et exige une décision de fusion, variante ou maintien séparé.'
  if (type === 'duplicate_legacy_concept') return 'Le concept semble répliqué dans la nomenclature historique sans différenciation éditoriale visible.'
  if (type === 'probable_source_label_error') return 'Le libellé source est probablement incorrect ou dupliqué; aucune correction silencieuse n’a été appliquée.'
  if (type === 'missing_card_count') return 'Le catalogue indique N/A pour le nombre de cartes. Le nombre attendu doit être validé à partir des sources de production.'
  if (type === 'duplicate_source_line') return 'La même ligne produit est reproduite dans le catalogue et nécessite une revue humaine.'
  if (type === 'legacy_numbering_gap') return 'La numérotation historique contient un saut ou une incohérence.'
  if (type === 'duplicate_legacy_number') return 'Deux produits portent le même numéro historique dans la même catégorie.'
  if (type === 'taxonomy_review') return 'Le produit semble rattaché à une catégorie historique qui ne correspond pas totalement à sa fonction pédagogique.'
  return 'Anomalie héritée du catalogue source à qualifier par le responsable produit.'
}

function issuesFromSeed(): ImportIssue[] {
  return seed.collections.flatMap((collection) =>
    collection.issues.map((issue, index) => ({
      id: `${collection.code}-${issue}-${index}`,
      collectionCode: collection.code,
      collectionName: collection.name,
      sourcePage: collection.sourcePage,
      type: issue,
      severity: ['duplicate_name', 'probable_source_label_error', 'missing_card_count'].includes(issue) ? 'high' as const : 'medium' as const,
      status: 'open' as const,
      explanation: importIssueExplanation(issue),
    })),
  )
}

function buildTaxonomy(categoriesInput: CatalogueSeedCategory[], collectionsInput: CatalogueSeedCollection[]): TaxonomyNode[] {
  const collectionByCategory = new Map<string, CatalogueSeedCollection[]>()
  for (const collection of collectionsInput) {
    const list = collectionByCategory.get(collection.categoryId) || []
    list.push(collection)
    collectionByCategory.set(collection.categoryId, list)
  }

  const directNodes = new Map<string, TaxonomyNode>()
  for (const category of categoriesInput) {
    const direct = collectionByCategory.get(category.id) || []
    directNodes.set(category.id, {
      ...category,
      collectionCount: direct.length,
      expectedCardCount: direct.reduce((sum, collection) => sum + Number(collection.expectedCardCount || 0), 0),
      issueCount: direct.reduce((sum, collection) => sum + collection.issues.length, 0),
      readinessAverage: direct.length
        ? Math.round(direct.reduce((sum, collection) => sum + collection.readiness, 0) / direct.length)
        : 0,
      children: [],
    })
  }

  const roots: TaxonomyNode[] = []
  for (const category of categoriesInput) {
    const node = directNodes.get(category.id)
    if (!node) continue
    if (category.parentId) directNodes.get(category.parentId)?.children.push(node)
    else roots.push(node)
  }

  function rollup(node: TaxonomyNode) {
    node.children.forEach(rollup)
    if (node.children.length) {
      node.collectionCount += node.children.reduce((sum, child) => sum + child.collectionCount, 0)
      node.expectedCardCount += node.children.reduce((sum, child) => sum + child.expectedCardCount, 0)
      node.issueCount += node.children.reduce((sum, child) => sum + child.issueCount, 0)
      const weighted = node.children.reduce((sum, child) => sum + child.readinessAverage * Math.max(child.collectionCount, 1), 0)
      const weight = node.children.reduce((sum, child) => sum + Math.max(child.collectionCount, 1), 0)
      node.readinessAverage = weight ? Math.round(weighted / weight) : 0
      node.children.sort((a, b) => a.order - b.order)
    }
  }

  roots.forEach(rollup)
  return roots.sort((a, b) => a.order - b.order)
}

function dossierSections(item: CollectionSummary) {
  const core = item.expectedCardCount ? 46 : 38
  return [
    { key: 'identity', label: 'Identité produit', status: 'ready' as const, completeness: 82 },
    { key: 'doctrine', label: 'Doctrine & objectifs', status: 'partial' as const, completeness: 46 },
    { key: 'audience', label: 'Audience intelligence', status: 'partial' as const, completeness: 52 },
    { key: 'cards', label: 'Registre des cartes', status: 'partial' as const, completeness: item.structuredCardCount && item.expectedCardCount ? Math.round(item.structuredCardCount / item.expectedCardCount * 100) : 0 },
    { key: 'specification', label: 'Spécifications produit', status: 'partial' as const, completeness: core },
    { key: 'research', label: 'Recherche & preuves', status: 'partial' as const, completeness: 12 },
    { key: 'design', label: 'Product design', status: 'partial' as const, completeness: 10 },
    { key: 'commands', label: 'Commandes de production', status: 'ready' as const, completeness: 88 },
    { key: 'vault', label: 'Sources & livrables', status: 'ready' as const, completeness: 82 },
    { key: 'quality', label: 'Qualité & approbations', status: 'ready' as const, completeness: item.issueCount ? 68 : 86 },
    { key: 'commercial', label: 'Coûts & readiness', status: 'ready' as const, completeness: item.historicalPriceDh ? 78 : 48 },
    { key: 'performance', label: 'Performance & apprentissage', status: 'future_engine' as const, completeness: 0 },
  ]
}

function dossierFromSeed(item: CollectionSummary): CollectionDossier {
  return {
    ...item,
    cards: [],
    commercials: [],
    sections: dossierSections(item),
    editions: item.languages.map((language) => ({ id: `${item.id}-${language}`, language, status: 'legacy_intake', version: item.version })),
    formats: [{ id: `${item.id}-${item.primaryFormat}`, format: item.primaryFormat, status: 'legacy_intake' }],
    timeline: [
      { id: 'source', label: 'Catalogue source identifié', detail: `${item.sourceLabel} — page ${item.sourcePage}`, date: null, tone: 'neutral' },
      { id: 'import', label: 'Entrée legacy créée', detail: `${item.code} · version ${item.version}`, date: null, tone: 'positive' },
      ...(item.issueCount ? [{ id: 'issues', label: 'Revue humaine requise', detail: `${item.issueCount} anomalie(s) non corrigée(s) silencieusement.`, date: null, tone: 'warning' as const }] : []),
    ],
  }
}

function mapDbCollection(row: any, categories: Map<string, any>): CollectionSummary {
  const category = categories.get(String(row.category_id))
  const parent = category?.parent_id ? categories.get(String(category.parent_id)) : category
  const issues = Array.isArray(row.legacy_issues) ? row.legacy_issues.map(String) : []
  return {
    id: String(row.id),
    code: String(row.code),
    name: String(row.name),
    slug: String(row.slug || ''),
    categoryId: String(row.category_id || ''),
    legacyDomain: String(row.legacy_domain || ''),
    legacyNumber: String(row.legacy_number || ''),
    expectedCardCount: row.expected_card_count == null ? null : Number(row.expected_card_count),
    structuredCardCount: Number(row.structured_card_count || 0),
    historicalPriceDh: row.historical_price_dh == null ? null : Number(row.historical_price_dh),
    primaryFormat: String(row.primary_format || 'flashcards'),
    status: row.status,
    readiness: Number(row.readiness_score || 0),
    ageMinMonths: row.age_min_months == null ? null : Number(row.age_min_months),
    ageMaxMonths: row.age_max_months == null ? null : Number(row.age_max_months),
    languages: Array.isArray(row.languages) ? row.languages.map(String) : [],
    methodologies: Array.isArray(row.methodologies) ? row.methodologies.map(String) : [],
    sourcePage: Number(row.source_page || 0),
    sourceLabel: String(row.source_label || ''),
    issues,
    notes: String(row.notes || ''),
    primaryObjective: String(row.primary_objective || ''),
    audiences: Array.isArray(row.audiences) ? row.audiences.map(String) : [],
    usageContexts: Array.isArray(row.usage_contexts) ? row.usage_contexts.map(String) : [],
    version: String(row.current_version || '0.1'),
    owner: String(row.owner_name || 'Direction Produit'),
    lifecycle: row.lifecycle,
    categoryName: String(category?.name || 'Catégorie non classée'),
    parentCategoryName: String(parent?.name || category?.name || 'Portefeuille'),
    issueCount: issues.length,
  }
}

function mapDbCard(row: any): CollectionCard {
  return {
    id: String(row.id),
    collectionId: String(row.collection_id),
    sequence: Number(row.sequence_no),
    concept: row.concept == null ? null : String(row.concept),
    frontText: row.front_text == null ? null : String(row.front_text),
    backGuidance: row.back_guidance == null ? null : String(row.back_guidance),
    language: String(row.language || 'fr'),
    translation: row.translation == null ? null : String(row.translation),
    pronunciation: row.pronunciation == null ? null : String(row.pronunciation),
    example: row.example_text == null ? null : String(row.example_text),
    activity: row.activity_instruction == null ? null : String(row.activity_instruction),
    difficulty: row.difficulty || 'foundation',
    imageBrief: row.image_brief == null ? null : String(row.image_brief),
    rightsStatus: row.rights_status || 'unverified',
    approvalStatus: row.approval_status || 'draft',
    updatedAt: row.updated_at == null ? null : String(row.updated_at),
  }
}

async function databaseCollections(): Promise<CollectionSummary[] | null> {
  try {
    const client = await createServiceClient()
    const [{ data: categoryRows, error: categoryError }, { data: rows, error }] = await Promise.all([
      table(client, 'categories').select('*').eq('tenant_key', TENANT_KEY).order('sort_order'),
      table(client, 'collections').select('*').eq('tenant_key', TENANT_KEY).order('name'),
    ])
    if (categoryError || error || !rows?.length) return null
    const categories = new Map<string, any>((categoryRows || []).map((row: any) => [String(row.id), row]))
    return rows.map((row: any) => mapDbCollection(row, categories))
  } catch {
    return null
  }
}

export async function loadCollections(): Promise<{ sourceMode: 'database' | 'catalogue_seed'; collections: CollectionSummary[] }> {
  const database = await databaseCollections()
  if (database) return { sourceMode: 'database', collections: database }
  if(catalogueSeedAllowed()) return { sourceMode: 'catalogue_seed', collections: allSeedSummaries() }
  throw catalogueUnavailable('collections')
}

export async function loadTaxonomyAtlas(): Promise<{ sourceMode: 'database' | 'catalogue_seed'; nodes: TaxonomyNode[] }> {
  const database = await databaseCollections()
  if (!database) { if(catalogueSeedAllowed()) return { sourceMode: 'catalogue_seed', nodes: buildTaxonomy(seed.categories, seed.collections) }; throw catalogueUnavailable('taxonomy') }

  try {
    const client = await createServiceClient()
    const { data: categoryRows, error } = await table(client, 'categories').select('*').eq('tenant_key', TENANT_KEY).order('sort_order')
    if (error || !categoryRows) { if(catalogueSeedAllowed()) return { sourceMode: 'catalogue_seed', nodes: buildTaxonomy(seed.categories, seed.collections) }; throw catalogueUnavailable('taxonomy categories') }
    const seedLikeCategories: CatalogueSeedCategory[] = categoryRows.map((row: any) => ({
      id: String(row.id),
      code: String(row.code),
      name: String(row.name),
      shortName: String(row.short_name || row.name),
      parentId: row.parent_id == null ? null : String(row.parent_id),
      order: Number(row.sort_order || 0),
      status: row.status,
      accent: String(row.accent_key || 'slate'),
      description: String(row.description || ''),
    }))
    const nodes = buildTaxonomy(seedLikeCategories, database.map((item) => ({ ...item })) as CatalogueSeedCollection[])
    return { sourceMode: 'database', nodes }
  } catch (error) {
    if(catalogueSeedAllowed()) return { sourceMode: 'catalogue_seed', nodes: buildTaxonomy(seed.categories, seed.collections) }
    throw error instanceof Error?error:catalogueUnavailable('taxonomy')
  }
}

export async function loadImportIssues(): Promise<{ sourceMode: 'database' | 'catalogue_seed'; issues: ImportIssue[] }> {
  try {
    const client = await createServiceClient()
    const [{ data, error }, { data: collectionRows }] = await Promise.all([
      table(client, 'import_issues').select('*').eq('tenant_key', TENANT_KEY).order('severity').order('created_at'),
      table(client, 'collections').select('id,code,name').eq('tenant_key', TENANT_KEY),
    ])
    if (!error && data?.length) {
      const collectionMap = new Map((collectionRows || []).map((row: any) => [String(row.id), row]))
      return {
        sourceMode: 'database',
        issues: data.map((row: any) => {
          const collection = collectionMap.get(String(row.collection_id)) as any
          return {
            id: String(row.id),
            collectionCode: String(collection?.code || ''),
            collectionName: String(collection?.name || ''),
            sourcePage: Number(row.source_page || 0),
            type: String(row.issue_type),
            severity: row.severity,
            status: row.status,
            explanation: String(row.explanation || importIssueExplanation(String(row.issue_type))),
          }
        }),
      }
    }
  } catch {
    // Fall through to immutable catalogue intake evidence.
  }
  return { sourceMode: 'catalogue_seed', issues: issuesFromSeed() }
}

export async function loadCollectionDossier(idOrCode: string): Promise<{ sourceMode: 'database' | 'catalogue_seed'; dossier: CollectionDossier | null }> {
  const { sourceMode, collections } = await loadCollections()
  const item = collections.find((collection) => collection.id === idOrCode || collection.code.toLowerCase() === idOrCode.toLowerCase())
  if (!item) return { sourceMode, dossier: null }

  if (sourceMode === 'database') {
    try {
      const client = await createServiceClient()
      const [{ data: cards }, { data: editions }, { data: formats }, { data: timeline }, { data: commercials }] = await Promise.all([
        table(client, 'cards').select('*').eq('tenant_key', TENANT_KEY).eq('collection_id', item.id).order('sequence_no'),
        table(client, 'editions').select('*').eq('tenant_key', TENANT_KEY).eq('collection_id', item.id).order('language_code'),
        table(client, 'formats').select('*').eq('tenant_key', TENANT_KEY).eq('collection_id', item.id).order('format_key'),
        table(client, 'audit_events').select('*').eq('tenant_key', TENANT_KEY).eq('entity_type', 'collection').eq('entity_id', item.id).order('created_at', { ascending: false }).limit(12),
        table(client, 'catalogue_collection_commercials').select('*').eq('tenant_key', TENANT_KEY).eq('collection_id', item.id).order('universe'),
      ])
      return {
        sourceMode,
        dossier: {
          ...item,
          cards: (cards || []).map(mapDbCard),
          commercials: (commercials || []).map((row:any)=>({id:String(row.id),universe:row.universe,basePriceDh:row.base_price_dh==null?null:Number(row.base_price_dh),unitCostDh:row.unit_cost_dh==null?null:Number(row.unit_cost_dh),minimumQuantity:Number(row.minimum_quantity||1),taxPercent:Number(row.tax_percent||0),volumeTiers:Array.isArray(row.volume_tiers)?row.volume_tiers:[],status:row.status,authoritySource:String(row.authority_source||row.metadata?.authority_source||row.metadata?.seed_source||'unconfigured'),confirmedAt:row.confirmed_at?String(row.confirmed_at):null,confirmedBy:row.confirmed_by?String(row.confirmed_by):null})),
          sections: dossierSections(item),
          editions: (editions || []).map((row: any) => ({ id: String(row.id), language: String(row.language_code), status: String(row.status), version: String(row.version_label || item.version) })),
          formats: (formats || []).map((row: any) => ({ id: String(row.id), format: String(row.format_key), status: String(row.status) })),
          timeline: (timeline || []).map((row: any) => ({ id: String(row.id), label: String(row.action_label || row.action_key), detail: String(row.summary || ''), date: String(row.created_at), tone: row.risk_level === 'high' ? 'warning' : 'neutral' })),
        },
      }
    } catch (error) {
      if(catalogueSeedAllowed()) return { sourceMode: 'catalogue_seed', dossier: dossierFromSeed(item) }
      throw error instanceof Error?error:catalogueUnavailable('collection dossier')
    }
  }

  return { sourceMode, dossier: dossierFromSeed(item) }
}

export async function loadFlashcardsDashboard(): Promise<FlashcardsDashboardData> {
  const [{ sourceMode, collections }, { issues }, { nodes }] = await Promise.all([
    loadCollections(),
    loadImportIssues(),
    loadTaxonomyAtlas(),
  ])
  const rootNodes = nodes
  const expectedCards = collections.reduce((sum, item) => sum + Number(item.expectedCardCount || 0), 0)
  const structuredCards = collections.reduce((sum, item) => sum + Number(item.structuredCardCount || 0), 0)
  const lifecycle = collections.reduce<Record<string, number>>((acc, item) => {
    acc[item.lifecycle] = (acc[item.lifecycle] || 0) + 1
    return acc
  }, {})
  const historicalPortfolioValueDh = collections.reduce((sum, item) => sum + Number(item.historicalPriceDh || 0), 0)
  const averageReadiness = collections.length
    ? Math.round(collections.reduce((sum, item) => sum + item.readiness, 0) / collections.length)
    : 0

  return {
    sourceMode,
    portfolioName: seed.portfolio.name,
    collections: collections.length,
    categories: seed.categories.length,
    activeDomains: rootNodes.filter((node) => node.collectionCount > 0).length,
    expectedCards,
    structuredCards,
    openIssues: issues.filter((issue) => issue.status === 'open').length,
    averageReadiness,
    historicalPortfolioValueDh,
    lifecycle,
    topDomains: rootNodes
      .filter((node) => node.collectionCount > 0)
      .map((node) => ({ id: node.id, name: node.shortName, collections: node.collectionCount, expectedCards: node.expectedCardCount, issues: node.issueCount, readiness: node.readinessAverage }))
      .sort((a, b) => b.collections - a.collections),
    decisionQueue: issues.slice(0, 8),
    latestCollections: collections.slice(0, 8),
  }
}

export async function createCategory(input: { code: string; name: string; shortName?: string; description?: string; parentId?: string | null; accent?: string }) {
  const client = await createServiceClient()
  const id = `cat-${input.code.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  const payload = {
    tenant_key: TENANT_KEY,
    id,
    code: input.code.trim().toUpperCase(),
    name: input.name.trim(),
    short_name: (input.shortName || input.name).trim(),
    description: input.description?.trim() || null,
    parent_id: input.parentId || null,
    accent_key: input.accent || 'indigo',
    status: 'active',
  }
  const { data, error } = await table(client, 'categories').insert(payload).select('*').single()
  if (error) throw new Error(error.message)
  return data
}

export async function createCollection(input: CollectionMutationInput & { code: string; name: string; categoryId: string }) {
  const client = await createServiceClient()
  const code = input.code.trim().toUpperCase()
  const id = code.toLowerCase()
  const payload = {
    tenant_key: TENANT_KEY,
    id,
    code,
    name: input.name.trim(),
    slug: input.name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    category_id: input.categoryId,
    expected_card_count: input.expectedCardCount ?? null,
    structured_card_count: 0,
    historical_price_dh: input.historicalPriceDh ?? null,
    primary_format: 'flashcards',
    status: input.status || 'needs_structuring',
    lifecycle: input.lifecycle || 'structuring',
    readiness_score: 18,
    age_min_months: input.ageMinMonths ?? null,
    age_max_months: input.ageMaxMonths ?? null,
    languages: input.languages || ['fr'],
    methodologies: input.methodologies || [],
    primary_objective: input.primaryObjective || '',
    audiences: input.audiences || [],
    usage_contexts: input.usageContexts || [],
    owner_name: input.owner || 'Direction Produit',
    notes: input.notes || '',
    source_label: 'Création native Flashcards OS',
    current_version: '0.1-draft',
  }
  const { data, error } = await table(client, 'collections').insert(payload).select('*').single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateCollection(codeOrId: string, input: CollectionMutationInput) {
  const client = await createServiceClient()
  const { data: existing, error: findError } = await table(client, 'collections').select('id').eq('tenant_key', TENANT_KEY).or(`id.eq.${codeOrId},code.eq.${codeOrId.toUpperCase()}`).maybeSingle()
  if (findError || !existing) throw new Error(findError?.message || 'Collection not found.')

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.name !== undefined) payload.name = input.name.trim()
  if (input.categoryId !== undefined) payload.category_id = input.categoryId
  if (input.status !== undefined) payload.status = input.status
  if (input.lifecycle !== undefined) payload.lifecycle = input.lifecycle
  if (input.expectedCardCount !== undefined) payload.expected_card_count = input.expectedCardCount
  if (input.historicalPriceDh !== undefined) payload.historical_price_dh = input.historicalPriceDh
  if (input.ageMinMonths !== undefined) payload.age_min_months = input.ageMinMonths
  if (input.ageMaxMonths !== undefined) payload.age_max_months = input.ageMaxMonths
  if (input.languages !== undefined) payload.languages = input.languages
  if (input.methodologies !== undefined) payload.methodologies = input.methodologies
  if (input.primaryObjective !== undefined) payload.primary_objective = input.primaryObjective
  if (input.audiences !== undefined) payload.audiences = input.audiences
  if (input.usageContexts !== undefined) payload.usage_contexts = input.usageContexts
  if (input.owner !== undefined) payload.owner_name = input.owner
  if (input.notes !== undefined) payload.notes = input.notes

  const { data, error } = await table(client, 'collections').update(payload).eq('tenant_key', TENANT_KEY).eq('id', existing.id).select('*').single()
  if (error) throw new Error(error.message)
  return data
}


export type CollectionDeletionDependency = { table: string; label: string; count: number }

export async function inspectCollectionDeletion(codeOrId: string) {
  const client = await createServiceClient()
  const { data: existing, error: findError } = await table(client, 'collections')
    .select('id,code,name,lifecycle,status')
    .eq('tenant_key', TENANT_KEY)
    .or(`id.eq.${codeOrId},code.eq.${codeOrId.toUpperCase()}`)
    .maybeSingle()
  if (findError || !existing) throw new Error(findError?.message || 'Collection not found.')

  const definitions = [
    ['collection_versions', 'Versions de collection', 'collection_id'],
    ['editions', 'Éditions', 'collection_id'],
    ['formats', 'Formats', 'collection_id'],
    ['variants', 'Variantes', 'collection_id'],
    ['cards', 'Cartes', 'collection_id'],
    ['import_issues', 'Anomalies importées', 'collection_id'],
    ['production_commands', 'Commandes de production', 'collection_id'],
    ['external_production_jobs', 'Jobs de production externes', 'collection_id'],
    ['upload_sessions', 'Sessions d’upload', 'collection_id'],
    ['storage_objects', 'Objets Windows Node', 'collection_id'],
    ['source_packages', 'Packages source', 'collection_id'],
    ['deliverables', 'Livrables', 'collection_id'],
    ['product_releases', 'Releases produit', 'collection_id'],
    ['product_quality_signals', 'Signaux qualité', 'collection_id'],
    ['catalogue_collection_commercials', 'Configuration commerciale catalogue', 'collection_id'],
    ['catalogue_solution_items', 'Packages et solutions', 'collection_id'],
    ['catalogue_journey_items', 'Programmes d’apprentissage', 'collection_id'],
    ['catalogue_journey_activity_links', 'Activités de programme', 'collection_id'],
    ['catalogue_sellable_items', 'Sellables publiés', 'collection_id'],
  ] as const
  const dependencies: CollectionDeletionDependency[] = []
  for (const [tableName, label, column] of definitions) {
    const { count, error } = await table(client, tableName)
      .select('id', { count: 'exact', head: true })
      .eq('tenant_key', TENANT_KEY)
      .eq(column, existing.id)
    if (error) throw new Error(`Unable to inspect ${tableName}: ${error.message}`)
    if (Number(count || 0) > 0) dependencies.push({ table: tableName, label, count: Number(count) })
  }
  const { count: relationshipCount, error: relationshipError } = await table(client, 'collection_relationships')
    .select('id', { count: 'exact', head: true })
    .or(`source_collection_id.eq.${existing.id},target_collection_id.eq.${existing.id}`)
  if (relationshipError) throw new Error(`Unable to inspect collection relationships: ${relationshipError.message}`)
  if (Number(relationshipCount || 0) > 0) dependencies.push({ table: 'collection_relationships', label: 'Relations entre collections', count: Number(relationshipCount) })

  const lifecycle = String(existing.lifecycle || '')
  const protectedLifecycle = ['approved', 'published', 'archived'].includes(lifecycle)
  return { collection: existing, dependencies, canDelete: !protectedLifecycle && dependencies.length === 0, protectedLifecycle }
}

export async function deleteCollectionPermanently(codeOrId: string) {
  const inspection = await inspectCollectionDeletion(codeOrId)
  if (inspection.protectedLifecycle) throw new Error(`La collection est au lifecycle ${inspection.collection.lifecycle}. Créez une version de remplacement au lieu de supprimer l’historique.`)
  if (inspection.dependencies.length) {
    const detail = inspection.dependencies.map((item) => `${item.label}: ${item.count}`).join(' · ')
    throw new Error(`Suppression bloquée par des dépendances actives — ${detail}`)
  }
  const client = await createServiceClient()
  const { error: sectionsError } = await table(client, 'collection_dossier_sections')
    .delete().eq('collection_id', inspection.collection.id)
  if (sectionsError) throw new Error(`Unable to delete collection dossier sections: ${sectionsError.message}`)
  const { error } = await table(client, 'collections')
    .delete().eq('tenant_key', TENANT_KEY).eq('id', inspection.collection.id)
  if (error) throw new Error(`Permanent deletion blocked by an active dependency: ${error.message}`)
  return inspection.collection
}

export async function createCard(collectionCodeOrId: string, input: Partial<CollectionCard> & { sequence: number }) {
  const client = await createServiceClient()
  const { data: collection, error: findError } = await table(client, 'collections').select('id').eq('tenant_key', TENANT_KEY).or(`id.eq.${collectionCodeOrId},code.eq.${collectionCodeOrId.toUpperCase()}`).maybeSingle()
  if (findError || !collection) throw new Error(findError?.message || 'Collection not found.')

  const payload = {
    tenant_key: TENANT_KEY,
    collection_id: collection.id,
    sequence_no: input.sequence,
    concept: input.concept || null,
    front_text: input.frontText || null,
    back_guidance: input.backGuidance || null,
    language: input.language || 'fr',
    translation: input.translation || null,
    pronunciation: input.pronunciation || null,
    example_text: input.example || null,
    activity_instruction: input.activity || null,
    difficulty: input.difficulty || 'foundation',
    image_brief: input.imageBrief || null,
    rights_status: input.rightsStatus || 'unverified',
    approval_status: input.approvalStatus || 'draft',
  }
  const { data, error } = await table(client, 'cards').insert(payload).select('*').single()
  if (error) throw new Error(error.message)
  await client.rpc('fc_os_refresh_collection_structured_card_count', { target_collection_id: collection.id })
  return data
}


export async function updateCard(cardId: string, input: Partial<CollectionCard> & { sequence?: number }) {
  const client = await createServiceClient()
  const { data: existing, error: findError } = await table(client, 'cards').select('*').eq('tenant_key', TENANT_KEY).eq('id', cardId).maybeSingle()
  if (findError || !existing) throw new Error(findError?.message || 'Card not found.')
  const payload: Record<string, unknown> = {}
  if (input.sequence !== undefined) payload.sequence_no = input.sequence
  if (input.concept !== undefined) payload.concept = input.concept || null
  if (input.frontText !== undefined) payload.front_text = input.frontText || null
  if (input.backGuidance !== undefined) payload.back_guidance = input.backGuidance || null
  if (input.language !== undefined) payload.language = input.language || 'fr'
  if (input.translation !== undefined) payload.translation = input.translation || null
  if (input.pronunciation !== undefined) payload.pronunciation = input.pronunciation || null
  if (input.example !== undefined) payload.example_text = input.example || null
  if (input.activity !== undefined) payload.activity_instruction = input.activity || null
  if (input.difficulty !== undefined) payload.difficulty = input.difficulty
  if (input.imageBrief !== undefined) payload.image_brief = input.imageBrief || null
  if (input.rightsStatus !== undefined) payload.rights_status = input.rightsStatus
  if (input.approvalStatus !== undefined) payload.approval_status = input.approvalStatus
  const { data, error } = await table(client, 'cards').update(payload).eq('tenant_key', TENANT_KEY).eq('id', cardId).select('*').single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteCardPermanently(cardId: string) {
  const client = await createServiceClient()
  const { data: existing, error: findError } = await table(client, 'cards').select('*').eq('tenant_key', TENANT_KEY).eq('id', cardId).maybeSingle()
  if (findError || !existing) throw new Error(findError?.message || 'Card not found.')
  if (String(existing.approval_status || 'draft') === 'approved') throw new Error('An approved card cannot be deleted permanently. Create a replacement version instead.')
  const { error } = await table(client, 'cards').delete().eq('tenant_key', TENANT_KEY).eq('id', cardId)
  if (error) throw new Error(`Permanent deletion blocked by an active dependency: ${error.message}`)
  await client.rpc('fc_os_refresh_collection_structured_card_count', { target_collection_id: existing.collection_id })
  return existing
}


export async function resolveImportIssue(
  issueId: string,
  input: { status: 'resolved' | 'accepted' | 'rejected'; resolution: string; actorName?: string | null },
) {
  const client = await createServiceClient()
  const payload = {
    status: input.status,
    resolution: input.resolution.trim(),
    resolved_by: input.actorName || null,
    resolved_at: new Date().toISOString(),
  }
  const { data, error } = await table(client, 'import_issues')
    .update(payload)
    .eq('tenant_key', TENANT_KEY)
    .eq('id', issueId)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function recordFlashcardsAudit(input: {
  actorId?: string | null
  actorName?: string | null
  actionKey: string
  actionLabel: string
  entityType: string
  entityId: string
  summary: string
  before?: unknown
  after?: unknown
  riskLevel?: 'normal' | 'medium' | 'high'
}) {
  try {
    const client = await createServiceClient()
    await table(client, 'audit_events').insert({
      tenant_key: TENANT_KEY,
      actor_id: input.actorId || null,
      actor_name: input.actorName || null,
      action_key: input.actionKey,
      action_label: input.actionLabel,
      entity_type: input.entityType,
      entity_id: input.entityId,
      summary: input.summary,
      before_payload: input.before ?? null,
      after_payload: input.after ?? null,
      risk_level: input.riskLevel || 'normal',
    })
    await table(client, 'outbox_events').insert({
      tenant_key: TENANT_KEY,
      event_key: input.actionKey,
      aggregate_type: input.entityType,
      aggregate_id: input.entityId,
      payload: { summary: input.summary, actorId: input.actorId || null },
      status: 'pending',
    })
  } catch {
    // The primary mutation has already completed. Audit persistence is independently verified by the U1 gate.
  }
}
