import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import { NextRequest, NextResponse } from 'next/server'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'
import {
  applyMaterialMovement,
  assignMaterialResponsible,
  createMaterialCategory,
  createMaterialItem,
  getMaterialIntegrityStatus,
  getMaterialItemDossier,
  getMaterialMovementById,
  getMaterialSnapshot,
  listMaterialAudit,
  listMaterialCategories,
  listMaterialItems,
  listMaterialLowStock,
  listMaterialMovements,
  listMaterialStaff,
  listMaterialStewardship,
  lookupMaterialByBarcode,
  updateMaterialCategory,
  updateMaterialItem,
} from '@/lib/angelcare360/server/inventory-material-command'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Body = {
  entity?: string
  operation?: string
  payload?: Record<string, unknown>
}

function schoolId(request: NextRequest) {
  return request.nextUrl.searchParams.get('schoolId')
}

async function GET__customerPlatformImpl(request: NextRequest) {
  try {
    const mode = request.nextUrl.searchParams.get('mode') || 'overview'
    const sid = schoolId(request)
    if (mode === 'integrity') return NextResponse.json({ ok: true, integrity: await getMaterialIntegrityStatus() })
    if (mode === 'categories') return NextResponse.json({ ok: true, categories: await listMaterialCategories({ schoolId: sid }) })
    if (mode === 'items') return NextResponse.json({ ok: true, items: await listMaterialItems({ schoolId: sid }) })
    if (mode === 'item') {
      const id = request.nextUrl.searchParams.get('id') || ''
      const dossier = await getMaterialItemDossier(id, { schoolId: sid })
      return NextResponse.json({ ok: Boolean(dossier), dossier }, { status: dossier ? 200 : 404 })
    }
    if (mode === 'movements') return NextResponse.json({ ok: true, movements: await listMaterialMovements({ schoolId: sid }) })
    if (mode === 'movement') {
      const id = request.nextUrl.searchParams.get('id') || ''
      const movement = await getMaterialMovementById(id, { schoolId: sid })
      return NextResponse.json({ ok: Boolean(movement), movement }, { status: movement ? 200 : 404 })
    }
    if (mode === 'low-stock') return NextResponse.json({ ok: true, items: await listMaterialLowStock({ schoolId: sid }) })
    if (mode === 'responsibles') return NextResponse.json({ ok: true, stewardship: await listMaterialStewardship({ schoolId: sid }) })
    if (mode === 'staff') return NextResponse.json({ ok: true, staff: await listMaterialStaff({ schoolId: sid }) })
    if (mode === 'audit') return NextResponse.json({ ok: true, audit: await listMaterialAudit({ schoolId: sid }) })
    if (mode === 'barcode') {
      const barcode = request.nextUrl.searchParams.get('barcode') || ''
      const item = await lookupMaterialByBarcode(barcode, { schoolId: sid })
      return NextResponse.json({ ok: Boolean(item), item }, { status: item ? 200 : 404 })
    }
    const snapshot = await getMaterialSnapshot({ schoolId: sid })
    return NextResponse.json({ ok: Boolean(snapshot), snapshot }, { status: snapshot ? 200 : 404 })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Erreur inventaire inattendue.' }, { status: 500 })
  }
}

async function POST__customerPlatformImpl(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as Body | null
    if (!body?.entity || !body.operation) return NextResponse.json({ ok: false, error: 'Commande inventaire incomplète.' }, { status: 422 })
    const payload = body.payload || {}
    let result
    if (body.entity === 'category' && body.operation === 'create') result = await createMaterialCategory(payload)
    else if (body.entity === 'category' && body.operation === 'update') result = await updateMaterialCategory(payload)
    else if (body.entity === 'item' && body.operation === 'create') result = await createMaterialItem(payload)
    else if (body.entity === 'item' && body.operation === 'update') result = await updateMaterialItem(payload)
    else if (body.entity === 'item' && body.operation === 'assign') result = await assignMaterialResponsible(payload)
    else if (body.entity === 'movement' && body.operation === 'create') result = await applyMaterialMovement(payload)
    else return NextResponse.json({ ok: false, error: 'Commande inventaire inconnue.' }, { status: 400 })
    return NextResponse.json(result, { status: result.ok ? 200 : result.locked ? 409 : 422 })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Erreur inventaire inattendue.' }, { status: 500 })
  }
}

export const GET = governCustomerPlatformRoute(
  { workloadClass: 'interactive', operation: 'GET:/api/angelcare360/inventory-command' },
  GET__customerPlatformImpl,
)

export const POST = governCustomerPlatformRoute(
  { workloadClass: 'mutation', operation: 'POST:/api/angelcare360/inventory-command' },
  POST__customerPlatformImpl,
)
