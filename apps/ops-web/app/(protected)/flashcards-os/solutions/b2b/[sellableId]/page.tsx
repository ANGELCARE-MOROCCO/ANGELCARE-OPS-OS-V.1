import { notFound } from 'next/navigation'
import SellableDossier from '@/components/flashcards-os/solutions/SellableDossier'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadSellable } from '@/lib/flashcards-os/solutions/server/repository'
export default async function B2BSellablePage({params}:{params:Promise<{sellableId:string}>}){await requireFlashcardsPageAccess('flashcards_os.view_solutions');const {sellableId}=await params;const data=await loadSellable(decodeURIComponent(sellableId),'b2b');if(!data.sellable)notFound();return <SellableDossier sellable={data.sellable} releases={data.releases} readyPlans={data.readyPlans}/>}
