import { handleCustomerSessionBridge } from '@/angelcare-marketplace/customer-commerce/customer-access-api'
export async function POST(request: Request) { return handleCustomerSessionBridge(request) }
