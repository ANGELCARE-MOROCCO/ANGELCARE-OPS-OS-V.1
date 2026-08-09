import { money, fmt, txt, shortErr } from '../../utils';

export function CustomersPanel({ analytics, currency }) {
  const cust = analytics?.customers || {};
  const cd = cust.data || {};
  const chkd = analytics?.checkouts?.data || {};
  const funnel = analytics?.funnel?.data || {};
  const cur = cd.currencyCode || currency;

  return (
    <section className="panel">
      <div className="panel-header">
        <div className="panel-hd">
          <div className="panel-icon pp">♥</div>
          <div className="panel-title">
            <h2>Customers &amp; Checkouts</h2>
            <div className="panel-note">
              {cust.ok ? `${fmt(cd.totalShown)} customers sampled` : shortErr(cust.error || 'Admin API required')}
            </div>
          </div>
        </div>
        <a className="button ghost" href="/api/analytics">JSON</a>
      </div>

      <div className="mini-list">
        <div className="mini-item">
          <strong>Repeat customers:</strong> {fmt(cd.repeatCustomers || 0)}<br />
          <strong>Email subscribers:</strong> {fmt(cd.marketingEmailSubscribers || 0)}<br />
          <strong>Avg customer value:</strong> {money(cd.averageCustomerValue || 0, cur)}<br />
          <strong>Recovery proxy:</strong>{' '}
          {funnel.checkoutRecoveryProxyRate != null ? `${funnel.checkoutRecoveryProxyRate}%` : 'N/A'}
        </div>

        <div className="mini-item">
          <strong>Open abandoned checkouts:</strong>{' '}
          {chkd.openCount != null ? fmt(chkd.openCount) : fmt(chkd.totalShown || 0)}<br />
          <strong>Open checkout value:</strong> {money(chkd.openValue || 0, chkd.currencyCode || currency)}
        </div>

        {(cd.topCustomers || []).slice(0, 5).map((c, i) => (
          <div className="mini-item" key={i}>
            <strong>{txt(c.displayName)}</strong>
            <br />
            <span className="muted">
              {txt(c.email)} · {fmt(c.numberOfOrders)} orders · {money(c.amountSpent, c.currencyCode || currency)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
