import { NextRequest, NextResponse } from 'next/server'
import { deleteResource, getResource, updateResource } from '@/lib/capital-command-center/tasks-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> | { id: string } }

export async function GET(_request: NextRequest, context: Ctx) {
  try {
    const { id } = await context.params
    const data = await getResource('tasks', id)
    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to load task' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: Ctx) {
  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({}))
    const patch = { ...(body || {}) }
    if (patch.status === 'completed' && !patch.completed_at) patch.completed_at = new Date().toISOString()
    if (patch.status && patch.status !== 'completed') patch.completed_at = patch.completed_at || null
    const data = await updateResource('tasks', id, patch)
    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to update task' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, context: Ctx) {
  try {
    const { id } = await context.params
    await deleteResource('tasks', id)
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to delete task' }, { status: 500 })
  }
}
