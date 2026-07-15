import { NextRequest, NextResponse } from 'next/server'
import { deleteResource, updateResource } from '@/lib/capital-command-center/tasks-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> | { id: string } }

export async function PATCH(request: NextRequest, context: Ctx) {
  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({}))
    const data = await updateResource('modules' as any, id, body || {})
    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to update modules' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, context: Ctx) {
  try {
    const { id } = await context.params
    await deleteResource('modules' as any, id)
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to delete modules' }, { status: 500 })
  }
}
