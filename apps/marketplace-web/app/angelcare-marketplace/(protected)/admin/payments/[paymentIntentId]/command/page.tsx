import { notFound } from 'next/navigation'
import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { adminPaymentDossier } from '@/angelcare-marketplace/admin-control-plane/repository'
import { PaymentMegaCommand } from '@/angelcare-marketplace/enterprise-command/components/PaymentMegaCommand'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{paymentIntentId:string}>}){await requireMarketplacePageContext('marketplace.finance.view');const{paymentIntentId}=await params;const data=await adminPaymentDossier(paymentIntentId).catch(()=>null);if(!data)notFound();return <PaymentMegaCommand initial={data}/>}
