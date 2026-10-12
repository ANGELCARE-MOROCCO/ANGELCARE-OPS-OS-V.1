import {handleSocialCallback} from '@/angelcare-marketplace/customer-commerce/customer-social/server'
export const dynamic='force-dynamic'
export async function GET(request:Request){return handleSocialCallback(request)}
