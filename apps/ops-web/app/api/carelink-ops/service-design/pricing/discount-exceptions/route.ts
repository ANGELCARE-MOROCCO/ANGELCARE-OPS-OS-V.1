import{get,post}from'@/lib/homeservice-commercial/server/api-command'
export async function GET(){return get('discountExceptions')}
export async function POST(r:Request){return post('discountExceptions',r)}
