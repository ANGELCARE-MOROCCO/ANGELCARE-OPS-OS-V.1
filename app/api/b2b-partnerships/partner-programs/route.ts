import { NextRequest, NextResponse } from 'next/server'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'

async function guard(action: 'read' | 'create' | 'update' = 'read') {
  const db = await getServerB2BDatabaseClient()
  const actor = await getCurrentB2BAppUser()

  if (!actor?.id) {
    return { ok: false as const, db, actor, response: NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 }) }
  }

  const permission = requireB2BPermission(action, {
    actorId: actor.id,
    actorRole: actor.role || actor.role_key,
      permissions: actor.permissions,
  })

  if (!permission.ok) {
    return { ok: false as const, db, actor, response: NextResponse.json({ ok: false, error: permission.error }, { status: permission.status }) }
  }

  return { ok: true as const, db, actor }
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function nullableText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function safeLimit(req: NextRequest, fallback = 120) {
  const url = new URL(req.url)
  return Math.min(Number(url.searchParams.get('limit') || fallback), 500)
}

const fallbackPrograms = [
  {
    id: 'hotel-family-hospitality',
    name: 'ANGELCARE Family Hospitality Partnership',
    sector_focus: 'Hotels, resorts, family hospitality, event venues',
    description: 'Programme destiné aux hôtels souhaitant renforcer l’expérience familiale avec garde encadrée, kids club, workshops enfants et support familles.',
    services: ['On-demand babysitting coordination', 'Kids club animation support', 'Weekend children workshops', 'Family event childcare', 'Hotel guest family support desk'],
    value_proposition: ['Better family guest satisfaction', 'Improved hotel differentiation', 'Additional revenue opportunities', 'Higher comfort for parents'],
    pricing_models: ['Fixed monthly retainer', 'Commission per booking', 'Per event', 'Pilot package', 'Custom'],
    is_active: true,
  },
  {
    id: 'clinic-child-development',
    name: 'ANGELCARE Family & Child Development Partnership',
    sector_focus: 'Pediatric clinics, pediatricians, child development centers',
    description: 'Programme destiné aux cliniques pédiatriques et centres spécialisés pour apporter un accompagnement complémentaire aux familles.',
    services: ['Parent support orientation', 'Child development workshops', 'Post-consultation family support', 'Referral partnership'],
    value_proposition: ['Stronger patient-family experience', 'Added value beyond medical consultation', 'Professional support for parents'],
    pricing_models: ['Fixed monthly retainer', 'Referral partnership', 'Per workshop', 'Pilot package', 'Custom'],
    is_active: true,
  },
]

export async function GET() {
  try {
    const g = await guard('read')
    if (!g.ok) return g.response

    const { data, error } = await g.db.from('b2b_partner_programs').select('*').eq('is_active', true).order('created_at', { ascending: true })

    if (error) {
      console.error('[B2B_PARTNER_PROGRAMS_GET_FAILED]', error)
      return NextResponse.json({ ok: true, data: fallbackPrograms })
    }

    return NextResponse.json({ ok: true, data: data?.length ? data : fallbackPrograms })
  } catch (error) {
    console.error('[B2B_PARTNER_PROGRAMS_GET_CRASHED]', error)
    return NextResponse.json({ ok: true, data: fallbackPrograms })
  }
}
