import CataloguePackageComposer from '@/components/flashcards-os/catalogue-composer/CataloguePackageComposer'
import { loadCatalogueComposerOptions } from '@/lib/flashcards-os/catalogue-composer/source'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
export default async function FlashcardsSolutionComposerPage(){await requireFlashcardsPageAccess('flashcards_os.create_solution_requests');return <CataloguePackageComposer options={await loadCatalogueComposerOptions('b2c')}/>}
