import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listSops } from '@/angelcare-marketplace/trust-quality/repository'
import { SopAuthority } from '@/angelcare-marketplace/trust-quality/components/SopAuthority'
import { SopCreateDesk, TrustDecisionDesk } from '@/angelcare-marketplace/trust-quality/components/TrustDecisionDesk'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.trust.view');const items=await listSops(context);const canManage=hasMarketplacePermission(context,'marketplace.trust.sops.manage');return <><SopAuthority items={items}/><SopCreateDesk canManage={canManage}/><TrustDecisionDesk kind="sop" items={items} canManage={canManage}/></>}
