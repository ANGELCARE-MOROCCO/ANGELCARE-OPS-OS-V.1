import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listCapa } from '@/angelcare-marketplace/trust-quality/repository'
import { CapaCommand } from '@/angelcare-marketplace/trust-quality/components/CapaCommand'
import { TrustDecisionDesk } from '@/angelcare-marketplace/trust-quality/components/TrustDecisionDesk'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.quality.view');const items=await listCapa(context);return <><CapaCommand items={items}/><TrustDecisionDesk kind="capa" items={items} canManage={hasMarketplacePermission(context,'marketplace.quality.corrective_actions.manage')}/></>}
