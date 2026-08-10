import {handleAcademyCohortTransition} from '@/angelcare-marketplace/academy-engine/final-api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{cohortId:string}>}){return handleAcademyCohortTransition(request,(await params).cohortId)}
