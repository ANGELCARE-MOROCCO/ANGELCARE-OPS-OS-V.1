'use client';

import React, { useMemo, useState } from 'react';
import { phase27ActivationStatus, phase27Routes } from './phase27-routing-data';
import {
  getPhase27BuildSafePercent,
  getPhase27MountedCount,
  getPhase27OrderedRoutes,
  getPhase27RouteByKey,
} from './phase27-routing-helpers';
import type { Phase27RouteKey } from './phase27-routing-types';

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

function PlaceholderWorkspace(props: { routeKey: Phase27RouteKey; componentName: string }): React.ReactElement {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        Local Workspace Host
      </p>
      <h3 className="mt-2 text-xl font-bold text-slate-950">{props.componentName}</h3>
      <p className="mt-2 text-sm text-slate-600">
        This router safely registers the {props.routeKey} workspace. To fully mount the real component,
        import the referenced workspace in this local Content Command Center submodule only.
      </p>
      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
        This placeholder is intentionally safe: it does not touch routes, global layout, or the Market-OS main page.
      </div>
    </div>
  );
}

export function ContentCommandPhase27ActivationRouter(): React.ReactElement {
  const routes = useMemo(() => getPhase27OrderedRoutes(phase27Routes), []);
  const [activeKey, setActiveKey] = useState<Phase27RouteKey>(routes[0]?.key ?? 'overview');

  const activeRoute = useMemo(() => getPhase27RouteByKey(routes, activeKey), [routes, activeKey]);
  const buildSafePercent = useMemo(() => getPhase27BuildSafePercent(phase27ActivationStatus), []);
  const mountedCount = useMemo(() => getPhase27MountedCount(phase27ActivationStatus), []);

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Content Command Center
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Phase 27 Activation Router
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Local workspace switcher for activating major Content Command Center sections safely
          inside the submodule without changing Market-OS main page routing.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Registered Routes</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{routes.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mounted</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{mountedCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Build Safe</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{buildSafePercent}%</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Local Workspace Switcher</h3>
          <div className="mt-5 space-y-2">
            {routes.map((route) => (
              <button
                key={route.key}
                type="button"
                onClick={() => setActiveKey(route.key)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{route.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{route.description}</p>
                  </div>
                  <Badge>{route.enabled ? 'Enabled' : 'Off'}</Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {activeRoute ? (
            <PlaceholderWorkspace routeKey={activeRoute.key} componentName={activeRoute.componentName} />
          ) : null}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">Activation Status</h3>
            <div className="mt-5 space-y-3">
              {phase27ActivationStatus.map((status) => (
                <article key={status.key} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold capitalize text-slate-950">{status.key}</p>
                      <p className="mt-2 text-sm text-slate-600">{status.notes}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{status.mounted ? 'Mounted' : 'Not mounted'}</Badge>
                      <Badge>{status.buildSafe ? 'Build-safe' : 'Review'}</Badge>
                    </div>
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

export default ContentCommandPhase27ActivationRouter;