import{post}from'@/lib/homeservice-commercial/server/api-command'
export async function POST(r:Request){return post('calculate',r)}
