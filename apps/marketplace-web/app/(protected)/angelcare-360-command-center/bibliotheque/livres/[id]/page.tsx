import { notFound } from 'next/navigation'
import { LibraryCommandShell } from '@/components/angelcare360/library-command/LibraryCommandShell'
import { WorkPortrait } from '@/components/angelcare360/library-command/LibraryViews'
import { getLibraryBookDossier } from '@/lib/angelcare360/server/library-circulation-command'
import { requireAngelcare360RouteAccess } from '@/lib/angelcare360/server/route-guard'

export const dynamic = 'force-dynamic'

export default async function LivreDossierPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAngelcare360RouteAccess('/angelcare-360-command-center/bibliotheque/livres/[id]')
  const { id } = await params
  const dossier = await getLibraryBookDossier(id)
  if (!dossier) notFound()
  return <LibraryCommandShell schoolName={dossier.snapshot.schoolName} title="Dossier d’œuvre" subtitle="Bibliographic & Circulation Dossier · identité éditoriale, copies physiques, disponibilité et historique institutionnel">
    <WorkPortrait snapshot={dossier.snapshot} book={dossier.book} copies={dossier.copies} loans={dossier.loans} />
  </LibraryCommandShell>
}
