import { handlePaymentIntentCreate } from '@/angelcare-marketplace/customer-commerce/api-handlers'

export async function POST(request: Request) {
  return handlePaymentIntentCreate(request)
}
