import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { canAccessConnectDepartment, canCreateExecutiveBroadcast } from '@/lib/connect/connect-access'

const memoryConversations: any[] = []

export async function GET() {
  const user = await getCurrentAppUser()
  if (!user?.id) return NextResponse.json({ conversations: [] }, { status: 401 })

  const safeUser = user as any
  const visible = memoryConversations.filter((conversation) => {
    if (conversation.type === 'direct') return conversation.memberIds?.includes(String(safeUser.id))
    if (conversation.privacy_level === 'executive') return canCreateExecutiveBroadcast(safeUser)
    return canAccessConnectDepartment(safeUser, conversation.department)
  })

  return NextResponse.json({ conversations: visible })
}

export async function POST(req: Request) {
  const user = await getCurrentAppUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const safeUser = user as any

  if (body.privacy_level === 'executive' && !canCreateExecutiveBroadcast(safeUser)) {
    return NextResponse.json({ error: 'Executive room creation is restricted' }, { status: 403 })
  }

  const conversation = {
    id: crypto.randomUUID(),
    title: String(body.title || 'Untitled conversation'),
    type: body.type || 'room',
    privacy_level: body.privacy_level || 'private',
    department: body.department || null,
    module_key: body.module_key || null,
    memberIds: Array.from(new Set([String(safeUser.id), ...(body.memberIds || []).map(String)])),
    created_by: String(safeUser.id),
    created_at: new Date().toISOString(),
  }

  memoryConversations.push(conversation)
  return NextResponse.json({ conversation })
}
