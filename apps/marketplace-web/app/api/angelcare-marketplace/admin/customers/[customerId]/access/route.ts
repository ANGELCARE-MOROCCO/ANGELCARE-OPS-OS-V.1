import {handleCustomerAccess} from '@/angelcare-marketplace/operational-intake/customer-access'
export const dynamic='force-dynamic'
export async function GET(request:Request,{params}:{params:Promise<{customerId:string}>}){return handleCustomerAccess(request,(await params).customerId)}
export const POST=GET
