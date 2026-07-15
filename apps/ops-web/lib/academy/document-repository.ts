import { createClient } from '@/lib/supabase/server'
import { makeDocumentNumber, makeQrDataUrl, makeVerificationToken, makeVerificationUrl, type AcademyDocumentType } from './document-qr'

export async function createAcademyDocument(input: {
  documentType: AcademyDocumentType
  title?: string
  traineeId?: string | null
  enrollmentId?: string | null
  paymentId?: string | null
  refundId?: string | null
  certificateId?: string | null
  amount?: number
  currency?: string
  payload?: Record<string, unknown>
}) {
  const supabase = await createClient()
  const token = makeVerificationToken(input.paymentId || input.traineeId || input.certificateId || input.refundId || input.documentType)
  const verificationUrl = makeVerificationUrl(token)
  const qrDataUrl = await makeQrDataUrl(verificationUrl)
  const documentNumber = makeDocumentNumber(input.documentType)

  const { data, error } = await supabase
    .from('academy_documents')
    .insert({
      document_number: documentNumber,
      document_type: input.documentType,
      trainee_id: input.traineeId || null,
      enrollment_id: input.enrollmentId || null,
      payment_id: input.paymentId || null,
      refund_id: input.refundId || null,
      certificate_id: input.certificateId || null,
      verification_token: token,
      verification_url: verificationUrl,
      qr_data_url: qrDataUrl,
      title: input.title || documentNumber,
      amount: input.amount || 0,
      currency: input.currency || 'MAD',
      payload: input.payload || {},
      status: 'valid',
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function getAcademyDocumentByToken(token: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('academy_documents')
    .select('*')
    .eq('verification_token', token)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function logDocumentVerification(token: string, documentId?: string | null, result = 'viewed') {
  const supabase = await createClient()
  await supabase.from('academy_document_verification_logs').insert({
    verification_token: token,
    document_id: documentId || null,
    result,
  })
}
