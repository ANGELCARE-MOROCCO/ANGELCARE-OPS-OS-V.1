import { createServiceClient } from '@/lib/supabase/server'
import { writeMarketplaceAudit } from '../audit/write-audit'
import type { MarketplaceRequestContext } from '../domain/types'
import { MarketplaceError } from '../server/errors'
import { validatePageForPublication, validatePageTransition } from './validation'
import type { CmsBlock, CmsCta, CmsMenu, CmsPage, CmsPageDetail, CmsPageStatus, PreviewSession, PublicationJob } from './types'

function dbError(operation: string, error: { code?: string; message?: string } | null) {
  const missing = error?.code === '42P01' || String(error?.message || '').includes('angelcare_marketplace_cms_')
  return new MarketplaceError(missing ? 'CONFIGURATION_ERROR' : 'INTERNAL_ERROR', missing ? 'Les migrations Experience Builder doivent être appliquées.' : `Le CMS n’a pas pu ${operation}.`)
}

export async function listPages(filters?: { status?: string; locale?: string; territoryId?: string | null }): Promise<CmsPage[]> {
  const supabase = await createServiceClient()
  let query = supabase.from('angelcare_marketplace_cms_pages').select('*').order('updated_at', { ascending: false }).limit(300)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.locale) query = query.eq('locale', filters.locale)
  if (filters?.territoryId) query = query.eq('territory_id', filters.territoryId)
  const { data, error } = await query
  if (error) throw dbError('charger les pages', error)
  return (data || []) as CmsPage[]
}

export async function getPageDetail(pageId: string): Promise<CmsPageDetail> {
  const supabase = await createServiceClient()
  const [{ data: page, error: pageError }, { data: blocks, error: blockError }, { data: versions, error: versionError }] = await Promise.all([
    supabase.from('angelcare_marketplace_cms_pages').select('*').eq('id', pageId).single(),
    supabase.from('angelcare_marketplace_cms_blocks').select('*').eq('page_id', pageId).neq('status','archived').order('sort_order'),
    supabase.from('angelcare_marketplace_cms_page_versions').select('*').eq('page_id', pageId).order('version_number', { ascending: false }).limit(50),
  ])
  if (pageError || !page) throw dbError('charger la page', pageError)
  if (blockError) throw dbError('charger les blocs', blockError)
  if (versionError) throw dbError('charger les versions', versionError)
  return { page: page as CmsPage, blocks: (blocks || []) as CmsBlock[], versions: (versions || []) as CmsPageDetail['versions'] }
}

export async function createPage(input: { routeKey: string; locale: string; territoryId?: string | null; title: string; navigationLabel?: string | null; slug: string; description?: string | null; sensitive?: boolean; seoTitle?: string | null; seoDescription?: string | null; context: MarketplaceRequestContext; requestId: string }): Promise<CmsPage> {
  const supabase = await createServiceClient()
  const payload = { route_key: input.routeKey, locale: input.locale, territory_id: input.territoryId || input.context.territoryId, title: input.title, navigation_label: input.navigationLabel || null, slug: input.slug, description: input.description || null, sensitive: Boolean(input.sensitive), seo_title: input.seoTitle || null, seo_description: input.seoDescription || null, source_locale: 'fr', translation_status: input.locale === 'fr' ? 'source' : 'draft', owner_id: input.context.actor.id, created_by: input.context.actor.id, updated_by: input.context.actor.id }
  const { data, error } = await supabase.from('angelcare_marketplace_cms_pages').insert(payload).select('*').single()
  if (error || !data) throw dbError('créer la page', error)
  await writeMarketplaceAudit({ context: input.context, requestId: input.requestId, action: 'marketplace.cms.page_created', objectType: 'cms_page', objectId: String(data.id), result: 'success', severity: 'info', afterValue: data, source: 'ultra-delivery-01-experience-builder' })
  return data as CmsPage
}

export async function updatePage(input: { pageId: string; patch: Record<string, unknown>; changeSummary: string; context: MarketplaceRequestContext; requestId: string }): Promise<CmsPage> {
  const supabase = await createServiceClient()
  const detail = await getPageDetail(input.pageId)
  const snapshot = { page: detail.page, blocks: detail.blocks }
  const nextVersion = detail.page.current_version + 1
  const { error: versionError } = await supabase.from('angelcare_marketplace_cms_page_versions').insert({ page_id: input.pageId, version_number: detail.page.current_version, title: detail.page.title, description: detail.page.description, slug: detail.page.slug, status: detail.page.status, snapshot, change_summary: input.changeSummary, created_by: input.context.actor.id })
  if (versionError) throw dbError('versionner la page', versionError)
  const { data, error } = await supabase.from('angelcare_marketplace_cms_pages').update({ ...input.patch, current_version: nextVersion, updated_by: input.context.actor.id, updated_at: new Date().toISOString() }).eq('id', input.pageId).select('*').single()
  if (error || !data) throw dbError('mettre à jour la page', error)
  await writeMarketplaceAudit({ context: input.context, requestId: input.requestId, action: 'marketplace.cms.page_updated', objectType: 'cms_page', objectId: input.pageId, result: 'success', severity: 'info', reason: input.changeSummary, beforeValue: detail.page, afterValue: data, source: 'ultra-delivery-01-experience-builder' })
  return data as CmsPage
}

