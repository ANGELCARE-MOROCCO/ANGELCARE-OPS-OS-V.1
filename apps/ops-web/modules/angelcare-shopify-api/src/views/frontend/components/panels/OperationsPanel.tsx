import { Pill } from '../Pill';
import { fmt, txt, allWarnings } from '../../utils';

export function OperationsPanel({ payload }) {
  const data = payload?.data || {};
  const diag = data.diagnostics || {};
  const sections = diag.sections || [];
  const warnings = allWarnings(payload || {});
  const source = payload?.source || '—';

  return (
    <section className="panel">
      <div className="panel-header">
        <div className="panel-hd">
          <div className="panel-icon pg">⚙</div>
          <div className="panel-title">
            <h2>Operations</h2>
            <div className="panel-note">{diag.shopDomain ? `Shop: ${diag.shopDomain}` : 'Loading diagnostics'}</div>
          </div>
        </div>
        <Pill label={source} cls={source?.includes('partial') ? 'pill warn' : 'pill'} />
      </div>

      <div className="mini-grid">
        <div>
          <h3>Service Sections</h3>
          <div className="mini-list">
            {sections.length ? (
              sections.map((s) => (
                <div className="mini-item" key={s.name}>
                  <Pill label={s.ok ? 'Online' : 'Issue'} cls={s.ok ? 'pill' : 'pill bad'} />
                  <strong> {s.name}</strong>
                  <br />
                  <span className="muted">{s.ok ? `${fmt(s.durationMs)} ms` : txt(s.error)}</span>
                </div>
              ))
            ) : (
              <div className="mini-item muted">No sections available.</div>
            )}
          </div>
        </div>

        <div>
          <h3>Warnings</h3>
          <div className="mini-list">
            {warnings.length ? (
              warnings.map((w, i) => (
                <div className="mini-item" key={i}>
                  <strong>{txt(w.section)}</strong>
                  <br />
                  <span className="bad-text">{txt(w.error)}</span>
                </div>
              ))
            ) : (
              <div className="mini-item">
                <Pill label="Clear" cls="pill" /> No warnings.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
