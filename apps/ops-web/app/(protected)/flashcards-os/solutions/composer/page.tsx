import CataloguePackageComposer from '@/components/flashcards-os/catalogue-composer/CataloguePackageComposer'
import { loadCatalogueComposerOptions } from '@/lib/flashcards-os/catalogue-composer/source'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
export default async function PackageComposerPage({searchParams}:{searchParams:Promise<{collection?:string}>}){await requireFlashcardsPageAccess('flashcards_os.create_solution_requests');const query=await searchParams;return <CataloguePackageComposer options={await loadCatalogueComposerOptions('b2c')} initialCollectionId={query.collection?decodeURIComponent(query.collection):undefined}/>}
