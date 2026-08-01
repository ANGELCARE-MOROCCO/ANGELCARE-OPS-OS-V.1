import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser } from '@/lib/flashcards-os/intelligence/server/jobs'
import { createResearchMission, loadIntelligenceOverview } from '@/lib/flashcards-os/intelligence/server/repository'

export async function GET() {
  const access = await assertFlashcardsApiAccess('flashcards_os.view_intelligence')
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })
  const data = await loadIntelligenceOverview()
  return NextResponse.json({ missions: data.missions, sourceMode: data.sourceMode })
}

export async function POST(request: Request) {
  const access = await assertFlashcardsApiAccess('flashcards_os.create_research')
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })
  try {
    const body = await request.json()
    if (String(body.title || '').trim().length < 6) return NextResponse.json({ error: 'Le titre doit contenir au moins 6 caractères.' }, { status: 400 })
    if (String(body.strategicQuestion || '').trim().length < 20) return NextResponse.json({ error: 'La question stratégique doit contenir au moins 20 caractères.' }, { status: 400 })
    if (!Array.isArray(body.plannedQueries) || body.plannedQueries.length < 1 || body.plannedQueries.length > 12) return NextResponse.json({ error: 'La mission exige 1 à 12 requêtes planifiées.' }, { status: 400 })
    const mission = await createResearchMission({
      title: String(body.title), strategicQuestion: String(body.strategicQuestion), purpose: body.purpose, mode: body.mode,
      productDomain: body.productDomain ? String(body.productDomain) : undefined,
      collectionIds: Array.isArray(body.collectionIds) ? body.collectionIds.map(String) : [],
      audienceProfiles: Array.isArray(body.audienceProfiles) ? body.audienceProfiles.map(String) : [],
      geographicScope: Array.isArray(body.geographicScope) ? body.geographicScope.map(String) : [],
      languages: Array.isArray(body.languages) ? body.languages.map(String) : [],
      sourceCategories: Array.isArray(body.sourceCategories) ? body.sourceCategories.map(String) : [],
      includeDomains: Array.isArray(body.includeDomains) ? body.includeDomains.map(String) : [],
      excludeDomains: Array.isArray(body.excludeDomains) ? body.excludeDomains.map(String) : [],
      plannedQueries: body.plannedQueries.map(String), searchDepth: body.searchDepth,
      sourceLimit: Number(body.sourceLimit || 10), budgetCredits: Number(body.budgetCredits || 15),
      ownerName: String(body.ownerName || ''), reviewerName: String(body.reviewerName || ''), deadline: body.deadline ? String(body.deadline) : undefined,
    }, actorFromUser(access.user))
    revalidatePath('/flashcards-os/intelligence'); revalidatePath('/flashcards-os/intelligence/research')
    return NextResponse.json({ mission }, { status: 201 })
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create research mission.' }, { status: 500 }) }
}
