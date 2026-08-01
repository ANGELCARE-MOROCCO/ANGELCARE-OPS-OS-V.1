import { notFound } from 'next/navigation'
import CardContentRegistry from '@/components/flashcards-os/CardContentRegistry'
import { loadCollectionDossier } from '@/lib/flashcards-os/server/repository'

export default async function FlashcardsCardRegistryPage({ params }: { params: Promise<{ collectionId: string }> }) {
  const { collectionId } = await params
  const { dossier, sourceMode } = await loadCollectionDossier(decodeURIComponent(collectionId))
  if (!dossier) notFound()
  return <CardContentRegistry dossier={dossier} sourceMode={sourceMode} />
}
