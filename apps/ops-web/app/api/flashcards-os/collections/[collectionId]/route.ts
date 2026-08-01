import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { recordFlashcardsAudit, updateCollection } from '@/lib/flashcards-os/server/repository'

export async function PATCH(request: Request, context: { params: Promise<{ collectionId: string }> }) {
  const access = await assertFlashcardsApiAccess('flashcards_os.manage_collections')
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })

  try {
    const { collectionId } = await context.params
    const body = await request.json()
    const allowedStatuses = new Set(['needs_structuring', 'needs_review', 'ready_for_growth', 'active', 'approved', 'archived'])
    const allowedLifecycle = new Set(['legacy_intake', 'idea', 'structuring', 'content_draft', 'review', 'approved', 'published', 'revision_required', 'archived'])
    if (body.status && !allowedStatuses.has(String(body.status))) return NextResponse.json({ error: 'Statut invalide.' }, { status: 400 })
    if (body.lifecycle && !allowedLifecycle.has(String(body.lifecycle))) return NextResponse.json({ error: 'Lifecycle invalide.' }, { status: 400 })

    const collection = await updateCollection(decodeURIComponent(collectionId), {
      name: body.name == null ? undefined : String(body.name),
      categoryId: body.categoryId == null ? undefined : String(body.categoryId),
      status: body.status,
      lifecycle: body.lifecycle,
      expectedCardCount: body.expectedCardCount === undefined ? undefined : body.expectedCardCount == null ? null : Number(body.expectedCardCount),
      historicalPriceDh: body.historicalPriceDh === undefined ? undefined : body.historicalPriceDh == null ? null : Number(body.historicalPriceDh),
      ageMinMonths: body.ageMinMonths === undefined ? undefined : body.ageMinMonths == null ? null : Number(body.ageMinMonths),
      ageMaxMonths: body.ageMaxMonths === undefined ? undefined : body.ageMaxMonths == null ? null : Number(body.ageMaxMonths),
      languages: Array.isArray(body.languages) ? body.languages.map(String) : undefined,
      methodologies: Array.isArray(body.methodologies) ? body.methodologies.map(String) : undefined,
      primaryObjective: body.primaryObjective == null ? undefined : String(body.primaryObjective),
      audiences: Array.isArray(body.audiences) ? body.audiences.map(String) : undefined,
      usageContexts: Array.isArray(body.usageContexts) ? body.usageContexts.map(String) : undefined,
      owner: body.owner == null ? undefined : String(body.owner),
      notes: body.notes == null ? undefined : String(body.notes),
    })
    await recordFlashcardsAudit({
      actorId: String((access.user as any).id || ''),
      actorName: String((access.user as any).full_name || (access.user as any).email || ''),
      actionKey: 'collection.updated',
      actionLabel: 'Dossier collection mis à jour',
      entityType: 'collection',
      entityId: String(collection.id),
      summary: `Mise à jour de ${collection.code} · ${collection.name}`,
      after: body,
    })
    revalidatePath('/flashcards-os')
    revalidatePath('/flashcards-os/product')
    revalidatePath('/flashcards-os/product/collections')
    revalidatePath(`/flashcards-os/product/collections/${decodeURIComponent(collectionId).toLowerCase()}`)
    return NextResponse.json({ collection })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update collection.' }, { status: 500 })
  }
}
