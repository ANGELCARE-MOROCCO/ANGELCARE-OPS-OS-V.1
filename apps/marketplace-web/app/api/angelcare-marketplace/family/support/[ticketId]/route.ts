import { handleSupportTicket } from '@/angelcare-marketplace/family-experience/api-handlers'
export async function GET(request:Request,{params}:{params:Promise<{ticketId:string}>}){return handleSupportTicket(request,(await params).ticketId)}
