import { notFound } from 'next/navigation'
import CollectionDossier from '@/components/flashcards-os/CollectionDossier'
import { loadCollectionDossier, loadTaxonomyAtlas } from '@/lib/flashcards-os/server/repository'

export default async function FlashcardsCollectionDossierPage({ params }: { params: Promise<{ collectionId: string }> }) {
  const { collectionId } = await params
  const [{ dossier, sourceMode }, { nodes }] = await Promise.all([
    loadCollectionDossier(decodeURIComponent(collectionId)),
    loadTaxonomyAtlas(),
  ])
  if (!dossier) notFound()
  return <CollectionDossier dossier={dossier} taxonomy={nodes} sourceMode={sourceMode} />
}
