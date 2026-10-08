import { LibraryCommandShell } from '@/components/angelcare360/library-command/LibraryCommandShell'
import { AvailabilityAtlas } from '@/components/angelcare360/library-command/LibraryViews'
import { loadLibrarySnapshot } from '../_utils'
import { requireAngelcare360RouteAccess } from '@/lib/angelcare360/server/route-guard'

export const dynamic = 'force-dynamic'

export default async function DisponibilitePage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  await requireAngelcare360RouteAccess('/angelcare-360-command-center/bibliotheque/disponibilite')
  const [snapshot, query] = await Promise.all([loadLibrarySnapshot(), searchParams])
  const q = Array.isArray(query.q) ? query.q[0] : query.q
  return <LibraryCommandShell schoolName={snapshot.schoolName} title="Availability Atlas" subtitle="Disponibilité réelle par titre et exemplaire · aucune localisation physique temps réel ni réservation inventée">
    <AvailabilityAtlas snapshot={snapshot} query={q || ''} />
  </LibraryCommandShell>
}
