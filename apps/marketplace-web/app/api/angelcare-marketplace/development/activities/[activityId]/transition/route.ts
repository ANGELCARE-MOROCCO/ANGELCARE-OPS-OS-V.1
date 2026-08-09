import { handleDevelopmentActivityTransition } from '@/angelcare-marketplace/development-engine/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{activityId:string}>}){return handleDevelopmentActivityTransition(request,(await params).activityId)}
