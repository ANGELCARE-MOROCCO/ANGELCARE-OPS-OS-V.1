import { handleAdminEnterpriseOrder } from '@/angelcare-marketplace/customer-commerce/api-handlers'

type Context = { params: Promise<{ orderId: string }> }

export async function PATCH(request: Request, context: Context) {
  return handleAdminEnterpriseOrder(request, context.params)
}
