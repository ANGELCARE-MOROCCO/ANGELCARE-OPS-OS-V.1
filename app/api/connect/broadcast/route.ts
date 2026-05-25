import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createBroadcast } from '@/lib/connect/connect-repository'

export async function POST(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const broadcast = await createBroadcast(user as any, await req.json())
    return NextResponse.json({ ok: true, broadcast })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Create Connect broadcast failed'
    return NextResponse.json({ error: message }, { status: message.toLowerCase().includes('restricted') ? 403 : 500 })
  }
}
