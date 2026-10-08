import {handleAcademySessionTransition} from '@/angelcare-marketplace/academy-engine/final-api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{sessionId:string}>}){return handleAcademySessionTransition(request,(await params).sessionId)}
