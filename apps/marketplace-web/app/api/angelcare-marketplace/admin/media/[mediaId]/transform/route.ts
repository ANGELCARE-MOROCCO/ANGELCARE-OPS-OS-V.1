import { handleMediaTransform } from '@/angelcare-marketplace/commerce-studio/api-handlers'
export const runtime='nodejs'
export async function POST(request:Request,{params}:{params:Promise<{mediaId:string}>}){const {mediaId}=await params;return handleMediaTransform(request,mediaId)}
