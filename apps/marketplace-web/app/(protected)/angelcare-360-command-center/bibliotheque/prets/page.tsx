import { LibraryCommandShell } from '@/components/angelcare360/library-command/LibraryCommandShell'
import { CirculationDesk } from '@/components/angelcare360/library-command/LibraryViews'
import { loadLibrarySnapshot } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function PretsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; state?: string | string[] }> }) {
  const [snapshot, query] = await Promise.all([loadLibrarySnapshot(), searchParams])
  const one = (value?: string | string[]) => Array.isArray(value) ? value[0] : value
  return <LibraryCommandShell schoolName={snapshot.schoolName} title="Circulation Desk" subtitle="Prêts atomiques · emprunteurs · échéances · retours · intégrité transactionnelle">
    <CirculationDesk snapshot={snapshot} query={one(query.q) || ''} state={one(query.state) || 'active'} />
  </LibraryCommandShell>
}
