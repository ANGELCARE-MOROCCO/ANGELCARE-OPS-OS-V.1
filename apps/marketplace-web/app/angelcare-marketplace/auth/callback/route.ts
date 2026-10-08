import { handleCustomerConfirmation } from '@/angelcare-marketplace/customer-commerce/customer-auth-links'
export const dynamic = 'force-dynamic'
export async function GET(request: Request) { return handleCustomerConfirmation(request) }
