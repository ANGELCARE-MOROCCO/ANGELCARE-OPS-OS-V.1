import{get,post}from'@/lib/homeservice-commercial/server/api-command'
export const dynamic='force-dynamic'
export async function GET(){return get('offers')}
export async function POST(r:Request){return post('offers',r)}
