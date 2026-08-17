import { LibraryCommandShell } from '@/components/angelcare360/library-command/LibraryCommandShell'
import { KnowledgeAtrium } from '@/components/angelcare360/library-command/LibraryViews'
import { loadLibrarySnapshot } from './_utils'

export default async function BibliothequePage() {
  const snapshot = await loadLibrarySnapshot()
  return (
    <LibraryCommandShell schoolName={snapshot.schoolName} title="Bibliothèque" subtitle="Maison du savoir · collection, exemplaires et circulation institutionnelle">
      <KnowledgeAtrium snapshot={snapshot} />
    </LibraryCommandShell>
  )
}
