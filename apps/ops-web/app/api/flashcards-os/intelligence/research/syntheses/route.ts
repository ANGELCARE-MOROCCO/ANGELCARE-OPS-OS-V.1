import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser } from '@/lib/flashcards-os/intelligence/server/jobs'
import { queueSynthesis } from '@/lib/flashcards-os/intelligence/server/repository'

export async function POST(request: Request) {
  const access = await assertFlashcardsApiAccess('flashcards_os.run_synthesis')
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })
  try { const body = await request.json(); const missionId = String(body.missionId || ''); if (!missionId) return NextResponse.json({ error: 'missionId required.' }, { status: 400 }); const result = await queueSynthesis(missionId, actorFromUser(access.user)); revalidatePath(`/flashcards-os/intelligence/research/${missionId}`); return NextResponse.json(result, { status: 202 }) }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Synthesis queue failed.' }, { status: 500 }) }
}
