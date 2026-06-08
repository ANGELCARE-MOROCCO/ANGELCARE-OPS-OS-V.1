import { fmt, txt } from '../../utils';

function ProgRow({ label, val, tone }: { label: string; val: unknown; tone?: string }) {
  const pct = Math.max(0, Math.min(100, Number(val) || 0));
  return (
    <div className="progress-row">
      <span>{label}</span>
      <div className="bar-track">
        <div className={`progress-fill${tone ? ' ' + tone : ''}`} style={{ width: `${Math.max(2, pct)}%` }} />
      </div>
      <strong>{pct}%</strong>
    </div>
  );
}

export function CatalogHealthPanel({ insights }) {
  const ins = insights || {};
  const cov = ins.coverage || {};
  const cnt = ins.counts || {};

  return (
    <section className="panel">
      <div className="panel-header">
        <div className="panel-hd">
          <div className="panel-icon pg">✔</div>
          <div className="panel-title">
            <h2>Catalog Health</h2>
            <div className="panel-note">
              {cnt.trackedVariantCount != null
                ? `${fmt(cnt.trackedVariantCount)} tracked / ${fmt(cnt.untrackedVariantCount)} untracked`
                : 'Loading catalog coverage'}
            </div>
          </div>
        </div>
        <a className="button ghost" href="/api/catalog/insights">JSON</a>
      </div>

      <div className="mini-grid">
        <div className="mini-item">
          <h3>Coverage</h3>
          <div className="progress">
            <ProgRow label="Tracking"  val={cov.trackingCoveragePct} tone={cov.trackingCoveragePct < 50 ? 'warn' : ''} />
            <ProgRow label="Available" val={cov.availabilityPct} />
            <ProgRow label="Untracked" val={cov.untrackedPct}    tone={cov.untrackedPct > 50 ? 'warn' : ''} />
          </div>
        </div>

        <div className="mini-item">
          <h3>Stock Mix</h3>
          {(ins.mix?.stock || []).length ? (
            ins.mix.stock.map((item, i) => (
              <div key={i}>
                <strong>{txt(item.label)}</strong> <span className="muted">{fmt(item.count)}</span>
              </div>
            ))
          ) : (
            <span className="muted">No stock mix.</span>
          )}
        </div>
      </div>
    </section>
  );
}
