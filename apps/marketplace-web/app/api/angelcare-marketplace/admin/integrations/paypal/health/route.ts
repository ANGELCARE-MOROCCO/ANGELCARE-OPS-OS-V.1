import { handlePayPalAdminHealth } from '@/angelcare-marketplace/customer-commerce/paypal-admin-api'
export async function GET(request: Request) { return handlePayPalAdminHealth(request) }
export async function POST(request: Request) { return handlePayPalAdminHealth(request) }
