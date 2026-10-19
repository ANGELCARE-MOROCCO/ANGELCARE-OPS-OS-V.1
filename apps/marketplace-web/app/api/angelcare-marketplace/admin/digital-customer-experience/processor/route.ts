import {processorAuthorized,processorCommand}from'@/angelcare-marketplace/digital-customer-experience/processor-service'
import {apiFailure,apiSuccess}from'@/angelcare-marketplace/server/request'
import {MarketplaceError}from'@/angelcare-marketplace/server/errors'
export const dynamic='force-dynamic';export const runtime='nodejs'
export async function POST(request:Request){try{if(!processorAuthorized(request))throw new MarketplaceError('AUTHENTICATION_REQUIRED','Processor authentication required.');const raw=await request.text();if(Buffer.byteLength(raw)>5*1024*1024)throw new MarketplaceError('VALIDATION_ERROR','Processor payload exceeds limits.');const result=apiSuccess(await processorCommand(JSON.parse(raw)));result.headers.set('Cache-Control','private, no-store');return result}catch(e){const response=apiFailure(e);response.headers.set('Cache-Control','private, no-store');return response}}
