'use client';

import { useEffect, useMemo, useState } from 'react';
import type { MarketEntityKind, MarketRecord, MOSPriority, MOSStatus } from './types';
import { initialMarketRecords } from './seed';

const OFFLINE_KEY = 'angelcare-market-os-v8-offline-cache';

function toUi(row: any): MarketRecord {
  const kind = (row.kind || row.record_type || 'task') as MarketEntityKind;
  const base: any = {
    ...(row.payload || {}),
    id: String(row.id),
    kind,
    title: row.title || 'Untitled Market-OS record',
    owner: row.owner || row.owner_agent || 'Unassigned',
    status: (row.status || 'draft') as MOSStatus,
    priority: (row.priority === 'normal' ? 'medium' : row.priority || 'medium') as MOSPriority,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
    notes: row.notes || row.description || '',
    score: Number(row.score ?? row.payload?.score ?? 50),
    nextAction: row.payload?.nextAction || row.metadata?.nextAction || row.stage || 'Define next action.',
  };
  if (kind === 'strategy') return { ...base, type: base.type || 'market', objective: base.objective || base.notes || 'Market objective', kpis: base.kpis || ['Execution velocity'] };
  if (kind === 'mission') return { ...base, team: base.team || [base.owner], slaHours: base.slaHours || 48 };
  if (kind === 'task') return { ...base, assignee: base.assignee || base.owner, dueDate: base.dueDate || new Date().toISOString().slice(0,10) };
  if (kind === 'funnel') return { ...base, stages: base.stages || [], scriptIds: base.scriptIds || [] };
  if (kind === 'offer') return { ...base, service: base.service || 'AngelCare Service', positioning: base.positioning || base.notes, components: base.components || [], targetSegment: base.targetSegment || 'Families' };
  if (kind === 'pricing') return { ...base, basePriceMad: base.basePriceMad || 0, effectiveFrom: base.effectiveFrom || new Date().toISOString().slice(0,10) };
  if (kind === 'asset') return { ...base, assetType: base.assetType || 'folder', tags: base.tags || [] };
  if (kind === 'script') return { ...base, scriptType: base.scriptType || 'call', version: base.version || 'v1.0', content: base.content || base.notes || '' };
  if (kind === 'expansion') return { ...base, readinessScore: base.readinessScore || base.score || 50, checklist: base.checklist || [] };
  if (kind === 'alert') return { ...base, severity: base.severity || 'high', source: base.source || 'strategy', actionRequired: base.actionRequired || base.nextAction || base.notes };
  return base as MarketRecord;
}

function toApi(record: any) {
  return {
    record: {
      ...record,
      kind: record.kind,
      record_type: record.kind,
      title: record.title,
      owner: record.owner,
      status: record.status,
      priority: record.priority === 'medium' ? 'normal' : record.priority,
      score: record.score,
      notes: record.notes,
      payload: record,
    },
  };
}

async function post(action: string, payload: any) {
  const res = await fetch('/api/market-os/core', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...payload }) });
  return res.json();
}

export function useMarketOSStore() {
  const [records, setRecords] = useState<MarketRecord[]>(initialMarketRecords);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/market-os/core', { cache: 'no-store' });
        const data = await res.json();
        if (!cancelled && data?.ok && Array.isArray(data.records)) {
          const liveRecords = data.records.map(toUi);
          setRecords(liveRecords.length ? liveRecords : initialMarketRecords);
          setLive(Boolean(data.live));
          try { window.localStorage.setItem(OFFLINE_KEY, JSON.stringify(liveRecords)); } catch {}
          return;
        }
      } catch {}
      try {
        const raw = window.localStorage.getItem(OFFLINE_KEY);
        if (!cancelled && raw) setRecords(JSON.parse(raw));
      } catch {}
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const byKind = useMemo(() => records.reduce<Record<string, MarketRecord[]>>((acc, item) => { acc[item.kind] = acc[item.kind] || []; acc[item.kind].push(item); return acc; }, {}), [records]);
  const persistOffline = (next: MarketRecord[]) => { try { window.localStorage.setItem(OFFLINE_KEY, JSON.stringify(next)); } catch {} };

  function addRecord(record: MarketRecord) {
    const stamped = { ...record, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as MarketRecord;
    setRecords((prev) => { const next = [stamped, ...prev]; persistOffline(next); return next; });
    post('upsert_record', toApi(stamped)).then((data) => { if (data?.record) setRecords((prev) => prev.map((r) => r.id === stamped.id ? toUi(data.record) : r)); }).catch(() => {});
  }
  function updateRecord(id: string, patch: Partial<MarketRecord>) {
    let updated: MarketRecord | undefined;
    setRecords((prev) => { const next = prev.map((r) => r.id === id ? (updated = { ...r, ...patch, updatedAt: new Date().toISOString() } as MarketRecord) : r); persistOffline(next); return next; });
    if (updated) post('update_record', { recordId: id, ...toApi(updated) }).catch(() => {});
  }
  function cloneRecord(id: string, patch: Partial<MarketRecord> = {}) { const item = records.find((r) => r.id === id); if (!item) return; addRecord({ ...item, ...patch, id: `${item.kind}-${Date.now()}`, title: `${item.title} · duplicated`, status: 'draft', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as MarketRecord); }
  function bulkStatus(kind: MarketEntityKind, from: MOSStatus, to: MOSStatus) { records.filter(r => r.kind === kind && r.status === from).forEach(r => updateStatus(r.id, to)); }
  function updateStatus(id: string, status: MOSStatus) { updateRecord(id, { status }); }
  function updatePriority(id: string, priority: MOSPriority) { updateRecord(id, { priority }); }
  function attachDrive(id: string, driveUrl: string) { updateRecord(id, { driveUrl } as Partial<MarketRecord>); }
  function updateNotes(id: string, notes: string) { updateRecord(id, { notes }); }
  function setNextAction(id: string, nextAction: string) { updateRecord(id, { nextAction }); }
  function removeRecord(id: string) { setRecords((prev) => { const next = prev.filter((r) => r.id !== id); persistOffline(next); return next; }); post('delete_record', { recordId: id }).catch(() => {}); }
  function clearDemoData() { setRecords([]); persistOffline([]); }
  function get(kind: MarketEntityKind) { return byKind[kind] || []; }
  return { records, get, addRecord, updateRecord, cloneRecord, bulkStatus, updateStatus, updatePriority, attachDrive, updateNotes, setNextAction, removeRecord, clearDemoData, live };
}
