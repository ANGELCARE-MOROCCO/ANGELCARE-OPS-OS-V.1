import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromPxUser, deleteItem, updateItem } from '@/lib/flashcards-os/px/repository'

export async function PATCH(request: Request, { params }: { params: Promise<{ workbenchId: string; itemId: string }> }) {
  const access = await assertFlashcardsApiAccess('flashcards_os.view')
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })
  try { const { workbenchId, itemId } = await params; return NextResponse.json(await updateItem(workbenchId, itemId, await request.json(), actorFromPxUser(access.user))) }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Item update failed.' }, { status: 400 }) }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ workbenchId: string; itemId: string }> }) {
  const access = await assertFlashcardsApiAccess('flashcards_os.view')
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })
  try { const { workbenchId, itemId } = await params; return NextResponse.json(await deleteItem(workbenchId, itemId, actorFromPxUser(access.user))) }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Permanent item deletion failed.' }, { status: 400 }) }
}
