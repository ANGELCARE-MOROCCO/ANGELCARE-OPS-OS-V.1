import { LibraryCommandShell } from '@/components/angelcare360/library-command/LibraryCommandShell'
import { CirculationDesk } from '@/components/angelcare360/library-command/LibraryViews'
import { loadLibrarySnapshot } from '../_utils'

export default async function PretsPage() {
  const snapshot = await loadLibrarySnapshot()
  return (
    <LibraryCommandShell schoolName={snapshot.schoolName} title="Circulation Desk" subtitle="Prêts · emprunteurs · échéances · vérité transactionnelle">
      <CirculationDesk snapshot={snapshot} />
    </LibraryCommandShell>
  )
}
