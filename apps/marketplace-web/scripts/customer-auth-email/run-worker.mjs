/** Start only in the separate runtime activation stage. Importing/installing does nothing. */
import { pathToFileURL } from 'node:url'
export async function runWorker({once=false,signal}={}) {
 const origin=new URL(process.env.ANGELCARE_AUTH_EMAIL_WORKER_URL||'https://my.angelcarehub.com')
 if(origin.protocol!=='https:'||origin.username||origin.password)throw Error('Worker requires its production HTTPS origin')
 const secret=process.env.ANGELCARE_AUTH_EMAIL_WORKER_SECRET||''
 if(secret.length<32)throw Error('ANGELCARE_AUTH_EMAIL_WORKER_SECRET is not configured')
 const endpoint=new URL('/api/angelcare-marketplace/customer/auth/email-worker',origin.origin)
 const wait=ms=>new Promise(resolve=>{let timer;const done=()=>{clearTimeout(timer);signal?.removeEventListener('abort',done);resolve()};timer=setTimeout(done,ms);signal?.addEventListener('abort',done,{once:true});if(signal?.aborted)done()})
 do {
  try {
   const response=await fetch(endpoint,{method:'POST',headers:{Authorization:'Bearer '+secret},signal:signal?AbortSignal.any([signal,AbortSignal.timeout(180000)]):AbortSignal.timeout(180000)})
   if(!response.ok){console.log('AUTH_EMAIL_WORKER_HTTP='+response.status);if(response.status===401)throw Error('Worker authentication refused')}
   else {const data=await response.json();console.log(JSON.stringify({checkedAt:new Date().toISOString(),id:data.id||null,state:data.state,errorCode:data.errorCode||null,inboxDelivery:'not_observed'}))}
  }catch(error){if(signal?.aborted)break;if(error?.message==='Worker authentication refused')throw error;console.log('AUTH_EMAIL_WORKER_REQUEST_INCOMPLETE; next poll will not automatically resend an unacknowledged delivery')}
  if(once)break;await wait(5000)
 }while(!signal?.aborted)
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const controller=new AbortController();process.on('SIGINT',()=>controller.abort());process.on('SIGTERM',()=>controller.abort())
 runWorker({once:process.argv.includes('--once'),signal:controller.signal}).catch(error=>{console.error(error.message);process.exitCode=1})
}
