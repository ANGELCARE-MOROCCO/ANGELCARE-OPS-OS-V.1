import{get,post}from'@/lib/homeservice-commercial/server/api-command'
export async function GET(){return get('costBooks')}
export async function POST(r:Request){return post('costBooks',r)}
