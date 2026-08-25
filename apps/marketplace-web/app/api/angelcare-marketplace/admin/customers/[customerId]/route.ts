import { handleAdminCustomer } from '@/angelcare-marketplace/admin-control-plane/api-handlers'

type Context = { params: Promise<{ customerId: string }> }
export async function GET(request: Request, context: Context) { return handleAdminCustomer(request, (await context.params).customerId) }
export async function PATCH(request: Request, context: Context) { return handleAdminCustomer(request, (await context.params).customerId) }
