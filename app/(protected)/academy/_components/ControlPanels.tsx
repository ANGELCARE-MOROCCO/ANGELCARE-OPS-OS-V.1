import Link from 'next/link';
import type { AcademyException } from '../_lib/exceptionEngine';
import type { AcademyCommand } from '../_lib/commandEngine';
import { getAvailableTransitions, stageLabel } from '../_lib/stateMachine';

export function ExceptionPanel({ exceptions }: { exceptions: AcademyException[] }) {
  return (
    <section style={panelStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle}>Exception Engine</h2>
          <p style={textStyle}>Operational risks detected across Academy workflow.</p>
        </div>
        <strong style={countStyle}>{exceptions.length}</strong>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {exceptions.length ? exceptions.slice(0, 10).map((item) => (
          <Link key={item.id} href={item.actionHref} style={exceptionStyle(item.severity)}>
            <div>
              <strong>{item.title}</strong>
              <p>{item.message}</p>
              <small>{item.type.toUpperCase()} · {item.severity.toUpperCase()}</small>
            </div>
            <span>{item.actionLabel} →</span>
          </Link>
        )) : <div style={emptyStyle}>No critical Academy exception detected.</div>}
      </div>
    </section>
  );
}

export function CommandPanel({ commands }: { commands: AcademyCommand[] }) {
  return (
    <section style={panelStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle}>Manager Command Panel</h2>
          <p style={textStyle}>System-generated priorities for today’s execution.</p>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {commands.map((cmd) => (
          <Link key={cmd.id} href={cmd.href} style={commandStyle(cmd.priority)}>
            <span style={priorityStyle(cmd.priority)}>{cmd.priority}</span>
            <div>
              <strong>{cmd.title}</strong>
              <p>{cmd.description}</p>
              <small>Owner: {cmd.ownerHint} · Outcome: {cmd.expectedOutcome}</small>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function WorkflowTransitions({ entityId, currentStage }: { entityId: string; currentStage?: string | null }) {
  const transitions = getAvailableTransitions(currentStage);
  return (
    <div style={workflowStyle}>
      <div>
        <strong>Current stage</strong>
        <span>{stageLabel(currentStage)}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {transitions.map((t) => (
          <Link key={`${entityId}-${t.action}-${t.to}`} href={`/academy/trainees?transition=${t.to}&trainee=${entityId}`} style={transitionStyle}>
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ControlKpi({ label, value, tone = '#2563eb', href }: { label: string; value: string | number; tone?: string; href?: string }) {
  const body = (
    <div style={{ ...kpiStyle, borderLeft: `5px solid ${tone}` }}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{body}</Link> : body;
}

const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 18px 40px rgba(15,23,42,.06)' };
const headerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, marginBottom: 16 };
const titleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 24, fontWeight: 950 };
const textStyle: React.CSSProperties = { margin: '6px 0 0', color: '#64748b', fontWeight: 750, lineHeight: 1.5 };
const countStyle: React.CSSProperties = { display: 'grid', placeItems: 'center', minWidth: 54, height: 54, borderRadius: 18, background: '#0f172a', color: '#fff', fontSize: 22 };
const emptyStyle: React.CSSProperties = { padding: 16, borderRadius: 18, background: '#ecfdf5', color: '#166534', border: '1px solid #86efac', fontWeight: 900 };
const exceptionStyle = (severity: string): React.CSSProperties => {
  const tones: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#64748b' };
  const tone = tones[severity] || '#64748b';
  return { display: 'flex', justifyContent: 'space-between', gap: 12, textDecoration: 'none', color: '#0f172a', padding: 14, borderRadius: 18, background: `${tone}12`, border: `1px solid ${tone}44` };
};
const commandStyle = (priority: string): React.CSSProperties => {
  const tones: Record<string, string> = { P0: '#ef4444', P1: '#f97316', P2: '#2563eb', P3: '#22c55e' };
  const tone = tones[priority] || '#64748b';
  return { display: 'grid', gridTemplateColumns: '54px 1fr', gap: 12, textDecoration: 'none', color: '#0f172a', padding: 16, borderRadius: 20, background: `${tone}10`, border: `1px solid ${tone}40` };
};
const priorityStyle = (priority: string): React.CSSProperties => ({ display: 'grid', placeItems: 'center', height: 44, borderRadius: 15, background: priority === 'P0' ? '#ef4444' : priority === 'P1' ? '#f97316' : priority === 'P2' ? '#2563eb' : '#22c55e', color: '#fff', fontWeight: 950 });
const workflowStyle: React.CSSProperties = { display: 'grid', gap: 10, padding: 14, borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0' };
const transitionStyle: React.CSSProperties = { textDecoration: 'none', borderRadius: 999, padding: '8px 11px', background: '#0f172a', color: '#fff', fontSize: 12, fontWeight: 900 };
const kpiStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 18, borderRadius: 22, background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a', boxShadow: '0 12px 28px rgba(15,23,42,.05)' };
