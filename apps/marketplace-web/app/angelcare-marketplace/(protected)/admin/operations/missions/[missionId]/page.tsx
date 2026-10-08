import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { missionDossier } from '@/angelcare-marketplace/operations-execution/repository'
import { MissionDossier } from '@/angelcare-marketplace/operations-execution/components/MissionDossier'
export default async function Page({params}:{params:Promise<{missionId:string}>}){const context=await requireMarketplacePageContext('marketplace.operations.view');const {missionId}=await params;return <MissionDossier data={await missionDossier(missionId,context)} canManage={hasMarketplacePermission(context,'marketplace.operations.missions.manage')}/>}
