import CommercialDocumentRegistry from '@/components/flashcards-os/revenue/CommercialDocumentRegistry'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { listDeliveries, listInvoices, listOrders, listQuotations } from '@/lib/flashcards-os/revenue/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.view_revenue');const [quotations,orders,deliveries,invoices]=await Promise.all([listQuotations(),listOrders(),listDeliveries(),listInvoices()]);return <CommercialDocumentRegistry quotations={quotations} orders={orders} deliveries={deliveries} invoices={invoices}/>}
