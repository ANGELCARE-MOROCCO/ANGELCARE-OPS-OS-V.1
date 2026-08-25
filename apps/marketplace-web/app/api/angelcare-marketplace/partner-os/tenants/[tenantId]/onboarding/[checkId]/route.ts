import { handleTenantOnboardingCheck } from '@/angelcare-marketplace/partner-os/api-handlers'
export async function POST(r:Request,{params}:{params:Promise<{tenantId:string;checkId:string}>}){const p=await params;return handleTenantOnboardingCheck(r,p.tenantId,p.checkId)}
