import { NextResponse } from 'next/server'
import { requireEmployee360Actor } from '@/lib/hr-employee-360/permissions'
import { loadEmployee360Aggregate } from '@/lib/hr-employee-360/repository'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function sourceText(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const normalized = String(value).trim()
  return normalized || null
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; documentId: string }> },
) {
  try {
    const actor = await requireEmployee360Actor('read')
    const { id, documentId } = await context.params
    const aggregate = await loadEmployee360Aggregate(id, actor)
    const document = aggregate.domains.documents.find((record) => record.id === documentId)
    if (!document) {
      return NextResponse.json({ ok: false, error: 'Document introuvable.' }, { status: 404 })
    }

    const source = document.metadata.sourceRow
    if (!source || typeof source !== 'object' || Array.isArray(source)) {
      return NextResponse.json({ ok: false, error: 'Référence de stockage indisponible.' }, { status: 409 })
    }
    const row = source as Record<string, unknown>
    const bucket = sourceText(row.storage_bucket)
    const path = sourceText(row.storage_path)
    if (!bucket || !path) {
      const externalUrl = sourceText(row.file_url)
      return externalUrl
        ? NextResponse.json({ ok: true, url: externalUrl }, { headers: { 'cache-control': 'no-store' } })
        : NextResponse.json({ ok: false, error: 'Aucun fichier téléchargeable n’est lié à ce document.' }, { status: 409 })
    }

    const db = await createServiceClient()
    const signed = await db.storage.from(bucket).createSignedUrl(path, 120)
    if (signed.error || !signed.data?.signedUrl) {
      return NextResponse.json({ ok: false, error: signed.error?.message || 'Lien sécurisé indisponible.' }, { status: 500 })
    }

    return NextResponse.json(
      { ok: true, url: signed.data.signedUrl, expiresIn: 120 },
      { headers: { 'cache-control': 'no-store' } },
    )
  } catch (error) {
    const detail = error as Error & { status?: number; code?: string }
    return NextResponse.json(
      { ok: false, error: detail.message || 'Téléchargement impossible.', code: detail.code || 'DOCUMENT_DOWNLOAD_FAILED' },
      { status: detail.status || 500, headers: { 'cache-control': 'no-store' } },
    )
  }
}
