import{post}from '@/lib/homeservice-performance/server/api-command'
export async function POST(request:Request,context:{params:Promise<{id:string}>}){const{id}=await context.params;return post('case_transition',request,id)}
