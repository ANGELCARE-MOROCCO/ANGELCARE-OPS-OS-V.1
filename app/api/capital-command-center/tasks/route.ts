import { NextRequest, NextResponse } from 'next/server'
import { createResource, listResource, STARTER_TASKS } from '@/lib/capital-command-center/tasks-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await listResource('tasks')
    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to load tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    if (body?.starter === true) {
      const created = []
      for (const task of STARTER_TASKS) created.push(await createResource('tasks', task))
      return NextResponse.json({ ok: true, data: created })
    }
    const data = await createResource('tasks', body || {})
    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to create task' }, { status: 500 })
  }
}
