import { handleCorporateUsage } from '@/angelcare-marketplace/b2b-verticals/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{quotaId:string}>}){return handleCorporateUsage(request,(await params).quotaId)}
