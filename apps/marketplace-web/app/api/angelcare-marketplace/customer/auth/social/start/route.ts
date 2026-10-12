import {handleSocialStart} from '@/angelcare-marketplace/customer-commerce/customer-social/server'
export const dynamic='force-dynamic'
export async function POST(request:Request){return handleSocialStart(request)}
