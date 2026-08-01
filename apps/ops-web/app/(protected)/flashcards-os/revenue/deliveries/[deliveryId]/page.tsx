import DeliveryNoteCompositionRoom from '@/components/flashcards-os/revenue/DeliveryNoteCompositionRoom'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { getDelivery, getOrder } from '@/lib/flashcards-os/revenue/server/repository'
export default async function Page({params}:{params:Promise<{deliveryId:string}>}){await requireFlashcardsPageAccess('flashcards_os.create_delivery_notes');const {deliveryId}=await params;const delivery=await getDelivery(deliveryId);return <DeliveryNoteCompositionRoom delivery={delivery} order={delivery?await getOrder(delivery.orderId):null}/>}
