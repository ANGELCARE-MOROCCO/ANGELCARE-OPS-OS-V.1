import Link from 'next/link'
import { ReactNode } from 'react'

export function ServiceOSPanel({title, subtitle, right, children}:{title:string; subtitle?:string; right?:ReactNode; children:ReactNode}){
  return <section style={{border:'1px solid #e2e8f0', background:'#fff', borderRadius:28, padding:22, boxShadow:'0 18px 55px rgba(15,23,42,.08)', marginBottom:18}}>
    <div style={{display:'flex', justifyContent:'space-between', gap:16, alignItems:'flex-start', marginBottom:18}}>
      <div><h2 style={{fontSize:21, margin:'0 0 6px', color:'#0f172a'}}>{title}</h2>{subtitle&&<p style={{margin:0,color:'#64748b',fontSize:14,lineHeight:1.6}}>{subtitle}</p>}</div>
      {right&&<div style={{display:'flex',gap:10,flexWrap:'wrap'}}>{right}</div>}
    </div>{children}
  </section>
}
export function ServiceOSButton({href, children, light}:{href:string; children:ReactNode; light?:boolean}){
  return <Link href={href} style={{display:'inline-flex',alignItems:'center',justifyContent:'center',borderRadius:999,padding:'10px 14px',fontSize:13,fontWeight:800,textDecoration:'none',background:light?'#f8fafc':'#0f172a',color:light?'#0f172a':'#fff',border:'1px solid #cbd5e1'}}>{children}</Link>
}
export function ServiceOSMetric({label,value,sub,accent}:{label:string;value:ReactNode;sub?:string;accent?:string}){
  return <div style={{border:'1px solid #e2e8f0',borderRadius:24,padding:18,background:'linear-gradient(180deg,#fff,#f8fafc)'}}><div style={{fontSize:12,color:'#64748b',fontWeight:800,textTransform:'uppercase',letterSpacing:.6}}>{label}</div><div style={{fontSize:28,fontWeight:950,color:accent||'#0f172a',marginTop:8}}>{value}</div>{sub&&<div style={{fontSize:13,color:'#64748b',marginTop:4}}>{sub}</div>}</div>
}
export function ServiceOSGrid({children}:{children:ReactNode}){ return <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14}}>{children}</div> }
export function ServiceOSPill({children,tone='slate'}:{children:ReactNode;tone?:'green'|'amber'|'red'|'blue'|'purple'|'slate'}){
 const map:any={green:['#dcfce7','#166534'],amber:['#fef3c7','#92400e'],red:['#fee2e2','#991b1b'],blue:['#dbeafe','#1d4ed8'],purple:['#ede9fe','#6d28d9'],slate:['#f1f5f9','#334155']}; const [bg,fg]=map[tone]||map.slate;
 return <span style={{display:'inline-flex',borderRadius:999,padding:'5px 9px',background:bg,color:fg,fontSize:12,fontWeight:850}}>{children}</span>
}
export function ServiceOSCard({title, subtitle, children}:{title:string; subtitle?:string; children?:ReactNode}){return <article style={{border:'1px solid #e2e8f0',borderRadius:24,padding:18,background:'#fff'}}><h3 style={{margin:'0 0 6px',fontSize:17,color:'#0f172a'}}>{title}</h3>{subtitle&&<p style={{margin:'0 0 12px',fontSize:13,lineHeight:1.55,color:'#64748b'}}>{subtitle}</p>}{children}</article>}
