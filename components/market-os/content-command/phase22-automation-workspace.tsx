'use client';

import React from 'react';
import {
  phase22AutomationRules,
  phase22ExecutionLogs,
} from './phase22-automation-data';

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export function ContentCommandPhase22AutomationWorkspace(): React.ReactElement {
  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-950">
          Phase 22 Automation Rules
        </h2>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 p-4">
            <h3 className="text-lg font-bold text-slate-950">Automation Rules</h3>

            <div className="mt-4 space-y-3">
              {phase22AutomationRules.map((rule) => (
                <article key={rule.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{rule.title}</p>
                      <p className="mt-1 text-xs text-slate-9500">
                        {rule.trigger} → {rule.action}
                      </p>
                    </div>

                    <Badge>{rule.enabled ? 'Enabled' : 'Disabled'}</Badge>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 p-4">
            <h3 className="text-lg font-bold text-slate-950">Execution Logs</h3>

            <div className="mt-4 space-y-3">
              {phase22ExecutionLogs.map((log) => (
                <article key={log.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{log.notes}</p>
                      <p className="mt-1 text-xs text-slate-9500">
                        {log.ruleId} · {log.executedAt}
                      </p>
                    </div>

                    <Badge>{log.status}</Badge>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase22AutomationWorkspace;