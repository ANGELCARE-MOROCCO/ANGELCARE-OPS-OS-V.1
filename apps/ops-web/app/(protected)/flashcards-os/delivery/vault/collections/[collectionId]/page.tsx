import ProductVaultRoom from '@/components/flashcards-os/production/ProductVaultRoom'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadProductionOverview } from '@/lib/flashcards-os/production/server/repository'
export default async function Page({params}:{params:Promise<{collectionId:string}>}){await requireFlashcardsPageAccess('flashcards_os.view_vault');const {collectionId}=await params;return <ProductVaultRoom data={await loadProductionOverview()} collectionId={decodeURIComponent(collectionId)}/>}
