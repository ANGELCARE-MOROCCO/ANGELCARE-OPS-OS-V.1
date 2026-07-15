import { NextRequest, NextResponse } from 'next/server'
import {
  blockAngelcare360LibraryBarcode,
  blockAngelcare360LibraryExport,
  blockAngelcare360LibraryReminder,
  cancelAngelcare360LibraryLoan,
  changeAngelcare360LibraryBookStatus,
  changeAngelcare360LibraryCopyStatus,
  createAngelcare360LibraryBook,
  createAngelcare360LibraryCopy,
  createAngelcare360LibraryLoan,
  getAngelcare360LibraryAvailability,
  getAngelcare360LibraryOverview,
  listAngelcare360LibraryAuditEvents,
  listAngelcare360LibraryLoans,
  listAngelcare360LibraryOverdueLoans,
  updateAngelcare360LibraryBook,
  updateAngelcare360LibraryCopy,
  returnAngelcare360LibraryLoan,
  markAngelcare360LibraryLoanLost,
} from '@/lib/angelcare360/server/library'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'

export const runtime = 'nodejs'

type LibraryMutationBody = {
  entity?: string
  operation?: string
  id?: string
  payload?: Record<string, unknown>
}

function normalizePayload(body: LibraryMutationBody): Record<string, unknown> {
  return {
    ...(body.payload || {}),
    id: body.id || body.payload?.id || null,
  }
}

export async function GET(request: NextRequest) {
  const schoolId = request.nextUrl.searchParams.get('schoolId')
  const mode = request.nextUrl.searchParams.get('mode') || 'overview'

  if (mode === 'audit') {
    const events = await listAngelcare360LibraryAuditEvents({
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

  if (mode === 'availability') {
    const availability = await getAngelcare360LibraryAvailability({ schoolId })
    return NextResponse.json({ ok: true, availability }, { status: 200 })
  }

  if (mode === 'overdue') {
    const overdue = await listAngelcare360LibraryOverdueLoans({ schoolId })
    return NextResponse.json({ ok: true, overdue }, { status: 200 })
  }

  if (mode === 'loans') {
    const loans = await listAngelcare360LibraryLoans({ schoolId })
    return NextResponse.json({ ok: true, loans }, { status: 200 })
  }

  const overview = await getAngelcare360LibraryOverview({ schoolId })
  return NextResponse.json({ ok: Boolean(overview), overview }, { status: overview ? 200 : 404 })
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as LibraryMutationBody | null
    if (!body?.entity || !body.operation) {
      return NextResponse.json({ ok: false, error: 'La requête bibliothèque est incomplète.' }, { status: 422 })
    }

    const payload = normalizePayload(body)

    if (body.entity === 'book') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360LibraryBook(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360LibraryBook(payload), { status: 200 })
      if (body.operation === 'status') return NextResponse.json(await changeAngelcare360LibraryBookStatus(payload), { status: 200 })
    }

    if (body.entity === 'copy') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360LibraryCopy(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360LibraryCopy(payload), { status: 200 })
      if (body.operation === 'status') return NextResponse.json(await changeAngelcare360LibraryCopyStatus(payload), { status: 200 })
    }

    if (body.entity === 'loan') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360LibraryLoan(payload), { status: 200 })
      if (body.operation === 'return') return NextResponse.json(await returnAngelcare360LibraryLoan(payload), { status: 200 })
      if (body.operation === 'lost') return NextResponse.json(await markAngelcare360LibraryLoanLost(payload), { status: 200 })
      if (body.operation === 'cancel') return NextResponse.json(await cancelAngelcare360LibraryLoan(payload), { status: 200 })
    }

    if (body.entity === 'notification' && body.operation === 'block') {
      return NextResponse.json(
        await blockAngelcare360LibraryReminder({
          schoolId: typeof payload.schoolId === 'string' ? payload.schoolId : null,
          reason: typeof payload.reason === 'string' ? payload.reason : null,
        }),
        { status: 200 },
      )
    }

    if (body.entity === 'export' && body.operation === 'block') {
      return NextResponse.json(
        await blockAngelcare360LibraryExport({
          schoolId: typeof payload.schoolId === 'string' ? payload.schoolId : null,
          reason: typeof payload.reason === 'string' ? payload.reason : null,
        }),
        { status: 200 },
      )
    }

    if (body.entity === 'barcode' && body.operation === 'block') {
      return NextResponse.json(
        await blockAngelcare360LibraryBarcode({
          schoolId: typeof payload.schoolId === 'string' ? payload.schoolId : null,
          reason: typeof payload.reason === 'string' ? payload.reason : null,
        }),
        { status: 200 },
      )
    }

    return NextResponse.json({ ok: false, error: 'Entité bibliothèque inconnue.' }, { status: 400 })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    }

    const message = error instanceof Error ? error.message : 'Erreur inattendue'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
