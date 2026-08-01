import{post}from'@/lib/homeservice-handoff/server/api-command';export async function POST(r:Request,{params}:{params:Promise<{id:string}>}){return post('blueprint',r,(await params).id)}
