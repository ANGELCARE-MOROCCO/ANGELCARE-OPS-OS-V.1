import { NextResponse } from 'next/server'
import { getRevenueSnapshot, packages } from '@/lib/service-os/commercial-engine'
export async function GET(){return NextResponse.json({ok:true,snapshot:getRevenueSnapshot(),packages})}
