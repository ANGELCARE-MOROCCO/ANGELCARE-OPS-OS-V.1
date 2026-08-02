import CatalogueJourneyComposer from '@/components/flashcards-os/catalogue-composer/CatalogueJourneyComposer'
import { loadCatalogueComposerOptions } from '@/lib/flashcards-os/catalogue-composer/source'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
export default async function NewLearningJourneyPage(){await requireFlashcardsPageAccess('flashcards_os.create_journey_requests');return <CatalogueJourneyComposer options={await loadCatalogueComposerOptions('b2c')}/>}
