import {handleInvoices} from '@/angelcare-marketplace/enterprise-closure/api-handlers'
export async function GET(request:Request){return handleInvoices(request)}
export async function POST(request:Request){return handleInvoices(request)}
