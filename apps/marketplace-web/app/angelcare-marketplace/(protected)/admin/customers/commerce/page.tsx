import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {listCustomerCommerce} from '@/angelcare-marketplace/total-commerce-control/repository'
import {CustomerCommerceCommand} from '@/angelcare-marketplace/total-commerce-control/components/CustomerCommerceCommand'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.family.admin.view');return <CustomerCommerceCommand initial={await listCustomerCommerce()}/>}
