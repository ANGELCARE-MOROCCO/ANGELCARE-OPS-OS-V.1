import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) as any
}

function cell(value: unknown) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}

export async function GET() {
  const supabase = client()
  if (!supabase) return NextResponse.json({ ok: false, message: 'Supabase non configuré.' }, { status: 500 })

  const { data, error } = await supabase.from('core_organizations').select('*').limit(5000)
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 400 })

  const rows = Array.isArray(data) ? data : []
  const lines = ['id,name,city,status,stage,organization_type,created_at']
  for (const row of rows) {
    lines.push([row.id, row.name || row.display_name || row.legal_name, row.city, row.status, row.stage, row.organization_type, row.created_at].map(cell).join(','))
  }

  return new Response(lines.join('\n'), {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="traininghub-partners-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
