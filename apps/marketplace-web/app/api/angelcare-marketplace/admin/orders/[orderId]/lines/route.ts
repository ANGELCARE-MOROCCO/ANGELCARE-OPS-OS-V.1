import { handleAdminOrderLineEvent } from '@/angelcare-marketplace/customer-commerce/api-handlers'

type Context = { params: Promise<{ orderId: string }> }

export async function POST(request: Request, context: Context) {
  return handleAdminOrderLineEvent(request, context.params)
}
