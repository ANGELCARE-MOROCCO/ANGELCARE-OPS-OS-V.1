import { handleTenantSubscriptionAssign } from '@/angelcare-marketplace/partner-os/api-handlers'
export async function POST(r:Request,{params}:{params:Promise<{tenantId:string}>}){return handleTenantSubscriptionAssign(r,(await params).tenantId)}
