import{post}from '@/lib/homeservice-performance/server/api-command'
export async function POST(request:Request){return post('reconcile',request)}
