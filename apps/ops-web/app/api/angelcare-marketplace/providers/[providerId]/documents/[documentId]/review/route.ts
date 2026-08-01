import { handleDocumentReview } from '@/angelcare-marketplace/provider-workforce/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{providerId:string;documentId:string}>}){const p=await params;return handleDocumentReview(request,p.providerId,p.documentId)}
