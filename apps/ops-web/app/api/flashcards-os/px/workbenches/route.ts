import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromPxUser, createWorkbench, listWorkbenches } from '@/lib/flashcards-os/px/repository'

export async function GET() {
  const access = await assertFlashcardsApiAccess('flashcards_os.view')
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })
  try { return NextResponse.json({ workbenches: await listWorkbenches(actorFromPxUser(access.user)) }) }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Workbench list failed.' }, { status: 400 }) }
}

export async function POST(request: Request) {
  const access = await assertFlashcardsApiAccess('flashcards_os.view')
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })
  try {
    const body = await request.json()
    const kind = ['collection', 'package', 'journey', 'command', 'document'].includes(String(body.kind)) ? body.kind : 'package'
    const created = await createWorkbench({ kind, sourceId: body.sourceId || null, sourceType: body.sourceType || null, title: String(body.title || 'Nouveau workbench'), universe: body.universe, payload: body.payload, sourceSnapshot: body.sourceSnapshot, items: Array.isArray(body.items) ? body.items : [] }, actorFromPxUser(access.user))
    return NextResponse.json(created, { status: 201 })
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Workbench creation failed.' }, { status: 400 }) }
}
