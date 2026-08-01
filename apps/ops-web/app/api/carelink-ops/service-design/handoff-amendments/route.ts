import{get,post}from'@/lib/homeservice-handoff/server/api-command';export async function GET(){return get('amendments')}export async function POST(r:Request){return post('amendments',r)}
