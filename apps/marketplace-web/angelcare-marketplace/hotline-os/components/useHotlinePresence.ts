 'use client'
import {useEffect,useRef,useState} from 'react'
import type {Agent} from '../types'
import {hotlineRequest} from '../client'
import {useHotlinePolling} from './useHotlinePolling'
/** A heartbeat never republishes a tab's stale status. Only an explicit user choice changes it. */
export function useHotlinePresence(enabled:boolean){
 const [status,setStatus]=useState<Agent['status']>('away'),[changing,setChanging]=useState(false),[error,setError]=useState('');
 const alive=useRef(true),change=useRef(0),locked=useRef(false);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;change.current++}},[]);
 const sync=useHotlinePolling(async signal=>{const generation=change.current;const agent=await hotlineRequest<Agent>('agents/heartbeat',{},true,undefined,{signal});if(!signal.aborted&&alive.current&&generation===change.current&&!locked.current)setStatus(agent.status)},enabled,12000,true);
 async function choose(next:Agent['status']){if(locked.current||!enabled)return;locked.current=true;const generation=++change.current;setChanging(true);setError('');try{const agent=await hotlineRequest<Agent>('agents/heartbeat',{status:next},true);if(alive.current&&generation===change.current)setStatus(agent.status)}catch(e){if(alive.current)setError(e instanceof Error?e.message:String(e))}finally{locked.current=false;if(alive.current){setChanging(false);sync.retry()}}}
 return {status,choose,changing,sync,error};
}
