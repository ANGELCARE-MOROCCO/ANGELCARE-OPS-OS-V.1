import { requireMarketplaceAdminPageContext } from '@/angelcare-marketplace/auth/context'
import { OperatingCommandCenter } from '@/angelcare-marketplace/admin-operating/components/OperatingCommandCenter'
import { listOperatingCases } from '@/angelcare-marketplace/admin-operating/repository'
export const metadata={title:'Vertical Operating Authority · ANGELCARE Marketplace'}
export default async function Page(){const context=await requireMarketplaceAdminPageContext('marketplace.operating_kernel.view');return <OperatingCommandCenter cases={await listOperatingCases(context,{limit:300})}/>}
