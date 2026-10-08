import { handleQuoteApproval } from '@/angelcare-marketplace/commercial-pipeline/api-handlers'
export async function POST(r:Request,{params}:{params:Promise<{quoteId:string}>}){return handleQuoteApproval(r,(await params).quoteId)}
