import {loadProductLaunch,productLaunchAction} from '@/angelcare-marketplace/supplier-command-360/product-launch-server'
import {apiFailure,apiSuccess,parseJsonObject,requestId} from '@/angelcare-marketplace/server/request'
export const dynamic='force-dynamic'
export const runtime='nodejs'
export async function GET(request:Request){const rid=requestId(request);try{const pid=new URL(request.url).searchParams.get('catalogId')||undefined;return apiSuccess(await loadProductLaunch(pid),{requestId:rid})}catch(e){return apiFailure(e,rid)}}
export async function POST(request:Request){const rid=requestId(request);try{return apiSuccess(await productLaunchAction(await parseJsonObject(request)),{requestId:rid})}catch(e){return apiFailure(e,rid)}}
