import{get,post}from '@/lib/homeservice-performance/server/api-command'
export async function GET(){return get('health')}
export async function POST(request:Request){return post('health',request)}
