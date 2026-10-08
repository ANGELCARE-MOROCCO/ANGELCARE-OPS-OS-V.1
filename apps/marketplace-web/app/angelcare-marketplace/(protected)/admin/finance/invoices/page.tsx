import{hasMarketplacePermission,requireMarketplacePageContext}from '@/angelcare-marketplace/auth/context'
import{listEnterpriseCustomers,listEnterpriseOrders,listInvoices}from '@/angelcare-marketplace/enterprise-closure/repository'
import{InvoiceCommand}from '@/angelcare-marketplace/enterprise-closure/components/InvoiceCommand'
export const dynamic='force-dynamic'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.finance.view');const[customers,orders,invoices]=await Promise.all([listEnterpriseCustomers(),listEnterpriseOrders(),listInvoices()]);return <InvoiceCommand customers={customers} orders={orders} initial={invoices} canManage={hasMarketplacePermission(context,'marketplace.finance.manage')}/>}
