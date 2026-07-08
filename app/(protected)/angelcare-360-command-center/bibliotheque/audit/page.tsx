import Angelcare360LibraryAuditDrawer from '@/components/angelcare360/library/Angelcare360LibraryAuditDrawer'
import Angelcare360LibrarySectionScreen from '@/components/angelcare360/library/Angelcare360LibrarySectionScreen'
import { listAngelcare360LibraryAuditEvents } from '@/lib/angelcare360/server/library'
import { getAngelcare360LibraryContext } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360LibraryAuditPage() {
  const context = await getAngelcare360LibraryContext()
  const events = await listAngelcare360LibraryAuditEvents({ schoolId: context.school.id })
  return (
    <Angelcare360LibrarySectionScreen title="Audit bibliothèque" description="Journal des mutations et blocages bibliothèque.">
      <Angelcare360LibraryAuditDrawer events={events} />
    </Angelcare360LibrarySectionScreen>
  )
}
