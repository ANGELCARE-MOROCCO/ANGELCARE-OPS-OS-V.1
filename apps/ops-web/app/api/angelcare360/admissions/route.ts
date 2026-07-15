import { NextRequest, NextResponse } from 'next/server'
import {
  acceptAngelcare360AdmissionApplication,
  changeAngelcare360AdmissionApplicationStatus,
  changeAngelcare360AdmissionLeadStatus,
  convertAngelcare360ApplicationToPeopleRecords,
  convertAngelcare360LeadToApplication,
  createAngelcare360AdmissionApplication,
  createAngelcare360AdmissionLead,
  createAngelcare360AdmissionRequiredDocument,
  decideAngelcare360AdmissionApplication,
  rejectAngelcare360AdmissionApplication,
  updateAngelcare360AdmissionApplication,
  updateAngelcare360AdmissionDocumentSubmissionStatus,
  updateAngelcare360AdmissionLead,
  updateAngelcare360AdmissionNextAction,
  updateAngelcare360AdmissionRequiredDocument,
} from '@/lib/angelcare360/server/admissions'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'

export const runtime = 'nodejs'

type AdmissionsMutationBody = {
  entity?: string
  operation?: string
  id?: string
  payload?: Record<string, unknown>
}

function normalizePayload(body: AdmissionsMutationBody) {
  return {
    ...(body.payload || {}),
    id: body.id || body.payload?.id || null,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as AdmissionsMutationBody | null
    if (!body?.entity || !body.operation) {
      return NextResponse.json({ ok: false, error: 'La requête admissions est incomplète.' }, { status: 422 })
    }

    const payload = normalizePayload(body)

    if (body.entity === 'lead') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360AdmissionLead(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360AdmissionLead(payload), { status: 200 })
      if (body.operation === 'status') return NextResponse.json(await changeAngelcare360AdmissionLeadStatus(payload), { status: 200 })
      if (body.operation === 'convert') return NextResponse.json(await convertAngelcare360LeadToApplication(payload), { status: 200 })
    }

    if (body.entity === 'application') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360AdmissionApplication(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360AdmissionApplication(payload), { status: 200 })
      if (body.operation === 'status') return NextResponse.json(await changeAngelcare360AdmissionApplicationStatus(payload), { status: 200 })
      if (body.operation === 'decision') return NextResponse.json(await decideAngelcare360AdmissionApplication(payload), { status: 200 })
      if (body.operation === 'accept') return NextResponse.json(await acceptAngelcare360AdmissionApplication(payload), { status: 200 })
      if (body.operation === 'reject') return NextResponse.json(await rejectAngelcare360AdmissionApplication(payload), { status: 200 })
      if (body.operation === 'convert') return NextResponse.json(await convertAngelcare360ApplicationToPeopleRecords(payload), { status: 200 })
    }

    if (body.entity === 'required-document') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360AdmissionRequiredDocument(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360AdmissionRequiredDocument(payload), { status: 200 })
    }

    if (body.entity === 'document-submission' && body.operation === 'update') {
      return NextResponse.json(await updateAngelcare360AdmissionDocumentSubmissionStatus(payload), { status: 200 })
    }

    if (body.entity === 'next-action' && body.operation === 'update') {
      return NextResponse.json(await updateAngelcare360AdmissionNextAction(payload), { status: 200 })
    }

    if (body.entity === 'conversion' && body.operation === 'convert') {
      return NextResponse.json(await convertAngelcare360ApplicationToPeopleRecords(payload), { status: 200 })
    }

    return NextResponse.json({ ok: false, error: 'Entité admissions inconnue.' }, { status: 400 })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    }

    const message = error instanceof Error ? error.message : 'Erreur inattendue'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
