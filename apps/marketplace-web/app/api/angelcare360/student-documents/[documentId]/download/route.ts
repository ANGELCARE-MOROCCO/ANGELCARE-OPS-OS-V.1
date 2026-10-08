import { NextResponse } from 'next/server'
import { createAngelcare360StudentDocumentSignedUrl } from '@/lib/angelcare360/server/student-document-vault'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, context: { params: Promise<{ documentId: string }> }) {
  try {
    const { documentId } = await context.params
    const signedUrl = await createAngelcare360StudentDocumentSignedUrl(documentId)
    return NextResponse.redirect(signedUrl, { status: 302 })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Document indisponible.' }, { status: 404 })
  }
}
