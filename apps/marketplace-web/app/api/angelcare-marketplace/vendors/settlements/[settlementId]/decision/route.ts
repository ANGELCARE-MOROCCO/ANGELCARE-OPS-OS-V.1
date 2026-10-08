import { handleVendorSettlementDecision } from '@/angelcare-marketplace/vendor-authority/api-handlers'
export async function POST(r:Request,{params}:{params:Promise<{settlementId:string}>}){return handleVendorSettlementDecision(r,(await params).settlementId)}
