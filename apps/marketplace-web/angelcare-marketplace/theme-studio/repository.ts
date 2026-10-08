import { createServiceClient } from '@/lib/supabase/server'
import type { MarketplaceRequestContext } from '../domain/types'
import { MarketplaceError } from '../server/errors'
import { writeMarketplaceAudit } from '../audit/write-audit'
import { ANGELCARE_FLAGSHIP_THEME } from './defaults'
import type { HomepageThemeConfig, HomepageThemeStudioDocument, ThemeStudioDraftResponse } from './types'

const row = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
const rows = (value: unknown): Record<string, unknown>[] => Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object')) : []
const text = (value: unknown): string => typeof value === 'string' ? value.trim() : ''
const numberValue = (value: unknown, fallback = 0): number => Number.isFinite(Number(value)) ? Number(value) : fallback

export function normalizeTheme(value: unknown): HomepageThemeConfig {
  const source = row(value)
  const color = (key: keyof HomepageThemeConfig, fallback: string) => /^#[0-9a-f]{6}$/i.test(text(source[key])) ? text(source[key]) : fallback
  return {
    ...ANGELCARE_FLAGSHIP_THEME,
    id: text(source.id) || ANGELCARE_FLAGSHIP_THEME.id,
    name: text(source.name) || ANGELCARE_FLAGSHIP_THEME.name,
    surface: color('surface', ANGELCARE_FLAGSHIP_THEME.surface),
    surfaceSoft: color('surfaceSoft', ANGELCARE_FLAGSHIP_THEME.surfaceSoft),
    ink: color('ink', ANGELCARE_FLAGSHIP_THEME.ink),
    muted: color('muted', ANGELCARE_FLAGSHIP_THEME.muted),
    navy: color('navy', ANGELCARE_FLAGSHIP_THEME.navy),
    navy2: color('navy2', ANGELCARE_FLAGSHIP_THEME.navy2),
    blue: color('blue', ANGELCARE_FLAGSHIP_THEME.blue),
    red: color('red', ANGELCARE_FLAGSHIP_THEME.red),
    line: color('line', ANGELCARE_FLAGSHIP_THEME.line),
    warm: color('warm', ANGELCARE_FLAGSHIP_THEME.warm),
    contentWidth: Math.min(1800, Math.max(960, numberValue(source.contentWidth, 1460))),
    sectionRadius: Math.min(64, Math.max(0, numberValue(source.sectionRadius, 28))),
    cardRadius: Math.min(48, Math.max(0, numberValue(source.cardRadius, 20))),
    spacingScale: Math.min(1.6, Math.max(.65, numberValue(source.spacingScale, 1))),
    headingScale: Math.min(1.4, Math.max(.8, numberValue(source.headingScale, 1))),
    bodyScale: Math.min(1.25, Math.max(.85, numberValue(source.bodyScale, 1))),
    headerVariant: source.headerVariant === 'compact' || source.headerVariant === 'editorial' ? source.headerVariant : 'classic',
    density: source.density === 'compact' || source.density === 'cinematic' ? source.density : 'comfortable',
  }
}

function normalizeDocument(value: unknown): HomepageThemeStudioDocument {
  const source = row(value)
  const locale = source.locale === 'en' || source.locale === 'ar' ? source.locale : 'fr'
  return {
    schemaVersion: 1,
    locale,
    theme: normalizeTheme(source.theme),
    sections: rows(source.sections) as unknown as HomepageThemeStudioDocument['sections'],
    campaigns: rows(source.campaigns) as unknown as HomepageThemeStudioDocument['campaigns'],
    categories: rows(source.categories) as unknown as HomepageThemeStudioDocument['categories'],
    savedAt: text(source.savedAt) || new Date().toISOString(),
  }
}

export async function latestThemeStudioDraft(locale: 'fr' | 'en' | 'ar'): Promise<ThemeStudioDraftResponse | null> {
  const db = await createServiceClient()
  const { data, error } = await db.from('angelcare_marketplace_homepage_versions').select('*').eq('locale', locale).eq('status', 'draft').order('created_at', { ascending: false }).limit(25)
  if (error) throw new MarketplaceError('INTERNAL_ERROR', 'Impossible de charger le brouillon Theme Studio.', { cause: error, retryable: true })
  for (const record of rows(data)) {
    const snapshot = row(record.snapshot)
    if (!snapshot.theme_studio) continue
    return { id: text(record.id), version: numberValue(record.version), status: text(record.status), document: normalizeDocument(snapshot.theme_studio), created_at: text(record.created_at), updated_at: text(record.updated_at) }
  }
  return null
}

