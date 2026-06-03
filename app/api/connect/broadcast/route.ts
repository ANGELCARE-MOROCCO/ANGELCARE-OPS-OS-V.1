import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createBroadcast } from '@/lib/connect/connect-repository'

export async function POST(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ ok: false, data: null, error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    if (!String(body?.title || body?.body || '').trim()) return NextResponse.json({ ok: false, data: null, error: 'title or body required' }, { status: 400 })
    const broadcast = await createBroadcast(user as any, body)
    return NextResponse.json({ ok: true, data: { broadcast }, broadcast, error: null })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Create Connect broadcast failed'
    return NextResponse.json({ ok: false, data: null, error: message }, { status: message.toLowerCase().includes('restricted') ? 403 : 500 })
  }
}
