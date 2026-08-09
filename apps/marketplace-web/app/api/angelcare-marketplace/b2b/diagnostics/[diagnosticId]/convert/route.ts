import { handleDiagnosticConversion } from '@/angelcare-marketplace/b2b-verticals/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{diagnosticId:string}>}){return handleDiagnosticConversion(request,(await params).diagnosticId)}