async function nextVersion(locale: string): Promise<number> {
  const db = await createServiceClient()
  const { data } = await db.from('angelcare_marketplace_homepage_versions').select('version').eq('locale', locale).order('version', { ascending: false }).limit(1)
  return numberValue(rows(data)[0]?.version, 0) + 1
}

export async function saveThemeStudioDraft(documentInput: unknown, context: MarketplaceRequestContext, requestId: string, request?: Request): Promise<ThemeStudioDraftResponse> {
  const document = normalizeDocument(documentInput)
  const db = await createServiceClient()
  const version = await nextVersion(document.locale)
  const now = new Date().toISOString()
  const { data, error } = await db.from('angelcare_marketplace_homepage_versions').insert({
    locale: document.locale,
    territory_id: null,
    version,
    status: 'draft',
    snapshot: { theme_studio: { ...document, savedAt: now } },
    owner_id: context.actor.id,
    created_by: context.actor.id,
    updated_by: context.actor.id,
  }).select('*').single()
  if (error || !data) throw new MarketplaceError('INTERNAL_ERROR', 'Impossible d’enregistrer le brouillon Theme Studio.', { cause: error || undefined, retryable: true })
  await writeMarketplaceAudit({ context, requestId, request, action: 'homepage.theme_studio.draft_saved', objectType: 'homepage_theme_version', objectId: String(data.id), afterValue: data, source: 'homepage-theme-studio' })
  return { id: String(data.id), version: Number(data.version), status: String(data.status), document: { ...document, savedAt: now }, created_at: String(data.created_at || ''), updated_at: String(data.updated_at || '') }
}

export async function publishThemeStudioDocument(documentInput: unknown, context: MarketplaceRequestContext, requestId: string, request?: Request) {
  const document = normalizeDocument(documentInput)
  const db = await createServiceClient()
  const now = new Date().toISOString()

  for (const section of document.sections) {
    const payload = {
      section_key: String(section.section_key || ''), section_type: String(section.section_type || 'custom_product_grid'), locale: document.locale,
      title: String(section.title || ''), subtitle: section.subtitle || null, layout_variant: String(section.layout_variant || 'rail'), sort_order: Number(section.sort_order || 0),
      settings: row(section.settings), visible: section.visible !== false, audience: String(section.audience || 'all'), starts_at: section.starts_at || null,
      ends_at: section.ends_at || null, background_variant: String(section.background_variant || 'white'), accent: String(section.accent || 'navy'), status: String(section.status || 'active'),
      updated_by: context.actor.id, updated_at: now,
    }
    if (String(section.id).startsWith('draft-')) {
      const { error } = await db.from('angelcare_marketplace_homepage_sections').insert({ ...payload, created_by: context.actor.id })
      if (error) throw new MarketplaceError('INTERNAL_ERROR', `Impossible de publier la section ${section.title}.`, { cause: error, retryable: true })
    } else {
      const { error } = await db.from('angelcare_marketplace_homepage_sections').update(payload).eq('id', section.id)
      if (error) throw new MarketplaceError('INTERNAL_ERROR', `Impossible de publier la section ${section.title}.`, { cause: error, retryable: true })
    }
  }

  for (const campaign of document.campaigns) {
    if (!campaign.id || campaign.id.startsWith('draft-')) continue
    const { error } = await db.from('angelcare_marketplace_homepage_campaigns').update({
      title: campaign.title, eyebrow: campaign.eyebrow, subtitle: campaign.subtitle,
      primary_cta_label: campaign.primary_cta_label, primary_cta_href: campaign.primary_cta_href,
      secondary_cta_label: campaign.secondary_cta_label, secondary_cta_href: campaign.secondary_cta_href,
      desktop_asset_url: campaign.desktop_asset_url, tablet_asset_url: campaign.tablet_asset_url, mobile_asset_url: campaign.mobile_asset_url,
      audience: campaign.audience, priority: campaign.priority, status: campaign.status, updated_by: context.actor.id, updated_at: now,
    }).eq('id', campaign.id)
    if (error) throw new MarketplaceError('INTERNAL_ERROR', `Impossible de publier la campagne ${campaign.title}.`, { cause: error, retryable: true })
  }

  for (const category of document.categories) {
    if (!category.id) continue
    const { error } = await db.from('angelcare_marketplace_catalog_categories').update({
      title: category.title, short_description: category.short_description, cover_asset_url: category.cover_asset_url, icon_key: category.icon_key, visual_theme: category.visual_theme, updated_by: context.actor.id, updated_at: now,
    }).eq('id', category.id)
    if (error) throw new MarketplaceError('INTERNAL_ERROR', `Impossible de publier la catégorie ${category.title}.`, { cause: error, retryable: true })
  }

  const version = await nextVersion(document.locale)
  const { data: versionRow, error: versionError } = await db.from('angelcare_marketplace_homepage_versions').insert({
    locale: document.locale, territory_id: null, version, status: 'published', snapshot: { theme_studio: { ...document, savedAt: now } },
    owner_id: context.actor.id, created_by: context.actor.id, updated_by: context.actor.id, published_at: now,
  }).select('*').single()
  if (versionError || !versionRow) throw new MarketplaceError('INTERNAL_ERROR', 'Impossible de créer la version publiée du Theme Studio.', { cause: versionError || undefined, retryable: true })

  await db.from('angelcare_marketplace_homepage_versions').update({ status: 'superseded', updated_at: now }).eq('locale', document.locale).eq('status', 'published').neq('id', versionRow.id)
  await db.from('angelcare_marketplace_homepage_versions').update({ status: 'superseded', updated_at: now }).eq('locale', document.locale).eq('status', 'draft')
  await db.from('angelcare_marketplace_homepage_release_dossiers').insert({
    homepage_version_id: versionRow.id, locale: document.locale, territory_id: null, status: 'published', release_title: `Theme Studio · ${document.theme.name} · v${version}`,
    scope: { theme: document.theme.id, sections: document.sections.length, campaigns: document.campaigns.length, categories: document.categories.length }, readiness: { runtime_parity: true, explicit_publication: true },
    owner_id: context.actor.id, created_by: context.actor.id, updated_by: context.actor.id, published_at: now,
    publication_evidence: { source: 'theme-studio', version, published_at: now },
  })
  await writeMarketplaceAudit({ context, requestId, request, action: 'homepage.theme_studio.published', objectType: 'homepage_theme_version', objectId: String(versionRow.id), afterValue: versionRow, source: 'homepage-theme-studio' })
  return { id: String(versionRow.id), version, status: 'published', published_at: now, theme: document.theme }
}


