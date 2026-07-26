import { NextRequest } from 'next/server'
import { requireContentHeadquartersUser, contentHeadquartersApiError } from '@/lib/market-os/content-command-headquarters/auth'
import { downloadContentHeadquartersFile } from '@/lib/market-os/content-command-headquarters/bridge'

export const dynamic='force-dynamic'
export async function GET(request:NextRequest){
  try{
    await requireContentHeadquartersUser('view')
    const bridgeFileId=request.nextUrl.searchParams.get('fileId')||''
    const storageKey=request.nextUrl.searchParams.get('storageKey')||''
    if(!bridgeFileId&&!storageKey)throw new Error('FILE_REFERENCE_REQUIRED')
    const file=await downloadContentHeadquartersFile({bridgeFileId,storageKey})
    return new Response(file.bytes,{status:200,headers:{'content-type':file.contentType,'cache-control':'private, max-age=120','x-content-type-options':'nosniff'}})
  }catch(error){return contentHeadquartersApiError(error)}
}
