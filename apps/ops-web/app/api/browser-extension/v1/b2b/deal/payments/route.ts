import { NextRequest } from 'next/server'
import { handleB2BDealRoute } from '@/lib/browser-extension/b2b-deal-closing/route-handler'

export async function POST(req:NextRequest){return handleB2BDealRoute(req,'b2b.payment_promise.create')}
export async function PUT(req:NextRequest){return handleB2BDealRoute(req,'b2b.payment_promise.verify_request')}
