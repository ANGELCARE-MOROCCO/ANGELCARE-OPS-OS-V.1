import { fmt, txt } from '../../utils';

const SEV_CLS = { high: 'pill bad', medium: 'pill warn', info: 'pill info' };

export function InventoryAlertsPanel({ insights }) {
  const alerts = (insights?.alerts || []).slice(0, 8);

  return (
    <section className="panel">
      <div className="panel-header">
        <div className="panel-hd">
          <div className="panel-icon pa">△</div>
          <div className="panel-title">
            <h2>Inventory Attention</h2>
            <div className="panel-note">Low, out, unavailable and untracked</div>
          </div>
        </div>
        <a className="button ghost" href="/api/inventory/alerts">JSON</a>
      </div>

      <div className="mini-list">
        {alerts.length ? (
          alerts.map((a, i) => (
            <div className="mini-item alert-row" key={i}>
              <span className={SEV_CLS[a.severity] || 'pill'}>{txt(a.state)}</span>
              <div>
                <strong>{txt(a.productTitle)}</strong>
                <br />
                <span className="muted">{txt(a.variantTitle)} / {txt(a.sku)}</span>
              </div>
              <span className="muted">{a.inventoryQuantity == null ? 'N/A' : fmt(a.inventoryQuantity)}</span>
            </div>
          ))
        ) : (
          <div className="mini-item muted">No inventory alerts.</div>
        )}
      </div>
    </section>
  );
}
