import { NextRequest, NextResponse } from 'next/server'
import {
  blockAngelcare360PayrollBankTransfer,
  blockAngelcare360PayrollCompliance,
  blockAngelcare360PayrollExport,
  blockAngelcare360PayrollRecord,
  changeAngelcare360PayrollPeriodStatus,
  createAngelcare360PayrollItem,
  createAngelcare360PayrollPeriod,
  createAngelcare360PayrollRecord,
  getAngelcare360PayrollOverview,
  markAngelcare360PayrollRecordPaid,
  prepareAngelcare360PayrollRecord,
  cancelAngelcare360PayrollItem,
  updateAngelcare360PayrollItem,
  updateAngelcare360PayrollPeriod,
  updateAngelcare360PayrollRecord,
  validateAngelcare360PayrollRecord,
} from '@/lib/angelcare360/server/payroll'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'

export const runtime = 'nodejs'

type PayrollMutationBody = {
  entity?: string
  operation?: string
  id?: string
  payload?: Record<string, unknown>
}

function normalizePayload(body: PayrollMutationBody): Record<string, unknown> {
  return {
    ...(body.payload || {}),
    id: body.id || body.payload?.id || null,
  }
}

export async function GET(request: NextRequest) {
  const schoolId = request.nextUrl.searchParams.get('schoolId')
  const overview = await getAngelcare360PayrollOverview({ schoolId })
  return NextResponse.json({ ok: Boolean(overview), overview }, { status: overview ? 200 : 404 })
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as PayrollMutationBody | null
    if (!body?.entity || !body.operation) {
      return NextResponse.json({ ok: false, error: 'La requête paie est incomplète.' }, { status: 422 })
    }

    const payload = normalizePayload(body)

    if (body.entity === 'period') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360PayrollPeriod(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360PayrollPeriod(payload), { status: 200 })
      if (body.operation === 'status') return NextResponse.json(await changeAngelcare360PayrollPeriodStatus(payload), { status: 200 })
    }

    if (body.entity === 'record') {
      if (body.operation === 'prepare') return NextResponse.json(await prepareAngelcare360PayrollRecord(payload), { status: 200 })
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360PayrollRecord(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360PayrollRecord(payload), { status: 200 })
      if (body.operation === 'validate') return NextResponse.json(await validateAngelcare360PayrollRecord(payload), { status: 200 })
      if (body.operation === 'block') return NextResponse.json(await blockAngelcare360PayrollRecord(payload), { status: 200 })
      if (body.operation === 'paid' || body.operation === 'payment-status') return NextResponse.json(await markAngelcare360PayrollRecordPaid(payload), { status: 200 })
    }

    if (body.entity === 'item') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360PayrollItem(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360PayrollItem(payload), { status: 200 })
      if (body.operation === 'cancel') return NextResponse.json(await cancelAngelcare360PayrollItem(payload), { status: 200 })
    }

    if (body.entity === 'export' && body.operation === 'block') {
      return NextResponse.json(await blockAngelcare360PayrollExport({
        schoolId: typeof payload.schoolId === 'string' ? payload.schoolId : null,
        reason: typeof payload.reason === 'string' ? payload.reason : null,
        entityType: typeof payload.entityType === 'string' ? payload.entityType : null,
        entityId: typeof payload.entityId === 'string' ? payload.entityId : null,
      }), { status: 200 })
    }

    if (body.entity === 'bank-transfer' && body.operation === 'block') {
      return NextResponse.json(await blockAngelcare360PayrollBankTransfer({
        schoolId: typeof payload.schoolId === 'string' ? payload.schoolId : null,
        reason: typeof payload.reason === 'string' ? payload.reason : null,
        entityType: typeof payload.entityType === 'string' ? payload.entityType : null,
        entityId: typeof payload.entityId === 'string' ? payload.entityId : null,
      }), { status: 200 })
    }

    if (body.entity === 'compliance' && body.operation === 'block') {
      return NextResponse.json(await blockAngelcare360PayrollCompliance({
        schoolId: typeof payload.schoolId === 'string' ? payload.schoolId : null,
        reason: typeof payload.reason === 'string' ? payload.reason : null,
        entityType: typeof payload.entityType === 'string' ? payload.entityType : null,
        entityId: typeof payload.entityId === 'string' ? payload.entityId : null,
      }), { status: 200 })
    }

    return NextResponse.json({ ok: false, error: 'Entité paie inconnue.' }, { status: 400 })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    }

    const message = error instanceof Error ? error.message : 'Erreur inattendue'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
