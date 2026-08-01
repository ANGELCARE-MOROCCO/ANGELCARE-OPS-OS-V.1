import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser } from '@/lib/flashcards-os/intelligence/server/jobs'
import { reviewEvidence } from '@/lib/flashcards-os/intelligence/server/repository'

export async function POST(request: Request, context: { params: Promise<{ sourceId: string }> }) {
  const access = await assertFlashcardsApiAccess('flashcards_os.review_evidence')
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })
  try { const { sourceId } = await context.params; const body = await request.json(); if (!['accepted','rejected','needs_verification'].includes(String(body.status))) return NextResponse.json({ error: 'Décision preuve invalide.' }, { status: 400 }); if (String(body.note || '').trim().length < 4) return NextResponse.json({ error: 'Une note d’arbitrage est requise.' }, { status: 400 }); const source = await reviewEvidence(decodeURIComponent(sourceId), body.status, String(body.note), actorFromUser(access.user)); revalidatePath('/flashcards-os/intelligence/evidence'); return NextResponse.json({ source }) }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Evidence review failed.' }, { status: 500 }) }
}
