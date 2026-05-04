'use client';

import { useEffect, useMemo, useState } from 'react';
import type { MarketEntityKind, MarketRecord, MOSPriority, MOSStatus } from './types';
import { initialMarketRecords } from './seed';

const KEY = 'angelcare-market-os-v7-records';

export function useMarketOSStore() {
  const [records, setRecords] = useState<MarketRecord[]>(initialMarketRecords);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setRecords(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try { window.localStorage.setItem(KEY, JSON.stringify(records)); } catch {}
  }, [records]);

  const byKind = useMemo(() => {
    return records.reduce<Record<string, MarketRecord[]>>((acc, item) => {
      acc[item.kind] = acc[item.kind] || [];
      acc[item.kind].push(item);
      return acc;
    }, {});
  }, [records]);

  function addRecord(record: MarketRecord) {
    const stamped = { ...record, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as MarketRecord;
    setRecords((prev) => [stamped, ...prev]);
  }

  function updateRecord(id: string, patch: Partial<MarketRecord>) {
    setRecords((prev) => prev.map((r) => r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } as MarketRecord : r));
  }

  function cloneRecord(id: string, patch: Partial<MarketRecord> = {}) {
    const item = records.find((r) => r.id === id);
    if (!item) return;
    const cloned = { ...item, ...patch, id: `${item.kind}-${Date.now()}`, title: `${item.title} · duplicated`, status: 'draft', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as MarketRecord;
    setRecords((prev) => [cloned, ...prev]);
  }

  function bulkStatus(kind: MarketEntityKind, from: MOSStatus, to: MOSStatus) {
    setRecords((prev) => prev.map((r) => r.kind === kind && r.status === from ? { ...r, status: to, updatedAt: new Date().toISOString() } as MarketRecord : r));
  }

  function updateStatus(id: string, status: MOSStatus) {
    setRecords((prev) => prev.map((r) => r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } as MarketRecord : r));
  }

  function updatePriority(id: string, priority: MOSPriority) {
    setRecords((prev) => prev.map((r) => r.id === id ? { ...r, priority, updatedAt: new Date().toISOString() } as MarketRecord : r));
  }

  function attachDrive(id: string, driveUrl: string) {
    setRecords((prev) => prev.map((r) => r.id === id ? { ...r, driveUrl, updatedAt: new Date().toISOString() } as MarketRecord : r));
  }

  function updateNotes(id: string, notes: string) {
    setRecords((prev) => prev.map((r) => r.id === id ? { ...r, notes, updatedAt: new Date().toISOString() } as MarketRecord : r));
  }

  function setNextAction(id: string, nextAction: string) {
    setRecords((prev) => prev.map((r) => r.id === id ? { ...r, nextAction, updatedAt: new Date().toISOString() } as MarketRecord : r));
  }

  function removeRecord(id: string) {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }

  function clearDemoData() {
    setRecords(initialMarketRecords);
    try { window.localStorage.removeItem(KEY); } catch {}
  }

  function get(kind: MarketEntityKind) {
    return byKind[kind] || [];
  }

  return { records, get, addRecord, updateRecord, cloneRecord, bulkStatus, updateStatus, updatePriority, attachDrive, updateNotes, setNextAction, removeRecord, clearDemoData };
}
