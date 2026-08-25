import {handleAcademyRemediationTransition} from '@/angelcare-marketplace/academy-engine/final-api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{remediationId:string}>}){return handleAcademyRemediationTransition(request,(await params).remediationId)}
