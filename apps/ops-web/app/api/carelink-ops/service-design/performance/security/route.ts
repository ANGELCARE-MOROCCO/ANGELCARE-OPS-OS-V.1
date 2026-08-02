import{get,post}from '@/lib/homeservice-performance/server/api-command'
export async function GET(){return get('security')}
export async function POST(request:Request){return post('security',request)}
