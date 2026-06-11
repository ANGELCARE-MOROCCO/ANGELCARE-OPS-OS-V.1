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

const fallbackTemplates = [
  {
    id: 'hotel-email-intro',
    name: 'Email introduction hôtel premium',
    channel: 'Email',
    segment: 'Hotel',
    category: 'cold_outreach',
    subject: 'Créer une expérience famille différenciante pour {{prospect_name}}',
    body: 'Bonjour {{decision_maker_name}},\n\nJe me permets de vous contacter car ANGELCARE accompagne les familles avec des solutions enfants structurées, rassurantes et premium. Pour un établissement comme {{prospect_name}}, cela peut renforcer l’expérience client famille, les événements et la différenciation hospitality.\n\nSeriez-vous disponible pour un court échange de 15 minutes cette semaine ?',
    is_active: true,
  },
  {
    id: 'clinic-whatsapp-intro',
    name: 'WhatsApp clinique pédiatrique',
    channel: 'WhatsApp',
    segment: 'Pediatric clinic',
    category: 'cold_outreach',
    subject: '',
    body: 'Bonjour {{decision_maker_name}}, je vous contacte de la part d’ANGELCARE. Nous développons des partenariats avec les cliniques pédiatriques pour renforcer l’accompagnement des familles autour de l’enfant. Puis-je vous envoyer une courte présentation ?',
    is_active: true,
  },
]

export async function GET() {
  try {
    const g = await guard('read')
    if (!g.ok) return g.response

    const { data, error } = await g.db.from('b2b_templates').select('*').eq('is_active', true).order('created_at', { ascending: false })

    if (error) {
      console.error('[B2B_TEMPLATES_GET_FAILED]', error)
      return NextResponse.json({ ok: true, data: fallbackTemplates })
    }

    return NextResponse.json({ ok: true, data: data?.length ? data : fallbackTemplates })
  } catch (error) {
    console.error('[B2B_TEMPLATES_GET_CRASHED]', error)
    return NextResponse.json({ ok: true, data: fallbackTemplates })
  }
}

export async function POST(req: NextRequest) {
  try {
    const g = await guard('create')
    if (!g.ok) return g.response

    const body = await req.json()
    const payload = {
      name: body.name || 'Template B2B',
      channel: body.channel || 'Email',
      segment: body.segment || 'General',
      category: body.category || 'custom',
      subject: body.subject || null,
      body: body.body || body.message_body || '',
      is_active: body.is_active ?? true,
      created_by: g.actor.id,
    }

    const { data, error } = await g.db.from('b2b_templates').insert(payload).select('*').single()

    if (error) {
      console.error('[B2B_TEMPLATES_POST_FAILED]', error)
      return NextResponse.json({ ok: false, error: 'Unable to create template.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch (error) {
    console.error('[B2B_TEMPLATES_POST_CRASHED]', error)
    return NextResponse.json({ ok: false, error: 'Unable to create template.' }, { status: 500 })
  }
}
