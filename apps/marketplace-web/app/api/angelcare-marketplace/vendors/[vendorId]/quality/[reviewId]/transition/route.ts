import { handleVendorQualityTransition } from '@/angelcare-marketplace/vendor-authority/api-handlers'
export async function POST(r:Request,{params}:{params:Promise<{vendorId:string;reviewId:string}>}){const p=await params;return handleVendorQualityTransition(r,p.vendorId,p.reviewId)}
