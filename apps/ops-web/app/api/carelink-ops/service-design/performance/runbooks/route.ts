import{get,post}from '@/lib/homeservice-performance/server/api-command'
export async function GET(){return get('runbooks')}
export async function POST(request:Request){return post('runbooks',request)}
