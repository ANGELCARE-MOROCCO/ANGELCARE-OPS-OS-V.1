import { notFound } from 'next/navigation'
import { LibraryCommandShell } from '@/components/angelcare360/library-command/LibraryCommandShell'
import { CopyDossier } from '@/components/angelcare360/library-command/LibraryViews'
import { getLibraryCopyDossier } from '@/lib/angelcare360/server/library-circulation-command'

export default async function ExemplaireDossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dossier = await getLibraryCopyDossier(id)
  if (!dossier) notFound()
  return (
    <LibraryCommandShell schoolName={dossier.snapshot.schoolName} title="Dossier exemplaire" subtitle="Identité physique · localisation · condition · chronologie">
      <CopyDossier snapshot={dossier.snapshot} copy={dossier.copy} book={dossier.book} loans={dossier.loans} />
    </LibraryCommandShell>
  )
}
