'use client';

import React, { useMemo, useState } from 'react';
import { phase11ConfigOptions, phase11GovernanceRules, phase11SlaRules } from './phase11-settings-data';
import type { Phase11ConfigOption, Phase11ConfigScope } from './phase11-settings-types';
import { validatePhase11Settings } from './phase11-settings-validation';

const scopes: Phase11ConfigScope[] = [
  'statuses',
  'priorities',
  'languages',
  'channels',
  'content_types',
  'governance',
  'sla',
];

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

function ConfigRow(props: { option: Phase11ConfigOption }): React.ReactElement {
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-950">{props.option.label}</p>
          <p className="mt-1 text-xs text-slate-9500">{props.option.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{props.option.enabled ? 'Enabled' : 'Disabled'}</Badge>
          {props.option.locked ? <Badge>Locked</Badge> : null}
        </div>
      </div>
    </article>
  );
}

export function ContentCommandPhase11SettingsWorkspace(): React.ReactElement {
  const [selectedScope, setSelectedScope] = useState<Phase11ConfigScope>('statuses');

  const selectedOptions = useMemo(() => {
    return phase11ConfigOptions.filter((option) => option.scope === selectedScope);
  }, [selectedScope]);

  const validation = validatePhase11Settings(phase11ConfigOptions, phase11GovernanceRules, phase11SlaRules);

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-9500">
          Content Command Center
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">Phase 11 Configuration Settings</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Configuration layer for statuses, priorities, languages, channels, content types, governance rules, and SLA standards.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Configuration Areas</h3>
          <div className="mt-5 space-y-2">
            {scopes.map((scope) => (
              <button
                key={scope}
                type="button"
                onClick={() => setSelectedScope(scope)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                {scope.replaceAll('_', ' ')}
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-950">
              Settings validation: {validation.valid ? 'Healthy' : 'Needs attention'}
            </p>
            {validation.warnings.length > 0 ? (
              <ul className="mt-2 list-inside list-disc text-sm text-slate-600">
                {validation.warnings.map((warning) => <li key={warning}>{warning}</li>)}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600">Configuration is ready for controlled workspace behavior.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold capitalize text-slate-950">{selectedScope.replaceAll('_', ' ')}</h3>
            <p className="mt-1 text-sm text-slate-600">Reusable configuration options for this workspace area.</p>
            <div className="mt-5 space-y-3">
              {selectedOptions.length > 0 ? (
                selectedOptions.map((option) => <ConfigRow key={option.id} option={option} />)
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                  This area is handled by the dedicated rules below.
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-950">Governance Rules</h3>
              <div className="mt-5 space-y-3">
                {phase11GovernanceRules.map((rule) => (
                  <article key={rule.id} className="rounded-2xl border border-slate-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{rule.title}</p>
                        <p className="mt-1 text-xs text-slate-9500">{rule.description}</p>
                      </div>
                      <Badge>{rule.severity}</Badge>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-950">SLA Rules</h3>
              <div className="mt-5 space-y-3">
                {phase11SlaRules.map((rule) => (
                  <article key={rule.id} className="rounded-2xl border border-slate-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{rule.title}</p>
                        <p className="mt-1 text-xs text-slate-9500">{rule.appliesTo}</p>
                      </div>
                      <Badge>{rule.targetHours}h</Badge>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase11SettingsWorkspace;