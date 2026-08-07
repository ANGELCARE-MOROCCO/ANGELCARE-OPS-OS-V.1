import { handleCustomerMe } from '@/angelcare-marketplace/customer-commerce/api-handlers'

export async function GET(request: Request) {
  return handleCustomerMe(request)
}
