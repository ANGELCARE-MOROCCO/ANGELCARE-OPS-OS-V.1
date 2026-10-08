import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {commerceProductAtelierSnapshot} from '@/angelcare-marketplace/commerce-product-atelier/repository'
import {DoctrineFactoryWorkspace} from '@/angelcare-marketplace/commerce-product-atelier/components/DoctrineFactoryWorkspace'
export const dynamic='force-dynamic'
export default async function Page({searchParams}:{searchParams?:Promise<Record<string,string|string[]|undefined>>}){{const context=await requireMarketplacePageContext('marketplace.admin.access');const snapshot=await commerceProductAtelierSnapshot(context);return <DoctrineFactoryWorkspace snapshot={snapshot}/>}}
