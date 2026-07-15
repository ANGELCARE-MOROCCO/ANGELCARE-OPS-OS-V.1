'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Download,
  ExternalLink,
  LineChart,
  Loader2,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  ShieldCheck,
  Store,
  Users,
  Webhook,
} from 'lucide-react';

type AnyRecord = Record<string, any>;

type DashboardPayload = {
  success?: boolean;
  source?: string;
  auth?: string;
  message?: string;
  installUrl?: string;
  data?: AnyRecord;
  warnings?: Array<{ section?: string; error?: string }>;
};

const API_BASE = '/shopify/api';

function asArray<T = AnyRecord>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function formatMoney(value: unknown, currency = 'USD') {
  const amount = Number(value || 0);
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

function formatNumber(value: unknown) {
  return new Intl.NumberFormat().format(Number(value || 0));
}

function text(value: unknown, fallback = 'N/A') {
  return value === null || value === undefined || value === '' ? fallback : String(value);
}

function dateShort(value: unknown) {
  const date = new Date(String(value || ''));
  return Number.isNaN(date.getTime()) ? text(value) : date.toLocaleDateString();
}

function statusClass(value: unknown) {
  const normalized = String(value || '').toLowerCase();
  if (['connected', 'active', 'paid', 'fulfilled', 'healthy', 'stocked', 'available'].includes(normalized)) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  if (['pending', 'partial', 'low', 'draft', 'public', 'partially_fulfilled'].includes(normalized)) {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }
  return 'border-rose-200 bg-rose-50 text-rose-700';
}

function stockState(variant: AnyRecord) {
  if (variant?.tracked === false) return 'Untracked';
  const quantity = Number(variant?.inventoryQuantity);
  if (Number.isFinite(quantity)) {
    if (quantity <= 0) return 'Out';
    if (quantity <= 5) return 'Low';
    return 'Stocked';
  }
  return variant?.available ? 'Available' : 'Unavailable';
}

function flattenProducts(products: AnyRecord[]) {
  return products.flatMap((product) => {
    const variants = asArray<AnyRecord>(product.variants).length ? asArray<AnyRecord>(product.variants) : [{ title: 'Default' }];
    return variants.map((variant) => ({ product, variant }));
  });
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[2rem] border border-slate-200 bg-white/95 p-5 shadow-sm ${className}`}>{children}</section>;
}

function Pill({ children, value }: { children: React.ReactNode; value?: unknown }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(value ?? children)}`}>
      {children}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string; hint: string }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{hint}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-700">
          <Icon size={20} />
        </div>
      </div>
    </Card>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">{label}</div>;
}

