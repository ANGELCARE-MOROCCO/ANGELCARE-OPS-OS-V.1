import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { createCategory, recordFlashcardsAudit } from '@/lib/flashcards-os/server/repository'

export async function POST(request: Request) {
  const access = await assertFlashcardsApiAccess('flashcards_os.manage_taxonomy')
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })

  try {
    const body = await request.json()
    const code = String(body.code || '').trim()
    const name = String(body.name || '').trim()
    if (!/^[A-Za-z0-9][A-Za-z0-9-]{1,31}$/.test(code)) {
      return NextResponse.json({ error: 'Le code doit contenir 2 à 32 caractères alphanumériques ou tirets.' }, { status: 400 })
    }
    if (name.length < 3 || name.length > 160) {
      return NextResponse.json({ error: 'Le nom doit contenir 3 à 160 caractères.' }, { status: 400 })
    }

    const category = await createCategory({
      code,
      name,
      shortName: String(body.shortName || '').trim() || undefined,
      description: String(body.description || '').trim() || undefined,
      parentId: body.parentId ? String(body.parentId) : null,
      accent: String(body.accent || 'indigo'),
    })
    await recordFlashcardsAudit({
      actorId: String((access.user as any).id || ''),
      actorName: String((access.user as any).full_name || (access.user as any).email || ''),
      actionKey: 'taxonomy.category.created',
      actionLabel: 'Catégorie créée',
      entityType: 'category',
      entityId: String(category.id),
      summary: `Création du nœud taxonomique ${category.code} · ${category.name}`,
      after: category,
    })
    revalidatePath('/flashcards-os/product/taxonomy')
    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create category.' }, { status: 500 })
  }
}
