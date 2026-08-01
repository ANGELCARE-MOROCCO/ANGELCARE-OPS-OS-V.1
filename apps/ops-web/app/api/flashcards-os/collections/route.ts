import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { createCollection, recordFlashcardsAudit } from '@/lib/flashcards-os/server/repository'

export async function POST(request: Request) {
  const access = await assertFlashcardsApiAccess('flashcards_os.manage_collections')
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })

  try {
    const body = await request.json()
    const code = String(body.code || '').trim()
    const name = String(body.name || '').trim()
    const categoryId = String(body.categoryId || '').trim()
    if (!/^FC-[A-Z0-9]+-[A-Z0-9-]+$/i.test(code)) return NextResponse.json({ error: 'Le code doit suivre le format FC-DOMAINE-IDENTIFIANT.' }, { status: 400 })
    if (name.length < 3 || name.length > 180) return NextResponse.json({ error: 'Le nom doit contenir 3 à 180 caractères.' }, { status: 400 })
    if (!categoryId) return NextResponse.json({ error: 'La sous-catégorie est obligatoire.' }, { status: 400 })

    const collection = await createCollection({
      code,
      name,
      categoryId,
      expectedCardCount: body.expectedCardCount == null ? null : Number(body.expectedCardCount),
      historicalPriceDh: body.historicalPriceDh == null ? null : Number(body.historicalPriceDh),
      ageMinMonths: body.ageMinMonths == null ? null : Number(body.ageMinMonths),
      ageMaxMonths: body.ageMaxMonths == null ? null : Number(body.ageMaxMonths),
      languages: Array.isArray(body.languages) ? body.languages.map(String) : ['fr'],
      primaryObjective: String(body.primaryObjective || ''),
      owner: String(body.owner || 'Direction Produit'),
    })
    await recordFlashcardsAudit({
      actorId: String((access.user as any).id || ''),
      actorName: String((access.user as any).full_name || (access.user as any).email || ''),
      actionKey: 'collection.created',
      actionLabel: 'Collection créée',
      entityType: 'collection',
      entityId: String(collection.id),
      summary: `Création de la collection ${collection.code} · ${collection.name}`,
      after: collection,
    })
    revalidatePath('/flashcards-os')
    revalidatePath('/flashcards-os/product')
    revalidatePath('/flashcards-os/product/collections')
    return NextResponse.json({ collection }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create collection.' }, { status: 500 })
  }
}
