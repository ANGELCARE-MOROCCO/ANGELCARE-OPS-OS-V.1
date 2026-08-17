import { LibraryCommandShell } from '@/components/angelcare360/library-command/LibraryCommandShell'
import { CollectionForensics } from '@/components/angelcare360/library-command/LibraryViews'
import { loadLibrarySnapshot } from '../_utils'

export default async function AuditBibliothequePage() {
  const snapshot = await loadLibrarySnapshot()
  return (
    <LibraryCommandShell schoolName={snapshot.schoolName} title="Collection Forensics" subtitle="Traçabilité institutionnelle · actions · états · intégrité de circulation">
      <CollectionForensics snapshot={snapshot} />
    </LibraryCommandShell>
  )
}
