'use client';
import { useEffect,useRef,useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DataRow } from '../server/repository';
import { object } from '../validation';
import { number } from '../components/Public';
import { useCommand } from './commands';
export interface DurableIntent<A extends string>{action:A;payload:DataRow;version:number;key:string}
export interface DraftProtocol<A extends string>{kind:'hiring'|'case'|'team'|'talent'|'reputation'|'organization';parse:(value:unknown)=>DurableIntent<A>|null}
export function useDurableDraft<A extends string>(protocol:DraftProtocol<A>,key:string,draft:DataRow|null,receipt:DataRow|null){
 const body=draft?.body&&typeof draft.body==='object'&&!Array.isArray(draft.body)?object(draft.body):{},initial=receipt?null:protocol.parse(body.intent),router=useRouter(),command=useCommand();
 const [pending,setPending]=useState<DurableIntent<A>|null>(initial),[processing,setProcessing]=useState(false),[result,setResult]=useState<DataRow|null>(receipt);
 const mounted=useRef(true),lifecycle=useRef(0),busy=useRef(false),intentRef=useRef(initial),resultRef=useRef(receipt),draftVersion=useRef(number(draft||{},'version')||0),checkpointed=useRef(Boolean(initial)),frozenFields=useRef<DataRow|null>(initial&&body.fields?object(body.fields):null);
 // Cached routes can become active again. Synchronize acknowledged local state,
 // but require an explicit resume after a command crosses a detached lifecycle.
 useEffect(()=>{mounted.current=true;setPending(intentRef.current);setResult(resultRef.current);setProcessing(busy.current);return()=>{mounted.current=false;lifecycle.current++;};},[]);
 function sync(){if(mounted.current){setPending(intentRef.current);setResult(resultRef.current);}}
 function clear(){draftVersion.current=0;intentRef.current=null;checkpointed.current=false;}
 async function saveDraft(fields:DataRow){
  if(!mounted.current||busy.current||intentRef.current)return null;const generation=lifecycle.current;busy.current=true;setProcessing(true);
  try{const saved=await command.run('draft.save',{kind:protocol.kind,key,body:{fields,intent:null}},draftVersion.current);if(saved)draftVersion.current=number(saved,'version')||draftVersion.current;return mounted.current&&generation===lifecycle.current?saved:null;}
  finally{busy.current=false;if(mounted.current)setProcessing(false);}
 }
 async function run(action:A,payload:DataRow,version:number,fields:DataRow){
  if(!mounted.current||busy.current)return null;const generation=lifecycle.current,active=()=>mounted.current&&generation===lifecycle.current;busy.current=true;setProcessing(true);
  try{
   if(!intentRef.current){intentRef.current={action,payload,version,key:crypto.randomUUID()};frozenFields.current=fields;checkpointed.current=false;resultRef.current=null;sync();}
   const intent=intentRef.current;
   if(!checkpointed.current){
    const saved=await command.run('draft.save',{kind:protocol.kind,key,body:{fields:frozenFields.current||fields,intent}},draftVersion.current);if(!saved)return null;
    draftVersion.current=number(saved,'version')||draftVersion.current;checkpointed.current=true;
    if(!active()){sync();return null;}
   }
   const committed=await command.run(intent.action,intent.payload,intent.version,intent.key);if(!committed)return null;resultRef.current=committed;sync();
   if(!active())return null;
   const removed=await command.run('draft.remove',{kind:protocol.kind,key},draftVersion.current);if(removed)clear();sync();
   if(!active())return null;router.refresh();return committed;
  }finally{busy.current=false;if(mounted.current)setProcessing(false);}
 }
 async function discard(){
  if(!mounted.current||busy.current)return;const generation=lifecycle.current;busy.current=true;setProcessing(true);
  try{if(draftVersion.current){const removed=await command.run('draft.remove',{kind:protocol.kind,key},draftVersion.current);if(!removed)return;}clear();resultRef.current=null;sync();if(mounted.current&&generation===lifecycle.current){command.clearError();router.refresh();}}
  finally{busy.current=false;if(mounted.current)setProcessing(false);}
 }
 return {body,pending,processing,result,run,saveDraft,discard,error:command.error};
}
