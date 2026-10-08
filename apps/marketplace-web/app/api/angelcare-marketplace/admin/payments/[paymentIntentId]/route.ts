import { handleAdminPayment } from '@/angelcare-marketplace/admin-control-plane/api-handlers'

type Context = { params: Promise<{ paymentIntentId: string }> }
export async function GET(request: Request, context: Context) { return handleAdminPayment(request, (await context.params).paymentIntentId) }
export async function PATCH(request: Request, context: Context) { return handleAdminPayment(request, (await context.params).paymentIntentId) }
