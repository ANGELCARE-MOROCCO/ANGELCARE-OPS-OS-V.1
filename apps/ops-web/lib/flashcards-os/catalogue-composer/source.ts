import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import catalogueSeedJson from '@/lib/flashcards-os/catalogue-2022.seed.json'
import type { CatalogueSeed } from '@/lib/flashcards-os/types'
import type { CatalogueCollectionCandidate, CatalogueComposerOptions, CatalogueUniverse } from './types'

const seed = catalogueSeedJson as CatalogueSeed
const TENANT_KEY = 'angelcare-internal'
const VIEW_PREFIX = 'fc_os_'

type ServiceClient = Awaited<ReturnType<typeof createServiceClient>>
function table(client: ServiceClient, name: string) { return client.from(`${VIEW_PREFIX}${name}`) }
function arr(value: unknown): string[] { return Array.isArray(value) ? value.map(String).filter(Boolean) : [] }
function num(value: unknown, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback }
function object(value: unknown): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {} }
function deliveryFormats(primary: unknown, rows: any[], metadata: Record<string, unknown>) {
  const raw = [...rows.map((row) => String(row.format_key || '')), ...arr(metadata.formats), String(primary || '')]
  const out = new Set<'physical' | 'digital' | 'hybrid'>()
  for (const value of raw) {
    const lower = value.toLowerCase()
    if (lower.includes('digital') || lower.includes('video') || lower.includes('classroom')) out.add('digital')
    if (lower.includes('hybrid')) out.add('hybrid')
    if (lower && !lower.includes('digital')) out.add('physical')
  }
  if (!out.size) out.add('physical')
  return [...out]
}
function ontologyRow(row: any) { return { key: String(row.key || row.code || row.id), label: String(row.label || row.name || row.key || ''), description: String(row.description || '') } }

function seedCandidate(item: CatalogueSeed['collections'][number], category: CatalogueSeed['categories'][number] | undefined): CatalogueCollectionCandidate {
  const price = item.historicalPriceDh
  return {
    id: item.id, code: item.code, name: item.name, categoryId: item.categoryId,
    categoryCode: category?.code || item.categoryId, categoryName: category?.name || 'Catalogue',
    versionId: null, versionLabel: item.version, status: item.status, lifecycle: item.lifecycle,
    readinessScore: item.readiness, cardCount: item.structuredCardCount || item.expectedCardCount || 0,
    ageMinMonths: item.ageMinMonths, ageMaxMonths: item.ageMaxMonths,
    languages: item.languages, formats: ['physical'], methodologies: item.methodologies,
    audiences: item.audiences, usageContexts: item.usageContexts,
    objectiveKeys: [item.primaryObjective].filter(Boolean), painPointKeys: [], outcomeKeys: [],
    description: item.notes || item.primaryObjective || '', priceDh: price, unitCostDh: null,
    commercialStatus: price && price > 0 ? 'active' : 'missing_price',
    warnings: [price && price > 0 ? '' : 'Prix catalogue manquant.', item.status === 'archived' ? 'Collection archivée.' : ''].filter(Boolean),
  }
}

