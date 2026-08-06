import {handleCustomerSessions} from '@/angelcare-marketplace/customer-commerce/api-handlers'
export async function GET(request:Request){return handleCustomerSessions(request)}
export async function DELETE(request:Request){return handleCustomerSessions(request)}
