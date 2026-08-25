import { handleAdminCustomerAddress } from '@/angelcare-marketplace/admin-control-plane/api-handlers'

type Context = { params: Promise<{ customerId: string; addressId: string }> }
export async function PATCH(request: Request, context: Context) {
  const params = await context.params
  return handleAdminCustomerAddress(request, params.customerId, params.addressId)
}
