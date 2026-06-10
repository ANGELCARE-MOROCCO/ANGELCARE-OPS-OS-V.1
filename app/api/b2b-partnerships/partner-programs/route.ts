import { NextRequest, NextResponse } from 'next/server'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'

function optionalString(value: unknown) { return typeof value === 'string' && value.trim() ? value.trim() : null }
function list(value: unknown) { return Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim()) : [] }

export async function GET() {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()
    if (!actor?.id) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })

    const permission = requireB2BPermission('read', { actorId: actor.id, actorRole: actor.role })
    if (!permission.ok) return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })

    const { data, error } = await db.from('b2b_partner_programs').select('*').eq('is_active', true).order('created_at', { ascending: true })
    if (error) return NextResponse.json({ ok: false, error: 'Unable to load partner programs.' }, { status: 500 })
    return NextResponse.json({ ok: true, data: data ?? [] })
  } catch {
    return NextResponse.json({ ok: false, error: 'Unexpected server error.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()
    if (!actor?.id) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })

    const permission = requireB2BPermission('manage_settings', { actorId: actor.id, actorRole: actor.role })
    if (!permission.ok) return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })

    const body = await req.json()
    const name = optionalString(body.name)
    if (!name) return NextResponse.json({ ok: false, error: 'Program name is required.' }, { status: 400 })

    const { data, error } = await db.from('b2b_partner_programs').insert({
      name,
      sector_focus: optionalString(body.sector_focus),
      description: optionalString(body.description),
      services: list(body.services),
      value_proposition: list(body.value_proposition),
      pricing_models: list(body.pricing_models),
      is_active: body.is_active !== false,
      created_by: actor.id,
      updated_by: actor.id,
    }).select('*').single()

    if (error) return NextResponse.json({ ok: false, error: 'Unable to create partner program.' }, { status: 500 })
    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch {
    return NextResponse.json({ ok: false, error: 'Unexpected server error.' }, { status: 500 })
  }
}
