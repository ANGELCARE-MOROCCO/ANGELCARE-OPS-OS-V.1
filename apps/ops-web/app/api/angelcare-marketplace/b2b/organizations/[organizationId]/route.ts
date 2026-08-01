import { handleOrganization360 } from '@/angelcare-marketplace/b2b-verticals/api-handlers'
export async function GET(request:Request,{params}:{params:Promise<{organizationId:string}>}){return handleOrganization360(request,(await params).organizationId)}
