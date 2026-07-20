import { NextRequest, NextResponse } from 'next/server'
import { authenticateExtensionRequest } from '@/lib/browser-extension/runtime'
export async function GET(req:NextRequest){ const auth=await authenticateExtensionRequest(req); if(!auth.ok) return auth.response; return NextResponse.json({ok:true,userId:auth.context.user.id,deviceId:auth.context.device.id,accessVersion:auth.context.claims.accessVersion,expiresAt:new Date(auth.context.claims.exp*1000).toISOString()}) }
