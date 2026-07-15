import AppShell from '@/app/components/erp/AppShell'
import { ServiceOSHeader, ServiceOSPanel, ServiceOSKpi, StatusBadge, ServiceOSPill } from '@/components/service-os/ServiceOSPrimitives'
import {
  calculateServicePrice,
  getServiceBlueprints,
  getServiceModules,
  getServiceRules,
} from '@/lib/service-os'

function toArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : []
}

function numberFrom(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function getPricingTotal(price: any): number {
  return numberFrom(price?.total, numberFrom(price?.finalPrice, numberFrom(price?.amount, numberFrom(price?.subtotal, 0))))
}

function getPricingBase(price: any): number {
  return numberFrom(price?.basePrice, numberFrom(price?.base, 450))
}

function getPricingModifiers(price: any): Array<{ label: string; amount: number }> {
  const raw = toArray<any>(price?.modifiers)
  if (raw.length) {
    return raw.map((item, index) => ({
      label: String(item?.label ?? item?.name ?? `Modifier ${index + 1}`),
      amount: numberFrom(item?.amount, numberFrom(item?.value, 0)),
    }))
  }
  return [
    { label: 'Urgent execution', amount: 90 },
    { label: 'Special-needs complexity', amount: 140 },
    { label: 'Transport coordination', amount: 60 },
  ]
}

export default function Page() {
  const blueprints = toArray<any>(getServiceBlueprints())
  const modules = toArray<any>(getServiceModules())
  const rules = toArray<any>(getServiceRules())

  const calculated = calculateServicePrice({
    city: 'Casablanca',
    urgent: true,
    night: false,
    transport: true,
    specialNeeds: true,
    complexity: 'high',
  }) as any

  const total = getPricingTotal(calculated)
  const base = getPricingBase(calculated)
  const modifiers = getPricingModifiers(calculated)
  const effectiveTotal = total || base + modifiers.reduce((sum, item) => sum + item.amount, 0)

  return (
    <AppShell title="Pricing Engine" subtitle="ServiceOS enterprise commercial intelligence" breadcrumbs={[{ label: 'Services', href: '/services' }, { label: 'Pricing Engine' }]}>
      <div style={{ display: 'grid', gap: 22 }}>
        <ServiceOSHeader
          eyebrow="ServiceOS Commercial Intelligence"
          title="Pricing Engine"
          subtitle="Dynamic pricing simulation connected to blueprints, modules, operational risk, transport, urgency, complexity and market expansion logic."
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }}>
          <ServiceOSKpi label="Blueprints" value={blueprints.length} helper="Service architectures" />
          <ServiceOSKpi label="Modules" value={modules.length} helper="Attachable offer layers" />
          <ServiceOSKpi label="Rules" value={rules.length} helper="Pricing and operations logic" />
          <ServiceOSKpi label="Sample total" value={`${effectiveTotal} MAD`} helper="Calculated scenario" tone="green" />
        </div>

        <ServiceOSPanel title="Production Pricing Scenario" subtitle="Casablanca urgent special-needs service with transport coordination and high complexity." tone="blue">
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatusBadge status="active" label="Dynamic pricing" />
              <StatusBadge status="high" label="High complexity" />
              <StatusBadge status="warning" label="Transport included" />
              <StatusBadge status="critical" label="Special-needs protocol" />
            </div>

            <div style={{ border: '1px solid #e5e7eb', borderRadius: 18, padding: 16, background: '#f8fafc' }}>
              <p style={{ margin: 0, color: '#64748b', fontWeight: 800 }}>Base commercial estimate</p>
              <p style={{ margin: '8px 0 0', fontSize: 32, fontWeight: 950, color: '#0f172a' }}>{base} MAD</p>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {modifiers.map((item) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eef2f7', paddingBottom: 8 }}>
                  <span style={{ color: '#334155', fontWeight: 750 }}>{item.label}</span>
                  <strong style={{ color: '#0f172a' }}>+{item.amount} MAD</strong>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 18, padding: 18, background: '#0f172a', color: '#fff' }}>
              <div>
                <p style={{ margin: 0, opacity: 0.76 }}>Final scenario price</p>
                <h3 style={{ margin: '6px 0 0', fontSize: 30 }}>{effectiveTotal} MAD</h3>
              </div>
              <ServiceOSPill tone="green">Margin-ready</ServiceOSPill>
            </div>
          </div>
        </ServiceOSPanel>

        <ServiceOSPanel title="Enterprise Commercial Logic" subtitle="This page is stabilized around the shared ServiceOS pricing engine contract." tone="purple">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }}>
            <ServiceOSKpi label="Urgency" value="Active" helper="Priority request surcharge enabled" />
            <ServiceOSKpi label="Complexity" value="High" helper="Advanced care configuration" />
            <ServiceOSKpi label="Market" value="Casa" helper="City-sensitive pricing scenario" />
          </div>
        </ServiceOSPanel>
      </div>
    </AppShell>
  )
}
