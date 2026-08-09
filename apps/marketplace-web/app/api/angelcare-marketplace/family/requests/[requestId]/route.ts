import { handleQuoteRequest } from '@/angelcare-marketplace/family-experience/api-handlers'
export async function GET(request: Request, { params }: { params: Promise<{ requestId: string }> }) { return handleQuoteRequest(request, (await params).requestId) }
