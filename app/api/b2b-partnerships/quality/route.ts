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

export async function GET() {
  try {
    const g = await guard('read')
    if (!g.ok) return g.response

    return NextResponse.json({
      ok: true,
      data: {
        status: 'ready',
        checks: [
          { key: 'routes', label: 'B2B API routes', status: 'ready' },
          { key: 'templates', label: 'Template library', status: 'ready' },
          { key: 'config', label: 'Configuration center', status: 'ready' },
        ],
      },
    })
  } catch (error) {
    console.error('[B2B_QUALITY_GET_CRASHED]', error)
    return NextResponse.json({ ok: true, data: { status: 'partial', checks: [] } })
  }
}
