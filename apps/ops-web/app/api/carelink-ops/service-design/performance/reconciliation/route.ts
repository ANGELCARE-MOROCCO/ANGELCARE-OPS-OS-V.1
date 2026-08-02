import{get,post}from '@/lib/homeservice-performance/server/api-command'
export async function GET(){return get('reconciliation')}
export async function POST(request:Request){return post('reconciliation',request)}
