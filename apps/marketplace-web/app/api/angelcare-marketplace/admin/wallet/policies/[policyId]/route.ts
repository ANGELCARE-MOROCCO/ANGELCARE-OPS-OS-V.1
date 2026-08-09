import { handleAdminWalletPolicy } from '@/angelcare-marketplace/customer-commerce/api-handlers'

type Context = { params: Promise<{ policyId: string }> }

export async function PATCH(request: Request, context: Context) {
  return handleAdminWalletPolicy(request, context.params)
}
