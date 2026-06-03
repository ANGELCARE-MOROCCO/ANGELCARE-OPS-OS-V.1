import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { attachMessageToAttachment, createAttachmentRecord, deleteAttachment, getAttachments, sendMessage } from '@/lib/connect/connect-repository'

const BUCKET = 'connect-attachments'
const MAX_BYTES = 25 * 1024 * 1024

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').slice(0, 120) || 'connect-file'
}

export async function POST(req: Request) {
  let uploadedPath: string | null = null
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ ok: false, data: null, error: 'Unauthorized' }, { status: 401 })
    const form = await req.formData()
    const conversationId = String(form.get('conversationId') || '').trim()
    const priority = String(form.get('priority') || 'normal') as 'normal' | 'important' | 'urgent'
    const confidential = String(form.get('confidential') || 'false') === 'true'
    const file = form.get('file')
    if (!conversationId) return NextResponse.json({ ok: false, data: null, error: 'conversationId required' }, { status: 400 })
    if (!(file instanceof File)) return NextResponse.json({ ok: false, data: null, error: 'file required' }, { status: 400 })
    if (file.size > MAX_BYTES) return NextResponse.json({ ok: false, data: null, error: 'Connect attachment exceeds 25MB production limit' }, { status: 413 })
    if (!['normal', 'important', 'urgent'].includes(priority)) return NextResponse.json({ ok: false, data: null, error: 'Invalid priority' }, { status: 400 })

    const supabase = await createClient()
    const extension = safeName(file.name).split('.').pop() || 'bin'
    const objectName = `${conversationId}/${user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`
    const upload = await supabase.storage.from(BUCKET).upload(objectName, file, {
      upsert: false,
      contentType: file.type || 'application/octet-stream',
    })
    if (upload.error) throw new Error(`Upload Connect attachment: ${upload.error.message}`)
    uploadedPath = objectName

    const signed = await supabase.storage.from(BUCKET).createSignedUrl(objectName, 60 * 60 * 24 * 7)
    const attachment = await createAttachmentRecord(user as any, {
      conversationId,
      storagePath: objectName,
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
    })
    const message = await sendMessage(user as any, {
      conversationId,
      body: file.type.startsWith('audio/') ? 'Voice note shared' : `File shared · ${file.name}`,
      message_type: 'file',
      priority,
      confidential,
      metadata: {
        attachment_id: attachment.id,
        filename: file.name,
        storage_path: objectName,
        storage_bucket: BUCKET,
        content_type: file.type || 'application/octet-stream',
        size: file.size,
        signed_url: signed.data?.signedUrl || null,
        uploaded_by: String(user.id),
        uploaded_at: new Date().toISOString(),
      },
    })
    uploadedPath = null
    await attachMessageToAttachment(user as any, attachment.id, message.id)
    return NextResponse.json({ ok: true, data: { message, attachment: { ...attachment, message_id: message.id, signed_url: signed.data?.signedUrl || null } }, message, attachment: { ...attachment, message_id: message.id, signed_url: signed.data?.signedUrl || null }, error: null })
  } catch (error) {
    if (uploadedPath) {
      try {
        const supabase = await createClient()
        await supabase.storage.from(BUCKET).remove([uploadedPath])
      } catch {}
    }
    const message = error instanceof Error ? error.message : 'Upload Connect attachment failed'
    return NextResponse.json({ ok: false, data: null, error: message }, { status: message.toLowerCase().includes('required') ? 400 : message.toLowerCase().includes('private') || message.toLowerCase().includes('cannot') ? 403 : 500 })
  }
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ ok: false, data: { attachments: [] }, attachments: [], error: 'Unauthorized' }, { status: 401 })
    const conversationId = new URL(req.url).searchParams.get('conversationId')
    if (!conversationId) return NextResponse.json({ ok: false, data: { attachments: [] }, attachments: [], error: 'conversationId required' }, { status: 400 })
    const attachments = await getAttachments(user as any, conversationId)
    return NextResponse.json({ ok: true, data: { attachments }, attachments, error: null })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Load Connect attachments failed'
    return NextResponse.json({ ok: false, data: { attachments: [] }, attachments: [], error: message }, { status: message.toLowerCase().includes('private') ? 403 : 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ ok: false, data: null, error: 'Unauthorized' }, { status: 401 })
    const url = new URL(req.url)
    const attachmentId = url.searchParams.get('attachmentId') || url.searchParams.get('id')
    const messageId = url.searchParams.get('messageId')
    if (!attachmentId && !messageId) return NextResponse.json({ ok: false, data: null, error: 'attachmentId or messageId required' }, { status: 400 })
    const result = await deleteAttachment(user as any, { attachmentId, messageId })
    return NextResponse.json({ data: result, ...result, error: null })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete Connect attachment failed'
    const status = message.toLowerCase().includes('required') ? 400 : message.toLowerCase().includes('cannot') || message.toLowerCase().includes('private') ? 403 : 500
    return NextResponse.json({ ok: false, data: null, error: message }, { status })
  }
}
