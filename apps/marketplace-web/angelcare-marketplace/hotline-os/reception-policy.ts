import type {Agent,HotlineConfig,Locale,Session} from './types'
export function holdClock(createdAt:string,now=Date.now()){
 const started=Date.parse(createdAt);const seconds=Number.isFinite(started)?Math.max(0,Math.floor((now-started)/1000)):0;
 return {seconds,tone:seconds>480?'red':seconds>=300?'orange':'green',label:`${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`};
}
export function canInspectWaitingSession(session:Pick<Session,'state'|'locale'|'queue_key'>|null|undefined,agent:Agent|null|undefined){return Boolean(session?.state==='queued'&&agent?.enabled&&agent.locales.includes(session.locale)&&agent.queues.includes(session.queue_key))}
export function ivrSummary(config:HotlineConfig,locale:Locale,answers:unknown[]){return answers.slice(0,5).flatMap(value=>{if(!value||typeof value!=='object')return[];const a=value as {node?:string;key?:string};const node=config.nodes.find(n=>n.id===a.node);const choice=node?.choices.find(c=>c.key===a.key);return node&&choice?[`${node.title[locale]}: ${choice.label[locale]}`]:[]}).join(' · ').slice(0,1000)}
