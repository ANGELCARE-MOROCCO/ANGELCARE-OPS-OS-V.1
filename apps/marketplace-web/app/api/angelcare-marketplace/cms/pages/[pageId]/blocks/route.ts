import { handleBlocks } from '@/angelcare-marketplace/experience-builder/api-handlers'
export async function PUT(request:Request,{params}:{params:Promise<{pageId:string}>}){return handleBlocks(request,(await params).pageId)}
