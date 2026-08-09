import { handleTenantWorkspace } from '@/angelcare-marketplace/partner-os/api-handlers'
export async function GET(request:Request,{params}:{params:Promise<{tenantId:string}>}){return handleTenantWorkspace(request,(await params).tenantId)}
