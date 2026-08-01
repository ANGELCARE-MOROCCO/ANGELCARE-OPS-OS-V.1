import InvoiceAllocationCockpit from '@/components/flashcards-os/revenue/InvoiceAllocationCockpit'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { getInvoice, getOrder, listDeliveries } from '@/lib/flashcards-os/revenue/server/repository'
export default async function Page({params}:{params:Promise<{invoiceId:string}>}){await requireFlashcardsPageAccess('flashcards_os.create_invoices');const {invoiceId}=await params;const invoice=await getInvoice(invoiceId);return <InvoiceAllocationCockpit invoice={invoice} order={invoice?await getOrder(invoice.orderId):null} deliveries={(await listDeliveries()).filter(d=>!invoice||d.orderId===invoice.orderId)}/>}
