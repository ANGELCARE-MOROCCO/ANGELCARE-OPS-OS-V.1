import { handleCustomerResend } from '@/angelcare-marketplace/customer-commerce/customer-access-api'
export async function POST(request: Request) { return handleCustomerResend(request) }
