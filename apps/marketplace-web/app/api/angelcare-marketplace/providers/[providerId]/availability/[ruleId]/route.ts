import {handleProviderAvailabilityRule} from '@/angelcare-marketplace/provider-workforce/api-handlers'
export async function PATCH(request:Request,{params}:{params:Promise<{providerId:string;ruleId:string}>}){const p=await params;return handleProviderAvailabilityRule(request,p.providerId,p.ruleId)}
export async function DELETE(request:Request,{params}:{params:Promise<{providerId:string;ruleId:string}>}){const p=await params;return handleProviderAvailabilityRule(request,p.providerId,p.ruleId)}
