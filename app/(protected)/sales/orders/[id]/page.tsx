'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { ERPPanel, MetricCard, StatusPill } from '@/app/components/erp/ERPPrimitives'

type Order = { id:string; order_ref:string; client_name:string; service_type?:string; city?:string; quantity?:number; unit_price?:number; discount_amount?:number; tax_amount?:number; total_amount?:number; status?:string; payment_status?:string; fulfillment_status?:string; payment_method?:string; payment_term?:string; next_action?:string; notes?:string; cancellation_reason?:string }
type Doc = { id:string; document_ref:string; document_type:string; status?:string; created_at?:string }
type Note = { id:string; note_type?:string; message:string; created_at?:string }

export default function SalesOrderDetailPage() {
  const params = useParams<{id:string}>()
  const id = params.id
  const [order, setOrder] = useState<Order | null>(null)
  const [documents, setDocuments] = useState<Doc[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [message, setMessage] = useState('Loading order...')
  const [edit, setEdit] = useState(false)
  const [note, setNote] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [form, setForm] = useState({ client_name:'', city:'', service_type:'', quantity:'1', unit_price:'0', discount_amount:'0', tax_amount:'0', payment_method:'', payment_term:'', next_action:'', notes:'' })

  const total = useMemo(() => Math.max(0, Number(form.quantity||0)*Number(form.unit_price||0)-Number(form.discount_amount||0)+Number(form.tax_amount||0)), [form])

  async function load() {
    const res = await fetch(`/api/sales-terminal/order-detail?id=${id}`, { cache:'no-store' })
    const json = await res.json()
    if (!json.ok) return setMessage(`Blocked: ${json.message}`)
    setOrder(json.order); setDocuments(json.documents || []); setNotes(json.notes || [])
    setForm({
      client_name: json.order.client_name || '', city: json.order.city || '', service_type: json.order.service_type || '', quantity: String(json.order.quantity || 1), unit_price: String(json.order.unit_price || 0), discount_amount: String(json.order.discount_amount || 0), tax_amount: String(json.order.tax_amount || 0), payment_method: json.order.payment_method || '', payment_term: json.order.payment_term || '', next_action: json.order.next_action || '', notes: json.order.notes || ''
    })
    setMessage(`Loaded ${json.order.order_ref}.`)
  }
  useEffect(() => { if (id) load() }, [id])

  async function patch(updates: Record<string, unknown>) {
    if (!order) return
    const res = await fetch('/api/sales-terminal/order-detail', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: order.id, ...updates }) })
    const json = await res.json()
    if (!json.ok) return setMessage(`Update failed: ${json.message}`)
    setMessage('Saved.'); await load()
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    await patch({ ...form, quantity:Number(form.quantity||1), unit_price:Number(form.unit_price||0), discount_amount:Number(form.discount_amount||0), tax_amount:Number(form.tax_amount||0), total_amount: total })
    setEdit(false)
  }

  async function createDoc(type: string) {
    if (!order) return
    if (type === 'invoice' && order.status !== 'confirmed') return setMessage('Safety guard: confirm order before invoice.')
    if (type === 'delivery' && !['confirmed','delivered'].includes(order.status || '')) return setMessage('Safety guard: confirm order before delivery notice.')
    const res = await fetch('/api/sales-terminal/documents', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ order_id: order.id, document_type: type }) })
    const json = await res.json()
    if (!json.ok) return setMessage(`Document failed: ${json.message}`)
    setMessage(`${type} created.`); window.open(`/api/sales-terminal/print?id=${json.data.id}`, '_blank'); await load()
  }

  async function addNote(e: FormEvent) {
    e.preventDefault(); if (!order || !note.trim()) return
    const res = await fetch('/api/sales-terminal/order-detail', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'add_note', order_id: order.id, note_type:'agent_note', message: note }) })
    const json = await res.json(); if (!json.ok) return setMessage(`Note failed: ${json.message}`)
    setNote(''); setMessage('Note added.'); await load()
  }

  async function cancelOrder() {
    if (!order) return
    if (!cancelReason.trim()) return setMessage('Cancellation reason is required.')
    const res = await fetch('/api/sales-terminal/order-detail', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'cancel_order', order_id: order.id, cancellation_reason: cancelReason }) })
    const json = await res.json(); if (!json.ok) return setMessage(`Cancel failed: ${json.message}`)
    setCancelReason(''); setMessage('Order cancelled.'); await load()
  }

  if (!order) return <AppShell title="Order Detail" subtitle={message} breadcrumbs={[{label:'Sales',href:'/sales'},{label:'Orders',href:'/sales/orders'}]}><ERPPanel title="Loading" subtitle={message}><Link href="/sales/orders">Back to orders</Link></ERPPanel></AppShell>

  return <AppShell title={`Order ${order.order_ref}`} subtitle="Detail, edit, documents, notes, cancellation and safety controls." breadcrumbs={[{label:'Sales',href:'/sales'},{label:'Orders',href:'/sales/orders'},{label:order.order_ref}]} actions={<PageAction href="/sales/orders">Back to Orders</PageAction>}>
    <section style={metricGrid}><MetricCard label="Total" value={`${Number(order.total_amount||0).toLocaleString()} MAD`} sub="value" icon="💰" accent="#b45309"/><MetricCard label="Status" value={order.status || 'draft'} sub="order" icon="📦" accent="#7c3aed"/><MetricCard label="Payment" value={order.payment_status || 'unpaid'} sub="state" icon="💳" accent="#0f766e"/><MetricCard label="Documents" value={documents.length} sub="history" icon="🧾" accent="#1d4ed8"/></section>
    <ERPPanel title="Operational Control" subtitle={message}><div style={buttons}><button style={btn} onClick={()=>setEdit(!edit)}>{edit?'Close Edit':'Edit Order'}</button><button style={btn} onClick={()=>patch({status:'quoted'})}>Mark Quoted</button><button style={btn} onClick={()=>patch({status:'confirmed'})}>Confirm</button><button style={btn} onClick={()=>patch({payment_status:'paid'})}>Mark Paid</button><button style={btn} onClick={()=>patch({fulfillment_status:'handoff_ready'})}>Handoff Ready</button><button style={btn} onClick={()=>createDoc('quote')}>Quote PDF</button><button style={btn} onClick={()=>createDoc('invoice')}>Invoice PDF</button><button style={btn} onClick={()=>createDoc('delivery')}>Delivery PDF</button></div></ERPPanel>
    {edit ? <ERPPanel title="Edit Order" subtitle="Saves to real database."><form onSubmit={save} style={formGrid}>{Object.entries(form).map(([k,v]) => k === 'notes' ? <textarea key={k} style={{...input, gridColumn:'1/-1', minHeight:90}} placeholder={k} value={v} onChange={e=>setForm({...form,[k]:e.target.value})}/> : <input key={k} style={input} placeholder={k} value={v} onChange={e=>setForm({...form,[k]:e.target.value})}/>) }<div style={totalBox}>Total: <strong>{total.toLocaleString()} MAD</strong></div><button style={primary}>Save Changes</button></form></ERPPanel> : null}
    <div style={twoCol}><ERPPanel title="Order Summary" subtitle="Commercial facts."><div style={{display:'grid',gap:10}}><Info label="Client" value={order.client_name}/><Info label="Service" value={order.service_type || '-'}/><Info label="City" value={order.city || '-'}/><Info label="Next Action" value={order.next_action || '-'}/><Info label="Cancellation" value={order.cancellation_reason || '-'}/></div></ERPPanel><ERPPanel title="Cancel with Reason" subtitle="Reason is mandatory."><textarea style={{...input,width:'100%',boxSizing:'border-box',minHeight:90}} value={cancelReason} onChange={e=>setCancelReason(e.target.value)} placeholder="Cancellation reason..."/><button style={danger} onClick={cancelOrder}>Cancel Order</button></ERPPanel></div>
    <div style={twoCol}><ERPPanel title="Document History" subtitle="Generated documents."><div style={{display:'grid',gap:10}}>{documents.length===0?<div style={empty}>No documents yet.</div>:documents.map(d=><article key={d.id} style={row}><div><strong>{d.document_ref}</strong><p style={muted}>{d.document_type} · {d.status || 'issued'}</p></div><a style={linkBtn} href={`/api/sales-terminal/print?id=${d.id}`} target="_blank">Print</a></article>)}</div></ERPPanel><ERPPanel title="Timeline / Notes" subtitle="Call, WhatsApp, payment and manager notes."><form onSubmit={addNote} style={{display:'grid',gap:10,marginBottom:12}}><textarea style={{...input,minHeight:80}} value={note} onChange={e=>setNote(e.target.value)} placeholder="Add note..."/><button style={primary}>Add Note</button></form><div style={{display:'grid',gap:10}}>{notes.length===0?<div style={empty}>No notes yet.</div>:notes.map(n=><article key={n.id} style={noteStyle}><strong>{n.note_type || 'note'}</strong><p style={muted}>{n.message}</p><small>{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</small></article>)}</div></ERPPanel></div>
  </AppShell>
}

