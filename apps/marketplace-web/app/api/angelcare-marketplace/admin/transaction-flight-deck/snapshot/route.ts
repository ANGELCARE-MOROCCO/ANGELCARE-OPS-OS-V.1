import { NextResponse } from 'next/server'
import { transactionFlightDeckSnapshot } from '@/angelcare-marketplace/transaction-flight-deck/repository'
export const dynamic='force-dynamic'
export async function GET(){try{return NextResponse.json({data:await transactionFlightDeckSnapshot()})}catch(error){return NextResponse.json({error:{message:error instanceof Error?error.message:'Transaction Flight Deck indisponible.'}},{status:500})}}
