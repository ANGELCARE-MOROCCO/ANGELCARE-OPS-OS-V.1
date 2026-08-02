import{get,post}from '@/lib/homeservice-performance/server/api-command'
export async function GET(){return get('pilots')}
export async function POST(request:Request){return post('pilots',request)}
