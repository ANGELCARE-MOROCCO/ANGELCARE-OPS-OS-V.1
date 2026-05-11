import { NextResponse } from 'next/server'
import { getEscalations, getOperationalSnapshot, serviceMissions } from '@/lib/service-os/execution-engine'
export async function GET(){ return NextResponse.json({ok:true,snapshot:getOperationalSnapshot(),missions:serviceMissions,escalations:getEscalations()}) }
