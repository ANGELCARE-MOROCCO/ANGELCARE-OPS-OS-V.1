import { Pill } from './Pill';
import { fmt, txt, fmtDate } from '../utils';

export function LocationsWebhooksPanel({ locations, webhookEvents }) {
  const locs = locations || [];
  const events = webhookEvents || [];

  return (
    <section className="panel">
      <div className="panel-header">
        <div className="panel-hd">
          <div className="panel-icon pg">◎</div>
          <div className="panel-title">
            <h2>Locations</h2>
            <div className="panel-note">{fmt(locs.length)} locations</div>
          </div>
        </div>
      </div>

      <div className="mini-list">
        {locs.length ? (
          locs.map((loc, i) => (
            <div className="mini-item" key={i}>
              <strong>{txt(loc.name)}</strong>
              <br />
              <span className="muted">{txt(loc.id)}</span>
              <br />
              <Pill label={loc.isActive ? 'Active' : 'Inactive'} cls={loc.isActive ? 'pill' : 'pill bad'} />
            </div>
          ))
        ) : (
          <div className="mini-item muted">No locations returned.</div>
        )}
      </div>

      <div className="panel-header" style={{ borderTop: '1px solid var(--line)' }}>
        <div className="panel-hd">
          <div className="panel-icon pb">↗</div>
          <div className="panel-title">
            <h2>Webhooks</h2>
            <div className="panel-note">Recent deliveries</div>
          </div>
        </div>
      </div>

      <div className="mini-list">
        {events.length ? (
          events.map((ev, i) => (
            <div className="mini-item" key={i}>
              <strong>{txt(ev.topic)}</strong>
              <br />
              <span className="muted">{fmtDate(ev.receivedAt)} · {txt(ev.shopDomain)}</span>
            </div>
          ))
        ) : (
          <div className="mini-item muted">No webhook events logged yet.</div>
        )}
      </div>
    </section>
  );
}
