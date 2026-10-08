import { notFound } from 'next/navigation'
import { LibraryCommandShell } from '@/components/angelcare360/library-command/LibraryCommandShell'
import { CirculationChamber } from '@/components/angelcare360/library-command/LibraryViews'
import { getLibraryLoanDossier } from '@/lib/angelcare360/server/library-circulation-command'
import { requireAngelcare360RouteAccess } from '@/lib/angelcare360/server/route-guard'

export const dynamic = 'force-dynamic'

export default async function PretDossierPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAngelcare360RouteAccess('/angelcare-360-command-center/bibliotheque/prets/[id]')
  const { id } = await params
  const dossier = await getLibraryLoanDossier(id)
  if (!dossier) notFound()
  return <LibraryCommandShell schoolName={dossier.snapshot.schoolName} title="Circulation Chamber" subtitle="Prêt, emprunteur, exemplaire, échéance, retour et exception — la transaction de base de données reste souveraine">
    <CirculationChamber snapshot={dossier.snapshot} loan={dossier.loan} />
  </LibraryCommandShell>
}
