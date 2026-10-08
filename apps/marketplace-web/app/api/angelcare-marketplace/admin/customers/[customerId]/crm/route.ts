import { handleCustomerCrmActivity } from '@/angelcare-marketplace/customer-relationship-command/crm-activity-api'

type Context = { params: Promise<{ customerId: string }> }
export async function GET(request: Request, context: Context) { return handleCustomerCrmActivity(request, (await context.params).customerId) }
