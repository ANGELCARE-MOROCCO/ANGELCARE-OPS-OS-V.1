import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { MissionTimeline } from '@/angelcare-marketplace/family-experience/components/MissionTimeline'
import { getMission } from '@/angelcare-marketplace/family-experience/repository'
export default async function Page({params}:{params:Promise<{missionId:string}>}){const context=await requireMarketplacePageContext('marketplace.family.missions.view');const {missionId}=await params;const bundle=await getMission(context,missionId);return <MissionTimeline {...bundle}/>}
