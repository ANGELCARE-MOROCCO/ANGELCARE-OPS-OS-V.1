import { handleWalletSummary } from '@/angelcare-marketplace/customer-commerce/api-handlers'

export async function GET(request: Request) {
  return handleWalletSummary(request)
}
