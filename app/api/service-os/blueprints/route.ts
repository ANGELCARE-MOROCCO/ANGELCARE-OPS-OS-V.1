import { NextResponse } from 'next/server'
import { buildExecutiveServiceSnapshot, listServiceBlueprints } from '@/lib/service-os/blueprint-engine'
export async function GET(){ return NextResponse.json({ ok:true, snapshot:buildExecutiveServiceSnapshot(), blueprints:listServiceBlueprints() }) }
