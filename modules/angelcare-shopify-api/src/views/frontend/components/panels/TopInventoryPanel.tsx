import { fmt, txt } from '../../utils';

export function TopInventoryPanel({ insights }) {
  const top = (insights?.topInventoryVariants || []).slice(0, 6);

  return (
    <section className="panel">
      <div className="panel-header">
        <div className="panel-hd">
          <div className="panel-icon pg">★</div>
          <div className="panel-title">
            <h2>Top Inventory</h2>
            <div className="panel-note">Tracked variants with the most units</div>
          </div>
        </div>
      </div>

      <div className="mini-list">
        {top.length ? (
          top.map((item, i) => (
            <div className="mini-item" key={i}>
              <strong>{txt(item.productTitle)}</strong>
              <br />
              <span className="muted">{txt(item.variantTitle)} · {fmt(item.inventoryQuantity)} units</span>
            </div>
          ))
        ) : (
          <div className="mini-item muted">No tracked inventory quantities available.</div>
        )}
      </div>
    </section>
  );
}
