import { notFound } from 'next/navigation'
import { LibraryCommandShell } from '@/components/angelcare360/library-command/LibraryCommandShell'
import { WorkPortrait } from '@/components/angelcare360/library-command/LibraryViews'
import { getLibraryBookDossier } from '@/lib/angelcare360/server/library-circulation-command'

export default async function LivreDossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dossier = await getLibraryBookDossier(id)
  if (!dossier) notFound()
  return (
    <LibraryCommandShell schoolName={dossier.snapshot.schoolName} title="Portrait d’œuvre" subtitle="Identité éditoriale · exemplaires · disponibilité · mémoire de circulation">
      <WorkPortrait snapshot={dossier.snapshot} book={dossier.book} copies={dossier.copies} loans={dossier.loans} />
    </LibraryCommandShell>
  )
}
