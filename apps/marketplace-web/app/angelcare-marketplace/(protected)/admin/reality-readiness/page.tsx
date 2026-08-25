import{requireMarketplacePageContext}from '@/angelcare-marketplace/auth/context'
import{enterpriseControlSnapshot}from '@/angelcare-marketplace/enterprise-closure/repository'
import{frontendControlSnapshot}from '@/angelcare-marketplace/total-commerce-control/repository'
import{ADMIN_WORKSPACE_REGISTRY}from '@/angelcare-marketplace/admin-excellence/workspace-registry'
import{FinalRealityReadiness}from '@/angelcare-marketplace/admin-excellence/components/FinalRealityReadiness'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.admin.access');const[commerce,frontend]=await Promise.all([enterpriseControlSnapshot(),frontendControlSnapshot()]);return <FinalRealityReadiness commerce={commerce} frontend={frontend} workspaceCount={ADMIN_WORKSPACE_REGISTRY.length}/>}
