import { handleProgramTransition } from '@/angelcare-marketplace/b2b-verticals/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{programId:string}>}){return handleProgramTransition(request,(await params).programId)}
