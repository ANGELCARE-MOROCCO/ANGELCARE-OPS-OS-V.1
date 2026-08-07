import { handleWalletComparison } from '@/angelcare-marketplace/customer-commerce/api-handlers'

export async function GET(request: Request) {
  return handleWalletComparison(request)
}

export async function POST(request: Request) {
  return handleWalletComparison(request)
}
