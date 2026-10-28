import { snapshotSupplierImport,associateSupplierImport } from '@/angelcare-marketplace/supplier-command-360/trilingual-import-server'
import { apiFailure,apiSuccess,parseJsonObject,requestId } from '@/angelcare-marketplace/server/request'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function GET(request:Request){const id=requestId(request);try{return apiSuccess(await snapshotSupplierImport(),{requestId:id})}catch(e){return apiFailure(e,id)}}
export async function POST(request:Request){const id=requestId(request);try{return apiSuccess(await associateSupplierImport(await parseJsonObject(request)),{requestId:id})}catch(e){return apiFailure(e,id)}}
