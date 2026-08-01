import{post}from'@/lib/homeservice-handoff/server/api-command';export async function POST(r:Request,{params}:{params:Promise<{id:string}>}){return post('preflight',r,(await params).id)}
