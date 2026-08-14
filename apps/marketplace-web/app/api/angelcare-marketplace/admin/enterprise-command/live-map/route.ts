import{handleLiveMap}from '@/angelcare-marketplace/enterprise-command/api-handlers'
export const dynamic='force-dynamic'
export async function GET(request:Request){return handleLiveMap(request)}