export async function saveBlocks(input: { pageId: string; blocks: Array<{ id?: string; blockKey: string; blockType: string; sortOrder: number; content: Record<string, unknown>; settings?: Record<string, unknown>; status?: string }>; context: MarketplaceRequestContext; requestId: string }): Promise<CmsBlock[]> {
  const supabase = await createServiceClient()
  const detail = await getPageDetail(input.pageId)
  const incomingIds = input.blocks.map((block) => block.id).filter((value): value is string => Boolean(value))
  if (detail.blocks.length) {
    const archiveIds = detail.blocks.filter((block) => !incomingIds.includes(block.id)).map((block) => block.id)
    if (archiveIds.length) await supabase.from('angelcare_marketplace_cms_blocks').update({ status: 'archived', updated_at: new Date().toISOString() }).in('id', archiveIds)
  }
  const rows = input.blocks.map((block) => ({ id: block.id, page_id: input.pageId, block_key: block.blockKey, block_type: block.blockType, sort_order: block.sortOrder, content: block.content, settings: block.settings || {}, status: block.status || 'active', territory_id: detail.page.territory_id, locale: detail.page.locale, updated_by: input.context.actor.id }))
  const { data, error } = await supabase.from('angelcare_marketplace_cms_blocks').upsert(rows).select('*')
  if (error) throw dbError('enregistrer les blocs', error)
  await writeMarketplaceAudit({ context: input.context, requestId: input.requestId, action: 'marketplace.cms.blocks_saved', objectType: 'cms_page', objectId: input.pageId, result: 'success', severity: 'info', afterValue: { blockCount: rows.length }, source: 'ultra-delivery-01-experience-builder' })
  return (data || []) as CmsBlock[]
}

export async function transitionPage(input: { pageId: string; target: CmsPageStatus; reason: string; context: MarketplaceRequestContext; requestId: string }): Promise<CmsPage> {
  const supabase = await createServiceClient()
  const detail = await getPageDetail(input.pageId)
  validatePageTransition(detail.page.status, input.target)
  if (input.target === 'published' || input.target === 'scheduled') validatePageForPublication(detail.page, detail.blocks)
  const { data, error } = await supabase.rpc('angelcare_marketplace_transition_cms_page', { p_page_id: input.pageId, p_target_status: input.target, p_reason: input.reason, p_actor_id: input.context.actor.id }).single()
  if (error || !data) throw dbError('changer le statut', error)
  await writeMarketplaceAudit({ context: input.context, requestId: input.requestId, action: `marketplace.cms.page_${input.target}`, objectType: 'cms_page', objectId: input.pageId, result: 'success', severity: ['published','retired','archived'].includes(input.target) ? 'warning' : 'info', reason: input.reason, beforeValue: detail.page, afterValue: data, source: 'ultra-delivery-01-experience-builder' })
  return data as CmsPage
}

export async function rollbackPage(input: { pageId: string; versionNumber: number; reason: string; context: MarketplaceRequestContext; requestId: string }): Promise<CmsPage> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase.rpc('angelcare_marketplace_rollback_cms_page', { p_page_id: input.pageId, p_version_number: input.versionNumber, p_reason: input.reason, p_actor_id: input.context.actor.id }).single()
  if (error || !data) throw dbError('restaurer la version', error)
  await writeMarketplaceAudit({ context: input.context, requestId: input.requestId, action: 'marketplace.cms.page_rolled_back', objectType: 'cms_page', objectId: input.pageId, result: 'success', severity: 'warning', reason: input.reason, afterValue: data, source: 'ultra-delivery-01-experience-builder' })
  return data as CmsPage
}

export async function listMenus(): Promise<CmsMenu[]> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase.from('angelcare_marketplace_cms_menus').select('*,items:angelcare_marketplace_cms_menu_items(*)').order('name')
  if (error) throw dbError('charger les menus', error)
  return (data || []) as CmsMenu[]
}

export async function listCtas(): Promise<CmsCta[]> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase.from('angelcare_marketplace_cms_ctas').select('*').order('cta_key')
  if (error) throw dbError('charger les CTA', error)
  return (data || []) as CmsCta[]
}

export async function listPublicationJobs(): Promise<PublicationJob[]> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase.from('angelcare_marketplace_cms_publication_jobs').select('*').order('created_at', { ascending: false }).limit(100)
  if (error) throw dbError('charger la runway de publication', error)
  return (data || []) as PublicationJob[]
}

export async function createPreview(input: { pageId: string; versionNumber?: number; context: MarketplaceRequestContext }): Promise<PreviewSession> {
  const supabase = await createServiceClient()
  const page = await getPageDetail(input.pageId)
  const token = crypto.randomUUID().replaceAll('-','')
  const { data, error } = await supabase.from('angelcare_marketplace_cms_preview_sessions').insert({ preview_token: token, page_id: input.pageId, version_number: input.versionNumber || page.page.current_version, locale: page.page.locale, territory_id: page.page.territory_id, created_by: input.context.actor.id, expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() }).select('*').single()
  if (error || !data) throw dbError('créer la prévisualisation', error)
  return data as PreviewSession
}

export async function getPreview(token: string): Promise<CmsPageDetail | null> {
  const supabase = await createServiceClient()
  const { data: session, error } = await supabase.from('angelcare_marketplace_cms_preview_sessions').select('*').eq('preview_token', token).gt('expires_at', new Date().toISOString()).maybeSingle()
  if (error || !session) return null
  return getPageDetail(String(session.page_id))
}
