import LegacyImportControl from '@/components/flashcards-os/LegacyImportControl'
import { loadCollections, loadImportIssues } from '@/lib/flashcards-os/server/repository'

export default async function FlashcardsLegacyImportControlPage() {
  const [{ issues, sourceMode }, { collections }] = await Promise.all([loadImportIssues(), loadCollections()])
  return <LegacyImportControl issues={issues} sourceMode={sourceMode} collectionCount={collections.length} />
}
