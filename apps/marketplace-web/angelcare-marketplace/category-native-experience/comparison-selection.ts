import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'
import { getCustomerContext } from '../customer-commerce/customer-auth'
import { getDiscoveryItemById } from '../catalog-discovery/repository'
import type { CatalogLocale } from '../catalog-discovery/types'

const VISITOR_COOKIE = 'angelcare_marketplace_visitor'
type Row = { catalog_item_id?: unknown; updated_at?: unknown }

export async function comparisonSelectionSlugs(locale: CatalogLocale, limit = 4): Promise<string[]> {
  const store = await cookies()
  const visitorReference = store.get(VISITOR_COOKIE)?.value || ''
  const customer = await getCustomerContext().catch(() => null)
  if (!visitorReference && !customer?.account.id) return []

  const db = await createServiceClient()
  let query = db
    .from('angelcare_marketplace_homepage_visitor_selections')
    .select('catalog_item_id,updated_at')
    .eq('selection_type', 'compare')
    .eq('active', true)
    .order('updated_at', { ascending: false })
    .limit(Math.max(1, Math.min(limit * 3, 24)))

  if (customer?.account.id && visitorReference) {
    query = query.or(`customer_account_id.eq.${customer.account.id},visitor_reference.eq.${visitorReference}`)
  } else if (customer?.account.id) {
    query = query.eq('customer_account_id', customer.account.id)
  } else {
    query = query.eq('visitor_reference', visitorReference)
  }

  const { data, error } = await query
  if (error || !data?.length) return []

  const ids = [...new Set((data as Row[]).map((row) => String(row.catalog_item_id || '')).filter(Boolean))]
  const items = (await Promise.all(ids.map((id) => getDiscoveryItemById({ locale, id }).catch(() => null)))).filter(Boolean)
  return items.slice(0, limit).map((item) => item!.slug)
}
