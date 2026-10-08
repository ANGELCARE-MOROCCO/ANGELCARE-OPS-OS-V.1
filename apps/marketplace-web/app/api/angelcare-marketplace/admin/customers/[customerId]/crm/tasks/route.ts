import { handleCustomerCrmTasks } from '@/angelcare-marketplace/customer-relationship-command/crm-activity-api'

type Context = { params: Promise<{ customerId: string }> }
export async function POST(request: Request, context: Context) { return handleCustomerCrmTasks(request, (await context.params).customerId) }
