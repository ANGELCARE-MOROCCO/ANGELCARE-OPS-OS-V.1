import { LibraryCommandShell } from '@/components/angelcare360/library-command/LibraryCommandShell'
import { OverdueRecovery } from '@/components/angelcare360/library-command/LibraryViews'
import { loadLibrarySnapshot } from '../_utils'
import { requireAngelcare360RouteAccess } from '@/lib/angelcare360/server/route-guard'

export const dynamic = 'force-dynamic'

export default async function RetardsPage() {
  await requireAngelcare360RouteAccess('/angelcare-360-command-center/bibliotheque/retards')
  const snapshot = await loadLibrarySnapshot()
  return <LibraryCommandShell schoolName={snapshot.schoolName} title="Overdue Resolution" subtitle="Échéances dépassées · membres concernés · récupération factuelle · aucune fausse relance externe">
    <OverdueRecovery snapshot={snapshot} />
  </LibraryCommandShell>
}
