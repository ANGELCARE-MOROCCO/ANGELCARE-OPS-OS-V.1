import { notFound } from 'next/navigation'
import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { adminPaymentDossier } from '@/angelcare-marketplace/admin-control-plane/repository'
import { PaymentMegaCommand } from '@/angelcare-marketplace/enterprise-command/components/PaymentMegaCommand'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{paymentIntentId:string}>}){const context=await requireMarketplacePageContext('marketplace.finance.view');const{paymentIntentId}=await params;const data=await adminPaymentDossier(paymentIntentId).catch(()=>null);if(!data)notFound();return <PaymentMegaCommand initial={data} canManage={hasMarketplacePermission(context,'marketplace.finance.exceptions.approve')} canRefund={hasMarketplacePermission(context,'marketplace.finance.exceptions.approve')} canExport={hasMarketplacePermission(context,'marketplace.finance.export')}/>}
