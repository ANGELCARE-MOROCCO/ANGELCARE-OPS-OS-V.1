import { handleCertificateDecision } from '@/angelcare-marketplace/academy-engine/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{certificateId:string}>}){return handleCertificateDecision(request,(await params).certificateId)}
