import {handleProviderQualification} from '@/angelcare-marketplace/provider-workforce/api-handlers'
export async function PATCH(request:Request,{params}:{params:Promise<{providerId:string;qualificationId:string}>}){const p=await params;return handleProviderQualification(request,p.providerId,p.qualificationId)}
export async function DELETE(request:Request,{params}:{params:Promise<{providerId:string;qualificationId:string}>}){const p=await params;return handleProviderQualification(request,p.providerId,p.qualificationId)}
