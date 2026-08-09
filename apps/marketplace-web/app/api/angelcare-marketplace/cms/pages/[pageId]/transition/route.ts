import { handlePageTransition } from '@/angelcare-marketplace/experience-builder/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{pageId:string}>}){return handlePageTransition(request,(await params).pageId)}
