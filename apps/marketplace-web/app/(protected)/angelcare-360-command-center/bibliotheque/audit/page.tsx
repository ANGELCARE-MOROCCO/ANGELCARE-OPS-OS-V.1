import { LibraryCommandShell } from '@/components/angelcare360/library-command/LibraryCommandShell'
import { CollectionForensics } from '@/components/angelcare360/library-command/LibraryViews'
import { loadLibrarySnapshot } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function AuditBibliothequePage() {
  const snapshot = await loadLibrarySnapshot()
  return <LibraryCommandShell schoolName={snapshot.schoolName} title="Collection Forensics" subtitle="Traçabilité institutionnelle · actions, états et intégrité de circulation réellement enregistrés">
    <CollectionForensics snapshot={snapshot} />
  </LibraryCommandShell>
}
