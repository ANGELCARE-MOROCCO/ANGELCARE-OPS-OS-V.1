import { NextResponse } from 'next/server'
import { apiError, productExperienceClient, requireProductExperienceActor, safeText } from '@/lib/service-design-product-experience/server'
import { findScenariosForRequest } from '@/lib/service-design-product-experience/repository'
import { diffScenarios } from '@/lib/service-design-product-experience/normalize'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(request:Request){try{await requireProductExperienceActor();const client=await productExperienceClient();const requestId=safeText(new URL(request.url).searchParams.get('requestId'),180);if(!requestId)return NextResponse.json({ok:false,error:'requestId requis.'},{status:400});const scenarios=await findScenariosForRequest(client,requestId);return NextResponse.json({ok:true,data:{scenarios,diffs:diffScenarios(scenarios)}})}catch(error){const e=apiError(error);return NextResponse.json({ok:false,error:e.message},{status:e.status})}}
