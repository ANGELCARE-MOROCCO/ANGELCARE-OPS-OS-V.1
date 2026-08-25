import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { CommercialCommand } from '@/angelcare-marketplace/commercial-pipeline/components/CommercialCommand'
import { commercialSummary, listAccounts, listLeads, listOpportunities, listQuotes } from '@/angelcare-marketplace/commercial-pipeline/repository'
export default async function Page(){await requireMarketplacePageContext('marketplace.crm.view');const [summary,leads,accounts,opportunities,quotes]=await Promise.all([commercialSummary(),listLeads(),listAccounts(),listOpportunities(),listQuotes()]);return <CommercialCommand summary={summary} leads={leads} accounts={accounts} opportunities={opportunities} quotes={quotes}/>}
