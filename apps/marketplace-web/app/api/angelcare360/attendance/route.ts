import { NextRequest, NextResponse } from 'next/server'
import {
  bulkUpdateAngelcare360AttendanceRecords,
  closeAngelcare360AttendanceSession,
  createAngelcare360AttendanceJustification,
  decideAngelcare360AttendanceJustification,
  openAngelcare360AttendanceSession,
  updateAngelcare360AttendanceJustification,
  updateAngelcare360AttendanceRecord,
} from '@/lib/angelcare360/server/attendance'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'

export const runtime = 'nodejs'

type AttendanceMutationBody = {
  entity?: string
  operation?: string
  id?: string
  payload?: Record<string, unknown>
}

function normalizePayload(body: AttendanceMutationBody) {
  return {
    ...(body.payload || {}),
    id: body.id || body.payload?.id || null,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as AttendanceMutationBody | null
    if (!body?.entity || !body.operation) {
      return NextResponse.json({ ok: false, error: 'La requête présences est incomplète.' }, { status: 422 })
    }

    const payload = normalizePayload(body)

    if (body.entity === 'session') {
      if (body.operation === 'open') return NextResponse.json(await openAngelcare360AttendanceSession(payload), { status: 200 })
      if (body.operation === 'close') return NextResponse.json(await closeAngelcare360AttendanceSession(payload), { status: 200 })
    }

    if (body.entity === 'record') {
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360AttendanceRecord(payload), { status: 200 })
      if (body.operation === 'bulk-update') return NextResponse.json(await bulkUpdateAngelcare360AttendanceRecords(payload), { status: 200 })
    }

    if (body.entity === 'justification') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360AttendanceJustification(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360AttendanceJustification(payload), { status: 200 })
      if (body.operation === 'decision') return NextResponse.json(await decideAngelcare360AttendanceJustification(payload), { status: 200 })
    }

    return NextResponse.json({ ok: false, error: 'Entité présences inconnue.' }, { status: 400 })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    }

    const message = error instanceof Error ? error.message : 'Erreur inattendue'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
