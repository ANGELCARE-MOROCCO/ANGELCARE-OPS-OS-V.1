import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function safe(supabase: any, table: string) {
  try {
    const { data, error } = await supabase.from(table).select('*').limit(500)
    return error ? [] : data || []
  } catch {
    return []
  }
}

export async function GET() {
  const supabase = await createClient()

  const services = await safe(supabase, 'service_catalog')
  const variations = await safe(supabase, 'service_variations')
  const pricing = await safe(supabase, 'service_pricing_rules')

  const map = new Map<string, any>()
  services.forEach((s: any) => map.set(String(s.id), s))

  const data: any[] = []

  variations.forEach((v: any) => {
    const sid = String(v.service_id || v.catalog_id || '')
    const s = map.get(sid) || {}
    const p = pricing.find((x: any) => String(x.variation_id || x.service_variation_id || '') === String(v.id))

    data.push({
      id: `${sid}-${v.id}`,
      service_id: sid,
      variation_id: v.id,
      service_name: s.name || s.title || s.service_name || v.service_name || 'Service',
      variation_name: v.name || v.title || v.variation_name || v.label || '',
      category: s.category || s.service_category || v.category || 'service',
      price: Number(v.price ?? v.base_price ?? v.unit_price ?? p?.price ?? p?.base_price ?? s.price ?? s.base_price ?? 0),
      description: v.description || s.description || '',
    })
  })

  services.forEach((s: any) => {
    if (!data.some((x: any) => String(x.service_id) === String(s.id))) {
      data.push({
        id: String(s.id),
        service_id: s.id,
        variation_id: null,
        service_name: s.name || s.title || s.service_name || 'Service',
        variation_name: '',
        category: s.category || s.service_category || 'service',
        price: Number(s.price || s.base_price || s.unit_price || 0),
        description: s.description || '',
      })
    }
  })

  return NextResponse.json({ ok: true, data })
}
