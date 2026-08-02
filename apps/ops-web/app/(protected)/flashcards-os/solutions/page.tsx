import FlashcardsProductFactory from '@/components/flashcards-os/catalogue-composer/FlashcardsProductFactory'
import { loadCatalogueComposerOptions } from '@/lib/flashcards-os/catalogue-composer/source'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
export default async function FlashcardsSolutionsPage(){await requireFlashcardsPageAccess('flashcards_os.view_solutions');return <FlashcardsProductFactory options={await loadCatalogueComposerOptions('b2c')}/>}
