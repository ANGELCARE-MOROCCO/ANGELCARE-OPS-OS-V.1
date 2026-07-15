'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function OrdersPage(){
  const [orders,setOrders]=useState<any[]>([])
  const [q,setQ]=useState('')
  const [msg,setMsg]=useState('Loading orders...')

  async function load(){
    const r=await fetch('/api/sales-terminal/orders',{cache:'no-store'})
    const j=await r.json()
    if(j.ok){setOrders(j.data||[]);setMsg(`${j.data?.length||0} orders loaded`)}
    else setMsg(j.message||'Orders API error')
  }

  useEffect(()=>{load()},[])

  const visible=orders.filter(o=>
    `${o.order_ref} ${o.client_name} ${o.service_type} ${o.status} ${o.payment_status}`.toLowerCase().includes(q.toLowerCase())
  )

  const total=orders.reduce((s,o)=>s+Number(o.total_amount||0),0)

  return (
    <main style={{padding:32,background:'#f8fafc',minHeight:'100vh'}}>
      <section style={{padding:28,borderRadius:28,background:'linear-gradient(135deg,#020617,#111827,#4c1d95)',color:'#fff',marginBottom:24}}>
        <p style={{fontWeight:900,color:'#ddd6fe'}}>SALES ORDERS · COMMAND CENTER</p>
        <h1 style={{fontSize:38,margin:'8px 0',color:'#fff'}}>Orders, quotes, invoices and delivery workflow</h1>
        <p style={{color:'#e2e8f0',fontWeight:700}}>{msg}</p>
        <div style={{display:'flex',gap:12,marginTop:18}}>
          <Link href="/sales/orders/new" style={{padding:'13px 16px',borderRadius:14,background:'#fff',color:'#0f172a',fontWeight:900,textDecoration:'none'}}>+ Create Order</Link>
          <Link href="/sales/clients" style={{padding:'13px 16px',borderRadius:14,background:'#7c3aed',color:'#fff',fontWeight:900,textDecoration:'none'}}>Clients</Link>
          <button onClick={load} style={{padding:'13px 16px',borderRadius:14,border:'1px solid rgba(255,255,255,.25)',background:'rgba(255,255,255,.12)',color:'#fff',fontWeight:900}}>Refresh</button>
        </div>
      </section>

      <section style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:20}}>
        <Card label="Orders" value={orders.length}/>
        <Card label="Pipeline" value={`${total.toLocaleString()} MAD`}/>
        <Card label="Draft" value={orders.filter(o=>!o.status||o.status==='draft').length}/>
        <Card label="Paid" value={orders.filter(o=>o.payment_status==='paid').length}/>
      </section>

      <section style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:24,padding:20}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:12,marginBottom:16}}>
          <h2 style={{margin:0,color:'#0f172a'}}>Live Orders</h2>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search orders..." style={{padding:12,border:'1px solid #cbd5e1',borderRadius:12,minWidth:300,color:'#0f172a'}}/>
        </div>

        <div style={{display:'grid',gap:10}}>
          {visible.map(o=>(
            <article key={o.id} style={{display:'grid',gridTemplateColumns:'1fr auto',gap:12,alignItems:'center',padding:16,border:'1px solid #e2e8f0',borderRadius:18,background:'#f8fafc'}}>
              <div>
                <b style={{color:'#0f172a'}}>{o.order_ref}</b>
                <p style={{margin:'6px 0',color:'#64748b',fontWeight:700}}>{o.client_name} · {o.service_type || 'No service'} · {Number(o.total_amount||0).toLocaleString()} MAD</p>
                <small style={{color:'#475569'}}>{o.status || 'draft'} · {o.payment_status || 'unpaid'} · {o.fulfillment_status || 'not_started'}</small>
              </div>
              <Link href={`/sales/orders/${o.id}`} style={{padding:'10px 12px',borderRadius:12,background:'#0f172a',color:'#fff',fontWeight:900,textDecoration:'none'}}>Open/Edit</Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

function Card({label,value}:{label:string,value:any}){
  return <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:20,padding:18}}><p style={{margin:0,color:'#64748b',fontWeight:800}}>{label}</p><strong style={{fontSize:24,color:'#0f172a'}}>{value}</strong></div>
}
