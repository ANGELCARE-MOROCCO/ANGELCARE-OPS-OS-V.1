import { notFound } from 'next/navigation'
import CustomerRelationshipCommandRoom from '@/components/angelcare360/operator/customer-dossier/CustomerRelationshipCommandRoom'
import type { CustomerDossierCapabilities } from '@/components/angelcare360/operator/customer-dossier/CustomerDossierPortals'
import { CUSTOMER_CHAPTERS, type CustomerChapterId } from '@/components/angelcare360/operator/customer-dossier/CustomerDossierContract'
import { loadWave2CustomerCommand } from '@/components/angelcare360/operator/wave2/Wave2CommandData'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ section?: string | string[] }>
}

function can(session: Awaited<ReturnType<typeof requireAngelcare360OperatorSession>>, permission: string) {
  if (!session) return false
  if (session.access.accessLevel === 'super_admin') return true
  const permissions = new Set((session.user.permissions || []).map((item) => String(item)))
  return permissions.has('*') || permissions.has('operator.*') || permissions.has('angelcare360.operator.*') || permissions.has(permission)
}

export default async function Angelcare360OperatorCustomerCommandPage({ params, searchParams }: PageProps) {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()

  const { id } = await params
  const query = await searchParams
  const requestedSection = Array.isArray(query.section) ? query.section[0] : query.section
  const chapterIds = new Set<CustomerChapterId>(CUSTOMER_CHAPTERS.map((item) => item.id))
  const initialChapter: CustomerChapterId = requestedSection && chapterIds.has(requestedSection as CustomerChapterId)
    ? requestedSection as CustomerChapterId
    : 'overview'

  const command = await loadWave2CustomerCommand(id)
  if (!command) notFound()

  const capabilities: CustomerDossierCapabilities = {
    updateClient: can(session, 'operator.clients.update'),
    archiveClient: can(session, 'operator.clients.archive'),
    createSupportTicket: can(session, 'operator.support.create'),
    createServiceAction: can(session, 'operator.service.update'),
    createNote: can(session, 'operator.service.update'),
  }

  return <CustomerRelationshipCommandRoom command={command} capabilities={capabilities} initialChapter={initialChapter} />
}
