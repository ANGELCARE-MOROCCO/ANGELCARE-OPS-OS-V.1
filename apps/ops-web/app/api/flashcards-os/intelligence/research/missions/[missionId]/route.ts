import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { loadResearchMission, updateResearchMissionStatus } from '@/lib/flashcards-os/intelligence/server/repository'
import { actorFromUser } from '@/lib/flashcards-os/intelligence/server/jobs'

export async function GET(_: Request, context: { params: Promise<{ missionId: string }> }) {
  const access = await assertFlashcardsApiAccess('flashcards_os.view_intelligence')
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })
  const { missionId } = await context.params
  const result = await loadResearchMission(decodeURIComponent(missionId))
  if (!result) return NextResponse.json({ error: 'Mission introuvable.' }, { status: 404 })
  return NextResponse.json(result)
}

export async function PATCH(request: Request, context: { params: Promise<{ missionId: string }> }) {
  const access = await assertFlashcardsApiAccess('flashcards_os.approve_research')
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })
  try {
    const { missionId } = await context.params
    const body = await request.json()
    const allowed = ['draft','submitted','approved','cancelled','archived']
    if (!allowed.includes(String(body.status))) return NextResponse.json({ error: 'Transition de mission invalide.' }, { status: 400 })
    const mission = await updateResearchMissionStatus(decodeURIComponent(missionId), body.status, actorFromUser(access.user), String(body.note || ''))
    return NextResponse.json({ mission })
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update mission.' }, { status: 500 }) }
}
