import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser } from '@/lib/flashcards-os/intelligence/server/jobs'
import { updateResearchMissionStatus } from '@/lib/flashcards-os/intelligence/server/repository'

export async function POST(request: Request, context: { params: Promise<{ missionId: string }> }) {
  const access = await assertFlashcardsApiAccess('flashcards_os.approve_research')
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })
  try { const { missionId } = await context.params; const body = await request.json().catch(() => ({})); const mission = await updateResearchMissionStatus(decodeURIComponent(missionId), 'cancelled', actorFromUser(access.user), String(body.note || 'Mission annulée par autorité.')); revalidatePath(`/flashcards-os/intelligence/research/${missionId}`); return NextResponse.json({ mission }) }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Cancellation failed.' }, { status: 500 }) }
}
