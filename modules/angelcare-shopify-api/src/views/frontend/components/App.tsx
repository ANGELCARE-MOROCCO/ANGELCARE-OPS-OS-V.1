import { useState, useEffect } from 'react';
import { StatusStrip } from './StatusStrip';
import { MetricsSection } from './MetricsSection';
import { OperationsPanel } from './panels/OperationsPanel';
import { TrafficPanel } from './panels/TrafficPanel';
import { CustomersPanel } from './panels/CustomersPanel';
import { PaymentsPanel } from './panels/PaymentsPanel';
import { CatalogHealthPanel } from './panels/CatalogHealthPanel';
import { InventoryAlertsPanel } from './panels/InventoryAlertsPanel';
import { CatalogMixPanel } from './panels/CatalogMixPanel';
import { TopInventoryPanel } from './panels/TopInventoryPanel';
import { ProductsTable } from './tables/ProductsTable';
import { OrdersPanel } from './tables/OrdersPanel';
import { LocationsWebhooksPanel } from './LocationsWebhooksPanel';
import { allWarnings, txt, fetchJson, clientId } from '../utils';

type DashboardPayload = any;
type LoadOptions = { days?: string; fresh?: boolean };

function SectionHead({ title }: { title: string }) {
  return (
    <div className="section-head">
      <span className="section-head-label">{title}</span>
      <div className="section-head-line" />
    </div>
  );
}

export function App({ shopDomain }: { shopDomain: string }) {
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [days, setDays]       = useState('30');

  async function load(opts: LoadOptions = {}) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ days: opts.days ?? days });
      if (opts.fresh) params.set('fresh', 'true');
      const p = await fetchJson<DashboardPayload>(`/api/dashboard/summary?${params}`);
      setPayload(p);
    } catch (e) {
      setError(e.message || 'Dashboard request failed.');
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  function handleDaysChange(d: string) {
    setDays(d);
    load({ days: d, fresh: true });
  }

  async function handleAdjust({ inventoryItemId, locationId, delta }: { inventoryItemId: string; locationId: string; delta: number }) {
    await fetchJson('/api/inventory/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inventoryItemId,
        locationId,
        delta,
        reason: 'correction',
        clientRequestId: clientId(),
      }),
    });
    load();
  }

  const data     = payload?.data || {};
  const currency = data.metrics?.currencyCode || data.shop?.currencyCode || 'USD';
  const warnings = allWarnings(payload || {});

  return (
    <main className="shell">

      {/* ── Topbar ─────────────────────────────────────────── */}
      <header className="topbar">
        <div className="brand">
          <div className="mark">AC</div>
          <div>
            <h1>AngelCare Commerce Console</h1>
            <p className="subhead">{shopDomain}</p>
          </div>
        </div>
        <div className="actions">
          <span className={loading ? 'pill warn' : 'pill'}>{loading ? 'Loading…' : 'Ready'}</span>
          <button className="primary" onClick={() => load({ fresh: true })} disabled={loading} type="button">
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <a className="button ghost" href="/install">Install OAuth</a>
          <a className="button ghost" href="/api/dashboard/summary">JSON</a>
        </div>
      </header>

      {/* ── Notices ────────────────────────────────────────── */}
      {(warnings.length > 0 || payload?.message) && (
        <section className="notice" style={{ marginTop: 20 }}>
          {payload?.message && <div>{payload.message}</div>}
          {warnings.map((w, i) => (
            <div key={i}><strong>{txt(w.section)}:</strong> {txt(w.error)}</div>
          ))}
        </section>
      )}

      {/* ── Overview ───────────────────────────────────────── */}
      <SectionHead title="Overview" />
      <StatusStrip payload={payload} />
      <MetricsSection payload={payload} />

      {/* ── Operations ─────────────────────────────────────── */}
      <SectionHead title="Operations" />
      <div className="panels-grid">
        <OperationsPanel payload={payload} />
        <TrafficPanel traffic={data.traffic} days={days} onChangeDays={handleDaysChange} />
      </div>

      {/* ── Commerce ───────────────────────────────────────── */}
      <SectionHead title="Commerce" />
      <div className="panels-grid">
        <CustomersPanel analytics={data.analytics} currency={currency} />
        <PaymentsPanel  analytics={data.analytics} currency={currency} />
      </div>

      {/* ── Catalog & Inventory ────────────────────────────── */}
      <SectionHead title="Catalog & Inventory" />
      <div className="panels-grid">
        <CatalogHealthPanel   insights={data.catalogInsights} />
        <InventoryAlertsPanel insights={data.catalogInsights} />
        <CatalogMixPanel      insights={data.catalogInsights} />
        <TopInventoryPanel    insights={data.catalogInsights} />
      </div>

      {/* ── Products ───────────────────────────────────────── */}
      <SectionHead title="Products" />
      <ProductsTable products={data.products || []} auth={payload?.auth} onAdjust={handleAdjust} />

      {/* ── Orders & Infrastructure ────────────────────────── */}
      <SectionHead title="Orders & Infrastructure" />
      <div className="panels-grid">
        <OrdersPanel            orders={data.orders}       currency={currency} />
        <LocationsWebhooksPanel locations={data.locations} webhookEvents={data.webhookEvents} />
      </div>

      {error && <div className="error" style={{ marginTop: 16 }}>{error}</div>}

    </main>
  );
}
