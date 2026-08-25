import { handleVendorLifecycle } from '@/angelcare-marketplace/vendor-authority/api-handlers'
export async function POST(r:Request,{params}:{params:Promise<{vendorId:string}>}){return handleVendorLifecycle(r,(await params).vendorId)}
