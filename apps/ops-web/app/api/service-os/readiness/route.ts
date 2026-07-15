import { NextResponse } from 'next/server'
import { listServiceOSBlueprints } from '@/lib/service-os/production/repository'
import { getServiceOSCrossModuleReadiness } from '@/lib/service-os/production/cross-module-sync'
export async function GET() { const blueprints = await listServiceOSBlueprints(); const data = await Promise.all(blueprints.map(async b => ({ code:b.code, title:b.title, ...(await getServiceOSCrossModuleReadiness(b)) }))); return NextResponse.json({ data }) }
