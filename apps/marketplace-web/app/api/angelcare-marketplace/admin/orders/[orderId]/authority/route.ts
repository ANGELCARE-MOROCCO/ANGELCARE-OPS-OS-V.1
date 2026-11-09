import { orderAuthorityCommand } from '@/angelcare-marketplace/orders360/authority-command'
export const dynamic='force-dynamic'
export async function POST(request:Request,{params}:{params:Promise<{orderId:string}>}){return orderAuthorityCommand(request,(await params).orderId)}
