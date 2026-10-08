import { LibraryCommandShell } from '@/components/angelcare360/library-command/LibraryCommandShell'
import { CopyFleet } from '@/components/angelcare360/library-command/LibraryViews'
import { loadLibrarySnapshot } from '../_utils'
import { requireAngelcare360RouteAccess } from '@/lib/angelcare360/server/route-guard'

export const dynamic = 'force-dynamic'

export default async function ExemplairesPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; status?: string | string[] }> }) {
  await requireAngelcare360RouteAccess('/angelcare-360-command-center/bibliotheque/exemplaires')
  const [snapshot, query] = await Promise.all([loadLibrarySnapshot(), searchParams])
  const one = (value?: string | string[]) => Array.isArray(value) ? value[0] : value
  return <LibraryCommandShell schoolName={snapshot.schoolName} title="Copy Control" subtitle="Exemplaires physiques · code-barres · rayon enregistré · condition · détenteur · disponibilité réelle">
    <CopyFleet snapshot={snapshot} query={one(query.q) || ''} status={one(query.status) || 'all'} />
  </LibraryCommandShell>
}
