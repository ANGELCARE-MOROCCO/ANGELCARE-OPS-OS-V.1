import { handlePage } from '@/angelcare-marketplace/experience-builder/api-handlers'
export async function GET(request:Request,{params}:{params:Promise<{pageId:string}>}){return handlePage(request,(await params).pageId)}
export async function PATCH(request:Request,{params}:{params:Promise<{pageId:string}>}){return handlePage(request,(await params).pageId)}
