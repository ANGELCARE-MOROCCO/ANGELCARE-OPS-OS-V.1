import { handleAssessmentRecalculate } from '@/angelcare-marketplace/trust-quality/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{assessmentId:string}>}){return handleAssessmentRecalculate(request,(await params).assessmentId)}
