import {notFound} from 'next/navigation'
import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {getCustomerCommerceDossier} from '@/angelcare-marketplace/total-commerce-control/repository'
import {CustomerCommerceDossier} from '@/angelcare-marketplace/total-commerce-control/components/CustomerCommerceDossier'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{customerId:string}>}){await requireMarketplacePageContext('marketplace.family.admin.view');const{customerId}=await params;const data=await getCustomerCommerceDossier(customerId);if(!data)notFound();return <CustomerCommerceDossier data={data}/>}
