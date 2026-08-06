import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { resolveRevenueOsActor } from '@/lib/revenue-command-os/access'
import { normalizeRevenueOsError } from '@/lib/revenue-command-os/errors'
import { executeOperationalDepth, readOperationalDepth } from '@/lib/revenue-command-os/operational-depth/service'
import type { OperationalDepthAction, OperationalEntityType } from '@/lib/revenue-command-os/operational-depth/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const entityTypes = new Set<OperationalEntityType>(['objective', 'strategy', 'program', 'mission', 'task', 'exception'])
const actions = new Set<OperationalDepthAction>(['update_fields', 'duplicate', 'create_child', 'add_note', 'update_note', 'delete_note', 'link_entity', 'unlink_entity', 'record_outcome', 'create_saved_view', 'delete_saved_view'])

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'Authentification requise.' } }, { status: 401 })
    const entityType = String(request.nextUrl.searchParams.get('entityType') || '') as OperationalEntityType
    const entityId = String(request.nextUrl.searchParams.get('entityId') || '')
    if (!entityTypes.has(entityType) || !entityId) return NextResponse.json({ ok: false, error: { code: 'INVALID_ENTITY', message: 'Dossier Revenue OS invalide.' } }, { status: 422 })
    const actor = await resolveRevenueOsActor('revenue_os.view', { aliases: ['revenue_os.manage'] })
    const data = await readOperationalDepth({ tenantId: actor.tenantId, entityType, entityId })
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
    const action = String(body.action || '') as OperationalDepthAction
    const entityType = body.entityType ? String(body.entityType) as OperationalEntityType : undefined
    if (!actions.has(action) || (entityType && !entityTypes.has(entityType))) return NextResponse.json({ ok: false, error: { code: 'INVALID_OPERATIONAL_ACTION', message: 'Action opérationnelle invalide.' } }, { status: 422 })
    const actor = await resolveRevenueOsActor('revenue_os.manage', { aliases: ['revenue_os.view'], payload: body })
    const data = await executeOperationalDepth({ tenantId: actor.tenantId, actorId: actor.id, actorLabel: actor.displayName, action, entityType, entityId: typeof body.entityId === 'string' ? body.entityId : undefined, payload: body.payload && typeof body.payload === 'object' ? body.payload : {} })
    return NextResponse.json({ ok: true, data }, { status: action === 'create_child' || action === 'add_note' || action === 'record_outcome' ? 201 : 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const normalized = normalizeRevenueOsError(error)
    return NextResponse.json({ ok: false, error: { code: normalized.code, message: normalized.message } }, { status: normalized.status || 500 })
  }
}
