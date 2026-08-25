import { notFound } from 'next/navigation'
import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { customerMegaDossier } from '@/angelcare-marketplace/enterprise-command/repository'
import { CustomerCommandPage } from '@/angelcare-marketplace/enterprise-command/components/CustomerCommandPage'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{customerId:string}>}){await requireMarketplacePageContext('marketplace.admin.access');const{customerId}=await params;const dossier=await customerMegaDossier(customerId).catch(()=>null);if(!dossier)notFound();return <CustomerCommandPage customerId={customerId}/>}
