import { NextResponse } from 'next/server'
import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { apiFailure, requestId } from '@/angelcare-marketplace/server/request'
import { transactionFlightDeckSnapshot } from '@/angelcare-marketplace/transaction-flight-deck/repository'
export const dynamic='force-dynamic'
export async function GET(request:Request){const id=requestId(request);try{await requireMarketplaceApiContext('marketplace.operations.view');return NextResponse.json({data:await transactionFlightDeckSnapshot()})}catch(error){return apiFailure(error,id)}}
