import{requireMarketplacePageContext}from '@/angelcare-marketplace/auth/context'
import{ADMIN_WORKSPACE_REGISTRY}from '@/angelcare-marketplace/admin-excellence/workspace-registry'
import{WorkspaceRegistryCommand}from '@/angelcare-marketplace/admin-excellence/components/WorkspaceRegistryCommand'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.admin.access');return <WorkspaceRegistryCommand routes={ADMIN_WORKSPACE_REGISTRY}/>}
