import {handleReceipts} from '@/angelcare-marketplace/enterprise-closure/api-handlers'
export async function GET(request:Request){return handleReceipts(request)}
export async function POST(request:Request){return handleReceipts(request)}