export async function restoreThemeStudioVersion(versionId: string, context: MarketplaceRequestContext, requestId: string, request?: Request) {
  const db = await createServiceClient()
  const { data, error } = await db.from('angelcare_marketplace_homepage_versions').select('*').eq('id', versionId).maybeSingle()
  if (error || !data) throw new MarketplaceError('NOT_FOUND', 'Version Theme Studio introuvable.', { cause: error || undefined })
  const snapshot = row(data.snapshot)
  if (!snapshot.theme_studio) throw new MarketplaceError('VALIDATION_ERROR', 'Cette version ne contient pas de document Theme Studio restaurable.')
  const result = await publishThemeStudioDocument(snapshot.theme_studio, context, requestId, request)
  await writeMarketplaceAudit({ context, requestId, request, action: 'homepage.theme_studio.restored', objectType: 'homepage_theme_version', objectId: String(result.id), beforeValue: data, afterValue: result, reason: `Restore source version ${versionId}`, source: 'homepage-theme-studio' })
  return { ...result, restored_from_version_id: versionId }
}

export async function publishedThemeStudioState(locale: 'fr' | 'en' | 'ar'): Promise<{ theme: HomepageThemeConfig; active: boolean }> {
  const db = await createServiceClient()
  const { data } = await db.from('angelcare_marketplace_homepage_versions').select('snapshot').eq('locale', locale).eq('status', 'published').order('published_at', { ascending: false }).limit(10)
  for (const record of rows(data)) {
    const snapshot = row(record.snapshot)
    const themeStudio = row(snapshot.theme_studio)
    if (themeStudio.theme) return { theme: normalizeTheme(themeStudio.theme), active: true }
  }
  return { theme: ANGELCARE_FLAGSHIP_THEME, active: false }
}

export async function publishedThemeForLocale(locale: 'fr' | 'en' | 'ar'): Promise<HomepageThemeConfig> {
  return (await publishedThemeStudioState(locale)).theme
}
