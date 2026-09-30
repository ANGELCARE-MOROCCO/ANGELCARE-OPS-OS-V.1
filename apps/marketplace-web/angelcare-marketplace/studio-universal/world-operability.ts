import type {StudioBlockProps} from './types'

const rec=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{ }
const arr=(value:unknown)=>Array.isArray(value)?value:[]
const empty=(value:unknown)=>value==null||value===''||(Array.isArray(value)&&value.length===0)||(typeof value==='object'&&!Array.isArray(value)&&Object.keys(value as Record<string,unknown>).length===0)

function compare(operator:string,current:unknown,expected:unknown){
 if(operator==='exists')return current!==undefined&&current!==null
 if(operator==='not_empty')return!empty(current)
 if(operator==='equals')return String(current??'')===String(expected??'')
 if(operator==='not_equals')return String(current??'')!==String(expected??'')
 if(operator==='includes')return Array.isArray(current)?current.map(String).includes(String(expected)):String(current??'').includes(String(expected??''))
 const a=Number(current),b=Number(expected);if(!Number.isFinite(a)||!Number.isFinite(b))return false
 if(operator==='gt')return a>b;if(operator==='gte')return a>=b;if(operator==='lt')return a<b;if(operator==='lte')return a<=b
 return true
}

export function worldOperabilityForProps(props:StudioBlockProps){return rec(props.__worldFactoryOperability)}
export function shouldRenderWorldBlock(props:StudioBlockProps,context:{locale:'fr'|'en'|'ar';territoryId?:string|null;audienceId?:string|null}){
 const op=worldOperabilityForProps(props),conditions=arr(op.conditions).map(rec)
 if(!conditions.length)return{render:true,blocked:false,reasons:[] as string[]}
 let render=true,blocked=false;const reasons:string[]=[]
 for(const rule of conditions){
  const source=String(rule.source||'prop'),key=String(rule.key||''),operator=String(rule.operator||'exists'),effect=String(rule.effect||'show')
  const current=source==='context'?(key==='locale'?context.locale:key==='territoryId'?context.territoryId:key==='audienceId'?context.audienceId:undefined):(props as Record<string,unknown>)[key]
  const matched=compare(operator,current,rule.value)
  if(effect==='show'&&!matched){render=false;reasons.push(String(rule.reason||rule.id||'condition'))}
  if(effect==='hide'&&matched){render=false;reasons.push(String(rule.reason||rule.id||'condition'))}
  if(effect==='block_publish'&&!matched){blocked=true;render=false;reasons.push(String(rule.reason||rule.id||'condition'))}
 }
 return{render,blocked,reasons}
}

export function worldMediaPresentation(props:StudioBlockProps){
 const op=worldOperabilityForProps(props),media=arr(op.media).map(rec),contract=media[0]||null
 if(!contract)return null
 const presentation=rec(contract.presentation),focal=rec(presentation.focalPoint)
 const x=Number(focal.x),y=Number(focal.y)
 return{
  fit:['cover','contain','fill','none','scale-down'].includes(String(presentation.fit))?String(presentation.fit):'cover',
  position:String(presentation.position||((Number.isFinite(x)&&Number.isFinite(y))?`${x}% ${y}%`:'50% 50%')),
  aspectRatio:typeof presentation.aspectRatio==='string'&&presentation.aspectRatio?presentation.aspectRatio:null,
  overlay:typeof presentation.overlay==='string'&&presentation.overlay?presentation.overlay:null,
  responsive:rec(contract.responsive),
 }
}
