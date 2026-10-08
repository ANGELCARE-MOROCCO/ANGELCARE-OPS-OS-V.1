import {handleAcademyB2BTransition} from '@/angelcare-marketplace/academy-engine/final-api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{orderId:string}>}){return handleAcademyB2BTransition(request,(await params).orderId)}
