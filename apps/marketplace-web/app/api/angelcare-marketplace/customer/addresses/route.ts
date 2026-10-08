import { handleCustomerAddresses } from '@/angelcare-marketplace/customer-commerce/api-handlers'
export async function GET(request:Request){return handleCustomerAddresses(request)}
export async function POST(request:Request){return handleCustomerAddresses(request)}
