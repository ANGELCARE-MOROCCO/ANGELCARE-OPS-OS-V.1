import { handleLiveCampaignAction } from '@/angelcare-marketplace/live-experience-command/api-handlers'
export async function POST(request:Request,context:{params:Promise<{campaignId:string;action:string}>}){return handleLiveCampaignAction(request,context.params)}
