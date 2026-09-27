import 'server-only'
import type { Data } from '@puckeditor/core'
import { createServiceClient } from '@/lib/supabase/server'
import type { MarketplaceRequestContext } from '@/angelcare-marketplace/domain/types'
import { SANILA_PAGE_BLUEPRINTS } from '@/angelcare-marketplace/sanila-public/pageBlueprints'
import type { SanilaWorldState } from '@/angelcare-marketplace/sanila-admin/types'
import { SANILA_WORLD_CONFIG_KEY, SANILA_WORLD_KEY } from './contract'

function sourceState(): SanilaWorldState {
  const pages = Object.fromEntries(SANILA_PAGE_BLUEPRINTS.map((page) => [page.slug, {
    slug: page.slug,
    title: page.title,
    nav: page.nav,
    status: 'source' as const,
    updatedAt: null,
    data: null,
  }]))
  return {
    version: 1,
    worldKey: SANILA_WORLD_KEY,
    status: 'source',
    revision: 0,
    sourceFingerprint: null,
    importedAt: null,
    importedBy: null,
    packageName: null,
    shell: { header: true, footer: true, navigation: true },
    workflows: { demo: true, contact: true, onboarding: true, protectedDemoAccess: true },
    pages,
    publishedAt: null,
    publishedBy: null,
  }
}

function normalize(value: unknown): SanilaWorldState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return sourceState()
  const row = value as Partial<SanilaWorldState>
  const base = sourceState()
  return {
    ...base,
    ...row,
    version: 1,
    worldKey: SANILA_WORLD_KEY,
    shell: { ...base.shell, ...(row.shell || {}) },
    workflows: { ...base.workflows, ...(row.workflows || {}) },
    pages: { ...base.pages, ...(row.pages || {}) },
  }
}

export async function getSanilaWorldState(): Promise<SanilaWorldState> {
  const db = await createServiceClient()
  const { data, error } = await db.from('angelcare_marketplace_configurations')
    .select('value')
    .eq('config_key', SANILA_WORLD_CONFIG_KEY)
    .is('territory_id', null)
    .is('tenant_id', null)
    .is('locale', null)
    .maybeSingle()
  if (error || !data) return sourceState()
  return normalize(data.value)
}

async function persist(state: SanilaWorldState, context: MarketplaceRequestContext): Promise<SanilaWorldState> {
  const db = await createServiceClient()
  const current = await db.from('angelcare_marketplace_configurations')
    .select('id,version')
    .eq('config_key', SANILA_WORLD_CONFIG_KEY)
    .is('territory_id', null)
    .is('tenant_id', null)
    .is('locale', null)
    .maybeSingle()
  if (current.error) throw current.error
  if (current.data) {
    const { error } = await db.from('angelcare_marketplace_configurations').update({
      value: state,
      version: Number(current.data.version || 1) + 1,
      updated_by: context.actor.id,
      updated_at: new Date().toISOString(),
    }).eq('id', current.data.id)
    if (error) throw error
    return state
  }
  const { error } = await db.from('angelcare_marketplace_configurations').insert({
    config_key: SANILA_WORLD_CONFIG_KEY,
    label: 'SANILA Sovereign Public World',
    description: 'Autorité isolée du workspace SANILA pour le world public multi-page.',
    value: state,
    value_type: 'json',
    category: 'SANILA Sovereign World',
    editable: true,
    sensitive: false,
    territory_id: null,
    tenant_id: null,
    locale: null,
    version: 1,
    updated_by: context.actor.id,
  })
  if (error) throw error
  return state
}

export async function saveSanilaWorldImport(input: { packageName: string; fingerprint: string; context: MarketplaceRequestContext }) {
  const current = await getSanilaWorldState()
  const now = new Date().toISOString()
  return persist({
    ...current,
    status: 'draft',
    revision: current.revision + 1,
    packageName: input.packageName,
    sourceFingerprint: input.fingerprint,
    importedAt: now,
    importedBy: input.context.actor.id,
  }, input.context)
}

export async function saveSanilaWorldPage(input: { slug: string; data: Data; context: MarketplaceRequestContext }) {
  const current = await getSanilaWorldState()
  const page = current.pages[input.slug]
  if (!page) throw new Error('Route SANILA inconnue.')
  const now = new Date().toISOString()
  return persist({
    ...current,
    status: 'draft',
    revision: current.revision + 1,
    pages: { ...current.pages, [input.slug]: { ...page, status: 'draft', updatedAt: now, data: input.data } },
  }, input.context)
}

export async function publishSanilaWorld(context: MarketplaceRequestContext) {
  const current = await getSanilaWorldState()
  const now = new Date().toISOString()
  const pages = Object.fromEntries(Object.entries(current.pages).map(([slug, page]) => [slug, page.data ? { ...page, status: 'published' as const } : page]))
  return persist({ ...current, status: 'published', revision: current.revision + 1, pages, publishedAt: now, publishedBy: context.actor.id }, context)
}
