import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {ProviderCommerceCommand} from '@/angelcare-marketplace/operations-reconciliation/components/CounterpartyCommands'
import {listProviderCommerce} from '@/angelcare-marketplace/operations-reconciliation/repository'
export default async function Page(){const c=await requireMarketplacePageContext('marketplace.providers.view');return <ProviderCommerceCommand items={await listProviderCommerce(c)}/>}
