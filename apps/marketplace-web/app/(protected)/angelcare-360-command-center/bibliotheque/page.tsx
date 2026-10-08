import { LibraryCommandShell } from '@/components/angelcare360/library-command/LibraryCommandShell'
import { KnowledgeAtrium } from '@/components/angelcare360/library-command/LibraryViews'
import { loadLibrarySnapshot } from './_utils'
import { requireAngelcare360RouteAccess } from '@/lib/angelcare360/server/route-guard'

export const dynamic = 'force-dynamic'

export default async function BibliothequePage() {
  await requireAngelcare360RouteAccess('/angelcare-360-command-center/bibliotheque')
  const snapshot = await loadLibrarySnapshot()
  return <LibraryCommandShell schoolName={snapshot.schoolName} title="Bibliothèque" subtitle="Library Operations Cockpit · collection, disponibilité, circulation, membres et exceptions institutionnelles">
    <KnowledgeAtrium snapshot={snapshot} />
  </LibraryCommandShell>
}
