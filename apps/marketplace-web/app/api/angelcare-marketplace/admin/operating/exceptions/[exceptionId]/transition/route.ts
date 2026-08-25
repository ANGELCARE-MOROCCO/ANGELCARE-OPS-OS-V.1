import { handleOperatingExceptionTransition } from '@/angelcare-marketplace/admin-operating/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{exceptionId:string}>}){return handleOperatingExceptionTransition(request,(await params).exceptionId)}
