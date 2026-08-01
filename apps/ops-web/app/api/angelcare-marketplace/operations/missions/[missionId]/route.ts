import { handleMissionDossier } from '@/angelcare-marketplace/operations-execution/api-handlers'
export async function GET(request:Request,{params}:{params:Promise<{missionId:string}>}){return handleMissionDossier(request,(await params).missionId)}
