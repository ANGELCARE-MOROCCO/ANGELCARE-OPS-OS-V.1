import { NextResponse } from 'next/server'
import { createMissionDossier } from '@/lib/missions/dossiers'
export const dynamic = 'force-dynamic'
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const serviceType = String(body.serviceType || body.service_type || '')
    if (!serviceType) return NextResponse.json({ ok: false, error: 'serviceType is required' }, { status: 400 })
    const familyIdRaw = body.familyId ?? body.family_id ?? null
    const caregiverIdRaw = body.caregiverId ?? body.caregiver_id ?? null
    const data = await createMissionDossier({
      familyId: familyIdRaw ? Number(familyIdRaw) : null,
      caregiverId: caregiverIdRaw ? Number(caregiverIdRaw) : null,
      serviceType,
      missionDate: body.missionDate || body.mission_date || null,
      startTime: body.startTime || body.start_time || null,
      endTime: body.endTime || body.end_time || null,
      city: body.city || null,
      zone: body.zone || null,
      notes: body.notes || null,
      recurrenceType: body.recurrenceType || body.recurrence_type || null,
      recurrenceRule: typeof body.recurrenceRule === 'object' ? body.recurrenceRule : {},
      recurrenceStartDate: body.recurrenceStartDate || null,
      recurrenceEndDate: body.recurrenceEndDate || null,
    })
    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Dossier creation failed' }, { status: 500 }) }
}
