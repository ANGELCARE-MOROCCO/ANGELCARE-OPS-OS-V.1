import{notFound}from 'next/navigation'
import{requireMarketplacePageContext}from '@/angelcare-marketplace/auth/context'
import{getEnterpriseOrder,listEnterpriseCatalog}from '@/angelcare-marketplace/enterprise-closure/repository'
import{OrderDossier}from '@/angelcare-marketplace/enterprise-closure/components/OrderDossier'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{orderId:string}>}){await requireMarketplacePageContext('marketplace.operations.view');const{orderId}=await params;const[order,catalog]=await Promise.all([getEnterpriseOrder(orderId),listEnterpriseCatalog()]);if(!order)notFound();return <OrderDossier initial={order} catalog={catalog}/>}
