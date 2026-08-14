import { notFound } from 'next/navigation'
import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { orderMegaDossier } from '@/angelcare-marketplace/enterprise-command/repository'
import { OrderMegaCommand } from '@/angelcare-marketplace/enterprise-command/components/OrderMegaCommand'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{orderId:string}>}){await requireMarketplacePageContext('marketplace.admin.access');const{orderId}=await params;const dossier=await orderMegaDossier(orderId).catch(()=>null);if(!dossier)notFound();return <OrderMegaCommand orderId={orderId}/>}
