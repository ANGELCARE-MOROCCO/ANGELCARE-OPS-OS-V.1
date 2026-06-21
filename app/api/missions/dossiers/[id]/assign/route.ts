import { NextResponse } from 'next/server'
import { assignMissionCaregiver } from '@/lib/missions/assignment'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({}))
    const caregiverId = body.caregiverId ?? body.caregiver_id ?? null
    const backupCaregiverId = body.backupCaregiverId ?? body.backup_caregiver_id ?? null
    const scope = body.scope || 'single'
    const note = typeof body.note === 'string' && body.note.trim()
      ? body.note.trim()
      : 'Assignment updated from CareLink mission dossier API.'
    const data = await assignMissionCaregiver(
      Number(id),
      caregiverId ? Number(caregiverId) : null,
      scope,
      backupCaregiverId ? Number(backupCaregiverId) : null,
      note,
    )
    return NextResponse.json({ ok: true, data, source: body?.source || 'missions_dossier_assignment_api' })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Assignment failed' }, { status: 500 })
  }
}
