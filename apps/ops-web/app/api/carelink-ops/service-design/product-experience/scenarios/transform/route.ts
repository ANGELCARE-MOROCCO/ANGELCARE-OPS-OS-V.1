import { NextResponse } from 'next/server'
import { apiError, productExperienceClient, requireProductExperienceActor, safeArray, safeJson, safeText } from '@/lib/service-design-product-experience/server'
import { transformServiceDesign } from '@/lib/service-design-product-experience/openrouter'
import { loadDraft } from '@/lib/service-design-product-experience/repository'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function POST(request:Request){try{const actor=await requireProductExperienceActor();const client=await productExperienceClient();const body=await request.json();const workspaceKey=safeText(body.workspaceKey,240);const draft=workspaceKey?await loadDraft(client,actor,workspaceKey):null;if(!draft)throw Object.assign(new Error('Workbench introuvable.'),{status:404});const transformed=await transformServiceDesign({command:safeText(body.command,180),draft:draft as unknown as Record<string,unknown>,allowedActivities:safeArray(body.allowedActivities).map((x)=>safeJson(x))});return NextResponse.json({ok:true,data:transformed})}catch(error){const e=apiError(error);return NextResponse.json({ok:false,error:e.message},{status:e.status})}}
