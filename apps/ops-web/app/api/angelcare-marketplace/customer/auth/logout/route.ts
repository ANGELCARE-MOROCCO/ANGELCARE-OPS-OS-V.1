import { handleCustomerLogout } from '@/angelcare-marketplace/customer-commerce/api-handlers'

export async function POST(request: Request) {
  return handleCustomerLogout(request)
}
