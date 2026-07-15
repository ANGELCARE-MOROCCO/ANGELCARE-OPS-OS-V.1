import { NextResponse } from 'next/server'
import { listServiceOSBlueprints, listServiceOSRules, listServiceOSCityDeployments } from '@/lib/service-os/production/repository'
import { calculateServiceOSPrice } from '@/lib/service-os/production/pricing-engine'
export async function POST(request: Request) { const body = await request.json(); const blueprints = await listServiceOSBlueprints(); const rules = await listServiceOSRules(); const deployments = await listServiceOSCityDeployments(); const blueprint = blueprints.find(b => b.code === body.code || b.id === body.id) || blueprints[0]; const city = deployments.find(d => d.city === body.city); return NextResponse.json({ data: calculateServiceOSPrice({ blueprint, city, rules, ...body }) }) }