function Info({label,value}:{label:string;value:string}) { return <div style={info}><small>{label}</small><strong>{value}</strong></div> }
const metricGrid:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:14,marginBottom:18}; const buttons:React.CSSProperties={display:'flex',flexWrap:'wrap',gap:10}; const btn:React.CSSProperties={borderRadius:12,border:'1px solid #cbd5e1',background:'#fff',color:'#0f172a',padding:'10px 12px',fontWeight:900,cursor:'pointer'}; const primary:React.CSSProperties={border:0,borderRadius:14,padding:'13px 16px',background:'#0f172a',color:'#fff',fontWeight:950,cursor:'pointer'}; const danger:React.CSSProperties={marginTop:10,borderRadius:14,border:'1px solid #fecaca',background:'#fee2e2',color:'#991b1b',padding:'13px 16px',fontWeight:950,cursor:'pointer'}; const formGrid:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:12}; const input:React.CSSProperties={border:'1px solid #cbd5e1',borderRadius:14,padding:'12px 14px',fontWeight:750,color:'#0f172a',background:'#fff'}; const totalBox:React.CSSProperties={display:'flex',alignItems:'center',borderRadius:14,padding:'12px 14px',background:'#f8fafc',border:'1px solid #e2e8f0',fontWeight:850,color:'#0f172a'}; const twoCol:React.CSSProperties={display:'grid',gridTemplateColumns:'1fr 1fr',gap:18,marginTop:18}; const row:React.CSSProperties={display:'flex',justifyContent:'space-between',alignItems:'center',gap:14,padding:14,borderRadius:16,border:'1px solid #e2e8f0',background:'#f8fafc'}; const linkBtn:React.CSSProperties={...btn,textDecoration:'none'}; const muted:React.CSSProperties={margin:'6px 0 0',color:'#64748b',fontWeight:750}; const empty:React.CSSProperties={padding:16,borderRadius:16,background:'#f8fafc',border:'1px solid #e2e8f0',color:'#64748b',fontWeight:800}; const noteStyle:React.CSSProperties={display:'grid',gap:4,padding:12,borderRadius:14,background:'#f8fafc',border:'1px solid #e2e8f0',color:'#0f172a'}; const info:React.CSSProperties={display:'grid',gap:5,padding:12,borderRadius:14,background:'#f8fafc',border:'1px solid #e2e8f0',color:'#0f172a'};
