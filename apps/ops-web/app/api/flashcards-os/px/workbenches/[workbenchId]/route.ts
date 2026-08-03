import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromPxUser, deleteWorkbench, getWorkbench, updateWorkbench } from '@/lib/flashcards-os/px/repository'

export async function GET(_: Request, { params }: { params: Promise<{ workbenchId: string }> }) {
  const access = await assertFlashcardsApiAccess('flashcards_os.view')
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })
  const { workbenchId } = await params
  const result = await getWorkbench(workbenchId, actorFromPxUser(access.user))
  return result ? NextResponse.json(result) : NextResponse.json({ error: 'Workbench not found.' }, { status: 404 })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ workbenchId: string }> }) {
  const access = await assertFlashcardsApiAccess('flashcards_os.view')
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })
  try { const { workbenchId } = await params; return NextResponse.json(await updateWorkbench(workbenchId, await request.json(), actorFromPxUser(access.user))) }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Workbench update failed.' }, { status: 400 }) }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ workbenchId: string }> }) {
  const access = await assertFlashcardsApiAccess('flashcards_os.view')
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })
  try { const { workbenchId } = await params; return NextResponse.json(await deleteWorkbench(workbenchId, actorFromPxUser(access.user))) }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Permanent deletion failed.' }, { status: 409 }) }
}
