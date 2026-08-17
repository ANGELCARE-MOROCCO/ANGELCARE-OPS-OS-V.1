import { LibraryCommandShell } from '@/components/angelcare360/library-command/LibraryCommandShell'
import { ReturnDesk } from '@/components/angelcare360/library-command/LibraryViews'
import { loadLibrarySnapshot } from '../_utils'

export default async function RetoursPage() {
  const snapshot = await loadLibrarySnapshot()
  return (
    <LibraryCommandShell schoolName={snapshot.schoolName} title="Return Desk" subtitle="Retours · condition physique · disponibilité restaurée atomiquement">
      <ReturnDesk snapshot={snapshot} />
    </LibraryCommandShell>
  )
}
