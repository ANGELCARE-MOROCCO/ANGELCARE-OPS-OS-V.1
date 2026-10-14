import {createElement,type ReactNode} from 'react'
import {editorialImage} from '../atomic-merchandising/model'
type Node={tag:string;props:Record<string,unknown>;children:Array<Node|string>}
const allowed=new Set(['p','br','strong','b','em','i','u','ul','ol','li','h2','h3','h4','blockquote','a','table','thead','tbody','tfoot','tr','th','td','img'])
const decode=(s:string)=>s.replace(/&(?:amp|lt|gt|quot|apos|nbsp);|&#(?:x[0-9a-f]+|\d+);/gi,v=>{const named:Record<string,string>={'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '};if(named[v.toLowerCase()])return named[v.toLowerCase()];const n=parseInt(v.startsWith('&#x')?v.slice(3,-1):v.slice(2,-1),v.startsWith('&#x')?16:10);return Number.isFinite(n)&&n>=0&&n<=0x10ffff?String.fromCodePoint(n):''})
const attribute=(s:string,key:string)=>{const m=s.match(new RegExp('\\b'+key+'\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))','i'));return m?decode(m[1]??m[2]??m[3]??''):''}
/** Allowlisted React elements only. No raw HTML, event attributes, styles or executable embeds. */
export function RichDescription({text}:{text:string}){
 const source=text.replace(/<(script|style|iframe|object|embed|svg|form)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'')
 if(!/<\/?[a-z][^>]*>/i.test(source))return <>{source.split(/\n\s*\n/).filter(Boolean).map((p,i)=><p key={i}>{decode(p)}</p>)}</>
 const root:Node={tag:'root',props:{},children:[]},stack=[root],tokens=source.match(/<[^>]*>|[^<]+|</g)||[]
 for(const token of tokens){const tag=token.match(/^<\/?\s*([a-z][a-z0-9]*)\b/i)?.[1]?.toLowerCase();if(!tag){if(!token.startsWith('<'))stack[stack.length-1].children.push(decode(token));continue}if(!allowed.has(tag))continue;if(token.startsWith('</')){const at=stack.map(n=>n.tag).lastIndexOf(tag);if(at>0)stack.splice(at);continue}if(stack.length>48)continue;const props:Record<string,unknown>={};if(tag==='a'){const raw=attribute(token,'href'),href=raw.startsWith('#')&&/^#[\w-]+$/.test(raw)?raw:editorialImage(raw);if(href){props.href=href;if(href.startsWith('https:')){props.target='_blank';props.rel='noopener noreferrer'}}}if(tag==='img'){const src=editorialImage(attribute(token,'src'));if(!src)continue;props.src=src;props.alt=attribute(token,'alt').slice(0,400);props.loading='lazy';props.decoding='async'}const node:Node={tag,props,children:[]};stack[stack.length-1].children.push(node);if(!['br','img'].includes(tag)&&!token.endsWith('/>'))stack.push(node)}
 function render(node:Node|string,key:string):ReactNode{return typeof node==='string'?node:createElement(node.tag,{...node.props,key},...node.children.map((c,i)=>render(c,key+'-'+i)))}
 return <>{root.children.map((n,i)=>render(n,'content-'+i))}</>
}
