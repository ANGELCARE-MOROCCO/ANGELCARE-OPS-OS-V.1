import { NextResponse } from 'next/server'
import { getExpansionRecommendations, getLiveOpsSnapshot, liveOps } from '@/lib/service-os/expansion-engine'
export async function GET(){return NextResponse.json({ok:true,live:getLiveOpsSnapshot(),liveOps,recommendations:getExpansionRecommendations()})}
