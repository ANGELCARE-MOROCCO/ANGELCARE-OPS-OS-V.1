import { requireMarketplaceAdminPageContext } from '@/angelcare-marketplace/auth/context'
import { OperatingDossier } from '@/angelcare-marketplace/admin-operating/components/OperatingDossier'
import { getOperatingDossier } from '@/angelcare-marketplace/admin-operating/repository'
export default async function Page({params}:{params:Promise<{caseId:string}>}){const context=await requireMarketplaceAdminPageContext('marketplace.operating_kernel.view');return <OperatingDossier data={await getOperatingDossier((await params).caseId,context)}/>}
