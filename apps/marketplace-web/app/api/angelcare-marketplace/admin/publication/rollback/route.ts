import { handleCommerceAction } from '@/angelcare-marketplace/commerce-studio/api-handlers'
export async function POST(request:Request){const body=await request.clone().json() as {resource?:string;id?:string};return handleCommerceAction(request,body.resource||'',body.id||'','rollback')}
