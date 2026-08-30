import { createServiceClient } from '@/lib/supabase/server'
import { MarketplaceError } from '../server/errors'
import type { CmsBlock, CmsMenuItem, CmsPage } from '../experience-builder/types'
import type { PublicInquiryInput, PublicInquiryRecord, PublicPageExperience } from './types'

function publicError(operation: string, error: { code?: string; message?: string } | null) {
  const missing = error?.code === '42P01' || String(error?.message || '').includes('angelcare_marketplace_cms_')
  return new MarketplaceError(missing ? 'CONFIGURATION_ERROR' : 'INTERNAL_ERROR', missing ? 'L’univers public nécessite les migrations Ultra Delivery 1/5.' : `L’univers public n’a pas pu ${operation}.`)
}


export function publicRoutePath(slug?: string[]): string {
  return slug?.filter(Boolean).join('/') || 'accueil'
}

export async function listPublicInquiries(): Promise<PublicInquiryRecord[]> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('angelcare_marketplace_public_inquiries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300)
  if (error) throw publicError('charger les entrées publiques', error)
  return (data || []) as PublicInquiryRecord[]
}

export async function resolveTerritoryId(code?: string | null): Promise<string | null> {
  if (!code) return null
  const supabase = await createServiceClient()
  const { data } = await supabase.from('angelcare_marketplace_territories').select('id').eq('territory_code', code).maybeSingle()
  return data?.id ? String(data.id) : null
}

export async function getPublicPage(input: { locale: string; slug: string; territoryCode?: string | null }): Promise<PublicPageExperience | null> {
  const supabase = await createServiceClient()
  const territoryId = await resolveTerritoryId(input.territoryCode || 'MA-MASTER')
  const loadPage = async (locale: string) => {
    let query = supabase.from('angelcare_marketplace_cms_pages').select('*').eq('locale', locale).eq('slug', input.slug).eq('status', 'published')
    if (territoryId) query = query.or(`territory_id.is.null,territory_id.eq.${territoryId}`)
    else query = query.is('territory_id', null)
    return query.order('territory_id', { ascending: false, nullsFirst: false }).limit(1)
  }
  const localized = await loadPage(input.locale)
  if (localized.error) throw publicError('charger la page', localized.error)
  const fallback = !localized.data?.length && input.locale !== 'fr' ? await loadPage('fr') : null
  if (fallback?.error) throw publicError('charger la page française de repli', fallback.error)
  const page = (localized.data?.[0] || fallback?.data?.[0]) as CmsPage | undefined
  if (!page) return null
  const [{ data: blocks, error: blockError }, localizedMenu] = await Promise.all([
    supabase.from('angelcare_marketplace_cms_blocks').select('*').eq('page_id', page.id).eq('status', 'active').order('sort_order'),
    supabase.from('angelcare_marketplace_public_navigation_v').select('*').eq('locale', input.locale).or(territoryId ? `territory_id.is.null,territory_id.eq.${territoryId}` : 'territory_id.is.null').order('sort_order'),
  ])
  if (blockError) throw publicError('charger les blocs', blockError)
  if (localizedMenu.error) throw publicError('charger la navigation', localizedMenu.error)
  const fallbackMenu = !localizedMenu.data?.length && input.locale !== 'fr'
    ? await supabase.from('angelcare_marketplace_public_navigation_v').select('*').eq('locale', 'fr').or(territoryId ? `territory_id.is.null,territory_id.eq.${territoryId}` : 'territory_id.is.null').order('sort_order')
    : null
  if (fallbackMenu?.error) throw publicError('charger la navigation française de repli', fallbackMenu.error)
  return { page, blocks: (blocks || []) as CmsBlock[], navigation: (localizedMenu.data?.length ? localizedMenu.data : fallbackMenu?.data || []) as CmsMenuItem[] }
}

export async function createPublicInquiry(input: PublicInquiryInput, request: Request): Promise<PublicInquiryRecord> {
  if (input.honeypot) throw new MarketplaceError('VALIDATION_ERROR', 'Soumission non acceptée.')
  if (!input.consent) throw new MarketplaceError('VALIDATION_ERROR', 'Votre accord de contact est requis.', { fieldErrors: { consent: ['Accord requis.'] } })
  if (!input.fullName.trim() || input.message.trim().length < 10) throw new MarketplaceError('VALIDATION_ERROR', 'Nom et besoin détaillé sont requis.')
  if (!input.email?.trim() && !input.phone?.trim()) throw new MarketplaceError('VALIDATION_ERROR', 'Un email ou un téléphone est requis.')
  const supabase = await createServiceClient()
  const territoryId = await resolveTerritoryId(input.territoryCode || 'MA-MASTER')
  const fingerprint = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
  const { data, error } = await supabase.from('angelcare_marketplace_public_inquiries').insert({ audience: input.audience, source_route: input.sourceRoute, full_name: input.fullName.trim(), email: input.email?.trim() || null, phone: input.phone?.trim() || null, organization: input.organization?.trim() || null, city: input.city?.trim() || null, message: input.message.trim(), consent_granted_at: new Date().toISOString(), locale: input.locale, territory_id: territoryId, request_fingerprint: fingerprint }).select('*').single()
  if (error || !data) throw publicError('enregistrer votre demande', error)
  await supabase.from('angelcare_marketplace_public_events').insert({ event_name: 'public_inquiry_submitted', route: input.sourceRoute, locale: input.locale, territory_id: territoryId, inquiry_id: data.id, event_data: { audience: input.audience } })
  return data as PublicInquiryRecord
}

export async function recordPublicEvent(input: { eventName: string; route: string; locale: string; territoryCode?: string | null; data?: Record<string, unknown> }) {
  const supabase = await createServiceClient()
  const territoryId = await resolveTerritoryId(input.territoryCode || 'MA-MASTER')
  await supabase.from('angelcare_marketplace_public_events').insert({ event_name: input.eventName, route: input.route, locale: input.locale, territory_id: territoryId, event_data: input.data || {} })
}
