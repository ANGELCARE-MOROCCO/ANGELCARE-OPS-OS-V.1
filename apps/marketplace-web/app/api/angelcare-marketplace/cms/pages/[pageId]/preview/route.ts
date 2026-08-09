import { handlePreview } from '@/angelcare-marketplace/experience-builder/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{pageId:string}>}){return handlePreview(request,(await params).pageId)}
