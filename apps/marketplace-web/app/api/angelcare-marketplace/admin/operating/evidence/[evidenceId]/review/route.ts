import { handleOperatingEvidenceReview } from '@/angelcare-marketplace/admin-operating/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{evidenceId:string}>}){return handleOperatingEvidenceReview(request,(await params).evidenceId)}
