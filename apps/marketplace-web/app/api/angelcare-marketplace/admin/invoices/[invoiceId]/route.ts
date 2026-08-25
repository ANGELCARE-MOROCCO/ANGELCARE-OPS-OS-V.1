import {handleInvoice} from '@/angelcare-marketplace/enterprise-closure/api-handlers'
export async function PATCH(request:Request,{params}:{params:Promise<{invoiceId:string}>}){const{invoiceId}=await params;return handleInvoice(request,invoiceId)}
