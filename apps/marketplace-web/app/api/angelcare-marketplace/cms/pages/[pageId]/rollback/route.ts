import { handlePageRollback } from '@/angelcare-marketplace/experience-builder/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{pageId:string}>}){return handlePageRollback(request,(await params).pageId)}
