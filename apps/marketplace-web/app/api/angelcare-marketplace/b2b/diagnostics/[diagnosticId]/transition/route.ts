import { handleDiagnosticTransition } from '@/angelcare-marketplace/b2b-verticals/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{diagnosticId:string}>}){return handleDiagnosticTransition(request,(await params).diagnosticId)}
