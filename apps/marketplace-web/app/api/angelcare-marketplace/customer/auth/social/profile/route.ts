import {handleSocialProfile} from '@/angelcare-marketplace/customer-commerce/customer-social/server'
export const dynamic='force-dynamic'
export async function GET(request:Request){return handleSocialProfile(request)}
export async function POST(request:Request){return handleSocialProfile(request)}
