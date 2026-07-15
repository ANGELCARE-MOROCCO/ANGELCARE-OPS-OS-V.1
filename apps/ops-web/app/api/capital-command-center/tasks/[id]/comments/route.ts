import { NextRequest, NextResponse } from 'next/server'
import { createComment, listComments } from '@/lib/capital-command-center/tasks-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> | { id: string } }

export async function GET(_request: NextRequest, context: Ctx) {
  try {
    const { id } = await context.params
    const data = await listComments(id)
    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to load comments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: Ctx) {
  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({}))
    const data = await createComment(id, body || {})
    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to add comment' }, { status: 500 })
  }
}
