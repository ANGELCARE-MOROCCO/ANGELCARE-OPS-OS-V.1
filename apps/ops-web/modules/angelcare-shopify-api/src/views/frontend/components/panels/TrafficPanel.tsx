import { fmt, txt } from '../../utils';

export function TrafficPanel({ traffic, days, onChangeDays }) {
  const t = traffic || {};
  const daily = (t.daily || []).slice(-14);
  const maxD = Math.max(1, ...daily.map((d) => +d.count || 0));

  return (
    <section className="panel">
      <div className="panel-header">
        <div className="panel-hd">
          <div className="panel-icon pb">~</div>
          <div className="panel-title">
            <h2>Storefront Traffic</h2>
            <div className="panel-note">
              {t.pageViews ? `${fmt(t.pageViews)} page views in ${t.days} days` : 'Waiting for tracking events'}
            </div>
          </div>
        </div>
        <div className="toolbar">
          <select value={days} onChange={(e) => onChangeDays(e.target.value)} aria-label="Traffic range">
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
          </select>
          <a className="button ghost" href="/api/traffic/summary">JSON</a>
        </div>
      </div>

      <div className="mini-grid">
        <div className="mini-item">
          <h3>Top Pages</h3>
          {(t.topPages || []).length ? (
            (t.topPages || []).slice(0, 7).map((p, i) => (
              <div className="mini-item" key={i}>
                <strong>{txt(p.label)}</strong>
                <br />
                <span className="muted">{fmt(p.count)} views</span>
              </div>
            ))
          ) : (
            <span className="muted">No page views recorded.</span>
          )}
        </div>

        <div className="mini-item">
          <h3>Referrers</h3>
          {(t.referrers || []).length ? (
            (t.referrers || []).slice(0, 5).map((r, i) => (
              <div className="mini-item" key={i}>
                <strong>{txt(r.label)}</strong>
                <br />
                <span className="muted">{fmt(r.count)} visits</span>
              </div>
            ))
          ) : (
            <span className="muted">No referrers recorded.</span>
          )}
        </div>
      </div>

      <div className="mini-list">
        <div className="mini-item">
          <h3>Daily Views</h3>
          <div className="bars">
            {daily.length ? (
              daily.map((d, i) => (
                <div className="bar-row" key={i}>
                  <span>{txt(d.label)}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${Math.max(2, Math.round(((+d.count || 0) / maxD) * 100))}%` }}
                    />
                  </div>
                  <strong>{fmt(d.count)}</strong>
                </div>
              ))
            ) : (
              <span className="muted">No daily traffic yet.</span>
            )}
          </div>
        </div>
        <div className="mini-item">
          <h3>Tracking Script</h3>
          <pre>
            {t.trackingScriptUrl
              ? `<script src="${txt(t.trackingScriptUrl)}" defer></` + 'script>'
              : 'Not configured'}
          </pre>
        </div>
      </div>
    </section>
  );
}
