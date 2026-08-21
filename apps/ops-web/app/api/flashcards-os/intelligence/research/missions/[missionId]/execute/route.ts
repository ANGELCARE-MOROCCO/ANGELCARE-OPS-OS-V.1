import { governRoute } from '@/lib/runtime/governor/route'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser } from '@/lib/flashcards-os/intelligence/server/jobs'
import { queueResearchMission } from '@/lib/flashcards-os/intelligence/server/repository'

async function POST__angelcareGovernedImpl(_: Request, context: { params: Promise<{ missionId: string }> }) {
  const access = await assertFlashcardsApiAccess('flashcards_os.execute_research')
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })
  try { const { missionId } = await context.params; const result = await queueResearchMission(decodeURIComponent(missionId), actorFromUser(access.user)); revalidatePath(`/flashcards-os/intelligence/research/${missionId}`); return NextResponse.json(result, { status: 202 }) }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Execution queue failed.' }, { status: 500 }) }
}

export const POST = governRoute(
  {
    workloadClass: 'worker',
    operation: 'POST:/api/flashcards-os/intelligence/research/missions/[missionId]/execute',
  },
  POST__angelcareGovernedImpl,
)
