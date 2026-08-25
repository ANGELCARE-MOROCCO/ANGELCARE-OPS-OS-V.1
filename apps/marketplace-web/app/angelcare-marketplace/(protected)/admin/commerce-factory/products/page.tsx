import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {commerceProductAtelierSnapshot} from '@/angelcare-marketplace/commerce-product-atelier/repository'
import {ProductMasterRegistry} from '@/angelcare-marketplace/commerce-product-atelier/components/ProductMasterRegistry'
export const dynamic='force-dynamic'
export default async function Page({searchParams}:{searchParams?:Promise<Record<string,string|string[]|undefined>>}){{const context=await requireMarketplacePageContext('marketplace.admin.access');const snapshot=await commerceProductAtelierSnapshot(context);const params=searchParams?await searchParams:{};return <ProductMasterRegistry snapshot={snapshot} openCreate={params?.create==='1'}/>}}
