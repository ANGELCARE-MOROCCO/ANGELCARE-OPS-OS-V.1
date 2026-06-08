import { StatusTile } from './StatusTile';
import { fmt, allWarnings, dataHealth, fmtDate } from '../utils';

export function StatusStrip({ payload }) {
  const data     = payload?.data || {};
  const diag     = data.diagnostics || {};
  const throttle = data.throttleStatus || {};
  const sections = diag.sections || [];
  const okCount  = sections.filter((s) => s.ok).length;
  const warnings = allWarnings(payload || {});
  const auth     = payload?.auth;
  const hval     = payload ? dataHealth(payload) : '—';

  return (
    <section className="status-grid" aria-label="Operational status">
      <StatusTile
        label="Auth"
        val={auth ?? '—'}
        valCls={auth === 'connected' ? 'ok' : 'warn-text'}
        detail={diag.authMode || 'Resolving'}
      />
      <StatusTile
        label="Data Health"
        val={hval}
        valCls={warnings.length ? 'warn-text' : 'ok'}
        detail={sections.length ? `${okCount}/${sections.length} sections ok` : 'Waiting'}
      />
      <StatusTile
        label="Last Refresh"
        val={diag.generatedAt ? fmtDate(diag.generatedAt) : '—'}
        detail={diag.responseTimeMs != null ? `${fmt(diag.responseTimeMs)} ms` : 'N/A'}
      />
      <StatusTile
        label="API Capacity"
        val={
          throttle.currentlyAvailable != null
            ? `${fmt(Math.floor(throttle.currentlyAvailable))} / ${fmt(throttle.maximumAvailable)}`
            : 'N/A'
        }
        detail={throttle.restoreRate != null ? `${fmt(throttle.restoreRate)} pts/sec` : 'No throttle data'}
      />
      <StatusTile
        label="Cache"
        val={payload?.cache ? `${payload.cache.status} · ${payload.cache.ttlSeconds}s` : '—'}
        detail="Refresh bypasses cache"
      />
    </section>
  );
}
