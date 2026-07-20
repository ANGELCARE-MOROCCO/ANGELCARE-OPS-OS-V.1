import { NextRequest } from 'next/server'
import { handleB2BDealRoute } from '@/lib/browser-extension/b2b-deal-closing/route-handler'

export async function POST(req:NextRequest){return handleB2BDealRoute(req,'b2b.pricing.calculate')}
export async function GET(req:NextRequest){return handleB2BDealRoute(req,'b2b.pricing.model_recommend')}
