import { handleTenantTransition } from '@/angelcare-marketplace/partner-os/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{tenantId:string}>}){return handleTenantTransition(request,(await params).tenantId)}
