import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { LeadAccountCommand } from '@/angelcare-marketplace/commercial-pipeline/components/LeadAccountCommand'
import { LeadCreateDesk } from '@/angelcare-marketplace/commercial-pipeline/components/CommercialActionClient'
import { listAccounts,listLeads } from '@/angelcare-marketplace/commercial-pipeline/repository'
export default async function Page(){await requireMarketplacePageContext('marketplace.crm.view');const [leads,accounts]=await Promise.all([listLeads(),listAccounts()]);return <><LeadCreateDesk/><LeadAccountCommand leads={leads} accounts={accounts}/></>}
