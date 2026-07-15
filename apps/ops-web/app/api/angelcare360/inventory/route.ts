import { NextRequest, NextResponse } from 'next/server'
import {
  blockAngelcare360InventoryBarcode,
  blockAngelcare360InventoryExport,
  createAngelcare360InventoryCategory,
  createAngelcare360InventoryItem,
  createAngelcare360InventoryMovement,
  getAngelcare360InventoryOverview,
  listAngelcare360InventoryAuditEvents,
  listAngelcare360InventoryMovements,
  listAngelcare360LowStockItems,
  listAngelcare360InventoryResponsibleCoverage,
  updateAngelcare360InventoryCategory,
  updateAngelcare360InventoryItem,
} from '@/lib/angelcare360/server/inventory'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'

export const runtime = 'nodejs'

type InventoryMutationBody = {
  entity?: string
  operation?: string
  id?: string
  payload?: Record<string, unknown>
}

function normalizePayload(body: InventoryMutationBody): Record<string, unknown> {
  return {
    ...(body.payload || {}),
    id: body.id || body.payload?.id || null,
  }
}

export async function GET(request: NextRequest) {
  const schoolId = request.nextUrl.searchParams.get('schoolId')
  const mode = request.nextUrl.searchParams.get('mode') || 'overview'

  if (mode === 'audit') {
    const events = await listAngelcare360InventoryAuditEvents({
      schoolId,
      filters: {
        schoolId,
        module: request.nextUrl.searchParams.get('module'),
        action: request.nextUrl.searchParams.get('action'),
        severity: request.nextUrl.searchParams.get('severity'),
        entityType: request.nextUrl.searchParams.get('entityType'),
        entityId: request.nextUrl.searchParams.get('entityId'),
        actorUserId: request.nextUrl.searchParams.get('actorUserId'),
        status: request.nextUrl.searchParams.get('status'),
        search: request.nextUrl.searchParams.get('search'),
        from: request.nextUrl.searchParams.get('from'),
        to: request.nextUrl.searchParams.get('to'),
      },
    })
    return NextResponse.json({ ok: true, events }, { status: 200 })
  }

  if (mode === 'movements') {
    const movements = await listAngelcare360InventoryMovements({ schoolId })
    return NextResponse.json({ ok: true, movements }, { status: 200 })
  }

  if (mode === 'low-stock') {
    const lowStock = await listAngelcare360LowStockItems({ schoolId })
    return NextResponse.json({ ok: true, lowStock }, { status: 200 })
  }

  if (mode === 'responsibles') {
    const responsibles = await listAngelcare360InventoryResponsibleCoverage({ schoolId })
    return NextResponse.json({ ok: true, responsibles }, { status: 200 })
  }

  const overview = await getAngelcare360InventoryOverview({ schoolId })
  return NextResponse.json({ ok: Boolean(overview), overview }, { status: overview ? 200 : 404 })
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as InventoryMutationBody | null
    if (!body?.entity || !body.operation) {
      return NextResponse.json({ ok: false, error: 'La requête inventaire est incomplète.' }, { status: 422 })
    }

    const payload = normalizePayload(body)

    if (body.entity === 'category') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360InventoryCategory(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360InventoryCategory(payload), { status: 200 })
    }

    if (body.entity === 'item') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360InventoryItem(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360InventoryItem(payload), { status: 200 })
    }

    if (body.entity === 'movement' && body.operation === 'create') {
      return NextResponse.json(await createAngelcare360InventoryMovement(payload), { status: 200 })
    }

    if (body.entity === 'export' && body.operation === 'block') {
      return NextResponse.json(
        await blockAngelcare360InventoryExport({
          schoolId: typeof payload.schoolId === 'string' ? payload.schoolId : null,
          reason: typeof payload.reason === 'string' ? payload.reason : null,
        }),
        { status: 200 },
      )
    }

    if (body.entity === 'barcode' && body.operation === 'block') {
      return NextResponse.json(
        await blockAngelcare360InventoryBarcode({
          schoolId: typeof payload.schoolId === 'string' ? payload.schoolId : null,
          reason: typeof payload.reason === 'string' ? payload.reason : null,
        }),
        { status: 200 },
      )
    }

    return NextResponse.json({ ok: false, error: 'Entité inventaire inconnue.' }, { status: 400 })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    }

    const message = error instanceof Error ? error.message : 'Erreur inattendue'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
