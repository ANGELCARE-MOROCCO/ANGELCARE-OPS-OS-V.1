import { NextRequest, NextResponse } from 'next/server'
import {
  createAngelcare360SchoolCalendarEvent,
  createAngelcare360TimetableSlot,
  updateAngelcare360SchoolCalendarEvent,
  updateAngelcare360TimetableSlot,
} from '@/lib/angelcare360/server/timetable'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'

export const runtime = 'nodejs'

type TimetableMutationBody = {
  entity?: string
  operation?: string
  id?: string
  payload?: Record<string, unknown>
}

function normalizePayload(body: TimetableMutationBody) {
  return {
    ...(body.payload || {}),
    id: body.id || body.payload?.id || null,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as TimetableMutationBody | null
    if (!body?.entity || !body.operation) {
      return NextResponse.json({ ok: false, error: 'La requête emploi du temps est incomplète.' }, { status: 422 })
    }

    const payload = normalizePayload(body)

    if (body.entity === 'slot') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360TimetableSlot(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360TimetableSlot(payload), { status: 200 })
    }

    if (body.entity === 'calendar-event') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360SchoolCalendarEvent(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360SchoolCalendarEvent(payload), { status: 200 })
    }

    return NextResponse.json({ ok: false, error: 'Entité emploi du temps inconnue.' }, { status: 400 })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    }

    const message = error instanceof Error ? error.message : 'Erreur inattendue'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
