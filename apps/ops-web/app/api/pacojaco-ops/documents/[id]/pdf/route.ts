import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { hasPacojacoOpsAccess } from '@/lib/pacojaco-ops/security'
import { isUuid } from '@/lib/pacojaco-ops/validation'
import { generatePacojacoDocumentPdfBytes, getPacojacoDocumentPdfFilename } from '@/lib/pacojaco-ops/pdf'
import { loadPacojacoDocumentRelations } from '@/lib/pacojaco-ops/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> | { id: string } }

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

async function resolveId(context: Ctx) {
  const params = await context.params
  return String(params?.id || '').trim()
}

export async function GET(_request: Request, context: Ctx) {
  try {
    const id = await resolveId(context)
    if (!isUuid(id)) return jsonError('Invalid document id.', 400)

    const user = await getCurrentUser()
    if (!hasPacojacoOpsAccess(user)) return jsonError('Unauthorized', 403)

    const supabase = await createClient()
    const document = await loadPacojacoDocumentRelations(supabase, id)
    if (!document) return jsonError('Document not found.', 404)

    const pdf = await generatePacojacoDocumentPdfBytes(document)
    const filename = getPacojacoDocumentPdfFilename(document.document_number)

    return new Response(Buffer.from(pdf), {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `inline; filename="${filename}"`,
        'cache-control': 'no-store',
      },
    })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to generate PDF.', 500)
  }
}

