import { LibraryCommandShell } from '@/components/angelcare360/library-command/LibraryCommandShell'
import { MemberCommand } from '@/components/angelcare360/library-command/LibraryViews'
import { loadLibrarySnapshot } from '../_utils'
import { requireAngelcare360RouteAccess } from '@/lib/angelcare360/server/route-guard'

export const dynamic = 'force-dynamic'

export default async function MembresPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; type?: string | string[]; attention?: string | string[] }> }) {
  await requireAngelcare360RouteAccess('/angelcare-360-command-center/bibliotheque/membres')
  const [snapshot, query] = await Promise.all([loadLibrarySnapshot(), searchParams])
  const one = (value?: string | string[]) => Array.isArray(value) ? value[0] : value
  return <LibraryCommandShell schoolName={snapshot.schoolName} title="Library Members" subtitle="Élèves et personnel · prêts actifs · retards · historique · éligibilité strictement fondée sur l’autorité existante">
    <MemberCommand snapshot={snapshot} query={one(query.q) || ''} type={one(query.type) || 'all'} attention={one(query.attention) === '1'} />
  </LibraryCommandShell>
}
