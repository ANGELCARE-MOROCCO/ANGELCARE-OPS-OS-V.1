import { handleAdminPaymentReconciliationTransition } from '@/angelcare-marketplace/customer-commerce/api-handlers'
type Context={params:Promise<{itemId:string}>}
export async function POST(request:Request,context:Context){return handleAdminPaymentReconciliationTransition(request,context.params)}
