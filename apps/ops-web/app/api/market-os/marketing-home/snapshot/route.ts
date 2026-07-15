import { NextResponse } from 'next/server'
import { getMarketingHomeSyncSnapshot } from '@/lib/market-os/marketing-home-sync'
export const dynamic = 'force-dynamic'
export async function GET(){ const snapshot = await getMarketingHomeSyncSnapshot(); return NextResponse.json(snapshot) }
