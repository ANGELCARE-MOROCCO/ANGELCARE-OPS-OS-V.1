import { NextResponse } from 'next/server'
import { requireAccess } from '@/lib/auth/requireAccess'
import { createAcademyDocument } from '@/lib/academy/document-repository'
import type { AcademyDocumentType } from '@/lib/academy/document-qr'

export async function POST(req: Request) {
  await requireAccess('academy.manage')
  const body = await req.json().catch(() => ({}))
  const documentType = String(body.documentType || 'payment_receipt') as AcademyDocumentType
  const document = await createAcademyDocument({
    documentType,
    title: body.title,
    traineeId: body.traineeId,
    enrollmentId: body.enrollmentId,
    paymentId: body.paymentId,
    refundId: body.refundId,
    certificateId: body.certificateId,
    amount: Number(body.amount || 0),
    currency: 'MAD',
    payload: body.payload || {},
  })
  return NextResponse.json({ ok: true, document })
}
