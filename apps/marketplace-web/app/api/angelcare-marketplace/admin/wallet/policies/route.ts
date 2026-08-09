import { handleAdminWalletPolicies } from '@/angelcare-marketplace/customer-commerce/api-handlers'

export async function GET(request: Request) {
  return handleAdminWalletPolicies(request)
}

export async function POST(request: Request) {
  return handleAdminWalletPolicies(request)
}
