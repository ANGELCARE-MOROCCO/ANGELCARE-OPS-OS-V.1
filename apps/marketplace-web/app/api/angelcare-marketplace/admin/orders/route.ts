import { handleAdminOrders } from '@/angelcare-marketplace/admin-control-plane/api-handlers'

export async function GET(request: Request) { return handleAdminOrders(request) }
export async function POST(request: Request) { return handleAdminOrders(request) }
