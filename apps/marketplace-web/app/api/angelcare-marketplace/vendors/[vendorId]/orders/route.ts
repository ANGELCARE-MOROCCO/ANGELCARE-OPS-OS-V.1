import { handleVendorOrders } from '@/angelcare-marketplace/vendor-authority/api-handlers'
export async function POST(r:Request,{params}:{params:Promise<{vendorId:string}>}){return handleVendorOrders(r,(await params).vendorId)}
