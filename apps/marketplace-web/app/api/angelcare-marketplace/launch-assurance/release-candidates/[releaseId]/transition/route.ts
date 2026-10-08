import { handleReleaseTransition } from '@/angelcare-marketplace/launch-assurance/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{releaseId:string}>}){return handleReleaseTransition(request,(await params).releaseId)}
