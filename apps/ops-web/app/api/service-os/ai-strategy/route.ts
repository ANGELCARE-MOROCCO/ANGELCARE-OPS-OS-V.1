import { NextResponse } from 'next/server'
import { getAIServiceRecommendations, getDemandSignals, getExecutiveAICommand } from '@/lib/service-os/ai-strategy-engine'
export async function GET(){return NextResponse.json({ok:true,command:getExecutiveAICommand(),recommendations:getAIServiceRecommendations(),signals:getDemandSignals()})}
