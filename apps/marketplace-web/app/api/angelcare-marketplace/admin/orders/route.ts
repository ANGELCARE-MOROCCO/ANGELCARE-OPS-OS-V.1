import { handleAdminEnterpriseOrders } from '@/angelcare-marketplace/customer-commerce/api-handlers'
import { handleAssistedOrders } from '@/angelcare-marketplace/total-commerce-control/api-handlers'
export async function GET(request: Request) { return handleAdminEnterpriseOrders(request) }
export async function POST(request: Request) { return handleAssistedOrders(request) }
