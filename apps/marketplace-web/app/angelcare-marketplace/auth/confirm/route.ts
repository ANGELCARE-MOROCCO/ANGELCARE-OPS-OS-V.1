import { handleCustomerConfirmation } from '@/angelcare-marketplace/customer-commerce/customer-auth-links'
export const dynamic = 'force-dynamic'
// Keep the existing email-template endpoint stable.
export async function GET(request: Request) { return handleCustomerConfirmation(request) }
