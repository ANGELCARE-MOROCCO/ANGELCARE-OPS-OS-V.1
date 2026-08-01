import { AccountRegistry } from '@/components/flashcards-os/revenue/CustomerRegistry'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { listB2BAccounts } from '@/lib/flashcards-os/revenue/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.view_b2b_crm');return <AccountRegistry accounts={await listB2BAccounts()}/>}
