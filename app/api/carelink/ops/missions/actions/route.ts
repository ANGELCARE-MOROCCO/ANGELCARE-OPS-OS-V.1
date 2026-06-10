import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  return NextResponse.json({ ok: true, action: body.action || 'recorded', message: 'Use /api/missions/[id] action endpoints for execution.', data: body })
}
