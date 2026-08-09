import { handleAcknowledgeNotification } from '@/angelcare-marketplace/journey-control/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{notificationId:string}>}){const {notificationId}=await params;return handleAcknowledgeNotification(request,notificationId)}
