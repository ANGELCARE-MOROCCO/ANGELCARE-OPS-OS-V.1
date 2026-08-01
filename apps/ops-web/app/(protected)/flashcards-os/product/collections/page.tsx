import CollectionRegistry from '@/components/flashcards-os/CollectionRegistry'
import { loadCollections, loadTaxonomyAtlas } from '@/lib/flashcards-os/server/repository'

export default async function FlashcardsCollectionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const [{ collections, sourceMode }, { nodes }] = await Promise.all([loadCollections(), loadTaxonomyAtlas()])
  return (
    <CollectionRegistry
      collections={collections}
      taxonomy={nodes}
      sourceMode={sourceMode}
      initialQuery={typeof params.q === 'string' ? params.q : ''}
      openCreate={params.create === '1'}
    />
  )
}
