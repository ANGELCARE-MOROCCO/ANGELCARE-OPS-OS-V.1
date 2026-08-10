import { handleAdminWalletReconciliationTransition } from '@/angelcare-marketplace/customer-commerce/api-handlers'
type Context={params:Promise<{itemId:string}>}
export async function POST(request:Request,context:Context){return handleAdminWalletReconciliationTransition(request,context.params)}
