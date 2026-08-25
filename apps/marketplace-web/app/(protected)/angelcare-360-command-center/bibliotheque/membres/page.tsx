import { LibraryCommandShell } from '@/components/angelcare360/library-command/LibraryCommandShell'
import { MemberCommand } from '@/components/angelcare360/library-command/LibraryViews'
import { loadLibrarySnapshot } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function MembresPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; type?: string | string[]; attention?: string | string[] }> }) {
  const [snapshot, query] = await Promise.all([loadLibrarySnapshot(), searchParams])
  const one = (value?: string | string[]) => Array.isArray(value) ? value[0] : value
  return <LibraryCommandShell schoolName={snapshot.schoolName} title="Library Members" subtitle="Élèves et personnel · prêts actifs · retards · historique · éligibilité strictement fondée sur l’autorité existante">
    <MemberCommand snapshot={snapshot} query={one(query.q) || ''} type={one(query.type) || 'all'} attention={one(query.attention) === '1'} />
  </LibraryCommandShell>
}
