import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { AccountCommand } from '@/angelcare-marketplace/journey-control/components/AccountCommand'
import { getCustomerAccountSummary } from '@/angelcare-marketplace/journey-control/repository'
export default async function AccountPage({params}:{params:Promise<{locale:string}>}){const {locale:raw}=await params;const locale=raw==='en'||raw==='ar'?raw:'fr';const context=await requireMarketplacePageContext();return <AccountCommand data={await getCustomerAccountSummary(context,locale)}/> }