export async function loadCatalogueComposerOptions(universe: CatalogueUniverse = 'b2c'): Promise<CatalogueComposerOptions> {
  try {
    const client = await createServiceClient()
    const [categoryRes, collectionRes, versionRes, formatRes, commercialRes, profileRes, contextRes, painRes, objectiveRes, outcomeRes] = await Promise.all([
      table(client, 'categories').select('*').eq('tenant_key', TENANT_KEY).order('sort_order'),
      table(client, 'collections').select('*').eq('tenant_key', TENANT_KEY).order('name'),
      table(client, 'collection_versions').select('*').eq('tenant_key', TENANT_KEY).order('created_at', { ascending: false }),
      table(client, 'formats').select('*').eq('tenant_key', TENANT_KEY),
      table(client, 'catalogue_collection_commercials').select('*').eq('tenant_key', TENANT_KEY).eq('universe', universe),
      table(client, 'learner_profile_options').select('*').eq('tenant_key', TENANT_KEY).eq('status', 'active').order('sort_order'),
      table(client, 'usage_context_options').select('*').eq('tenant_key', TENANT_KEY).eq('status', 'active').order('sort_order'),
      table(client, 'pain_point_options').select('*').eq('tenant_key', TENANT_KEY).eq('status', 'active').order('sort_order'),
      table(client, 'capability_objectives').select('*').eq('tenant_key', TENANT_KEY).eq('status', 'active').order('sort_order'),
      table(client, 'desired_outcome_options').select('*').eq('tenant_key', TENANT_KEY).eq('status', 'active').order('sort_order'),
    ])
    if (collectionRes.error || categoryRes.error) throw collectionRes.error || categoryRes.error
    const categories = categoryRes.data || []
    const categoryMap = new Map(categories.map((row: any) => [String(row.id), row]))
    const versionsByCollection = new Map<string, any[]>()
    for (const row of versionRes.data || []) {
      const key = String((row as any).collection_id)
      versionsByCollection.set(key, [...(versionsByCollection.get(key) || []), row])
    }
    const formatsByCollection = new Map<string, any[]>()
    for (const row of formatRes.data || []) {
      const key = String((row as any).collection_id)
      formatsByCollection.set(key, [...(formatsByCollection.get(key) || []), row])
    }
    const commercialMap = new Map((commercialRes.data || []).map((row: any) => [String(row.collection_id), row]))
    const collections: CatalogueCollectionCandidate[] = (collectionRes.data || []).map((row: any) => {
      const category = categoryMap.get(String(row.category_id)) as any
      const metadata = object(row.metadata)
      const versions = versionsByCollection.get(String(row.id)) || []
      const version = versions.find((entry) => entry.status === 'approved') || versions[0]
      const commercial: any = commercialMap.get(String(row.id))
      const price = commercial?.base_price_dh == null ? (row.historical_price_dh == null ? null : num(row.historical_price_dh)) : num(commercial.base_price_dh)
      const warnings = [] as string[]
      if (!price || price <= 0) warnings.push('Prix catalogue manquant.')
      if (row.status === 'archived' || row.lifecycle === 'archived') warnings.push('Collection archivée.')
      if (!version) warnings.push('Version structurée absente; la version courante du catalogue est utilisée.')
      return {
        id: String(row.id), code: String(row.code), name: String(row.name), categoryId: String(row.category_id),
        categoryCode: String(category?.code || row.category_id), categoryName: String(category?.name || 'Catalogue'),
        versionId: version?.id ? String(version.id) : null, versionLabel: String(version?.version_label || row.current_version || 'catalogue-current'),
        status: String(row.status), lifecycle: String(row.lifecycle), readinessScore: num(row.readiness_score),
        cardCount: num(row.structured_card_count || row.expected_card_count),
        ageMinMonths: row.age_min_months == null ? null : num(row.age_min_months),
        ageMaxMonths: row.age_max_months == null ? null : num(row.age_max_months),
        languages: arr(row.languages), formats: deliveryFormats(row.primary_format, formatsByCollection.get(String(row.id)) || [], metadata),
        methodologies: arr(row.methodologies), audiences: arr(row.audiences), usageContexts: arr(row.usage_contexts),
        objectiveKeys: [...new Set([String(row.primary_objective || ''), ...arr(metadata.objectiveKeys), ...arr(metadata.learningDomains)].filter(Boolean))],
        painPointKeys: arr(metadata.painPointKeys), outcomeKeys: arr(metadata.outcomeKeys),
        description: String(metadata.description || row.notes || row.primary_objective || ''),
        priceDh: price, unitCostDh: commercial?.unit_cost_dh == null ? null : num(commercial.unit_cost_dh),
        commercialStatus: commercial?.status === 'inactive' ? 'inactive' : price && price > 0 ? 'active' : 'missing_price', warnings,
      } satisfies CatalogueCollectionCandidate
    })
    const counts = new Map<string, number>()
    collections.forEach((item) => counts.set(item.categoryId, (counts.get(item.categoryId) || 0) + 1))
    return {
      sourceMode: 'database', collections,
      categories: categories.map((row: any) => ({ id: String(row.id), code: String(row.code), name: String(row.name), collectionCount: counts.get(String(row.id)) || 0 })),
      ontology: {
        learnerProfiles: (profileRes.data || []).map(ontologyRow), usageContexts: (contextRes.data || []).map(ontologyRow),
        painPoints: (painRes.data || []).map(ontologyRow), objectives: (objectiveRes.data || []).map(ontologyRow), outcomes: (outcomeRes.data || []).map(ontologyRow),
      },
    }
  } catch {
    const categoryMap = new Map(seed.categories.map((item) => [item.id, item]))
    const collections = seed.collections.map((item) => seedCandidate(item, categoryMap.get(item.categoryId)))
    const counts = new Map<string, number>()
    collections.forEach((item) => counts.set(item.categoryId, (counts.get(item.categoryId) || 0) + 1))
    const unique = (values: string[]) => [...new Set(values.filter(Boolean))].map((key) => ({ key, label: key.replaceAll('_', ' '), description: '' }))
    return {
      sourceMode: 'catalogue_seed', collections,
      categories: seed.categories.map((item) => ({ id: item.id, code: item.code, name: item.name, collectionCount: counts.get(item.id) || 0 })),
      ontology: {
        learnerProfiles: unique(seed.collections.flatMap((item) => item.audiences)),
        usageContexts: unique(seed.collections.flatMap((item) => item.usageContexts)), painPoints: [],
        objectives: unique(seed.collections.map((item) => item.primaryObjective)), outcomes: [],
      },
    }
  }
}
