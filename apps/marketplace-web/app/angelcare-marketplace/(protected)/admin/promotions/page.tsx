import{requireMarketplacePageContext}from '@/angelcare-marketplace/auth/context'
import{listPromotions}from '@/angelcare-marketplace/enterprise-closure/repository'
import{PromotionCommand}from '@/angelcare-marketplace/enterprise-closure/components/PromotionCommand'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.merchandising.view');return <PromotionCommand initial={await listPromotions()}/>}
