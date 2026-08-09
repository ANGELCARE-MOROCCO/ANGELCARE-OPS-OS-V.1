import { cookies } from 'next/headers'
import { requireMarketplaceApiContext } from '../auth/context'
import { writeMarketplaceAudit } from '../audit/write-audit'
import { MarketplaceError } from '../server/errors'
import { apiFailure, apiSuccess, cleanOptionalText, cleanText, parseJsonObject, requestId } from '../server/request'
import { resolveTerritoryId } from '../public-universe/repository'
import {
  archiveHomepageAdminRecord,
  createHomepageAdminRecord,
  listHomepageAdminKind,
  updateHomepageAdminRecord,
} from './repository'
import type { HomepageAdminKind } from './types'
import { createServiceClient } from '@/lib/supabase/server'

const VISITOR_COOKIE = 'angelcare_marketplace_visitor'
const kinds = new Set<HomepageAdminKind>(['campaigns', 'sections', 'collections', 'placements', 'audience-rules', 'territory-rules', 'assets'])

function adminKind(value: string): HomepageAdminKind {
  if (!kinds.has(value as HomepageAdminKind)) throw new MarketplaceError('NOT_FOUND', 'Registre Homepage inconnu.')
  return value as HomepageAdminKind
}

function allowedStatus(value: unknown): string {
  const result = cleanText(value, 40)
  return result || 'draft'
}

function adminPayload(kind: HomepageAdminKind, body: Record<string, unknown>, context: { actor: { id: string }; territoryId: string | null }): Record<string, unknown> {
  const common = { updated_by: context.actor.id }
  if (kind === 'campaigns') return {
    ...common, campaign_key: cleanText(body.campaign_key, 120), locale: cleanText(body.locale, 5) || 'fr', territory_id: cleanOptionalText(body.territory_id, 64) || context.territoryId,
    title: cleanText(body.title, 220), eyebrow: cleanOptionalText(body.eyebrow, 160), subtitle: cleanOptionalText(body.subtitle, 700),
    primary_cta_label: cleanText(body.primary_cta_label, 120), primary_cta_href: cleanText(body.primary_cta_href, 500),
    secondary_cta_label: cleanOptionalText(body.secondary_cta_label, 120), secondary_cta_href: cleanOptionalText(body.secondary_cta_href, 500),
    desktop_asset_url: cleanText(body.desktop_asset_url, 700), tablet_asset_url: cleanOptionalText(body.tablet_asset_url, 700), mobile_asset_url: cleanOptionalText(body.mobile_asset_url, 700),
    audience: cleanText(body.audience, 40) || 'all', priority: Number(body.priority || 100), starts_at: body.starts_at || new Date().toISOString(), ends_at: body.ends_at || null,
    status: allowedStatus(body.status), created_by: context.actor.id,
  }
  if (kind === 'sections') return {
    ...common, section_key: cleanText(body.section_key, 120), locale: cleanText(body.locale, 5) || 'fr', territory_id: cleanOptionalText(body.territory_id, 64) || context.territoryId,
    section_type: cleanText(body.section_type, 60) || 'collection_rail', title: cleanText(body.title, 220), subtitle: cleanOptionalText(body.subtitle, 600),
    layout_variant: cleanText(body.layout_variant, 80) || 'rail', sort_order: Number(body.sort_order || 100), settings: body.settings && typeof body.settings === 'object' ? body.settings : {}, status: allowedStatus(body.status), created_by: context.actor.id,
  }
  if (kind === 'collections') return {
    ...common, collection_key: cleanText(body.collection_key, 120), locale: cleanText(body.locale, 5) || 'fr', territory_id: cleanOptionalText(body.territory_id, 64) || context.territoryId,
    title: cleanText(body.title, 220), subtitle: cleanOptionalText(body.subtitle, 600), selection_method: cleanText(body.selection_method, 80) || 'editorial',
    layout_variant: cleanText(body.layout_variant, 80) || 'service_cards', sort_order: Number(body.sort_order || 100), status: allowedStatus(body.status), created_by: context.actor.id,
  }
  if (kind === 'placements') return {
    ...common, section_id: cleanOptionalText(body.section_id, 64), collection_id: cleanOptionalText(body.collection_id, 64), catalog_item_id: cleanOptionalText(body.catalog_item_id, 64),
    placement_key: cleanText(body.placement_key, 150), locale: cleanText(body.locale, 5) || 'fr', territory_id: cleanOptionalText(body.territory_id, 64) || context.territoryId,
    audience: cleanText(body.audience, 40) || 'all', priority: Number(body.priority || 100), sort_order: Number(body.sort_order || 100),
    starts_at: body.starts_at || new Date().toISOString(), ends_at: body.ends_at || null, status: allowedStatus(body.status), created_by: context.actor.id,
  }
  if (kind === 'audience-rules') return {
    ...common, rule_key: cleanText(body.rule_key, 120), audience: cleanText(body.audience, 40), locale: cleanText(body.locale, 5) || 'fr',
    conditions: body.conditions && typeof body.conditions === 'object' ? body.conditions : {}, outcome: body.outcome && typeof body.outcome === 'object' ? body.outcome : {},
    priority: Number(body.priority || 100), status: allowedStatus(body.status), created_by: context.actor.id,
  }
  if (kind === 'territory-rules') return {
    ...common, rule_key: cleanText(body.rule_key, 120), territory_id: cleanOptionalText(body.territory_id, 64) || context.territoryId,
    conditions: body.conditions && typeof body.conditions === 'object' ? body.conditions : {}, outcome: body.outcome && typeof body.outcome === 'object' ? body.outcome : {},
    priority: Number(body.priority || 100), status: allowedStatus(body.status), created_by: context.actor.id,
  }
  return {
    ...common, campaign_id: cleanOptionalText(body.campaign_id, 64), asset_key: cleanText(body.asset_key, 160), asset_type: cleanText(body.asset_type, 50) || 'image',
    desktop_url: cleanText(body.desktop_url, 700), tablet_url: cleanOptionalText(body.tablet_url, 700), mobile_url: cleanOptionalText(body.mobile_url, 700),
    arabic_url: cleanOptionalText(body.arabic_url, 700), alt_text_fr: cleanText(body.alt_text_fr, 300), alt_text_en: cleanOptionalText(body.alt_text_en, 300), alt_text_ar: cleanOptionalText(body.alt_text_ar, 300),
    focal_point: body.focal_point && typeof body.focal_point === 'object' ? body.focal_point : {}, rights_status: cleanText(body.rights_status, 50) || 'owned', status: allowedStatus(body.status), created_by: context.actor.id,
  }
}

