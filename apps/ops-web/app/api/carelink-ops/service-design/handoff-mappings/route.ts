import{get,post}from'@/lib/homeservice-handoff/server/api-command';export async function GET(){return get('mappings')}export async function POST(r:Request){return post('mappings',r)}
