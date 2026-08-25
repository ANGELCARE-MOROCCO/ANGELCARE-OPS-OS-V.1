import { LibraryCommandShell } from '@/components/angelcare360/library-command/LibraryCommandShell'
import { CopyFleet } from '@/components/angelcare360/library-command/LibraryViews'
import { loadLibrarySnapshot } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function ExemplairesPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; status?: string | string[] }> }) {
  const [snapshot, query] = await Promise.all([loadLibrarySnapshot(), searchParams])
  const one = (value?: string | string[]) => Array.isArray(value) ? value[0] : value
  return <LibraryCommandShell schoolName={snapshot.schoolName} title="Copy Control" subtitle="Exemplaires physiques · code-barres · rayon enregistré · condition · détenteur · disponibilité réelle">
    <CopyFleet snapshot={snapshot} query={one(query.q) || ''} status={one(query.status) || 'all'} />
  </LibraryCommandShell>
}
