import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { recordFlashcardsAudit, resolveImportIssue } from '@/lib/flashcards-os/server/repository'

export async function PATCH(request: Request, context: { params: Promise<{ issueId: string }> }) {
  const access = await assertFlashcardsApiAccess('flashcards_os.manage_portfolio')
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })

  try {
    const { issueId } = await context.params
    const body = await request.json()
    const status = String(body.status || '')
    const resolution = String(body.resolution || '').trim()
    if (!['resolved', 'accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Décision d’arbitrage invalide.' }, { status: 400 })
    }
    if (resolution.length < 12 || resolution.length > 2000) {
      return NextResponse.json({ error: 'La justification doit contenir 12 à 2 000 caractères.' }, { status: 400 })
    }

    const actorName = String((access.user as any).full_name || (access.user as any).email || '')
    const issue = await resolveImportIssue(decodeURIComponent(issueId), {
      status: status as 'resolved' | 'accepted' | 'rejected',
      resolution,
      actorName,
    })
    await recordFlashcardsAudit({
      actorId: String((access.user as any).id || ''),
      actorName,
      actionKey: 'catalogue.issue.arbitrated',
      actionLabel: 'Anomalie catalogue arbitrée',
      entityType: 'import_issue',
      entityId: String(issue.id),
      summary: `${status.toUpperCase()} · ${resolution.slice(0, 180)}`,
      after: issue,
      riskLevel: status === 'rejected' ? 'medium' : 'normal',
    })
    revalidatePath('/flashcards-os')
    revalidatePath('/flashcards-os/governance/import-control')
    return NextResponse.json({ issue })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to arbitrate issue.' }, { status: 500 })
  }
}
