import { handleDispatchGenerate } from '@/angelcare-marketplace/operations-execution/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{missionId:string}>}){return handleDispatchGenerate(request,(await params).missionId)}
