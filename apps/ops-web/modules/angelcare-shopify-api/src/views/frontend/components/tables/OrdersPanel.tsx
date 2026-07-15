import { useState, useMemo } from 'react';
import { Pill } from '../Pill';
import { money, fmt, txt, pillCls, fmtDate } from '../../utils';

export function OrdersPanel({ orders, currency }) {
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    if (!search) return orders || [];
    const q = search.toLowerCase();
    return (orders || []).filter((o) =>
      [o.name, o.customerName, o.customerEmail, o.displayFinancialStatus, o.displayFulfillmentStatus]
        .map(txt).join(' ').toLowerCase().includes(q),
    );
  }, [orders, search]);

  return (
    <section className="panel">
      <div className="panel-header">
        <div className="panel-hd">
          <div className="panel-icon pb">☰</div>
          <div className="panel-title">
            <h2>Recent Orders</h2>
            <div className="panel-note">{fmt(rows.length)} recent orders</div>
          </div>
        </div>
        <div className="toolbar">
          <input
            type="search"
            placeholder="Search orders"
            value={search}
            onInput={(e) => setSearch(e.currentTarget.value)}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order</th><th>Date</th><th>Customer</th>
              <th>Financial</th><th>Fulfillment</th><th>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((o, i) => (
                <tr key={o.id || i}>
                  <td><strong>{txt(o.name)}</strong></td>
                  <td>{fmtDate(o.createdAt)}</td>
                  <td>
                    {txt(o.customerName)}
                    <br />
                    <span className="muted">{txt(o.customerEmail)}</span>
                  </td>
                  <td><Pill label={txt(o.displayFinancialStatus)} cls={pillCls(o.displayFinancialStatus)} /></td>
                  <td>{txt(o.displayFulfillmentStatus)}</td>
                  <td>{money(o.total, o.currencyCode || currency)}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="empty">No orders match the current filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
