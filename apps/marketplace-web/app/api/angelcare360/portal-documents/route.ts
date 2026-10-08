import { NextResponse } from 'next/server'
import { createPortalDocumentSignedUrl } from '@/lib/angelcare360/portal/documents'
import type { Angelcare360PortalKind } from '@/types/angelcare360/role-portals'

export const dynamic='force-dynamic'
export const runtime='nodejs'
const KINDS=new Set<Angelcare360PortalKind>(['teacher','parent','student','staff'])
export async function GET(request:Request){
  try{const url=new URL(request.url);const documentId=String(url.searchParams.get('documentId')||'').trim();const portal=String(url.searchParams.get('portal')||'').trim() as Angelcare360PortalKind;if(!documentId||!KINDS.has(portal))return NextResponse.json({ok:false,error:'Document ou portail invalide.'},{status:400});const signedUrl=await createPortalDocumentSignedUrl(portal,documentId);return NextResponse.redirect(signedUrl,302)}catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:'Document indisponible.'},{status:403})}
}
