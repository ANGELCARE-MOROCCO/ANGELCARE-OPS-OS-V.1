import { createServiceClient } from '@/lib/supabase/server'
import type { MarketplaceRequestContext } from '../domain/types'
import { MarketplaceError } from '../server/errors'
import type {
  ActivationCheck,
  ActivationCommandData,
  ActivationReadiness,
  ActivationRun,
} from './types'

type Row = Record<string, unknown>
type DbError = { code?: string; message?: string } | null
const asRows = (value: unknown): Row[] => Array.isArray(value) ? value.filter((entry): entry is Row => Boolean(entry) && typeof entry === 'object') : []
const text = (value: unknown): string => typeof value === 'string' ? value : ''
const numberValue = (value: unknown): number => Number(value || 0)
const boolValue = (value: unknown): boolean => value === true
const objectValue = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}

function fail(operation: string, error: DbError): MarketplaceError {
  const missing = error?.code === '42P01' || String(error?.message || '').includes('activation_')
  return new MarketplaceError(
    missing ? 'CONFIGURATION_ERROR' : 'INTERNAL_ERROR',
    missing
      ? 'La migration Production Activation & Acceptance doit être appliquée.'
      : `Impossible de ${operation}.`,
    { cause: error || undefined },
  )
}

function mapReadiness(row: Row | null): ActivationReadiness {
  return {
    published_items: numberValue(row?.published_items),
    items_with_media: numberValue(row?.items_with_media),
    items_with_category: numberValue(row?.items_with_category),
    items_with_price: numberValue(row?.items_with_price),
    items_with_availability: numberValue(row?.items_with_availability),
    active_homepage_sections: numberValue(row?.active_homepage_sections),
    active_navigation_items: numberValue(row?.active_navigation_items),
    active_merchandising_placements: numberValue(row?.active_merchandising_placements),
    active_media_assets: numberValue(row?.active_media_assets),
    published_categories: numberValue(row?.published_categories),
    active_collections: numberValue(row?.active_collections),
    ready_for_activation: boolValue(row?.ready_for_activation),
  }
}

function mapCheck(row: Row): ActivationCheck {
  return {
    id: text(row.id),
    check_key: text(row.check_key),
    group_key: text(row.group_key),
    label_fr: text(row.label_fr),
    status: text(row.status) as ActivationCheck['status'],
    required: Boolean(row.required),
    measured_value: row.measured_value === null || row.measured_value === undefined ? null : numberValue(row.measured_value),
    expected_value: row.expected_value === null || row.expected_value === undefined ? null : numberValue(row.expected_value),
    message: text(row.message),
    evidence: objectValue(row.evidence),
  }
}

function mapRun(row: Row, checks: ActivationCheck[]): ActivationRun {
  return {
    id: text(row.id),
    public_reference: text(row.public_reference),
    status: text(row.status) as ActivationRun['status'],
    score: numberValue(row.score),
    started_at: text(row.started_at),
    completed_at: text(row.completed_at) || null,
    summary: objectValue(row.summary),
    checks,
  }
}

async function readiness(): Promise<ActivationReadiness> {
  const db = await createServiceClient()
  const { data, error } = await db.from('angelcare_marketplace_activation_readiness_v').select('*').single()
  if (error) throw fail('charger la préparation Marketplace', error)
  return mapReadiness(data as Row)
}

