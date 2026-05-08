import Link from 'next/link'
import type { ReactNode } from 'react'

export function HrV2Hero({title, subtitle, actions}:{title:string; subtitle:string; actions?:ReactNode}) {
  return <section style={{borderRadius:28,padding:28,background:'linear-gradient(135deg,#0f172a,#1e3a8a 55%,#7c3aed)',color:'white',boxShadow:'0 28px 60px rgba(15,23,42,.22)',marginBottom:20}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:20,alignItems:'flex-start',flexWrap:'wrap'}}>
      <div style={{maxWidth:820}}><div style={{fontSize:12,letterSpacing:2,textTransform:'uppercase',opacity:.78,fontWeight:800}}>AngelCare HR Unified V2 • Execution layer</div><h1 style={{fontSize:36,lineHeight:1.05,margin:'12px 0 10px',fontWeight:950}}>{title}</h1><p style={{fontSize:16,lineHeight:1.65,opacity:.9,margin:0}}>{subtitle}</p></div>
      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>{actions}</div>
    </div>
  </section>
}

export function HrAction({href,children,variant='dark'}:{href:string;children:ReactNode;variant?:'dark'|'light'}) {
  return <Link href={href} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'11px 14px',borderRadius:16,textDecoration:'none',fontWeight:850,background:variant==='dark'?'#0f172a':'rgba(255,255,255,.16)',color:'white',border:'1px solid rgba(255,255,255,.25)'}}>{children}</Link>
}

export function HrPanel({title, subtitle, children}:{title:string; subtitle?:string; children:ReactNode}) {
  return <section style={{background:'white',border:'1px solid #e5e7eb',borderRadius:24,padding:20,boxShadow:'0 14px 35px rgba(15,23,42,.06)',marginBottom:18}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'start',gap:16,marginBottom:16}}><div><h2 style={{fontSize:19,margin:'0 0 4px',fontWeight:950,color:'#0f172a'}}>{title}</h2>{subtitle?<p style={{margin:0,color:'#64748b',fontSize:13,lineHeight:1.5}}>{subtitle}</p>:null}</div></div>{children}</section>
}

export function HrMetric({label,value,detail,icon='◇'}:{label:string;value:string|number;detail?:string;icon?:string}) {
  return <div style={{border:'1px solid #e5e7eb',borderRadius:22,padding:18,background:'linear-gradient(180deg,#fff,#f8fafc)'}}><div style={{fontSize:24}}>{icon}</div><div style={{fontSize:28,fontWeight:950,color:'#0f172a',marginTop:8}}>{value}</div><div style={{fontWeight:850,color:'#334155'}}>{label}</div>{detail?<div style={{fontSize:12,color:'#64748b',marginTop:4}}>{detail}</div>:null}</div>
}

export function HrGrid({children,cols=4}:{children:ReactNode;cols?:number}) { return <div style={{display:'grid',gridTemplateColumns:`repeat(${cols}, minmax(0, 1fr))`,gap:14}}>{children}</div> }

export function HrTable({headers, rows}:{headers:string[]; rows:(ReactNode[])[]}) {
  return <div style={{overflowX:'auto',border:'1px solid #e5e7eb',borderRadius:18}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}><thead><tr>{headers.map(h=><th key={h} style={{textAlign:'left',padding:'12px 14px',background:'#f8fafc',color:'#475569',fontWeight:900,borderBottom:'1px solid #e5e7eb'}}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j} style={{padding:'12px 14px',borderBottom:'1px solid #f1f5f9',verticalAlign:'top'}}>{c}</td>)}</tr>)}</tbody></table></div>
}

export function HrStatusPill({status}:{status?:string}) {
  const s=String(status||'pending');
  const bg=s.includes('approved')||s.includes('active')||s.includes('hired')||s.includes('completed')?'#dcfce7':s.includes('blocked')||s.includes('rejected')?'#fee2e2':s.includes('open')||s.includes('screen')?'#dbeafe':'#fef3c7'
  const color=bg==='#dcfce7'?'#166534':bg==='#fee2e2'?'#991b1b':bg==='#dbeafe'?'#1e40af':'#92400e'
  return <span style={{display:'inline-flex',padding:'5px 9px',borderRadius:999,background:bg,color,fontWeight:900,fontSize:12}}>{s}</span>
}
