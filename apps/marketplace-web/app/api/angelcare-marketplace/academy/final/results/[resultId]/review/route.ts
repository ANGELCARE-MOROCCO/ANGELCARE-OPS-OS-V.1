import {handleAssessmentResultReview} from '@/angelcare-marketplace/academy-engine/final-api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{resultId:string}>}){return handleAssessmentResultReview(request,(await params).resultId)}
