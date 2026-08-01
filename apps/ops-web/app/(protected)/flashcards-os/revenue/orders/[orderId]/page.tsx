import DeliveryNoteCompositionRoom from '@/components/flashcards-os/revenue/DeliveryNoteCompositionRoom'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { getOrder } from '@/lib/flashcards-os/revenue/server/repository'
export default async function Page({params}:{params:Promise<{orderId:string}>}){await requireFlashcardsPageAccess('flashcards_os.manage_sales_orders');const {orderId}=await params;return <DeliveryNoteCompositionRoom order={await getOrder(orderId)}/>}
