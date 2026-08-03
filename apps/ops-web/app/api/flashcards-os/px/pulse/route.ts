import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromPxUser, listDocuments, listRecent, listWorkbenches } from '@/lib/flashcards-os/px/repository'

export async function GET() {
  const access = await assertFlashcardsApiAccess('flashcards_os.view')
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })
  try {
    const actor = actorFromPxUser(access.user)
    const [workbenches, recent, documents] = await Promise.all([listWorkbenches(actor, 12), listRecent(actor), listDocuments(actor)])
    const events = [
      ...workbenches.slice(0, 8).map((item) => ({ id: `workbench-${item.id}`, kind: 'workbench', label: `${item.title} · ${item.kind}`, href: `/flashcards-os/workbench/${item.kind}/${item.id}`, at: item.updatedAt, tone: 'active' })),
      ...documents.slice(0, 6).map((item) => ({ id: `document-${item.id}`, kind: 'document', label: `PDF généré · ${item.title}`, href: '/flashcards-os/documents', at: item.createdAt, tone: 'success' })),
      ...recent.slice(0, 8).map((item) => ({ id: `recent-${item.id}`, kind: item.entityType, label: item.label, href: item.href, at: item.lastOpenedAt, tone: 'neutral' })),
    ].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 18)
    return NextResponse.json({ events })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Pulse unavailable.', events: [] }, { status: 200 })
  }
}
