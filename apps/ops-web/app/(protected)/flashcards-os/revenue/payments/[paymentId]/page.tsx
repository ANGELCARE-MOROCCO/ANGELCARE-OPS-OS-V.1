import PaymentsReceivablesCockpit from '@/components/flashcards-os/revenue/PaymentsReceivablesCockpit'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { getPayment, listCustomerBalances } from '@/lib/flashcards-os/revenue/server/repository'
export default async function Page({params}:{params:Promise<{paymentId:string}>}){await requireFlashcardsPageAccess('flashcards_os.view_receivables');const {paymentId}=await params;const payment=await getPayment(paymentId);return <PaymentsReceivablesCockpit payments={payment?[payment]:[]} balances={(await listCustomerBalances()).filter(b=>!payment||b.customerId===payment.customerId)}/>}
