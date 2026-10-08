import { handleReconciliationResolution } from '@/angelcare-marketplace/finance-authority/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{eventId:string}>}){return handleReconciliationResolution(request,(await params).eventId)}