async function latestRun(): Promise<ActivationRun | null> {
  const db = await createServiceClient()
  const { data, error } = await db
    .from('angelcare_marketplace_activation_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw fail('charger le dernier contrôle d’activation', error)
  if (!data) return null
  const checksResult = await db
    .from('angelcare_marketplace_activation_checks')
    .select('*')
    .eq('run_id', data.id)
    .order('sort_order', { ascending: true })
  if (checksResult.error) throw fail('charger les contrôles d’activation', checksResult.error)
  return mapRun(data as Row, asRows(checksResult.data).map(mapCheck))
}

export async function activationCommandData(_context: MarketplaceRequestContext): Promise<ActivationCommandData> {
  return {
    readiness: await readiness(),
    latestRun: await latestRun(),
    publicRoutes: [
      { label: 'Homepage FR', href: '/angelcare-marketplace/fr', purpose: 'Storefront et merchandising live' },
      { label: 'Marketplace', href: '/angelcare-marketplace/fr/marketplace', purpose: 'Catalogue, recherche et découverte' },
      { label: 'Basket', href: '/angelcare-marketplace/fr/basket', purpose: 'Panier transactionnel' },
      { label: 'Mon ANGELCARE', href: '/angelcare-marketplace/fr/account', purpose: 'Parcours client et actions' },
    ],
    adminRoutes: [
      { label: 'Commerce Studio', href: '/angelcare-marketplace/admin/commerce-studio', purpose: 'Commandement commercial' },
      { label: 'Media Library', href: '/angelcare-marketplace/admin/media', purpose: 'Téléversement et médias' },
      { label: 'Homepage Composer', href: '/angelcare-marketplace/admin/homepage/composer', purpose: 'Composition no-code' },
      { label: 'Product Studio', href: '/angelcare-marketplace/admin/catalog/items/new', purpose: 'Créer un produit ou service réel' },
      { label: 'Category Studio', href: '/angelcare-marketplace/admin/catalog/categories', purpose: 'Catégories et assignations' },
      { label: 'Merchandising', href: '/angelcare-marketplace/admin/merchandising', purpose: 'Featured, Popular et Best Picks' },
      { label: 'Publication', href: '/angelcare-marketplace/admin/publication', purpose: 'Publication et rollback immédiats' },
    ],
  }
}

function makeChecks(value: ActivationReadiness): Array<Omit<ActivationCheck, 'id'>> {
  const coverage = (measured: number, total: number) => total > 0 && measured >= total
  return [
    { check_key: 'catalog.published', group_key: 'content', label_fr: 'Au moins une offre publiée', status: value.published_items > 0 ? 'passed' : 'blocked', required: true, measured_value: value.published_items, expected_value: 1, message: value.published_items > 0 ? 'Le catalogue contient une offre publiée.' : 'Créez et publiez au moins une offre commerciale réelle.', evidence: {} },
    { check_key: 'catalog.media', group_key: 'content', label_fr: 'Couverture média des offres', status: coverage(value.items_with_media, value.published_items) ? 'passed' : 'blocked', required: true, measured_value: value.items_with_media, expected_value: value.published_items, message: 'Chaque offre publiée doit disposer d’un média actif.', evidence: {} },
    { check_key: 'catalog.category', group_key: 'content', label_fr: 'Assignation catégorie', status: coverage(value.items_with_category, value.published_items) ? 'passed' : 'blocked', required: true, measured_value: value.items_with_category, expected_value: value.published_items, message: 'Chaque offre publiée doit appartenir à une catégorie.', evidence: {} },
    { check_key: 'catalog.price', group_key: 'commerce', label_fr: 'Prix ou mode devis', status: coverage(value.items_with_price, value.published_items) ? 'passed' : 'blocked', required: true, measured_value: value.items_with_price, expected_value: value.published_items, message: 'Chaque offre doit afficher un prix réel ou être explicitement sur devis.', evidence: {} },
    { check_key: 'catalog.availability', group_key: 'commerce', label_fr: 'Disponibilité gouvernée', status: coverage(value.items_with_availability, value.published_items) ? 'passed' : 'blocked', required: true, measured_value: value.items_with_availability, expected_value: value.published_items, message: 'Chaque offre doit posséder une vérité de disponibilité.', evidence: {} },
    { check_key: 'homepage.sections', group_key: 'storefront', label_fr: 'Homepage composée', status: value.active_homepage_sections > 0 ? 'passed' : 'blocked', required: true, measured_value: value.active_homepage_sections, expected_value: 1, message: 'Au moins une section Homepage doit être active.', evidence: {} },
    { check_key: 'navigation.active', group_key: 'storefront', label_fr: 'Navigation active', status: value.active_navigation_items > 0 ? 'passed' : 'blocked', required: true, measured_value: value.active_navigation_items, expected_value: 1, message: 'La navigation publique doit contenir au moins un élément actif.', evidence: {} },
    { check_key: 'merchandising.active', group_key: 'storefront', label_fr: 'Merchandising actif', status: value.active_merchandising_placements > 0 ? 'passed' : 'warning', required: false, measured_value: value.active_merchandising_placements, expected_value: 1, message: 'Ajoutez une offre Featured, Popular ou Best Pick pour valider le merchandising.', evidence: {} },
    { check_key: 'media.library', group_key: 'assets', label_fr: 'Media Library alimentée', status: value.active_media_assets > 0 ? 'passed' : 'blocked', required: true, measured_value: value.active_media_assets, expected_value: 1, message: 'Téléversez au moins un média réel.', evidence: {} },
    { check_key: 'categories.published', group_key: 'content', label_fr: 'Catégorie publiée', status: value.published_categories > 0 ? 'passed' : 'blocked', required: true, measured_value: value.published_categories, expected_value: 1, message: 'Publiez au moins une catégorie réelle.', evidence: {} },
  ]
}

export async function runActivationReadiness(context: MarketplaceRequestContext): Promise<ActivationRun> {
  const db = await createServiceClient()
  const current = await readiness()
  const checks = makeChecks(current)
  const required = checks.filter((check) => check.required)
  const passed = required.filter((check) => check.status === 'passed').length
  const score = required.length ? Math.round((passed / required.length) * 100) : 0
  const status: ActivationRun['status'] = passed === required.length ? 'passed' : 'blocked'
  const { data: run, error } = await db
    .from('angelcare_marketplace_activation_runs')
    .insert({
      status,
      score,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      actor_id: context.actor.id,
      summary: current,
    })
    .select('*')
    .single()
  if (error || !run) throw fail('enregistrer le contrôle d’activation', error)
  const { data: inserted, error: checksError } = await db
    .from('angelcare_marketplace_activation_checks')
    .insert(checks.map((check, index) => ({ ...check, run_id: run.id, sort_order: index * 10 })))
    .select('*')
  if (checksError) throw fail('enregistrer les contrôles d’activation', checksError)
  return mapRun(run as Row, asRows(inserted).map(mapCheck))
}
