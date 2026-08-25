import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { TenantWorkspace } from '@/angelcare-marketplace/partner-os/components/TenantWorkspace'
import { TenantLifecycleDesk } from '@/angelcare-marketplace/partner-os/components/PartnerLifecycleClient'
import { getTenantWorkspace,listPlans } from '@/angelcare-marketplace/partner-os/repository'
export default async function Page({params}:{params:Promise<{tenantId:string}>}){const context=await requireMarketplacePageContext('marketplace.partner_os.admin.view');const tenantId=(await params).tenantId;const [workspace,plans]=await Promise.all([getTenantWorkspace({tenantId,context}),listPlans()]);return <><TenantWorkspace data={workspace}/><TenantLifecycleDesk tenant={workspace.tenant} workspace={workspace} plans={plans}/></>}
