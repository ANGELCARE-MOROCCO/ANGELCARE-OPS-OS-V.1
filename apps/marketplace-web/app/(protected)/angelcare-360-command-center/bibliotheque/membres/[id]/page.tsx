import { notFound } from 'next/navigation'
import { LibraryCommandShell } from '@/components/angelcare360/library-command/LibraryCommandShell'
import { MemberDossier } from '@/components/angelcare360/library-command/LibraryViews'
import { getLibraryMemberDossier } from '@/lib/angelcare360/server/library-circulation-command'

export const dynamic = 'force-dynamic'

export default async function MembreDossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dossier = await getLibraryMemberDossier(id)
  if (!dossier) notFound()
  return <LibraryCommandShell schoolName={dossier.snapshot.schoolName} title="Dossier membre" subtitle="Prêts actuels, retards, historique de circulation et éligibilité prouvée — aucun scoring comportemental">
    <MemberDossier snapshot={dossier.snapshot} borrower={dossier.borrower} loans={dossier.loans} />
  </LibraryCommandShell>
}