export default function ShopifyCommerceDashboard() {
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState('30');

  async function load(options: { fresh?: boolean; nextDays?: string } = {}) {
    const initial = !payload;
    setError(null);
    initial ? setLoading(true) : setRefreshing(true);

    try {
      const params = new URLSearchParams({ days: options.nextDays || days });
      if (options.fresh) params.set('fresh', 'true');
      const response = await fetch(`${API_BASE}/dashboard/summary?${params.toString()}`, { cache: 'no-store' });
      const json = (await response.json()) as DashboardPayload;
      if (!response.ok || json.success === false) {
        throw new Error(json.message || (json as AnyRecord).error || 'Shopify dashboard request failed.');
      }
      setPayload(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Shopify dashboard request failed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = payload?.data || {};
  const metrics = data.metrics || {};
  const shop = data.shop || {};
  const analytics = data.analytics || {};
  const catalogInsights = data.catalogInsights || {};
  const products = asArray<AnyRecord>(data.products);
  const orders = asArray<AnyRecord>(data.orders);
  const customers = asArray<AnyRecord>(analytics.customers || data.customers);
  const webhooks = asArray<AnyRecord>(data.webhookEvents);
  const locations = asArray<AnyRecord>(data.locations);
  const warnings = asArray<{ section?: string; error?: string }>(payload?.warnings || data.diagnostics?.warnings);
  const currency = metrics.currencyCode || shop.currencyCode || 'USD';
  const productRows = useMemo(() => flattenProducts(products).slice(0, 12), [products]);
  const auth = payload?.auth || 'pending';

  const revenue = metrics.totalRevenue ?? metrics.revenue ?? analytics.revenue?.total ?? 0;
  const orderCount = metrics.ordersCount ?? metrics.orderCount ?? orders.length;
  const productCount = metrics.productsCount ?? metrics.productCount ?? products.length;
  const customerCount = metrics.customersCount ?? metrics.customerCount ?? customers.length;

  function changeDays(nextDays: string) {
    setDays(nextDays);
    load({ fresh: true, nextDays });
  }

  return (
    <main className="min-h-screen bg-[#f6f7f4] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1540px] space-y-6">
        <section className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-slate-950 text-white shadow-xl">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.35fr_0.65fr] lg:p-8">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.22em] text-emerald-100">
                <Store size={14} /> Native AngelCare Commerce Workspace
              </div>
              <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
                Shopify dashboard inside AngelCare OPSOS
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                This page runs inside <strong>localhost:3000</strong> and calls the in-app Shopify API bridge. No separate dev server is required for the dashboard UI.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => load({ fresh: true })}
                  disabled={loading || refreshing}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:bg-emerald-50 disabled:opacity-60"
                >
                  {refreshing || loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                  Refresh live data
                </button>
                <a href="/shopify/install" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/15">
                  Install / reconnect OAuth <ExternalLink size={16} />
                </a>
                <a href={`${API_BASE}/dashboard/summary`} className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/15">
                  Open JSON <ChevronRight size={16} />
                </a>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Connection</p>
                  <p className="mt-2 text-2xl font-black">{text(shop.name || shop.myshopifyDomain || shop.domain || 'Shopify store')}</p>
                </div>
                <Pill value={auth}>{auth}</Pill>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-slate-400">Domain</p>
                  <p className="mt-1 truncate font-bold">{text(shop.myshopifyDomain || shop.domain)}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-slate-400">Currency</p>
                  <p className="mt-1 font-bold">{currency}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-slate-400">Source</p>
                  <p className="mt-1 truncate font-bold">{text(payload?.source)}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-slate-400">Health</p>
                  <p className="mt-1 font-bold">{warnings.length ? 'Partial' : auth === 'connected' ? 'Healthy' : 'Pending'}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <Card className="border-rose-200 bg-rose-50">
            <div className="flex gap-3 text-rose-800">
              <AlertTriangle className="mt-0.5" size={20} />
              <div>
                <p className="font-black">Shopify bridge needs attention</p>
                <p className="mt-1 text-sm">{error}</p>
                <p className="mt-2 text-sm">Check <code>.env.local</code> for SHOPIFY_SHOP_DOMAIN, SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET, and SHOPIFY_ACCESS_TOKEN, then restart <code>npm run dev</code>.</p>
              </div>
            </div>
          </Card>
        )}

        {warnings.length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <div className="flex gap-3 text-amber-800">
              <AlertTriangle className="mt-0.5" size={20} />
              <div>
                <p className="font-black">Partial Shopify data</p>
                <div className="mt-2 space-y-1 text-sm">
                  {warnings.map((warning, index) => (
                    <p key={`${warning.section}-${index}`}><strong>{text(warning.section, 'section')}:</strong> {text(warning.error)}</p>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={LineChart} label="Revenue" value={formatMoney(revenue, currency)} hint={`Last ${days} days / available Shopify data`} />
          <MetricCard icon={ShoppingBag} label="Orders" value={formatNumber(orderCount)} hint="Live Admin API order flow" />
          <MetricCard icon={Boxes} label="Products" value={formatNumber(productCount)} hint="Catalog and inventory visibility" />
          <MetricCard icon={Users} label="Customers" value={formatNumber(customerCount)} hint="Customer intelligence layer" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Operations command</p>
                <h2 className="mt-2 text-2xl font-black">Commerce readiness</h2>
              </div>
              <select
                value={days}
                onChange={(event) => changeDays(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none"
              >
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
              </select>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Authentication', value: auth, Icon: ShieldCheck },
                { label: 'Catalog health', value: warnings.length ? 'partial' : 'healthy', Icon: PackageCheck },
                { label: 'Webhook events', value: `${webhooks.length} recent`, Icon: Webhook },
                { label: 'Locations', value: `${locations.length} synced`, Icon: Activity },
              ].map(({ label, value, Icon }) => (
                <div key={label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-600">{label}</p>
                      <p className="mt-1 text-lg font-black text-slate-950">{String(value)}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3 text-slate-700 shadow-sm"><Icon size={18} /></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Orders</p>
                <h2 className="mt-2 text-2xl font-black">Latest transactions</h2>
              </div>
              <ShoppingBag className="text-slate-400" />
            </div>
            <div className="mt-5 space-y-3">
              {orders.slice(0, 6).map((order, index) => (
                <div key={order.id || order.name || index} className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-black text-slate-950">{text(order.name || order.orderNumber || order.id, `Order ${index + 1}`)}</p>
                    <p className="mt-1 text-sm text-slate-500">{dateShort(order.createdAt || order.processedAt)} · {text(order.customer?.displayName || order.email || order.customerEmail, 'Customer pending')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black">{formatMoney(order.totalPrice || order.currentTotalPrice || order.total, currency)}</p>
                    <Pill value={order.displayFinancialStatus || order.financialStatus}>{text(order.displayFinancialStatus || order.financialStatus || 'status')}</Pill>
                  </div>
                </div>
              ))}
              {!orders.length && <EmptyState label={loading ? 'Loading Shopify orders…' : 'No orders returned yet. Connect OAuth or check Admin API scopes.'} />}
            </div>
          </Card>
        </div>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Catalog & inventory</p>
              <h2 className="mt-2 text-2xl font-black">Live product control</h2>
            </div>
            <a href={`${API_BASE}/products.csv`} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
              <Download size={16} /> Export CSV
            </a>
          </div>
          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
            <div className="grid grid-cols-[1.3fr_0.7fr_0.6fr_0.5fr] bg-slate-100 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              <span>Product</span><span>Variant / SKU</span><span>Stock</span><span className="text-right">Price</span>
            </div>
            <div className="divide-y divide-slate-200 bg-white">
              {productRows.map(({ product, variant }, index) => (
                <div key={`${product.id || product.handle}-${variant.id || variant.sku || index}`} className="grid grid-cols-[1.3fr_0.7fr_0.6fr_0.5fr] gap-3 px-4 py-4 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-black text-slate-950">{text(product.title)}</p>
                    <p className="mt-1 truncate text-slate-500">{text(product.vendor)} · {text(product.productType)} · {text(product.status)}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold">{text(variant.title)}</p>
                    <p className="mt-1 truncate text-slate-500">{text(variant.sku)}</p>
                  </div>
                  <div><Pill value={stockState(variant)}>{stockState(variant)} · {text(variant.inventoryQuantity, '?')}</Pill></div>
                  <div className="text-right font-black">{formatMoney(variant.price || product.priceRange?.minVariantPrice?.amount, currency)}</div>
                </div>
              ))}
              {!productRows.length && <div className="p-4"><EmptyState label={loading ? 'Loading catalog…' : 'No products returned yet.'} /></div>}
            </div>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card>
            <div className="flex items-center gap-3"><BarChart3 className="text-slate-400" /><h2 className="text-xl font-black">Catalog insights</h2></div>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Low stock</span><strong>{formatNumber(catalogInsights.lowStockCount || catalogInsights.lowStock?.length)}</strong></div>
              <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Out of stock</span><strong>{formatNumber(catalogInsights.outOfStockCount || catalogInsights.outOfStock?.length)}</strong></div>
              <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Tracked variants</span><strong>{formatNumber(catalogInsights.trackedVariants || catalogInsights.trackedVariantCount)}</strong></div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3"><Users className="text-slate-400" /><h2 className="text-xl font-black">Customers</h2></div>
            <div className="mt-5 space-y-3">
              {customers.slice(0, 5).map((customer, index) => (
                <div key={customer.id || index} className="rounded-2xl bg-slate-50 p-3 text-sm">
                  <p className="font-black">{text(customer.displayName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim(), 'Customer')}</p>
                  <p className="mt-1 text-slate-500">{text(customer.email)} · {formatMoney(customer.amountSpent?.amount || customer.totalSpent, currency)}</p>
                </div>
              ))}
              {!customers.length && <EmptyState label="No customer data returned yet." />}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3"><CheckCircle2 className="text-slate-400" /><h2 className="text-xl font-black">Infrastructure</h2></div>
            <div className="mt-5 space-y-3">
              {locations.slice(0, 4).map((location, index) => (
                <div key={location.id || index} className="rounded-2xl bg-slate-50 p-3 text-sm">
                  <p className="font-black">{text(location.name)}</p>
                  <p className="mt-1 text-slate-500">{text(location.city || location.address?.city)} · {text(location.country || location.address?.country)}</p>
                </div>
              ))}
              {!locations.length && <EmptyState label="No locations returned yet." />}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
