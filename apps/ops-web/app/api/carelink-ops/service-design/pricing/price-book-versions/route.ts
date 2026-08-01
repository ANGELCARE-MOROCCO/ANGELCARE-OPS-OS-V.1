import{get,post}from'@/lib/homeservice-commercial/server/api-command'
export async function GET(){return get('priceBookVersions')}
export async function POST(r:Request){return post('priceBookVersions',r)}
