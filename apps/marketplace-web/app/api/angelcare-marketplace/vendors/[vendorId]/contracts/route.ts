import { handleVendorContracts } from '@/angelcare-marketplace/vendor-authority/api-handlers'
export async function POST(r:Request,{params}:{params:Promise<{vendorId:string}>}){return handleVendorContracts(r,(await params).vendorId)}
