import { handleAdminCustomerChild } from '@/angelcare-marketplace/admin-control-plane/api-handlers'

type Context = { params: Promise<{ customerId: string; childId: string }> }
export async function PATCH(request: Request, context: Context) {
  const params = await context.params
  return handleAdminCustomerChild(request, params.customerId, params.childId)
}
