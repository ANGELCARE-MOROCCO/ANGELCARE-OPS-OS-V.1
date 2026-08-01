import B2BAccountArchitecture from '@/components/flashcards-os/revenue/B2BAccountArchitecture'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { listB2BAccounts, listOpportunities } from '@/lib/flashcards-os/revenue/server/repository'
export default async function Page({params}:{params:Promise<{siteId:string}>}){await requireFlashcardsPageAccess('flashcards_os.manage_b2b_sites');const {siteId}=await params;const account=(await listB2BAccounts()).find(item=>item.sites.some(site=>site.id===siteId));return account?<B2BAccountArchitecture account={{...account,sites:account.sites.filter(site=>site.id===siteId)}} opportunities={(await listOpportunities('b2b')).filter(item=>item.siteIds.includes(siteId))}/>:null}
