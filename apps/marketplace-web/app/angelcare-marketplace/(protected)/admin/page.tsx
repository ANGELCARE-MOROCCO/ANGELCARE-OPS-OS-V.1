import{requireMarketplacePageContext}from '@/angelcare-marketplace/auth/context'
import{enterpriseControlSnapshot}from '@/angelcare-marketplace/enterprise-closure/repository'
import{frontendControlSnapshot}from '@/angelcare-marketplace/total-commerce-control/repository'
import{ADMIN_WORKSPACE_REGISTRY}from '@/angelcare-marketplace/admin-excellence/workspace-registry'
import{OperatorExcellenceCockpit}from '@/angelcare-marketplace/admin-excellence/components/OperatorExcellenceCockpit'
export const dynamic='force-dynamic'
export const metadata={title:'Marketplace Operator Excellence'}
export default async function Page(){await requireMarketplacePageContext('marketplace.admin.access');const[commerce,frontend]=await Promise.all([enterpriseControlSnapshot(),frontendControlSnapshot()]);return <OperatorExcellenceCockpit commerce={commerce} frontend={frontend} workspaceCount={ADMIN_WORKSPACE_REGISTRY.length}/>}
