import {handleSubscriptions} from '@/angelcare-marketplace/enterprise-closure/api-handlers'
export async function GET(request:Request){return handleSubscriptions(request)}
export async function POST(request:Request){return handleSubscriptions(request)}
