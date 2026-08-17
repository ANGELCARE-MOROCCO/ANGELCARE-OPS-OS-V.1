import { LibraryCommandShell } from '@/components/angelcare360/library-command/LibraryCommandShell'
import { OverdueRecovery } from '@/components/angelcare360/library-command/LibraryViews'
import { loadLibrarySnapshot } from '../_utils'

export default async function RetardsPage() {
  const snapshot = await loadLibrarySnapshot()
  return (
    <LibraryCommandShell schoolName={snapshot.schoolName} title="Overdue Recovery" subtitle="Échéances dépassées · récupération · aucune fausse relance externe">
      <OverdueRecovery snapshot={snapshot} />
    </LibraryCommandShell>
  )
}
