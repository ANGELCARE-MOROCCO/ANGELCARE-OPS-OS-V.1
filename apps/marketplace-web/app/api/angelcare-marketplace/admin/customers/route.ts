import { handleAdminCustomers } from '@/angelcare-marketplace/admin-control-plane/api-handlers'

export async function GET(request: Request) { return handleAdminCustomers(request) }
export async function POST(request: Request) { return handleAdminCustomers(request) }
