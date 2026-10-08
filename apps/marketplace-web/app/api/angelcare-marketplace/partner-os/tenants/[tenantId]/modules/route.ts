import { handleTenantModuleUpsert } from '@/angelcare-marketplace/partner-os/api-handlers'
export async function POST(r:Request,{params}:{params:Promise<{tenantId:string}>}){return handleTenantModuleUpsert(r,(await params).tenantId)}
