import { handleCustomerPasswordReset } from '@/angelcare-marketplace/customer-commerce/api-handlers'

export async function PATCH(request: Request) {
  return handleCustomerPasswordReset(request)
}
