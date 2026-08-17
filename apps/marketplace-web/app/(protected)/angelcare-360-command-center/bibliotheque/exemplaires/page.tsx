import { LibraryCommandShell } from '@/components/angelcare360/library-command/LibraryCommandShell'
import { CopyFleet } from '@/components/angelcare360/library-command/LibraryViews'
import { loadLibrarySnapshot } from '../_utils'

export default async function ExemplairesPage() {
  const snapshot = await loadLibrarySnapshot()
  return (
    <LibraryCommandShell schoolName={snapshot.schoolName} title="Exemplaires" subtitle="Copy Fleet · identité physique · rayon · condition · disponibilité">
      <CopyFleet snapshot={snapshot} />
    </LibraryCommandShell>
  )
}
