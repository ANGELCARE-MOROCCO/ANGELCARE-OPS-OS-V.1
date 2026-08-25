import { TransactionAreaShell } from '@/angelcare-marketplace/transaction-flight-deck/components/TransactionAreaShell'
export const dynamic='force-dynamic'
export default function Layout({children}:{children:React.ReactNode}){return <TransactionAreaShell>{children}</TransactionAreaShell>}