export async function handleHomepageAdmin(request: Request, rawKind: string): Promise<Response> {
  const rid = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.cms.pages.manage')
    const kind = adminKind(rawKind)
    if (request.method === 'GET') return apiSuccess(await listHomepageAdminKind(kind), { requestId: rid })
    const body = await parseJsonObject(request)
    if (request.method === 'POST') {
      const created = await createHomepageAdminRecord(kind, adminPayload(kind, body, context))
      await writeMarketplaceAudit({ context, requestId: rid, action: `homepage.${kind}.created`, objectType: `homepage_${kind}`, objectId: String(created.id), afterValue: created, request })
      return apiSuccess(created, { requestId: rid, status: 201 })
    }
    const id = cleanText(body.id, 64)
    if (!id) throw new MarketplaceError('VALIDATION_ERROR', 'Identifiant requis.')
    if (request.method === 'PATCH') {
      const updated = await updateHomepageAdminRecord(kind, id, adminPayload(kind, body, context))
      await writeMarketplaceAudit({ context, requestId: rid, action: `homepage.${kind}.updated`, objectType: `homepage_${kind}`, objectId: id, afterValue: updated, request })
      return apiSuccess(updated, { requestId: rid })
    }
    if (request.method === 'DELETE') {
      await archiveHomepageAdminRecord(kind, id)
      await writeMarketplaceAudit({ context, requestId: rid, action: `homepage.${kind}.archived`, objectType: `homepage_${kind}`, objectId: id, request })
      return apiSuccess({ archived: true }, { requestId: rid })
    }
    throw new MarketplaceError('VALIDATION_ERROR', 'Méthode non prise en charge.')
  } catch (error) { return apiFailure(error, rid) }
}

export async function handleHomepageEngagement(request: Request): Promise<Response> {
  const rid = requestId(request)
  try {
    const store = await cookies()
    let visitorReference = store.get(VISITOR_COOKIE)?.value || ''
    if (!visitorReference) visitorReference = crypto.randomUUID()
    const supabase = await createServiceClient()
    if (request.method === 'GET') {
      const { data, error } = await supabase.from('angelcare_marketplace_homepage_visitor_selections').select('catalog_item_id,selection_type').eq('visitor_reference', visitorReference).eq('active', true)
      if (error) throw new MarketplaceError('INTERNAL_ERROR', 'Impossible de charger les sélections.', { cause: error })
      const response = apiSuccess(data || [], { requestId: rid })
      response.cookies.set(VISITOR_COOKIE, visitorReference, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 180, path: '/' })
      return response
    }
    const body = await parseJsonObject(request)
    const eventName = cleanText(body.event_name, 100)
    const locale = cleanText(body.locale, 5) || 'fr'
    const territoryId = await resolveTerritoryId(cleanText(body.territory_code, 30) || 'MA-MASTER')
    const catalogItemId = cleanOptionalText(body.catalog_item_id, 64)
    const selectionType = cleanOptionalText(body.selection_type, 20)
    const active = body.active !== false
    if (catalogItemId && (selectionType === 'saved' || selectionType === 'compare')) {
      const { error } = await supabase.from('angelcare_marketplace_homepage_visitor_selections').upsert({ visitor_reference: visitorReference, selection_type: selectionType, catalog_item_id: catalogItemId, locale, territory_id: territoryId, active, updated_at: new Date().toISOString() }, { onConflict: 'visitor_reference,selection_type,catalog_item_id' })
      if (error) throw new MarketplaceError('INTERNAL_ERROR', 'La sélection n’a pas pu être enregistrée.', { cause: error })
    }
    await supabase.from('angelcare_marketplace_homepage_interactions').insert({ visitor_reference: visitorReference, event_name: eventName || 'homepage.interaction', locale, territory_id: territoryId, campaign_id: cleanOptionalText(body.campaign_id, 64), collection_id: cleanOptionalText(body.collection_id, 64), catalog_item_id: catalogItemId, category_key: cleanOptionalText(body.category_key, 120), route: cleanText(body.route, 500), event_data: body.event_data && typeof body.event_data === 'object' ? body.event_data : {} })
    const response = apiSuccess({ recorded: true }, { requestId: rid, status: 201 })
    response.cookies.set(VISITOR_COOKIE, visitorReference, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 180, path: '/' })
    return response
  } catch (error) { return apiFailure(error, rid) }
}
