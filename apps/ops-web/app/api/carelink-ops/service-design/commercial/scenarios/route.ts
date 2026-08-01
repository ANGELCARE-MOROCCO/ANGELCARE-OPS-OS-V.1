import{get,post}from'@/lib/homeservice-commercial/server/api-command'
export const dynamic='force-dynamic'
export async function GET(){return get('scenarios')}
export async function POST(r:Request){return post('scenarios',r)}
