import { createHash, randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { requireEmployee360Actor } from '@/lib/hr-employee-360/permissions'
import { executeEmployee360Mutation } from '@/lib/hr-employee-360/service'
import { cleanNumber, cleanText } from '@/lib/hr-employee-360/validation'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const BUCKET = 'hr-employee-documents'
const MAX_BYTES = 15 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

function safeFileName(value: string): string {
  const normalized = value
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return normalized.slice(-180) || 'document'
}

function revalidateEmployee(employeeId: string) {
  ;[
    '/hr',
    '/hr/employees',
    `/hr/employees/${employeeId}`,
    '/hr/documents',
    '/hr/audit',
  ].forEach((path) => revalidatePath(path))
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let storagePath: string | null = null
  try {
    const actor = await requireEmployee360Actor('manageDomains')
    const { id } = await context.params
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'Fichier requis.' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ ok: false, error: 'Format de fichier non autorisé.' }, { status: 415 })
    }
    if (file.size <= 0 || file.size > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: 'Le fichier doit être compris entre 1 octet et 15 Mo.' }, { status: 413 })
    }

    const expectedVersion = cleanNumber(form.get('expectedVersion'))
    if (!expectedVersion || expectedVersion < 1) {
      return NextResponse.json({ ok: false, error: 'Version du dossier requise.' }, { status: 400 })
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    const hash = createHash('sha256').update(bytes).digest('hex')
    const tenantSegment = safeFileName(actor.tenantId || 'tenant-unresolved')
    const organizationSegment = safeFileName(actor.organizationId || 'organization-unresolved')
    storagePath = `${tenantSegment}/${organizationSegment}/${safeFileName(id)}/${randomUUID()}-${safeFileName(file.name)}`

    const db = await createServiceClient()
    const upload = await db.storage.from(BUCKET).upload(storagePath, bytes, {
      contentType: file.type,
      upsert: false,
      cacheControl: '3600',
    })
    if (upload.error) {
      return NextResponse.json({ ok: false, error: `Téléversement impossible: ${upload.error.message}` }, { status: 500 })
    }

    const result = await executeEmployee360Mutation(id, actor, {
      action: 'domain.create',
      expectedVersion,
      domain: 'documents',
      reason: cleanText(form.get('reason'), 5000) || 'Document téléversé depuis Employee 360.',
      idempotencyKey: cleanText(form.get('idempotencyKey'), 160) || `document-upload-${id}-${hash}`,
      payload: {
        title: cleanText(form.get('title'), 500) || file.name,
        documentType: cleanText(form.get('documentType'), 160) || 'document',
        status: 'uploaded',
        storageBucket: BUCKET,
        storagePath,
        contentHash: hash,
        uploadedBy: actor.id,
        uploadedAt: new Date().toISOString(),
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        expiryDate: cleanText(form.get('expiryDate'), 64),
        owner: cleanText(form.get('owner'), 240),
        complianceStatus: 'pending',
        notes: cleanText(form.get('notes'), 8000),
      },
    })

    if (!result.ok) {
      await db.storage.from(BUCKET).remove([storagePath])
      return NextResponse.json(result, {
        status: result.code === 'VERSION_CONFLICT' ? 409 : 500,
        headers: { 'cache-control': 'no-store' },
      })
    }

    revalidateEmployee(id)
    return NextResponse.json(result, {
      status: 200,
      headers: { 'cache-control': 'no-store' },
    })
  } catch (error) {
    if (storagePath) {
      try {
        const db = await createServiceClient()
        await db.storage.from(BUCKET).remove([storagePath])
      } catch {
        // The primary error remains authoritative. Storage cleanup is best-effort only here.
      }
    }
    const detail = error as Error & { status?: number; code?: string }
    return NextResponse.json(
      { ok: false, error: detail.message || 'Téléversement Employee 360 impossible.', code: detail.code || 'DOCUMENT_UPLOAD_FAILED' },
      { status: detail.status || 500, headers: { 'cache-control': 'no-store' } },
    )
  }
}
