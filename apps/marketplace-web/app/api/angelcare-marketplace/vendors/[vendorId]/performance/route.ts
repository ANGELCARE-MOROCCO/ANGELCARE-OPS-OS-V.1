import { handleVendorPerformance } from '@/angelcare-marketplace/vendor-authority/api-handlers'
export async function POST(r:Request,{params}:{params:Promise<{vendorId:string}>}){return handleVendorPerformance(r,(await params).vendorId)}
