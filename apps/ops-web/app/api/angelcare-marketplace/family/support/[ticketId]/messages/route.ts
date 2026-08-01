import { handleSupportMessage } from '@/angelcare-marketplace/family-experience/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{ticketId:string}>}){return handleSupportMessage(request,(await params).ticketId)}
