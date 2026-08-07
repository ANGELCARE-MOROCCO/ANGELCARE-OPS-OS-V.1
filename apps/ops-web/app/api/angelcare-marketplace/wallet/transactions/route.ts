import { handleWalletTransactions } from '@/angelcare-marketplace/customer-commerce/api-handlers'

export async function GET(request: Request) {
  return handleWalletTransactions(request)
}
