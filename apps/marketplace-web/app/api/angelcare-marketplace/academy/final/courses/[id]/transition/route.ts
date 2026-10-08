import {handleAcademyPublicationTransition} from '@/angelcare-marketplace/academy-engine/final-api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){return handleAcademyPublicationTransition(request,'course',(await params).id)}
