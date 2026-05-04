'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

export default function NewOrderPage(){
  const [clients,setClients]=useState<any[]>([])
  const [catalog,setCatalog]=useState<any[]>([])
  const [q,setQ]=useState('')
  const [msg,setMsg]=useState('Loading workspace...')
  const [saving,setSaving]=useState(false)

  const [f,setF]=useState({
    client_id:'',client_name:'',customer_type:'family',phone:'',email:'',city:'',
    service_category:'childcare',service_type:'',service_label:'',
    quantity:'1',unit_price:'0',discount:'0',tax:'0',
    payment_method:'cash',payment_term:'immediate',
    devis_object:'',devis_region:'',devis_contact:'',devis_program:'',devis_session:'',devis_note:'',
    notes:''
  })

  async function load(){
    const [cr,sr]=await Promise.all([
      fetch('/api/sales-terminal/clients',{cache:'no-store'}),
      fetch('/api/sales-terminal/service-catalog',{cache:'no-store'})
    ])
    const cj=await cr.json()
    const sj=await sr.json()
    setClients(cj.ok?cj.data||[]:[])
    setCatalog(sj.ok?sj.data||[]:[])
    setMsg('Workspace ready. Services and variations synced when available.')
  }

  useEffect(()=>{load()},[])

  const total=useMemo(()=>Math.max(0,Number(f.quantity||0)*Number(f.unit_price||0)-Number(f.discount||0)+Number(f.tax||0)),[f])
  const visible=catalog.filter(x=>`${x.service_name} ${x.variation_name} ${x.category}`.toLowerCase().includes(q.toLowerCase()))

  function selectClient(id:string){
    const c=clients.find(x=>x.id===id)
    setF({...f,client_id:id,client_name:c?.client_name||'',customer_type:c?.client_type||'family',city:c?.city||'',devis_region:c?.city||'',devis_contact:c?.client_name||'',phone:c?.phone||'',email:c?.email||''})
  }

  function selectService(s:any){
    const label=s.variation_name?`${s.service_name} — ${s.variation_name}`:s.service_name
    setF({...f,service_category:s.category||'service',service_type:s.service_name||'',service_label:label,devis_object:label,unit_price:String(s.price||0),notes:[f.notes,s.description?`Service description: ${s.description}`:''].filter(Boolean).join('\n')})
  }

  async function save(){
    if(!f.client_name.trim()) return alert('Client name required')
    setSaving(true)

    const notes=[
      f.notes,
      '--- DEVIS TEMPLATE DATA ---',
      `Devis object: ${f.devis_object}`,
      `Devis contact: ${f.devis_contact || f.client_name}`,
      `Devis phone: ${f.phone}`,
      `Devis region: ${f.devis_region || f.city}`,
      `Program proposal: ${f.devis_program}`,
      `Session déroulement: ${f.devis_session}`,
      `Note devis: ${f.devis_note}`,
      `Service label: ${f.service_label}`
    ].join('\n')

    const res=await fetch('/api/sales-terminal/orders',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        client_id:f.client_id || null,
        client_name:f.client_name,
        customer_type:f.customer_type,
        city:f.city || f.devis_region,
        service_category:f.service_category,
        service_type:f.service_label || f.service_type,
        quantity:Number(f.quantity||1),
        unit_price:Number(f.unit_price||0),
        discount_amount:Number(f.discount||0),
        tax_amount:Number(f.tax||0),
        total_amount:total,
        payment_method:f.payment_method,
        payment_term:f.payment_term,
        payment_status:'unpaid',
        fulfillment_status:'not_started',
        status:'draft',
        next_action:'Create/send quote',
        notes
      })
    })

    const j=await res.json()
    setSaving(false)
    if(j.ok) window.location.href=`/sales/orders/${j.data.id}`
    else alert(j.message || 'Order creation failed')
  }

  return (
    <main style={{padding:32,background:'#f8fafc',minHeight:'100vh'}}>
      <section style={{padding:28,borderRadius:28,background:'linear-gradient(135deg,#020617,#111827,#1d4ed8)',color:'#fff',marginBottom:24}}>
        <p style={{fontWeight:900,color:'#bfdbfe'}}>CREATE ORDER · SERVICE SYNC · DEVIS READY</p>
        <h1 style={{fontSize:38,margin:'8px 0',color:'#fff'}}>Create a complete sales order</h1>
        <p style={{color:'#e2e8f0',fontWeight:700}}>{msg}</p>
        <Link href="/sales/orders" style={{display:'inline-block',marginTop:14,padding:'12px 14px',borderRadius:14,background:'#fff',color:'#0f172a',fontWeight:900,textDecoration:'none'}}>Back to Orders</Link>
      </section>

      <section style={{display:'grid',gridTemplateColumns:'1.35fr .65fr',gap:20}}>
        <div style={{display:'grid',gap:18}}>
          <Panel title="01 — Client">
            <Grid>
              <Field label="Existing client"><select style={input} value={f.client_id} onChange={e=>selectClient(e.target.value)}><option value="">Manual / select</option>{clients.map(c=><option key={c.id} value={c.id}>{c.client_name}</option>)}</select></Field>
              <Field label="Client name"><input style={input} value={f.client_name} onChange={e=>setF({...f,client_name:e.target.value,devis_contact:e.target.value})}/></Field>
              <Field label="Customer type"><input style={input} value={f.customer_type} onChange={e=>setF({...f,customer_type:e.target.value})}/></Field>
              <Field label="Phone"><input style={input} value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/></Field>
              <Field label="Email"><input style={input} value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></Field>
              <Field label="City / Region"><input style={input} value={f.city} onChange={e=>setF({...f,city:e.target.value,devis_region:e.target.value})}/></Field>
            </Grid>
          </Panel>

          <Panel title="02 — Services & Variations">
            <div style={{display:'grid',gridTemplateColumns:'1fr 150px',gap:10,marginBottom:12}}>
              <input style={input} value={q} onChange={e=>setQ(e.target.value)} placeholder="Search services / variations"/>
              <Link href="/services" style={{padding:12,background:'#0f172a',color:'#fff',borderRadius:12,textDecoration:'none',fontWeight:900,textAlign:'center'}}>Services</Link>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
              {visible.slice(0,12).map(s=><button key={s.id} onClick={()=>selectService(s)} style={{textAlign:'left',padding:12,borderRadius:14,border:'1px solid #e2e8f0',background:'#fff',color:'#0f172a',cursor:'pointer'}}><b>{s.service_name}</b><br/><span>{s.variation_name||'Standard'}</span><br/><small>{Number(s.price||0).toLocaleString()} MAD</small></button>)}
            </div>
            <Grid>
              <Field label="Service category"><input style={input} value={f.service_category} onChange={e=>setF({...f,service_category:e.target.value})}/></Field>
              <Field label="Service type"><input style={input} value={f.service_type} onChange={e=>setF({...f,service_type:e.target.value})}/></Field>
              <Field label="Service label for Devis"><input style={input} value={f.service_label} onChange={e=>setF({...f,service_label:e.target.value})}/></Field>
            </Grid>
          </Panel>

          <Panel title="03 — Pricing">
            <Grid>
              <Field label="Quantity"><input style={input} type="number" value={f.quantity} onChange={e=>setF({...f,quantity:e.target.value})}/></Field>
              <Field label="Unit price"><input style={input} type="number" value={f.unit_price} onChange={e=>setF({...f,unit_price:e.target.value})}/></Field>
              <Field label="Discount"><input style={input} type="number" value={f.discount} onChange={e=>setF({...f,discount:e.target.value})}/></Field>
              <Field label="Tax / fees"><input style={input} type="number" value={f.tax} onChange={e=>setF({...f,tax:e.target.value})}/></Field>
              <Field label="Payment method"><input style={input} value={f.payment_method} onChange={e=>setF({...f,payment_method:e.target.value})}/></Field>
              <Field label="Payment term"><input style={input} value={f.payment_term} onChange={e=>setF({...f,payment_term:e.target.value})}/></Field>
            </Grid>
          </Panel>

          <Panel title="04 — Devis Template Data">
            <Grid>
              <Field label="Objet Devis"><input style={input} value={f.devis_object} onChange={e=>setF({...f,devis_object:e.target.value})}/></Field>
              <Field label="Contact Devis"><input style={input} value={f.devis_contact} onChange={e=>setF({...f,devis_contact:e.target.value})}/></Field>
              <Field label="Région Devis"><input style={input} value={f.devis_region} onChange={e=>setF({...f,devis_region:e.target.value})}/></Field>
            </Grid>
            <Field label="Programme activités"><textarea style={{...input,minHeight:80}} value={f.devis_program} onChange={e=>setF({...f,devis_program:e.target.value})}/></Field>
            <Field label="Déroulement session"><textarea style={{...input,minHeight:80}} value={f.devis_session} onChange={e=>setF({...f,devis_session:e.target.value})}/></Field>
            <Field label="Notes"><textarea style={{...input,minHeight:90}} value={f.notes} onChange={e=>setF({...f,notes:e.target.value})}/></Field>
          </Panel>

          <button disabled={saving} onClick={save} style={{padding:16,border:0,borderRadius:16,background:'#0f172a',color:'#fff',fontWeight:950,fontSize:16,cursor:'pointer'}}>{saving?'Creating...':'Create Order & Open Edit Page'}</button>
        </div>

        <aside style={{display:'grid',gap:18,alignSelf:'start'}}>
          <Panel title="Live Total">
            <h2 style={{fontSize:34,color:'#0f172a'}}>{total.toLocaleString()} MAD</h2>
            <p style={{color:'#64748b',fontWeight:700}}>Price remains editable after service import.</p>
          </Panel>
          <Panel title="Checklist">
            <Check ok={!!f.client_name} label="Client"/>
            <Check ok={!!f.service_label || !!f.service_type} label="Service"/>
            <Check ok={total>0} label="Price"/>
            <Check ok={!!f.devis_object || !!f.service_label} label="Devis object"/>
          </Panel>
        </aside>
      </section>
    </main>
  )
}

function Panel({title,children}:{title:string,children:any}){return <section style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:22,padding:18}}><h2 style={{marginTop:0,color:'#0f172a'}}>{title}</h2>{children}</section>}
function Grid({children}:{children:any}){return <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:12}}>{children}</div>}
function Field({label,children}:{label:string,children:any}){return <label style={{display:'grid',gap:6,color:'#334155',fontWeight:900,fontSize:12,marginBottom:10}}>{label}{children}</label>}
function Check({ok,label}:{ok:boolean,label:string}){return <div style={{display:'flex',justifyContent:'space-between',padding:12,borderRadius:12,background:'#f8fafc',marginBottom:8,color:'#0f172a',fontWeight:800}}><span>{label}</span><span>{ok?'✅':'⚠️'}</span></div>}
const input={width:'100%',boxSizing:'border-box' as const,padding:12,border:'1px solid #cbd5e1',borderRadius:12,color:'#0f172a',background:'#fff',fontWeight:700}
