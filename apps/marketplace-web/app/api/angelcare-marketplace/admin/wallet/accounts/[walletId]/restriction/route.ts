import { handleAdminWalletRestriction } from '@/angelcare-marketplace/customer-commerce/api-handlers'

type Context = { params: Promise<{ walletId: string }> }

export async function PATCH(request: Request, context: Context) {
  return handleAdminWalletRestriction(request, context.params)
}
