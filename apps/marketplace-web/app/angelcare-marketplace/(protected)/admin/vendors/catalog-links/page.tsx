import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {VendorCommerceCommand} from '@/angelcare-marketplace/operations-reconciliation/components/CounterpartyCommands'
import {listVendorCommerce} from '@/angelcare-marketplace/operations-reconciliation/repository'
export default async function Page(){const c=await requireMarketplacePageContext('marketplace.operations.view');return <VendorCommerceCommand items={await listVendorCommerce(c)}/>}
