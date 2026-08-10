import { NextRequest, NextResponse } from 'next/server'
import {
  blockAngelcare360AcademicExport,
  bulkUpdateAngelcare360Marks,
  calculateAngelcare360Averages,
  changeAngelcare360AssignmentStatus,
  changeAngelcare360ExamStatus,
  createAngelcare360Assignment,
  createAngelcare360Exam,
  createAngelcare360ExamSession,
  createAngelcare360Lesson,
  createAngelcare360ReportCardDraft,
  createAngelcare360TeacherComment,
  updateAngelcare360Assignment,
  updateAngelcare360AssignmentSubmissionStatus,
  updateAngelcare360Exam,
  updateAngelcare360ExamSession,
  updateAngelcare360Lesson,
  updateAngelcare360Mark,
  updateAngelcare360ReportCardStatus,
  updateAngelcare360TeacherComment,
} from '@/lib/angelcare360/server/academics'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'

export const runtime = 'nodejs'

type AcademicsMutationBody = {
  entity?: string
  operation?: string
  id?: string
  payload?: Record<string, unknown>
}

function normalizePayload(body: AcademicsMutationBody): Record<string, unknown> {
  return {
    ...(body.payload || {}),
    id: body.id || body.payload?.id || null,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as AcademicsMutationBody | null
    if (!body?.entity || !body.operation) {
      return NextResponse.json({ ok: false, error: 'La requête académique est incomplète.' }, { status: 422 })
    }

    const payload = normalizePayload(body)

    if (body.entity === 'lesson') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360Lesson(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360Lesson(payload), { status: 200 })
    }

    if (body.entity === 'assignment') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360Assignment(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360Assignment(payload), { status: 200 })
      if (body.operation === 'status') return NextResponse.json(await changeAngelcare360AssignmentStatus(payload), { status: 200 })
    }

    if (body.entity === 'submission' && body.operation === 'status') {
      return NextResponse.json(await updateAngelcare360AssignmentSubmissionStatus(payload), { status: 200 })
    }

    if (body.entity === 'exam') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360Exam(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360Exam(payload), { status: 200 })
      if (body.operation === 'status') return NextResponse.json(await changeAngelcare360ExamStatus(payload), { status: 200 })
    }

    if (body.entity === 'exam-session') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360ExamSession(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360ExamSession(payload), { status: 200 })
    }

    if (body.entity === 'mark') {
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360Mark(payload), { status: 200 })
      if (body.operation === 'bulk-update') return NextResponse.json(await bulkUpdateAngelcare360Marks(payload), { status: 200 })
    }

    if (body.entity === 'average') {
      if (body.operation === 'check') return NextResponse.json(await calculateAngelcare360Averages(payload), { status: 200 })
    }

    if (body.entity === 'report-card') {
      if (body.operation === 'draft-create') return NextResponse.json(await createAngelcare360ReportCardDraft(payload), { status: 200 })
      if (body.operation === 'status') return NextResponse.json(await updateAngelcare360ReportCardStatus(payload), { status: 200 })
    }

    if (body.entity === 'comment') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360TeacherComment(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360TeacherComment(payload), { status: 200 })
    }

    if (body.entity === 'export' && body.operation === 'block') {
      return NextResponse.json(
        await blockAngelcare360AcademicExport({
          schoolId: typeof payload.schoolId === 'string' ? payload.schoolId : null,
          reason: typeof payload.reason === 'string' ? payload.reason : null,
          entityType: typeof payload.entityType === 'string' ? payload.entityType : null,
          entityId: typeof payload.entityId === 'string' ? payload.entityId : null,
        }),
        { status: 200 },
      )
    }

    return NextResponse.json({ ok: false, error: 'Entité académique inconnue.' }, { status: 400 })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    }

    const message = error instanceof Error ? error.message : 'Erreur inattendue'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
