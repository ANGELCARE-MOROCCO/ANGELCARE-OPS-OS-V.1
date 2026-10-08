import { handleAdminCustomerChildren } from '@/angelcare-marketplace/admin-control-plane/api-handlers'

type Context = { params: Promise<{ customerId: string }> }
export async function GET(request: Request, context: Context) { return handleAdminCustomerChildren(request, (await context.params).customerId) }
export async function POST(request: Request, context: Context) { return handleAdminCustomerChildren(request, (await context.params).customerId) }
