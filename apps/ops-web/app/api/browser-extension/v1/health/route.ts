import { NextResponse } from 'next/server'
import { B2B_EXTENSION_CONTRACT, BROWSER_EXTENSION_MODULES } from '@/lib/browser-extension/catalog'
export async function GET(){ return NextResponse.json({ok:true,service:'ANGELCARE Revenue Command Extension Gateway',version:'0.1.0',contractVersion:B2B_EXTENSION_CONTRACT.version,b2bCapabilities:B2B_EXTENSION_CONTRACT.capabilityCount,modules:BROWSER_EXTENSION_MODULES.map((m:any)=>m.key),timestamp:new Date().toISOString()}) }
