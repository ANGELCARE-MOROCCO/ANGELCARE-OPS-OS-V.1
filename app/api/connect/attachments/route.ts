import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { sendMessage } from '@/lib/connect/connect-repository'

const BUCKET = 'connect-attachments'
const MAX_BYTES = 25 * 1024 * 1024

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').slice(0, 120) || 'connect-file'
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const form = await req.formData()
    const conversationId = String(form.get('conversationId') || '').trim()
    const priority = String(form.get('priority') || 'normal') as 'normal' | 'important' | 'urgent'
    const confidential = String(form.get('confidential') || 'false') === 'true'
    const file = form.get('file')
    if (!conversationId) return NextResponse.json({ error: 'conversationId required' }, { status: 400 })
    if (!(file instanceof File)) return NextResponse.json({ error: 'file required' }, { status: 400 })
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Connect attachment exceeds 25MB production limit' }, { status: 413 })

    const supabase = await createClient()
    const extension = safeName(file.name).split('.').pop() || 'bin'
    const objectName = `${conversationId}/${user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`
    const upload = await supabase.storage.from(BUCKET).upload(objectName, file, {
      upsert: false,
      contentType: file.type || 'application/octet-stream',
    })
    if (upload.error) throw new Error(`Upload Connect attachment: ${upload.error.message}`)

    const signed = await supabase.storage.from(BUCKET).createSignedUrl(objectName, 60 * 60 * 24 * 7)
    const message = await sendMessage(user as any, {
      conversationId,
      body: file.type.startsWith('audio/') ? 'Voice note shared' : `File shared · ${file.name}`,
      message_type: 'file',
      priority,
      confidential,
      metadata: {
        filename: file.name,
        storage_path: objectName,
        content_type: file.type || 'application/octet-stream',
        size: file.size,
        signed_url: signed.data?.signedUrl || null,
      },
    })
    return NextResponse.json({ message })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload Connect attachment failed'
    return NextResponse.json({ error: message }, { status: message.toLowerCase().includes('required') ? 400 : 500 })
  }
}
