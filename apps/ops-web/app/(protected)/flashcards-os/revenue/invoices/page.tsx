import DocumentList from '@/components/flashcards-os/revenue/DocumentList'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { listInvoices } from '@/lib/flashcards-os/revenue/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.create_invoices');const rows=(await listInvoices()).map(d=>({id:d.id,number:d.number,customer:d.customerName,status:d.status,total:d.calculation.totalDh,detail:`${d.paymentStatus} · due ${d.dueDate}`,href:`/flashcards-os/revenue/invoices/${d.id}`}));return <DocumentList eyebrow="Finance · Invoices" title="Invoice issue and payment status" description="Invoices are allocated from delivered sources and become immutable after issue." label="Invoices" rows={rows}/>}
