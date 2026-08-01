import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { createCard, recordFlashcardsAudit } from '@/lib/flashcards-os/server/repository'

export async function POST(request: Request, context: { params: Promise<{ collectionId: string }> }) {
  const access = await assertFlashcardsApiAccess('flashcards_os.manage_content')
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })

  try {
    const { collectionId } = await context.params
    const body = await request.json()
    const sequence = Number(body.sequence)
    if (!Number.isInteger(sequence) || sequence < 1) return NextResponse.json({ error: 'La séquence doit être un entier positif.' }, { status: 400 })
    if (!String(body.concept || '').trim()) return NextResponse.json({ error: 'Le concept canonique est obligatoire.' }, { status: 400 })

    const card = await createCard(decodeURIComponent(collectionId), {
      sequence,
      concept: String(body.concept || '').trim(),
      frontText: String(body.frontText || '').trim() || null,
      backGuidance: String(body.backGuidance || '').trim() || null,
      language: String(body.language || 'fr').trim(),
      translation: String(body.translation || '').trim() || null,
      pronunciation: String(body.pronunciation || '').trim() || null,
      example: String(body.example || '').trim() || null,
      activity: String(body.activity || '').trim() || null,
      difficulty: body.difficulty,
      imageBrief: String(body.imageBrief || '').trim() || null,
    })
    await recordFlashcardsAudit({
      actorId: String((access.user as any).id || ''),
      actorName: String((access.user as any).full_name || (access.user as any).email || ''),
      actionKey: 'card.created',
      actionLabel: 'Carte structurée',
      entityType: 'card',
      entityId: String(card.id),
      summary: `Carte #${sequence} ajoutée à ${decodeURIComponent(collectionId)}`,
      after: card,
    })
    revalidatePath(`/flashcards-os/product/collections/${decodeURIComponent(collectionId).toLowerCase()}`)
    revalidatePath(`/flashcards-os/product/collections/${decodeURIComponent(collectionId).toLowerCase()}/cards`)
    return NextResponse.json({ card }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create card.' }, { status: 500 })
  }
}
