import { handleLiveCampaign } from '@/angelcare-marketplace/live-experience-command/api-handlers'
export async function GET(request:Request,context:{params:Promise<{campaignId:string}>}){return handleLiveCampaign(request,context.params)}
export async function PATCH(request:Request,context:{params:Promise<{campaignId:string}>}){return handleLiveCampaign(request,context.params)}
