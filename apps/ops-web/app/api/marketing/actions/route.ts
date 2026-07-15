import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  return NextResponse.json({ ok: true, mode: 'safe-preview', action: body.action || 'marketing-action', queuedAt: new Date().toISOString() })
}
