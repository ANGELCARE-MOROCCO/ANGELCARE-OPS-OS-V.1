import{hasMarketplacePermission,requireMarketplacePageContext}from '@/angelcare-marketplace/auth/context'
import{listBookings,listEnterpriseCatalog,listEnterpriseCustomers}from '@/angelcare-marketplace/enterprise-closure/repository'
import{BookingCommand}from '@/angelcare-marketplace/enterprise-closure/components/BookingCommand'
export const dynamic='force-dynamic'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.operations.view');const[initial,customers,catalog]=await Promise.all([listBookings(),listEnterpriseCustomers(),listEnterpriseCatalog()]);return <BookingCommand initial={initial} customers={customers} catalog={catalog} canCreate={hasMarketplacePermission(context,'marketplace.operations.missions.create')} canManage={hasMarketplacePermission(context,'marketplace.operations.missions.manage')}/>}
