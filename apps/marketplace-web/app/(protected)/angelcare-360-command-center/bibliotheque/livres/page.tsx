import { LibraryCommandShell } from '@/components/angelcare360/library-command/LibraryCommandShell'
import { CatalogueEditorial } from '@/components/angelcare360/library-command/LibraryViews'
import { loadLibrarySnapshot } from '../_utils'

export default async function LivresPage({ searchParams }: { searchParams: Promise<{ category?: string | string[] }> }) {
  const [snapshot, query] = await Promise.all([loadLibrarySnapshot(), searchParams])
  const category = Array.isArray(query.category) ? query.category[0] : query.category
  return (
    <LibraryCommandShell schoolName={snapshot.schoolName} title="Catalogue éditorial" subtitle="Œuvres intellectuelles · données bibliographiques · collection active">
      <CatalogueEditorial snapshot={snapshot} category={category || null} />
    </LibraryCommandShell>
  )
}
