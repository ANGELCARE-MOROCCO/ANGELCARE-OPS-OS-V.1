import {setTimeout as delay} from 'node:timers/promises'
const origin=String(process.env.HOTLINE_MARKETPLACE_ORIGIN||'').replace(/\/$/,'')
const secret=String(process.env.HOTLINE_WORKER_SECRET||'')
if(!/^https:\/\//.test(origin)||secret.length<32){console.error('HOTLINE_MARKETPLACE_ORIGIN (https) and HOTLINE_WORKER_SECRET (32+ chars) required.');process.exitCode=1}else{
 let stopped=false;process.on('SIGTERM',()=>{stopped=true});process.on('SIGINT',()=>{stopped=true})
 while(!stopped){try{const response=await fetch(origin+'/api/angelcare-marketplace/internal/hotline/tick',{method:'POST',headers:{authorization:'Bearer '+secret},signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('Dispatch HTTP '+response.status);const data=await response.json();if(data.error)throw Error(data.error.message);if(data.data.assigned)console.log(JSON.stringify({at:data.data.at,assigned:data.data.assigned}))}catch(e){console.error(new Date().toISOString()+' '+(e instanceof Error?e.message:'Dispatch failed'))}if(!stopped)await delay(5000)}
}
