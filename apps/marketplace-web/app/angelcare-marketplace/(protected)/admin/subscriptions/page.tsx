import{requireMarketplacePageContext}from '@/angelcare-marketplace/auth/context'
import{listCustomerSubscriptions,listEnterpriseCatalog,listEnterpriseCustomers}from '@/angelcare-marketplace/enterprise-closure/repository'
import{SubscriptionCommand}from '@/angelcare-marketplace/enterprise-closure/components/SubscriptionCommand'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.admin.access');const[initial,customers,catalog]=await Promise.all([listCustomerSubscriptions(),listEnterpriseCustomers(),listEnterpriseCatalog()]);return <SubscriptionCommand initial={initial} customers={customers} catalog={catalog}/>}
