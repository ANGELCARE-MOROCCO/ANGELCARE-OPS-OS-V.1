import { LibraryCommandShell } from '@/components/angelcare360/library-command/LibraryCommandShell'
import { AvailabilityAtlas } from '@/components/angelcare360/library-command/LibraryViews'
import { loadLibrarySnapshot } from '../_utils'

export default async function DisponibilitePage() {
  const snapshot = await loadLibrarySnapshot()
  return (
    <LibraryCommandShell schoolName={snapshot.schoolName} title="Availability Atlas" subtitle="Disponibilité réelle par œuvre et exemplaire · recherche code-barres">
      <AvailabilityAtlas snapshot={snapshot} />
    </LibraryCommandShell>
  )
}
