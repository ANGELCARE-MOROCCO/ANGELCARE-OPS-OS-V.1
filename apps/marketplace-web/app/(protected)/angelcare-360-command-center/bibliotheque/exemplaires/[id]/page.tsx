import { notFound } from 'next/navigation'
import { LibraryCommandShell } from '@/components/angelcare360/library-command/LibraryCommandShell'
import { CopyDossier } from '@/components/angelcare360/library-command/LibraryViews'
import { getLibraryCopyDossier } from '@/lib/angelcare360/server/library-circulation-command'
import { requireAngelcare360RouteAccess } from '@/lib/angelcare360/server/route-guard'

export const dynamic = 'force-dynamic'

export default async function ExemplaireDossierPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAngelcare360RouteAccess('/angelcare-360-command-center/bibliotheque/exemplaires/[id]')
  const { id } = await params
  const dossier = await getLibraryCopyDossier(id)
  if (!dossier) notFound()
  return <LibraryCommandShell schoolName={dossier.snapshot.schoolName} title="Dossier exemplaire" subtitle="Copy Control Dossier · état physique, détenteur, rayon enregistré, circulation et gouvernance de disponibilité">
    <CopyDossier snapshot={dossier.snapshot} copy={dossier.copy} book={dossier.book} loans={dossier.loans} />
  </LibraryCommandShell>
}
