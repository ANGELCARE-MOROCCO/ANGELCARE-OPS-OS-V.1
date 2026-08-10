import LargeUploadStation from '@/components/flashcards-os/production/LargeUploadStation'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadProductionOverview } from '@/lib/flashcards-os/production/server/repository'
import { loadCatalogueComposerOptions } from '@/lib/flashcards-os/catalogue-composer/source'
export default async function Page({searchParams}:{searchParams:Promise<{collection?:string}>}){await requireFlashcardsPageAccess('flashcards_os.upload_deliverables');const query=await searchParams;const [data,catalogue]=await Promise.all([loadProductionOverview(),loadCatalogueComposerOptions('b2c')]);return <LargeUploadStation data={data} collections={catalogue.collections.map((item)=>({id:item.id,code:item.code,name:item.name,categoryName:item.categoryName}))} initialCollectionId={query.collection?decodeURIComponent(query.collection):undefined}/>}
