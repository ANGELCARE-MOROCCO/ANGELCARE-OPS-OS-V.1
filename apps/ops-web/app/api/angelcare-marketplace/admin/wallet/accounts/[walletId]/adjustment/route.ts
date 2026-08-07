import { handleAdminWalletAdjustment } from '@/angelcare-marketplace/customer-commerce/api-handlers'

type Context = { params: Promise<{ walletId: string }> }

export async function POST(request: Request, context: Context) {
  return handleAdminWalletAdjustment(request, context.params)
}
