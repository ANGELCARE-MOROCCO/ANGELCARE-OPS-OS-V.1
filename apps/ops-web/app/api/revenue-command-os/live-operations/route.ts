import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { resolveRevenueOsActor } from '@/lib/revenue-command-os/access'
import { normalizeRevenueOsError } from '@/lib/revenue-command-os/errors'
import { executeLiveOperation, listLiveEntities } from '@/lib/revenue-command-os/live-operations/service'
import type { LiveEntityType, LiveOperation } from '@/lib/revenue-command-os/live-operations/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const entities = new Set<LiveEntityType>(['objective','strategy','program','mission','task','exception'])
const operations = new Set<LiveOperation>(['create','update','activate','start','pause','resume','complete','close','reopen','cancel','archive','delete','assign','reassign','retry','publish','unpublish','execute','schedule','reschedule'])

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'Authentification requise.' } }, { status: 401 })
    const entityType = String(request.nextUrl.searchParams.get('entityType') || 'exception') as LiveEntityType
    if (!entities.has(entityType)) return NextResponse.json({ ok: false, error: { code: 'INVALID_ENTITY_TYPE', message: 'Type Revenue OS invalide.' } }, { status: 422 })
    const actor = await resolveRevenueOsActor('revenue_os.view', { aliases: ['revenue_os.manage'] })
    const data = await listLiveEntities({ tenantId: actor.tenantId, entityType, limit: Number(request.nextUrl.searchParams.get('limit') || 100) })
    return NextResponse.json({ ok: true, data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const normalized = normalizeRevenueOsError(error)
    return NextResponse.json({ ok: false, error: { code: normalized.code, message: normalized.message } }, { status: normalized.status || 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'Authentification requise.' } }, { status: 401 })
    const body = await request.json().catch(() => ({}))
    const entityType = String(body.entityType || '') as LiveEntityType
    const operation = String(body.operation || '') as LiveOperation
    if (!entities.has(entityType) || !operations.has(operation)) return NextResponse.json({ ok: false, error: { code: 'INVALID_LIVE_OPERATION', message: 'Type ou action Revenue OS invalide.' } }, { status: 422 })
    const actor = await resolveRevenueOsActor('revenue_os.manage', { aliases: ['revenue_os.view'], payload: body })
    const data = await executeLiveOperation({ tenantId: actor.tenantId, actorId: actor.id, actorLabel: actor.displayName, entityType, operation, entityId: typeof body.entityId === 'string' ? body.entityId : undefined, entityIds: Array.isArray(body.entityIds) ? body.entityIds.map(String) : undefined, reason: typeof body.reason === 'string' ? body.reason : undefined, changes: body.changes && typeof body.changes === 'object' ? body.changes : undefined })
    return NextResponse.json({ ok: true, data }, { status: operation === 'create' ? 201 : 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const normalized = normalizeRevenueOsError(error)
    return NextResponse.json({ ok: false, error: { code: normalized.code, message: normalized.message } }, { status: normalized.status || 500 })
  }
}
