import type { SupabaseClient } from '@supabase/supabase-js'
import type { PacojacoDocumentType } from './types'

function prefixForType(documentType: PacojacoDocumentType) {
  return documentType === 'invoice' ? 'FAC-PACO' : 'DEV-PACO'
}

export async function generatePacojacoDocumentNumber(
  supabase: SupabaseClient,
  documentType: PacojacoDocumentType,
  year = new Date().getFullYear()
) {
  const prefix = prefixForType(documentType)
  const pattern = `${prefix}-${year}-%`

  const { count, error } = await supabase
    .from('pacojaco_documents')
    .select('id', { count: 'exact', head: true })
    .eq('document_type', documentType)
    .ilike('document_number', pattern)

  if (error) {
    throw new Error(`Unable to generate document number: ${error.message}`)
  }

  const nextSequence = Number(count || 0) + 1
  return `${prefix}-${year}-${String(nextSequence).padStart(4, '0')}`
}

