'use client'
import {useEffect,useRef} from 'react'
import {SUPPORTED_TRIGGERS} from './experience-contract'
const events=new Map<string,number>()
export function emitLiveJourney(type:string){if(typeof window==='undefined'||!SUPPORTED_TRIGGERS.includes(type as typeof SUPPORTED_TRIGGERS[number]))return;events.set(location.pathname+':'+type,Date.now());window.dispatchEvent(new CustomEvent('angelcare:live-experience-trigger',{detail:{type}}))}
export function recentLiveJourney(type:string){return typeof window!=='undefined'&&Date.now()-(events.get(location.pathname+':'+type)||0)<30000}
export function useLiveJourneySignals({stage,signature='',error=false,completed=false,configured=false,unavailable=false,walletRequired=0,walletEligible=false,receipt}:{stage:'basket'|'checkout'|'configuration'|'payment';signature?:string;error?:boolean;completed?:boolean;configured?:boolean;unavailable?:boolean;walletRequired?:number;walletEligible?:boolean;receipt?:{sessionKey:string;visitorReference:string;outcomeId:string}|null}){
 const prior=useRef('')
 useEffect(()=>{if(signature&&signature!==prior.current){if(prior.current&&stage==='basket')emitLiveJourney('basket_update');if(prior.current&&stage==='configuration')emitLiveJourney('click');prior.current=signature}},[signature,stage])
 useEffect(()=>{if(error){emitLiveJourney('journey_problem');if(stage==='checkout')emitLiveJourney('checkout_interrupted')}},[error,stage])
 useEffect(()=>{if(completed){emitLiveJourney('journey_completed');if(receipt?.outcomeId)void attributeReceipt(receipt)}},[completed,receipt?.outcomeId])
 useEffect(()=>{if(configured)emitLiveJourney('service_configured')},[configured])
 useEffect(()=>{if(unavailable)emitLiveJourney('journey_problem')},[unavailable])
 useEffect(()=>{if(walletEligible)emitLiveJourney('wallet_eligible')},[walletEligible]);
 useEffect(()=>{if(walletRequired>0)emitLiveJourney('wallet_insufficient')},[walletRequired])
 useEffect(()=>{if(stage!=='basket'||!signature)return;const intent=(event:MouseEvent)=>{if(event.clientY<=4&&!event.relatedTarget)emitLiveJourney('basket_abandonment')};document.addEventListener('mouseout',intent);return()=>document.removeEventListener('mouseout',intent)},[stage,Boolean(signature)])
}

export function rememberLiveJourney(campaignId:string,revision:number,sessionKey:string){try{sessionStorage.setItem('ac-live-touch-2030',JSON.stringify({campaignId,revision,sessionKey,at:Date.now()}))}catch{}}
async function attributeReceipt(receipt:{sessionKey:string;visitorReference:string;outcomeId:string}){try{const touch=JSON.parse(sessionStorage.getItem('ac-live-touch-2030')||'null');if(!touch||Date.now()-touch.at>86400000)return;const result=await fetch('/api/angelcare-marketplace/live-experience/conversions',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...touch,...receipt,touchSessionKey:touch.sessionKey,pathname:location.pathname,locale:document.documentElement.lang})});if(result.ok){sessionStorage.removeItem('ac-live-touch-2030');window.dispatchEvent(new CustomEvent('angelcare:live-receipt',{detail:{campaignId:touch.campaignId,revision:touch.revision}}))}}catch{}}
