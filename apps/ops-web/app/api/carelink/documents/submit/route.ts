import { NextResponse } from 'next/server'
import { createNotification } from '@/lib/carelink/mobile-persistence'
import { carelinkMobileErrorResponse, requireCareLinkMobileAgent } from '@/lib/carelink/mobile-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await requireCareLinkMobileAgent('can_view_missions', request)
    const body = await request.json().catch(() => ({})) as Record<string, unknown>
    const documentType = String(body.documentType || body.document_type || '').trim()
    if (!documentType) return NextResponse.json({ ok: false, error: 'Document type is required.' }, { status: 400 })

    const payload = {
      caregiver_id: session.caregiverId,
      auth_user_id: String(session.user.id || ''),
      document_type: documentType,
      file_url: typeof body.fileUrl === 'string' ? body.fileUrl : null,
      note: String(body.note || ''),
      status: 'submitted_for_ops_review',
      review_status: 'pending_ops_review',
      source: 'carelink_mobile',
      metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
    }

    const { data, error } = await session.supabase
      .from('carelink_agent_document_submissions')
      .insert([payload])
      .select('*')
      .maybeSingle()
    if (error) throw new Error(error.message)

    await createNotification({
      type: 'agent_document_submission',
      title: 'Document agent soumis',
      body: `${documentType} soumis pour revue OPS.`,
      priority: 'high',
      caregiverId: session.caregiverId,
      linkedEntityType: 'caregiver',
      linkedEntityId: String(session.caregiverId),
      metadata: { submission_id: data?.id || null, document_type: documentType },
    }).catch(() => null)

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'CareLink document submission failed')
  }
}
