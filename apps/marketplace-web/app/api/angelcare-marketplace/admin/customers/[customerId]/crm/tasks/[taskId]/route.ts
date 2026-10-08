import { handleCustomerCrmTask } from '@/angelcare-marketplace/customer-relationship-command/crm-activity-api'

type Context = { params: Promise<{ customerId: string; taskId: string }> }
export async function PATCH(request: Request, context: Context) { const params = await context.params; return handleCustomerCrmTask(request, params.customerId, params.taskId) }
