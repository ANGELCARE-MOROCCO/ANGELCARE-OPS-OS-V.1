import { handleMission } from '@/angelcare-marketplace/family-experience/api-handlers'
export async function GET(request:Request,{params}:{params:Promise<{missionId:string}>}){return handleMission(request,(await params).missionId)}
