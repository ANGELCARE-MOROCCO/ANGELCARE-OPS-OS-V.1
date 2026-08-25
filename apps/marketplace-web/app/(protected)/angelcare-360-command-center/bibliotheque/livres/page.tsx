import { LibraryCommandShell } from '@/components/angelcare360/library-command/LibraryCommandShell'
import { CatalogueEditorial } from '@/components/angelcare360/library-command/LibraryViews'
import { loadLibrarySnapshot } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function LivresPage({ searchParams }: { searchParams: Promise<{ category?: string | string[]; q?: string | string[]; status?: string | string[] }> }) {
  const [snapshot, query] = await Promise.all([loadLibrarySnapshot(), searchParams])
  const one = (value?: string | string[]) => Array.isArray(value) ? value[0] : value
  return <LibraryCommandShell schoolName={snapshot.schoolName} title="Knowledge Catalogue" subtitle="Identité bibliographique, disponibilité de collection et mémoire de circulation — l’œuvre reste distincte de chaque exemplaire physique.">
    <CatalogueEditorial snapshot={snapshot} category={one(query.category) || null} query={one(query.q) || ''} status={one(query.status) || 'active'} />
  </LibraryCommandShell>
}
