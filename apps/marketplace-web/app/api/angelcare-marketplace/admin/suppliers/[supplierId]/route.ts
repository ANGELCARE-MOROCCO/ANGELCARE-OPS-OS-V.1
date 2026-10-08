import { handleAdminSupplier } from '@/angelcare-marketplace/admin-control-plane/api-handlers'
type Context = { params: Promise<{ supplierId: string }> }
export async function PATCH(request: Request, context: Context) { return handleAdminSupplier(request, (await context.params).supplierId) }
