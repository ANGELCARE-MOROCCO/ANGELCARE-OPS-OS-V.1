import { handleVendorContractTransition } from '@/angelcare-marketplace/vendor-authority/api-handlers'
export async function POST(r:Request,{params}:{params:Promise<{vendorId:string;contractId:string}>}){const p=await params;return handleVendorContractTransition(r,p.vendorId,p.contractId)}
