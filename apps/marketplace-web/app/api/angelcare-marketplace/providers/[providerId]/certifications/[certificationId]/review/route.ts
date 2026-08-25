import { handleProviderCertificationReview } from '@/angelcare-marketplace/provider-workforce/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{providerId:string;certificationId:string}>}){const p=await params;return handleProviderCertificationReview(request,p.providerId,p.certificationId)}
