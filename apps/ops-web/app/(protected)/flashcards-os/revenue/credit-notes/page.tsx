import DocumentList from '@/components/flashcards-os/revenue/DocumentList'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { listCreditNotes } from '@/lib/flashcards-os/revenue/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.create_credit_notes');const rows=(await listCreditNotes()).map(d=>({id:d.id,number:d.number,customer:d.customerName,status:d.status,total:d.calculation.totalDh,detail:`Invoice ${d.invoiceNumber} · ${d.reason}`,href:`/flashcards-os/revenue/credit-notes`}));return <DocumentList eyebrow="Finance · Credit Notes" title="Governed commercial corrections" description="Avoirs linked to issued invoices, eligible lines and approval authority." label="Credit notes" rows={rows}/>}
