import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listInvoiceReadiness } from '@/angelcare-marketplace/finance-authority/repository'
import { InvoiceReadinessAuthority } from '@/angelcare-marketplace/finance-authority/components/FinanceRegisters'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.finance.view');return <InvoiceReadinessAuthority items={await listInvoiceReadiness(context)}/>}