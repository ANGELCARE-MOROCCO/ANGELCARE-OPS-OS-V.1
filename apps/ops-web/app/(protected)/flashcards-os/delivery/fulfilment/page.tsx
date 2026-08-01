import FulfilmentCommandBoard from '@/components/flashcards-os/experience/FulfilmentCommandBoard'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadExperienceOverview } from '@/lib/flashcards-os/experience/server/repository'
import { listOrders } from '@/lib/flashcards-os/revenue/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.view_fulfilment');const [data,orders]=await Promise.all([loadExperienceOverview(),listOrders()]);return <FulfilmentCommandBoard data={data} orders={orders.filter(o=>['confirmed','ready_for_fulfilment','partially_delivered'].includes(o.status)).map(o=>({id:o.id,number:o.number,customerName:o.customerName}))}/>}
