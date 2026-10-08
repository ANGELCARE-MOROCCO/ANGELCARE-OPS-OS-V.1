import { LibraryCommandShell } from '@/components/angelcare360/library-command/LibraryCommandShell'
import { ReturnDesk } from '@/components/angelcare360/library-command/LibraryViews'
import { loadLibrarySnapshot } from '../_utils'
import { requireAngelcare360RouteAccess } from '@/lib/angelcare360/server/route-guard'

export const dynamic = 'force-dynamic'

export default async function RetoursPage() {
  await requireAngelcare360RouteAccess('/angelcare-360-command-center/bibliotheque/retours')
  const snapshot = await loadLibrarySnapshot()
  return <LibraryCommandShell schoolName={snapshot.schoolName} title="Return Desk" subtitle="Retours · condition physique · disponibilité restaurée ou exception enregistrée atomiquement">
    <ReturnDesk snapshot={snapshot} />
  </LibraryCommandShell>
}
