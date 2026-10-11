 'use client'
import {useCallback,useEffect,useRef,useState} from 'react'
import {HotlineRequestError} from '../client'
export type SyncState={phase:'idle'|'syncing'|'online'|'retrying'|'offline'|'blocked';error:string;lastSuccess:number|null;failures:number}
export const nextPollDelay=(interval:number,failures:number)=>Math.min(30000,interval*Math.pow(2,Math.min(failures,4)))
/** Sequential reads: no overlapping requests, stale writes, or automatic mutation retries. */
export function useHotlinePolling(task:(signal:AbortSignal)=>Promise<void>,enabled:boolean,interval=3000,background=false,resetKey=''){
 const [state,setState]=useState<SyncState>({phase:'idle',error:'',lastSuccess:null,failures:0});
 const taskRef=useRef(task),wake=useRef<()=>void>(()=>{});taskRef.current=task;
 useEffect(()=>{
  if(!enabled){setState(s=>({...s,phase:'idle',error:'',failures:0}));return}
  let stopped=false,busy=false,failures=0,blocked=false,timer:ReturnType<typeof setTimeout>|undefined,controller:AbortController|undefined;
  const schedule=(ms:number)=>{clearTimeout(timer);if(!stopped)timer=setTimeout(run,ms)};
  const run=async()=>{
   if(stopped||busy)return;
   if(!navigator.onLine){setState(s=>({...s,phase:'offline'}));schedule(10000);return}
   if(!background&&document.hidden){schedule(interval);return}
   busy=true;controller=new AbortController();setState(s=>({...s,phase:failures?'retrying':'syncing'}));
   try {await taskRef.current(controller.signal);if(stopped)return;failures=0;blocked=false;setState({phase:'online',error:'',lastSuccess:Date.now(),failures:0})}
   catch(e){if(stopped)return;failures++;blocked=e instanceof HotlineRequestError&&(e.status===401||e.status===403);setState(s=>({...s,phase:blocked?'blocked':'retrying',error:e instanceof Error?e.message:String(e),failures}))}
   finally{busy=false;if(!stopped&&!blocked)schedule(nextPollDelay(interval,failures))}
  };
  const retry=()=>{blocked=false;failures=0;clearTimeout(timer);void run()};wake.current=retry;
  const visibility=()=>{if(!document.hidden&&!blocked)retry()};
  window.addEventListener('online',retry);document.addEventListener('visibilitychange',visibility);void run();
  return()=>{stopped=true;clearTimeout(timer);controller?.abort();wake.current=()=>{};window.removeEventListener('online',retry);document.removeEventListener('visibilitychange',visibility)}
 },[enabled,interval,background,resetKey]);
 return {...state,retry:useCallback(()=>wake.current(),[])}
}
