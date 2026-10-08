import {handlePublicInquiryAdmin} from '@/angelcare-marketplace/total-commerce-control/api-handlers'
type Context={params:Promise<{inquiryId:string}>}
export async function PATCH(request:Request,context:Context){return handlePublicInquiryAdmin(request,context.params)}
