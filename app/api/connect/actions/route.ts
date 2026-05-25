import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createAction, deleteAction, getActions, updateAction } from '@/lib/connect/connect-repository'

export async function GET() {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ actions: [], error: 'Unauthorized' }, { status: 401 })
    const actions = await getActions(user as any)
    return NextResponse.json({ actions })
  } catch (error) {
    return NextResponse.json({ actions: [], error: error instanceof Error ? error.message : 'Load Connect tasks failed' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const action = await createAction(user as any, body)
    return NextResponse.json({ action })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Create Connect task failed' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const actionId = String(body.actionId || body.id || '').trim()
    if (!actionId) return NextResponse.json({ error: 'actionId required' }, { status: 400 })
    const action = await updateAction(user as any, actionId, body)
    return NextResponse.json({ action })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Update Connect task failed' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const url = new URL(req.url)
    const actionId = String(url.searchParams.get('actionId') || '').trim()
    if (!actionId) return NextResponse.json({ error: 'actionId required' }, { status: 400 })
    const result = await deleteAction(user as any, actionId)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Delete Connect task failed' }, { status: 500 })
  }
}
