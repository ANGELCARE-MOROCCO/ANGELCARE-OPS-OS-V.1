import { MetricCard } from './MetricCard';
import { money, fmt } from '../utils';

export function MetricsSection({ payload }) {
  const data = payload?.data || {};
  const m = data.metrics || {};
  const a = data.analytics || {};
  const cust = a.customers?.data || {};
  const chk = a.checkouts?.data || {};
  const pay = a.payments?.data || {};
  const traffic = data.traffic || {};
  const ins = data.catalogInsights || {};
  const cur = m.currencyCode || data.shop?.currencyCode || 'USD';
  const payCur = pay.balanceCurrencyCode || pay.currencyCode || cur;
  const NA = 'N/A';

  return (
    <div>
      <div className="section-label">Revenue &amp; Orders</div>
      <section className="metric-grid">
        <MetricCard label="Revenue"         val={payload ? money(m.totalRevenue, cur) : NA}           icon="$"  iconCls="ig" />
        <MetricCard label="AOV"             val={payload ? money(m.averageOrderValue, cur) : NA}       icon="∅"  iconCls="ig" />
        <MetricCard label="Paid Orders"     val={payload ? fmt(m.paidOrdersCount) : NA}               icon="#"  iconCls="ib" accent="ab" />
        <MetricCard label="Customers"       val={payload ? fmt(cust.totalShown) : NA}                 icon="♥"  iconCls="ip" accent="ap" />
        <MetricCard label="Abandoned"       val={payload ? fmt(chk.openCount ?? chk.totalShown) : NA} icon="↩"  iconCls="ia" accent="aa" />
        <MetricCard label="Payment Balance" val={payload ? (pay.currentBalance != null ? money(pay.currentBalance, payCur) : NA) : NA} icon="≈" iconCls="ig" />
      </section>

      <div className="section-label">Catalog &amp; Inventory</div>
      <section className="metric-grid">
        <MetricCard label="Products"          val={payload ? fmt(m.productCount) : NA}                             icon="□"  iconCls="ib" accent="ab" />
        <MetricCard label="Variants"          val={payload ? fmt(m.variantCount) : NA}                             icon="≡"  iconCls="ib" accent="ab" />
        <MetricCard label="Tracked"           val={payload ? fmt(m.trackedVariantCount) : NA}                      icon="✔"  iconCls="ig" />
        <MetricCard label="Available"         val={payload ? fmt(m.availableVariants) : NA}                        icon="●"  iconCls="ig" />
        <MetricCard label="Coverage"          val={payload ? `${ins.coverage?.trackingCoveragePct ?? 0}%` : NA}    icon="%"  iconCls="ig" />
        <MetricCard label="Inventory Units"   val={payload ? fmt(m.inventoryUnits) : NA}                           icon="▦"  iconCls="ib" accent="ab" />
        <MetricCard label="Low Stock"         val={payload ? fmt(m.lowStockVariants) : NA}                         icon="△"  iconCls="ia" accent="aa" />
        <MetricCard label="Out of Stock"      val={payload ? fmt(m.outOfStockVariants) : NA}                       icon="∅"  iconCls="ir" accent="ar" />
      </section>

      <div className="section-label">Storefront Traffic</div>
      <section className="metric-grid">
        <MetricCard label="Page Views" val={payload ? fmt(traffic.pageViews) : NA}       icon="■" iconCls="ib" accent="ab" />
        <MetricCard label="Visitors"   val={payload ? fmt(traffic.uniqueVisitors) : NA}  icon="○" iconCls="ib" accent="ab" />
        <MetricCard label="Sessions"   val={payload ? fmt(traffic.sessions) : NA}        icon="∿" iconCls="ib" accent="ab" />
      </section>
    </div>
  );
}
