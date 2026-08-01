import B2BAccountArchitecture from '@/components/flashcards-os/revenue/B2BAccountArchitecture'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { getB2BAccount, listOpportunities } from '@/lib/flashcards-os/revenue/server/repository'
export default async function Page({params}:{params:Promise<{accountId:string}>}){await requireFlashcardsPageAccess('flashcards_os.view_b2b_crm');const {accountId}=await params;const account=await getB2BAccount(accountId);if(!account)return null;return <B2BAccountArchitecture account={account} opportunities={(await listOpportunities('b2b')).filter(item=>item.customerId===account.id)}/>}
