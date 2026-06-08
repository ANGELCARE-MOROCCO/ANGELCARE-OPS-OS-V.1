import { fmt, txt } from '../../utils';

export function CatalogMixPanel({ insights }) {
  const mix = insights?.mix || {};
  const statusItems = mix.status || [];
  const vendorItems = (mix.vendors || []).slice(0, 5);

  return (
    <section className="panel">
      <div className="panel-header">
        <div className="panel-hd">
          <div className="panel-icon pb">≡</div>
          <div className="panel-title">
            <h2>Catalog Mix</h2>
            <div className="panel-note">Product status and vendor breakdown</div>
          </div>
        </div>
      </div>

      <div className="mini-list">
        {statusItems.map((item, i) => (
          <div className="mini-item" key={i}>
            <strong>{txt(item.label)}</strong>
            <br />
            <span className="muted">{fmt(item.count)} products</span>
          </div>
        ))}

        {vendorItems.length > 0 && <div className="mini-item"><strong>Top vendors</strong></div>}

        {vendorItems.map((item, i) => (
          <div className="mini-item" key={`v${i}`}>
            <strong>{txt(item.label)}</strong>
            <br />
            <span className="muted">{fmt(item.count)} products</span>
          </div>
        ))}

        {!statusItems.length && !vendorItems.length && (
          <div className="mini-item muted">No catalog mix available.</div>
        )}
      </div>
    </section>
  );
}
