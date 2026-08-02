import{get,post}from '@/lib/homeservice-performance/server/api-command'
export async function GET(){return get('incidents')}
export async function POST(request:Request){return post('incidents',request)}
