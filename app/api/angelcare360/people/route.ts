import { NextRequest, NextResponse } from 'next/server'
import {
  assignAngelcare360StudentToClass,
  changeAngelcare360ParentStatus,
  changeAngelcare360StaffStatus,
  changeAngelcare360StudentStatus,
  createAngelcare360DocumentReference,
  createAngelcare360EmergencyContact,
  createAngelcare360Parent,
  createAngelcare360Staff,
  createAngelcare360Student,
  linkAngelcare360ParentToStudent,
  unlinkAngelcare360ParentFromStudent,
  updateAngelcare360DocumentStatus,
  updateAngelcare360EmergencyContact,
  updateAngelcare360Parent,
  updateAngelcare360Staff,
  updateAngelcare360Student,
} from '@/lib/angelcare360/server/people'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'

export const runtime = 'nodejs'

type PeopleMutationBody = {
  entity?: string
  operation?: string
  id?: string
  payload?: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as PeopleMutationBody | null
    if (!body?.entity || !body.operation) {
      return NextResponse.json({ ok: false, error: 'La requête personnes est incomplète.' }, { status: 422 })
    }

    const payload = {
      ...(body.payload || {}),
      id: body.id || body.payload?.id || null,
    }

    if (body.entity === 'eleves') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360Student(payload), { status: 200 })
      if (body.operation === 'status') return NextResponse.json(await changeAngelcare360StudentStatus({ id: String(body.id || payload.id || ''), status: String(payload.status || 'active') as 'active' | 'inactive' | 'archived' }), { status: 200 })
      if (body.operation === 'assign-class') return NextResponse.json(await assignAngelcare360StudentToClass(payload), { status: 200 })
      return NextResponse.json(await updateAngelcare360Student(payload), { status: 200 })
    }

    if (body.entity === 'parents') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360Parent(payload), { status: 200 })
      if (body.operation === 'status') return NextResponse.json(await changeAngelcare360ParentStatus({ id: String(body.id || payload.id || ''), status: String(payload.status || 'active') as 'active' | 'inactive' | 'archived' }), { status: 200 })
      if (body.operation === 'link') return NextResponse.json(await linkAngelcare360ParentToStudent(payload), { status: 200 })
      if (body.operation === 'unlink') return NextResponse.json(await unlinkAngelcare360ParentFromStudent({ studentId: String(payload.studentId || ''), parentId: String(payload.parentId || ''), schoolId: String(payload.schoolId || '') }), { status: 200 })
      return NextResponse.json(await updateAngelcare360Parent(payload), { status: 200 })
    }

    if (body.entity === 'enseignants') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360Staff({ ...payload, staffType: 'teacher' }), { status: 200 })
      if (body.operation === 'status') return NextResponse.json(await changeAngelcare360StaffStatus({ id: String(body.id || payload.id || ''), status: String(payload.status || 'active') as 'active' | 'on_leave' | 'inactive' | 'archived', schoolId: String(payload.schoolId || '') }), { status: 200 })
      return NextResponse.json(await updateAngelcare360Staff({ ...payload, staffType: 'teacher' }), { status: 200 })
    }

    if (body.entity === 'personnel') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360Staff({ ...payload, staffType: 'personnel' }), { status: 200 })
      if (body.operation === 'status') return NextResponse.json(await changeAngelcare360StaffStatus({ id: String(body.id || payload.id || ''), status: String(payload.status || 'active') as 'active' | 'on_leave' | 'inactive' | 'archived', schoolId: String(payload.schoolId || '') }), { status: 200 })
      return NextResponse.json(await updateAngelcare360Staff({ ...payload, staffType: 'personnel' }), { status: 200 })
    }

    if (body.entity === 'liens-parent-enfant') {
      if (body.operation === 'create' || body.operation === 'update') return NextResponse.json(await linkAngelcare360ParentToStudent(payload), { status: 200 })
      if (body.operation === 'unlink' || body.operation === 'status') {
        return NextResponse.json(
          await unlinkAngelcare360ParentFromStudent({
            studentId: String(payload.studentId || ''),
            parentId: String(payload.parentId || ''),
            schoolId: String(payload.schoolId || ''),
          }),
          { status: 200 },
        )
      }
    }

    if (body.entity === 'contacts-urgence') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360EmergencyContact(payload), { status: 200 })
      return NextResponse.json(await updateAngelcare360EmergencyContact(payload), { status: 200 })
    }

    if (body.entity === 'documents') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360DocumentReference(payload), { status: 200 })
      return NextResponse.json(await updateAngelcare360DocumentStatus(payload), { status: 200 })
    }

    if (body.entity === 'affectations-classes') {
      return NextResponse.json(await assignAngelcare360StudentToClass(payload), { status: 200 })
    }

    return NextResponse.json({ ok: false, error: 'Entité personnes inconnue.' }, { status: 400 })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    }

    const message = error instanceof Error ? error.message : 'Erreur inattendue'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

