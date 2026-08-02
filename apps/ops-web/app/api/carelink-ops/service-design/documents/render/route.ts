import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { canUseServiceDesignDocuments } from '@/components/carelink/service-design/documents/server/access'
import { renderServiceDesignPdf } from '@/components/carelink/service-design/documents/server/pdfRenderer'
import { SERVICE_DOCUMENT_TEMPLATES } from '@/components/carelink/service-design/documents/templateRegistry'
import type { ServiceDocumentRenderPayload } from '@/components/carelink/service-design/documents/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const user = await getCurrentAppUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Authentification ANGELCARE requise.' }, { status: 401 })
  if (!canUseServiceDesignDocuments(user as Record<string, unknown>)) return NextResponse.json({ ok: false, error: 'Autorité Service Design insuffisante pour produire ce document.' }, { status: 403 })
  try {
    const payload = await request.json() as ServiceDocumentRenderPayload
    if (!payload?.source || !payload?.settings) return NextResponse.json({ ok: false, error: 'Source et configuration document requises.' }, { status: 400 })
    if (!SERVICE_DOCUMENT_TEMPLATES.some((template) => template.id === payload.settings.templateId)) return NextResponse.json({ ok: false, error: 'Gabarit document non autorisé.' }, { status: 400 })
    if (!payload.source.title?.trim()) return NextResponse.json({ ok: false, error: 'Le titre source est requis.' }, { status: 400 })
    if (!Array.isArray(payload.settings.sectionOrder) || !payload.settings.sectionOrder.length) return NextResponse.json({ ok: false, error: 'Au moins une section document est requise.' }, { status: 400 })
    const bytes = await renderServiceDesignPdf(payload)
    const checksum = crypto.createHash('sha256').update(bytes).digest('hex')
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
    return new Response(buffer, { status: 200, headers: { 'content-type': 'application/pdf', 'content-disposition': `attachment; filename="${String(payload.settings.documentReference || payload.source.reference || payload.source.code || 'ANGELCARE-SERVICE-DESIGN').replace(/[^a-zA-Z0-9_-]+/g, '-')}.pdf"`, 'cache-control': 'no-store', 'x-document-sha256': checksum, 'x-document-template': payload.settings.templateId } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Génération PDF impossible.' }, { status: 500 })
  }
}
