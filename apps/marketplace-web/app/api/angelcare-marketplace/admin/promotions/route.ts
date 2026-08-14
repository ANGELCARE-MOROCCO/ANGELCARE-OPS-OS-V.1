import {handlePromotions} from '@/angelcare-marketplace/enterprise-closure/api-handlers'
export async function GET(request:Request){return handlePromotions(request)}
export async function POST(request:Request){return handlePromotions(request)}
