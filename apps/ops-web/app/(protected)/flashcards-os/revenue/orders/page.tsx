import SalesOrderControlLedger from '@/components/flashcards-os/revenue/SalesOrderControlLedger'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { listOrders } from '@/lib/flashcards-os/revenue/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.manage_sales_orders');return <SalesOrderControlLedger orders={await listOrders()}/>}
