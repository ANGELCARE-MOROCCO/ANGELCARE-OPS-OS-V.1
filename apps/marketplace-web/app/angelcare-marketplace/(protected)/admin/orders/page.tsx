import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { adminOrderCommand } from '@/angelcare-marketplace/customer-commerce/admin-repository'
import { EnterpriseOrderCommand } from '@/angelcare-marketplace/customer-commerce/components/EnterpriseOrderCommand'
import { assistedOrderOptions } from '@/angelcare-marketplace/total-commerce-control/repository'
export const dynamic='force-dynamic'
export default async function Page({searchParams}:{searchParams?:Promise<Record<string,string|string[]|undefined>>}){const context=await requireMarketplacePageContext('marketplace.operations.view');const params=searchParams?await searchParams:{};const initialQuery=Object.fromEntries(Object.entries(params).map(([key,value])=>[key,Array.isArray(value)?value[0]:value]));const[initial,options]=await Promise.all([adminOrderCommand(context),assistedOrderOptions()]);return <EnterpriseOrderCommand initial={initial} options={options} initialQuery={initialQuery}/>}
