import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const action = String(body.action || '')
  const target = String(body.target || '')

  // Safe placeholder: records the intended action shape without mutating.
  // Later connect to tasks/escalations/connect notifications.
  return NextResponse.json({
    ok: true,
    action,
    target,
    createdBy: user.id,
    queuedAt: new Date().toISOString(),
    message: 'CSA action queued in safe preview mode.',
  })
}
