import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { buildHRDomainLiveState } from '@/lib/hr-production/live-sync'
import { createClient } from '@/lib/supabase/server'
import { logHRActivity } from '@/lib/hr-production/repository'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await buildHRDomainLiveState('documents'), { headers: { 'Cache-Control': 'no-store' } })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to load Document compliance state.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const supabase = await createClient()
    const action = String(body?.action || 'documents.review')
    const documentId = String(body?.document_id || body?.staff_document_id || body?.id || '').trim()
    const payload = {
      staff_id: body?.staff_id || null,
      employee_name: String(body?.employee_name || body?.full_name || body?.name || '').trim() || null,
      title: String(body?.title || body?.document_name || body?.file_name || 'HR document').trim(),
      document_type: String(body?.document_type || body?.type || 'document').trim(),
      file_url: String(body?.file_url || body?.url || '').trim() || null,
      status: String(body?.status || body?.compliance_status || 'pending').trim(),
      signature_status: String(body?.signature_status || '').trim() || null,
      compliance_status: String(body?.compliance_status || '').trim() || null,
      expiry_date: body?.expiry_date || null,
      owner: String(body?.owner || body?.manager || '').trim() || null,
      notes: String(body?.notes || '').trim() || null,
      updated_at: new Date().toISOString(),
    }

    let record: any = null
    if (documentId) {
      const { data, error } = await supabase.from('hr_documents').update(payload).eq('id', documentId).select('*').maybeSingle()
      if (error) throw error
      record = data
    } else {
      const { data, error } = await supabase.from('hr_documents').insert({ ...payload, created_at: new Date().toISOString() }).select('*').maybeSingle()
      if (error) throw error
      record = data
    }

    try {
      await supabase.from('hr_staff_documents').upsert({
        id: documentId || record?.id || undefined,
        staff_id: payload.staff_id,
        document_type: payload.document_type,
        title: payload.title,
        file_url: payload.file_url,
        expiry_date: payload.expiry_date,
        stage: payload.status,
        status: payload.status,
        verification_status: payload.compliance_status || payload.signature_status || payload.status,
        notes: payload.notes,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
    } catch {}

    await logHRActivity({
      action: `hr.documents.${action}`,
      entity_type: 'hr_document',
      entity_id: record?.id || documentId || null,
      module: 'hr',
      source: 'Document compliance endpoint',
      status: 'recorded',
      severity: 'info',
      payload: { action, documentId, body, record, payload },
      reason: 'Document compliance mutation persisted to the live HR document store.',
    })
    revalidatePath('/hr/documents')
    revalidatePath('/hr/compliance')
    revalidatePath('/hr/staff')
    revalidatePath('/hr')
    const state = await buildHRDomainLiveState('documents')
    return NextResponse.json({
      ok: true,
      endpoint: '/api/hr/documents',
      domain: 'documents',
      action,
      mutationApplied: true,
      message: 'Document compliance mutation applied to the live HR document store.',
      record,
      state,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to process Document compliance action.' }, { status: 500 })
  }
}
