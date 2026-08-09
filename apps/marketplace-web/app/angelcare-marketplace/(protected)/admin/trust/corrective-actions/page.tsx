import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listCapa } from '@/angelcare-marketplace/trust-quality/repository'
import { CapaCommand } from '@/angelcare-marketplace/trust-quality/components/CapaCommand'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.quality.view');return <CapaCommand items={await listCapa(context)}/>}