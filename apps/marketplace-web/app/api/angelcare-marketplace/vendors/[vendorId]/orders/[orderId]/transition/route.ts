import { handleVendorOrderTransition } from '@/angelcare-marketplace/vendor-authority/api-handlers'
export async function POST(r:Request,{params}:{params:Promise<{vendorId:string;orderId:string}>}){const p=await params;return handleVendorOrderTransition(r,p.vendorId,p.orderId)}
