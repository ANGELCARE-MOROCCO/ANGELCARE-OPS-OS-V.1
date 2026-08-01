import{get,post}from'@/lib/homeservice-commercial/server/api-command'
export async function GET(){return get('surcharges')}
export async function POST(r:Request){return post('surcharges',r)}
