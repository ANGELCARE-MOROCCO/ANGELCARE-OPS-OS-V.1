import { money, fmt, txt, shortErr, fmtDate } from '../../utils';

export function PaymentsPanel({ analytics, currency }) {
  const pay = analytics?.payments || {};
  const pd = pay.data || {};
  const issues = analytics?.issues || [];
  const cur = pd.balanceCurrencyCode || pd.currencyCode || currency;

  return (
    <section className="panel">
      <div className="panel-header">
        <div className="panel-hd">
          <div className="panel-icon pg">$</div>
          <div className="panel-title">
            <h2>Payments</h2>
            <div className="panel-note">
              {pay.ok ? `${fmt(pd.payoutsShown)} payouts shown` : shortErr(pay.error || 'Shopify Payments scopes required')}
            </div>
          </div>
        </div>
        <a className="button ghost" href="/api/payments">JSON</a>
      </div>

      <div className="mini-list">
        {(pd.currentBalance != null || pd.payoutsShown) && (
          <div className="mini-item">
            <strong>Current balance:</strong> {pd.currentBalance != null ? money(pd.currentBalance, cur) : 'N/A'}<br />
            <strong>Scheduled payouts:</strong> {money(pd.scheduledPayoutValue || 0, cur)}<br />
            <strong>Paid payouts:</strong> {money(pd.paidPayoutValue || 0, cur)}
          </div>
        )}

        {(pd.payouts || []).slice(0, 5).map((p, i) => (
          <div className="mini-item" key={i}>
            <strong>{txt(p.status)} {txt(p.transactionType)}</strong>
            <br />
            <span className="muted">{money(p.net, p.currencyCode || currency)} · {fmtDate(p.issuedAt)}</span>
          </div>
        ))}

        {!pd.payoutsShown && pd.currentBalance == null && !issues.length && (
          <div className="mini-item muted">No payout data available.</div>
        )}

        {issues.map((iss, i) => (
          <div className="mini-item" key={i}>
            <strong>{txt(iss.section)}</strong>
            <br />
            <span className="bad-text">{shortErr(iss.error)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
