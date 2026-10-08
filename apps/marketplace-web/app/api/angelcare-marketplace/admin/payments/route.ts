import { handleAdminPayments } from '@/angelcare-marketplace/admin-control-plane/api-handlers'

export async function GET(request: Request) { return handleAdminPayments(request) }
export async function POST(request: Request) { return handleAdminPayments(request) }
