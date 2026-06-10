import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const body = await request.json().catch(() => ({}))
  return NextResponse.json({ ok: true, missionId: id, action: 'checklist', data: body })
}
