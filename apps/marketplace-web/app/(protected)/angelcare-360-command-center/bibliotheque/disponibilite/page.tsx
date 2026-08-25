import { LibraryCommandShell } from '@/components/angelcare360/library-command/LibraryCommandShell'
import { AvailabilityAtlas } from '@/components/angelcare360/library-command/LibraryViews'
import { loadLibrarySnapshot } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function DisponibilitePage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const [snapshot, query] = await Promise.all([loadLibrarySnapshot(), searchParams])
  const q = Array.isArray(query.q) ? query.q[0] : query.q
  return <LibraryCommandShell schoolName={snapshot.schoolName} title="Availability Atlas" subtitle="Disponibilité réelle par titre et exemplaire · aucune localisation physique temps réel ni réservation inventée">
    <AvailabilityAtlas snapshot={snapshot} query={q || ''} />
  </LibraryCommandShell>
}
