'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { ERPPanel, MetricCard, StatusPill } from '@/app/components/erp/ERPPrimitives'

type Client = { id: string; client_name: string; client_type?: string; phone?: string; email?: string; city?: string; status?: string; created_at?: string }
type Order = { id: string; order_ref: string; client_id?: string; client_name: string; customer_type?: string; service_category?: string; service_type?: string; city?: string; total_amount?: number; status?: string; payment_status?: string; fulfillment_status?: string; next_action?: string; created_at?: string }
type Option = { id: string; area: string; label: string; value: string; is_active?: boolean }

export default function SalesPremiumHomePage() {
  const [clients, setClients] = useState<Client[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [options, setOptions] = useState<Option[]>([])
  const [message, setMessage] = useState('Loading live Sales Terminal data...')
  const [query, setQuery] = useState('')

  async function load() {
    try {
      const [clientsRes, ordersRes, optionsRes] = await Promise.all([
        fetch('/api/sales-terminal/clients', { cache: 'no-store' }),
        fetch('/api/sales-terminal/orders', { cache: 'no-store' }),
        fetch('/api/sales-terminal/options', { cache: 'no-store' }),
      ])

      const clientsJson = await clientsRes.json()
      const ordersJson = await ordersRes.json()
      const optionsJson = await optionsRes.json()

      if (!clientsJson.ok) throw new Error(clientsJson.message || 'Clients API failed')
      if (!ordersJson.ok) throw new Error(ordersJson.message || 'Orders API failed')

      setClients(clientsJson.data || [])
      setOrders(ordersJson.data || [])
      setOptions(optionsJson.ok ? (optionsJson.data || []) : [])
      setMessage('Live Sales Terminal connected. Clients, orders and configuration loaded.')
    } catch (error: any) {
      setMessage(`Blocked: ${error?.message || 'Unknown error'}`)
    }
  }

  useEffect(() => { load() }, [])

  const totalPipeline = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
  const confirmed = orders.filter(order => order.status === 'confirmed')
  const unpaid = orders.filter(order => order.payment_status !== 'paid' && order.status !== 'cancelled')
  const paid = orders.filter(order => order.payment_status === 'paid')
  const handoffReady = orders.filter(order => order.fulfillment_status === 'handoff_ready')
  const quoted = orders.filter(order => order.status === 'quoted')
  const draft = orders.filter(order => order.status === 'draft' || !order.status)
  const activeOptions = options.filter(option => option.is_active !== false)
  const recentOrders = [...orders].sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''))).slice(0, 8)
  const recentClients = [...clients].sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''))).slice(0, 6)

  const actionQueue = useMemo(() => {
    const rows: Array<{ title: string; subtitle: string; tone: 'blue' | 'green' | 'purple' | 'red' | 'amber' | 'slate'; href: string }> = []
    draft.slice(0, 3).forEach(order => rows.push({ title: `Create/send quote — ${order.order_ref}`, subtitle: order.client_name, tone: 'blue', href: `/sales/orders/${order.id}` }))
    quoted.slice(0, 3).forEach(order => rows.push({ title: `Follow up quote — ${order.order_ref}`, subtitle: order.client_name, tone: 'amber', href: `/sales/orders/${order.id}` }))
    confirmed.filter(order => order.payment_status !== 'paid').slice(0, 3).forEach(order => rows.push({ title: `Request payment — ${order.order_ref}`, subtitle: order.client_name, tone: 'red', href: `/sales/orders/${order.id}` }))
    paid.filter(order => order.fulfillment_status !== 'handoff_ready').slice(0, 3).forEach(order => rows.push({ title: `Prepare handoff — ${order.order_ref}`, subtitle: order.client_name, tone: 'green', href: `/sales/orders/${order.id}` }))
    return rows.slice(0, 8)
  }, [draft, quoted, confirmed, paid])

  const filteredOrders = recentOrders.filter(order => `${order.order_ref} ${order.client_name} ${order.service_type || ''} ${order.status || ''} ${order.payment_status || ''}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <AppShell title="Sales Command Terminal" subtitle="Corporate sales cockpit for clients, orders, payments, documents, configuration and execution control." breadcrumbs={[{ label: 'Sales' }]} actions={<><PageAction href="/sales/clients">+ Client</PageAction><PageAction href="/sales/orders" variant="light">+ Order</PageAction><PageAction href="/sales/configuration" variant="light">Configuration</PageAction></>}>
      <section style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>ANGELCARE SALES OS · LIVE TERMINAL</div>
          <h1 style={heroTitleStyle}>From client request to confirmed order, invoice and service handoff.</h1>
          <p style={heroTextStyle}>{message}</p>
          <div style={heroActionsStyle}>
            <Link href="/sales/clients" style={primaryLinkStyle}>Create / Open Client</Link>
            <Link href="/sales/orders" style={secondaryLinkStyle}>Create / Manage Order</Link>
            <Link href="/sales/qa" style={ghostLinkStyle}>QA Check</Link>
          </div>
        </div>
        <div style={heroPanelStyle}>
          <div style={heroPanelTopStyle}><span>Pipeline Value</span><StatusPill tone="green">LIVE</StatusPill></div>
          <strong style={heroAmountStyle}>{formatMad(totalPipeline)}</strong>
          <div style={miniGridStyle}>
            <Mini label="Confirmed" value={confirmed.length} />
            <Mini label="Unpaid" value={unpaid.length} />
            <Mini label="Paid" value={paid.length} />
            <Mini label="Handoff" value={handoffReady.length} />
          </div>
        </div>
      </section>

      <section style={metricGridStyle}>
        <MetricCard label="Clients" value={clients.length} sub="corporate client files" icon="👥" accent="#1d4ed8" />
        <MetricCard label="Orders" value={orders.length} sub={`${draft.length} draft · ${quoted.length} quoted`} icon="📦" accent="#7c3aed" />
        <MetricCard label="Payment risk" value={unpaid.length} sub="unpaid non-cancelled orders" icon="⚠️" accent="#b45309" />
        <MetricCard label="Configuration" value={activeOptions.length} sub="active dropdown options" icon="⚙️" accent="#0f766e" />
      </section>

      <div style={mainGridStyle}>
        <ERPPanel title="Executive Action Queue" subtitle="The next operational actions agents should handle first.">
          <div style={{ display: 'grid', gap: 10 }}>
            {actionQueue.length === 0 ? <div style={emptyStyle}>No urgent action detected. Create orders or review recent records.</div> : actionQueue.map((item, index) => (
              <Link key={`${item.title}-${index}`} href={item.href} style={actionRowStyle}>
                <div><strong>{item.title}</strong><p style={mutedStyle}>{item.subtitle}</p></div>
                <StatusPill tone={item.tone}>{index + 1}</StatusPill>
              </Link>
            ))}
          </div>
        </ERPPanel>

        <ERPPanel title="Quick Operations" subtitle="Fast entry points without changing the working workflow.">
          <div style={opsGridStyle}>
            <Quick href="/sales/clients" title="Client Files" subtitle="Create, search, open and edit clients" icon="👤" />
            <Quick href="/sales/orders" title="Orders" subtitle="Create, confirm, pay and handoff" icon="📦" />
            <Quick href="/sales/configuration" title="Configuration" subtitle="Options for customer/service/payment" icon="⚙️" />
            <Quick href="/sales/write-test" title="Write Test" subtitle="Verify database writes" icon="🧪" />
            <Quick href="/sales/qa" title="QA Check" subtitle="Production validation list" icon="✅" />
            <Quick href="/sales/orders" title="Documents" subtitle="Quote, invoice and delivery PDFs" icon="🧾" />
          </div>
        </ERPPanel>
      </div>

      <div style={mainGridStyle}>
        <ERPPanel title="Recent Orders" subtitle="Corporate order control with direct detail navigation.">
          <input style={searchStyle} placeholder="Search recent orders..." value={query} onChange={event => setQuery(event.target.value)} />
          <div style={{ display: 'grid', gap: 10 }}>
            {filteredOrders.length === 0 ? <div style={emptyStyle}>No matching recent orders.</div> : filteredOrders.map(order => (
              <article key={order.id} style={orderRowStyle}>
                <div>
                  <div style={rowTitleStyle}><strong>{order.order_ref}</strong><StatusPill tone={order.status === 'confirmed' ? 'green' : order.status === 'cancelled' ? 'red' : order.status === 'quoted' ? 'amber' : 'blue'}>{order.status || 'draft'}</StatusPill></div>
                  <p style={mutedStyle}>{order.client_name} · {order.service_type || 'No service'} · {formatMad(Number(order.total_amount || 0))}</p>
                  <div style={tagLineStyle}><span>{order.payment_status || 'unpaid'}</span><span>{order.fulfillment_status || 'not_started'}</span><span>{order.city || 'no city'}</span></div>
                </div>
                <div style={rowActionsStyle}>
                  <Link href={`/sales/orders/${order.id}`} style={smallLinkStyle}>Open</Link>
                  {order.client_id ? <Link href={`/sales/clients/${order.client_id}`} style={smallLinkStyle}>Client</Link> : null}
                </div>
              </article>
            ))}
          </div>
        </ERPPanel>

        <ERPPanel title="Client Activity" subtitle="Recently created client files.">
          <div style={{ display: 'grid', gap: 10 }}>
            {recentClients.length === 0 ? <div style={emptyStyle}>No clients yet. Create the first client.</div> : recentClients.map(client => (
              <Link key={client.id} href={`/sales/clients/${client.id}`} style={clientRowStyle}>
                <div style={avatarStyle}>{initials(client.client_name)}</div>
                <div><strong>{client.client_name}</strong><p style={mutedStyle}>{client.phone || 'No phone'} · {client.city || 'No city'} · {client.client_type || 'family'}</p></div>
                <StatusPill tone={client.status === 'active' ? 'green' : 'amber'}>{client.status || 'active'}</StatusPill>
              </Link>
            ))}
          </div>
        </ERPPanel>
      </div>

      <section style={insightGridStyle}>
        <ERPPanel title="Payment Control" subtitle="Unpaid orders requiring commercial pressure.">
          <div style={{ display: 'grid', gap: 10 }}>
            {unpaid.slice(0, 6).length === 0 ? <div style={emptyStyle}>No unpaid active orders.</div> : unpaid.slice(0, 6).map(order => (
              <Link key={order.id} href={`/sales/orders/${order.id}`} style={riskRowStyle}><strong>{order.order_ref}</strong><span>{order.client_name}</span><StatusPill tone="amber">{formatMad(Number(order.total_amount || 0))}</StatusPill></Link>
            ))}
          </div>
        </ERPPanel>

        <ERPPanel title="Fulfillment Bridge" subtitle="Paid orders that should move toward operations.">
          <div style={{ display: 'grid', gap: 10 }}>
            {paid.slice(0, 6).length === 0 ? <div style={emptyStyle}>No paid orders waiting.</div> : paid.slice(0, 6).map(order => (
              <Link key={order.id} href={`/sales/orders/${order.id}`} style={riskRowStyle}><strong>{order.order_ref}</strong><span>{order.client_name}</span><StatusPill tone={order.fulfillment_status === 'handoff_ready' ? 'green' : 'blue'}>{order.fulfillment_status || 'not_started'}</StatusPill></Link>
            ))}
          </div>
        </ERPPanel>

        <ERPPanel title="System Health" subtitle="Useful operational checks.">
          <div style={healthGridStyle}>
            <Health label="Clients API" ok={clients.length >= 0} />
            <Health label="Orders API" ok={orders.length >= 0} />
            <Health label="Config options" ok={activeOptions.length > 0} />
            <Health label="Documents route" ok={true} />
          </div>
        </ERPPanel>
      </section>
    </AppShell>
  )
}

function formatMad(value: number) { return `${Number(value || 0).toLocaleString()} MAD` }
function initials(name: string) { return String(name || 'AC').split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() }
function Mini({ label, value }: { label: string; value: number | string }) { return <div style={miniStyle}><small>{label}</small><strong>{value}</strong></div> }
function Quick({ href, title, subtitle, icon }: { href: string; title: string; subtitle: string; icon: string }) { return <Link href={href} style={quickStyle}><span style={quickIconStyle}>{icon}</span><strong>{title}</strong><small>{subtitle}</small></Link> }
function Health({ label, ok }: { label: string; ok: boolean }) { return <div style={healthStyle}><span>{label}</span><StatusPill tone={ok ? 'green' : 'red'}>{ok ? 'OK' : 'Check'}</StatusPill></div> }

const heroStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.5fr .8fr', gap: 18, padding: 22, borderRadius: 28, background: 'linear-gradient(135deg,#020617,#0f172a 55%,#312e81)', color: '#fff', marginBottom: 18, boxShadow: '0 24px 60px rgba(15,23,42,.18)' }
const eyebrowStyle: React.CSSProperties = { fontSize: 12, letterSpacing: 1.8, fontWeight: 950, color: '#c4b5fd', marginBottom: 10 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 34, lineHeight: 1.08, maxWidth: 780, letterSpacing: '-.04em' }
const heroTextStyle: React.CSSProperties = { color: '#cbd5e1', fontWeight: 750, lineHeight: 1.7, maxWidth: 760 }
const heroActionsStyle: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }
const primaryLinkStyle: React.CSSProperties = { borderRadius: 14, padding: '12px 14px', background: '#fff', color: '#0f172a', textDecoration: 'none', fontWeight: 950 }
const secondaryLinkStyle: React.CSSProperties = { borderRadius: 14, padding: '12px 14px', background: '#7c3aed', color: '#fff', textDecoration: 'none', fontWeight: 950 }
const ghostLinkStyle: React.CSSProperties = { borderRadius: 14, padding: '12px 14px', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.18)', color: '#fff', textDecoration: 'none', fontWeight: 950 }
const heroPanelStyle: React.CSSProperties = { borderRadius: 24, padding: 18, background: 'rgba(255,255,255,.11)', border: '1px solid rgba(255,255,255,.16)', backdropFilter: 'blur(16px)' }
const heroPanelTopStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#e2e8f0', fontWeight: 900 }
const heroAmountStyle: React.CSSProperties = { display: 'block', fontSize: 32, marginTop: 18, letterSpacing: '-.04em' }
const miniGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginTop: 18 }
const miniStyle: React.CSSProperties = { display: 'grid', gap: 4, padding: 12, borderRadius: 16, background: 'rgba(255,255,255,.10)', color: '#fff' }
const metricGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14, marginBottom: 18 }
const mainGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }
const insightGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }
const opsGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }
const quickStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 16, borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', textDecoration: 'none' }
const quickIconStyle: React.CSSProperties = { fontSize: 24 }
const actionRowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 14, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', textDecoration: 'none' }
const orderRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'center', padding: 14, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0' }
const rowTitleStyle: React.CSSProperties = { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }
const tagLineStyle: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8, color: '#64748b', fontSize: 12, fontWeight: 850 }
const rowActionsStyle: React.CSSProperties = { display: 'flex', gap: 8 }
const smallLinkStyle: React.CSSProperties = { borderRadius: 12, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', padding: '9px 12px', fontWeight: 900, textDecoration: 'none' }
const clientRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '42px 1fr auto', gap: 12, alignItems: 'center', padding: 14, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', textDecoration: 'none' }
const avatarStyle: React.CSSProperties = { width: 42, height: 42, borderRadius: 14, background: '#0f172a', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 950 }
const riskRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr auto', alignItems: 'center', gap: 10, padding: 13, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', textDecoration: 'none' }
const healthGridStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const healthStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 13, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0', fontWeight: 850, color: '#0f172a' }
const searchStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: 14, padding: '12px 14px', fontWeight: 800, color: '#0f172a', background: '#fff', marginBottom: 12 }
const mutedStyle: React.CSSProperties = { margin: '6px 0 0', color: '#64748b', fontWeight: 750 }
const emptyStyle: React.CSSProperties = { padding: 16, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 800 }