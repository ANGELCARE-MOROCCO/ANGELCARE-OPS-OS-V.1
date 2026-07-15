'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { buildDocumentReference, parseFilters } from './_lib/documentReferences'
import { getDocumentTemplate } from './_lib/documentCatalog'
import { validateExportReason } from './_lib/documentGovernance'

export async function createDocumentExport(formData: FormData) {
  const supabase = await createClient()
  const currentUser = await getCurrentAppUser().catch(() => null)

  const type = String(formData.get('type') || '')
  const reason = String(formData.get('reason') || '')
  const reasonNote = String(formData.get('reason_note') || '')
  const template = getDocumentTemplate(type)

  if (!template) throw new Error('Unknown Academy document template.')

  const validationError = validateExportReason(reason, reasonNote)
  if (validationError) throw new Error(validationError)

  const filters = parseFilters(formData)
  const { data: seqRows, error: seqError } = await supabase.rpc('next_academy_document_sequence', {
    input_code: template.code,
  })

  if (seqError) throw new Error(seqError.message)

  const sequence = Number(seqRows || 1)
  const reference = buildDocumentReference(template.code, sequence)

  const { data: exportRow, error } = await supabase
    .from('academy_document_exports')
    .insert({
      document_type: template.type,
      document_category: template.category,
      document_code: template.code,
      document_title: template.title,
      document_reference: reference,
      confidentiality: template.confidentiality,
      export_reason: reason,
      export_reason_note: reasonNote || null,
      filters,
      generated_by: currentUser?.id || null,
      generated_by_name: (currentUser as any)?.full_name || (currentUser as any)?.username || 'AngelCare User',
      status: 'generated',
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  await supabase.from('academy_audit_logs').insert({
    action: 'document_export_generated',
    entity: 'academy_document_exports',
    entity_id: exportRow.id,
    actor_id: currentUser?.id || null,
    reason,
    details: {
      document_type: template.type,
      document_reference: reference,
      filters,
      note: reasonNote || null,
    },
  })

  redirect(`/academy/documents/export?exportId=${exportRow.id}`)
}
