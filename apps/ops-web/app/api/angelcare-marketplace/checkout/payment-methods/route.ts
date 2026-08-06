import { handleCheckoutPaymentMethods } from '@/angelcare-marketplace/customer-commerce/api-handlers'

export async function GET(request: Request) {
  return handleCheckoutPaymentMethods(request)
}

export async function POST(request: Request) {
  return handleCheckoutPaymentMethods(request)
}
