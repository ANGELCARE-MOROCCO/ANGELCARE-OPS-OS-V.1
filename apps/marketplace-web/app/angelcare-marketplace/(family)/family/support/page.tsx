import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { SupportCenter } from '@/angelcare-marketplace/family-experience/components/SupportCenter'
import { listSupportTickets } from '@/angelcare-marketplace/family-experience/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.family.support.view');return <SupportCenter initialTickets={await listSupportTickets(context)}/>}
