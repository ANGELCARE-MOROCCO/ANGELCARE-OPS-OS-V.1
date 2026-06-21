'use client';

import React, { useMemo, useState } from 'react';
import { phase9DetailRecords, phase9TaskCards, phase9WorkspaceActions } from './phase9-action-data';
import { runPhase9Action } from './phase9-action-handlers';
import type { Phase9DetailPanelRecord, Phase9TaskCard, Phase9WorkspaceAction } from './phase9-action-types';

function Pill(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

function ActionButton(props: { action: Phase9WorkspaceAction; onRun: (action: Phase9WorkspaceAction) => void }): React.ReactElement {
  const isBlocked = props.action.status === 'blocked';

  return (
    <button
      type="button"
      onClick={() => props.onRun(props.action)}
      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isBlocked}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-950">{props.action.label}</p>
          <p className="mt-1 text-xs text-slate-9500">{props.action.targetWorkspace}</p>
        </div>
        <Pill>{props.action.status}</Pill>
      </div>
      <p className="mt-3 text-sm text-slate-600">{props.action.description}</p>
    </button>
  );
}

function TaskRow(props: { task: Phase9TaskCard }): React.ReactElement {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">{props.task.title}</p>
          <p className="mt-1 text-xs text-slate-9500">
            {props.task.workspace} · Owner: {props.task.owner}
          </p>
        </div>
        <div className="flex gap-2">
          <Pill>{props.task.status}</Pill>
          <Pill>{props.task.priority}</Pill>
        </div>
      </div>
    </div>
  );
}

function DetailPanel(props: { record: Phase9DetailPanelRecord }): React.ReactElement {
  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-9500">Detail Panel</p>
      <h3 className="mt-2 text-xl font-bold text-slate-950">{props.record.title}</h3>
      <p className="mt-1 text-sm text-slate-600">{props.record.subtitle}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Pill>{props.record.status}</Pill>
        <Pill>{props.record.owner}</Pill>
      </div>

      <div className="mt-5 space-y-3">
        {props.record.metadata.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">{item.label}</p>
            <p className="text-sm font-semibold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function ContentCommandPhase9ActionWorkspace(): React.ReactElement {
  const [selectedDetailId, setSelectedDetailId] = useState<string>(phase9DetailRecords[0]?.id ?? '');
  const [lastActionMessage, setLastActionMessage] = useState<string>('No action executed yet.');

  const selectedDetail = useMemo(
    () => phase9DetailRecords.find((record) => record.id === selectedDetailId) ?? phase9DetailRecords[0],
    [selectedDetailId]
  );

  function handleRunAction(action: Phase9WorkspaceAction): void {
    const result = runPhase9Action(action);
    setLastActionMessage(result.message);
  }

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-9500">
          Content Command Center
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">Phase 9 Actionable Controls</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Action-ready workspace layer for create/edit flows, approvals, AI review, scheduling, tasks, and detail panel activation.
        </p>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700">
          {lastActionMessage}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">Action Command Bar</h3>
            <p className="mt-1 text-sm text-slate-600">Reusable action definitions for future create/edit modals and live workflows.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {phase9WorkspaceActions.map((action) => (
                <ActionButton key={action.id} action={action} onRun={handleRunAction} />
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">Execution Task Board</h3>
            <p className="mt-1 text-sm text-slate-600">Task layer for content operations, approvals, product sheets, brand issues, and social execution.</p>
            <div className="mt-5 space-y-3">
              {phase9TaskCards.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {selectedDetail ? <DetailPanel record={selectedDetail} /> : null}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-950">Switch Detail Record</p>
            <div className="mt-4 space-y-2">
              {phase9DetailRecords.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => setSelectedDetailId(record.id)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                >
                  {record.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase9ActionWorkspace;