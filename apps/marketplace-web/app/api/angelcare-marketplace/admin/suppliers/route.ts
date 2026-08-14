import { handleAdminSuppliers } from '@/angelcare-marketplace/admin-control-plane/api-handlers'
export async function GET(request: Request) { return handleAdminSuppliers(request) }
export async function POST(request: Request) { return handleAdminSuppliers(request) }
