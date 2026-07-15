export const money = (a, c) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: c || 'USD' }).format(Number(a || 0));

export const fmt = (v) => new Intl.NumberFormat().format(Number(v || 0));

export const txt = (v) => (v == null || v === '' ? 'N/A' : String(v));

export const fmtDate = (v) => {
  const d = new Date(v || '');
  return isNaN(d.getTime()) ? txt(v) : d.toLocaleString();
};

export const fmtShort = (v) => {
  const d = new Date(v || '');
  return isNaN(d.getTime()) ? txt(v) : d.toLocaleDateString();
};

export function shortErr(v) {
  const m = txt(v);
  if (m.includes('shopifyPaymentsAccount') || m.includes('read_shopify_payments'))
    return 'Shopify Payments scope not granted.';
  if (m.toLowerCase().includes('access denied')) return 'Access denied: missing scope.';
  return m.length > 180 ? m.slice(0, 177) + '...' : m;
}

export function pillCls(v) {
  const n = String(v || '').toUpperCase();
  if (['ACTIVE', 'PAID', 'FULFILLED', 'CONNECTED', 'STOCKED', 'AVAILABLE'].includes(n)) return 'pill';
  if (['PENDING', 'PUBLIC', 'PARTIALLY_REFUNDED', 'PARTIALLY_FULFILLED', 'LOW', 'UNTRACKED', 'DRAFT'].includes(n))
    return 'pill warn';
  if (['INFO'].includes(n)) return 'pill info';
  return 'pill bad';
}

export function invLabel(v) {
  if (v.tracked === false) return 'Not tracked';
  const lvl = (v.inventoryLevels || [])[0];
  const base =
    v.inventoryQuantity == null
      ? v.available ? 'Available' : 'Unavailable'
      : `${fmt(v.inventoryQuantity)} total`;
  return lvl ? `${base} / ${lvl.available ?? '?'} at ${lvl.locationName}` : base;
}

export function stockState(v) {
  if (v.tracked === false) return 'untracked';
  const q = isFinite(+v.inventoryQuantity) ? +v.inventoryQuantity : null;
  if (q === 0) return 'out';
  if (q != null && q <= 5) return 'low';
  if (q != null) return 'stocked';
  return v.available ? 'available' : 'unavailable';
}

export const stockLbl = (v) =>
  ({ out: 'Out', low: 'Low', stocked: 'Stocked', available: 'Available', unavailable: 'Unavailable', untracked: 'Untracked' }[stockState(v)] || 'Unknown');

export const allWarnings = (p) => p?.warnings || p?.data?.diagnostics?.warnings || [];

export const dataHealth = (p) =>
  p.auth !== 'connected' ? 'Pending' : allWarnings(p).length ? 'Partial' : 'Healthy';

export function flatRows(prods) {
  return (prods || []).flatMap((p) => {
    const vs = p.variants?.length ? p.variants : [{ title: 'Default' }];
    return vs.map((v) => ({ p, v }));
  });
}

export function rowText(r) {
  return [r.p.title, r.p.handle, r.p.vendor, r.p.productType, r.p.status, r.v.title, r.v.sku]
    .map(txt)
    .join(' ')
    .toLowerCase();
}

export function clientId() {
  return crypto.randomUUID?.() ?? 'inv-' + Date.now();
}

export async function fetchJson<T = any>(url: string, opts: RequestInit = {}, ms = 20000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { ...opts, cache: opts.cache || 'no-store', signal: ctrl.signal });
    const ct = r.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      const body = await r.text();
      throw new Error(body.slice(0, 200) || `Request failed (${r.status})`);
    }
    const json = await r.json() as any;
    if (!r.ok || !json.success) throw new Error(json.error || `Request failed (${r.status})`);
    return json as T;
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Request timed out.');
    throw e;
  } finally {
    clearTimeout(t);
  }
}
