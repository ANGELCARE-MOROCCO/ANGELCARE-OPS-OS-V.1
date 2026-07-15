"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  FileText,
  Flag,
  Loader2,
  MapPinned,
  Plus,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import type { AmbassadorWorkspaceSnapshot } from "@/lib/market-os/ambassadors/types";

type AnyRecord = Record<string, any>;
type Tone = "blue" | "green" | "amber" | "red" | "purple" | "cyan";
type ActionMode = "mission" | "candidate" | "lead" | "conversion" | "payout" | "report" | null;

type AmbassadorCockpitRouteProps = {
  snapshot: AmbassadorWorkspaceSnapshot;
  kpis: Record<string, any>;
  loading?: boolean;
  refreshing?: boolean;
  diagnostics?: AnyRecord[];
  onRefresh?: () => void;
  onCreateMission?: () => void;
  onCreateCandidate?: () => void;
  onCreateLead?: () => void;
  onExportReport?: () => void;
  onOpenConversions?: () => void;
  onOpenPayouts?: () => void;
};

type ApiCollection = {
  leads: AnyRecord[];
  conversions: AnyRecord[];
  incentives: AnyRecord[];
  missions: AnyRecord[];
  recruitment: AnyRecord[];
  source: string;
  loadedAt: string;
};

const emptyApiData: ApiCollection = {
  leads: [],
  conversions: [],
  incentives: [],
  missions: [],
  recruitment: [],
  source: "initial",
  loadedAt: "",
};

function list(value: any): AnyRecord[] {
  return Array.isArray(value) ? value : [];
}

function text(value: any, fallback = "") {
  return String(value ?? fallback).trim() || fallback;
}

function numberValue(value: any) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function formatNumber(value: any) {
  return new Intl.NumberFormat("fr-FR").format(numberValue(value));
}

function formatMoney(value: any) {
  return `${formatNumber(value)} MAD`;
}

function classNames(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

function todayPlus(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function readJson(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || `Erreur API ${response.status}`);
  }
  return payload;
}

async function apiGet(path: string) {
  const payload = await readJson(await fetch(path, { cache: "no-store" }));
  return list(payload.records || payload.items || payload.data);
}

async function apiSend(path: string, method: "POST" | "PATCH", body: AnyRecord) {
  return readJson(await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }));
}

const toneStyles: Record<Tone, { icon: string; soft: string; text: string; bar: string; pill: string; border: string }> = {
  blue: { icon: "bg-blue-50 text-blue-700", soft: "bg-blue-50", text: "text-blue-700", bar: "bg-blue-600", pill: "bg-blue-50 text-blue-700", border: "border-blue-100" },
  green: { icon: "bg-emerald-50 text-emerald-700", soft: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700", border: "border-emerald-100" },
  amber: { icon: "bg-amber-50 text-amber-700", soft: "bg-amber-50", text: "text-amber-700", bar: "bg-amber-500", pill: "bg-amber-50 text-amber-700", border: "border-amber-100" },
  red: { icon: "bg-rose-50 text-rose-700", soft: "bg-rose-50", text: "text-rose-700", bar: "bg-rose-500", pill: "bg-rose-50 text-rose-700", border: "border-rose-100" },
  purple: { icon: "bg-violet-50 text-violet-700", soft: "bg-violet-50", text: "text-violet-700", bar: "bg-violet-500", pill: "bg-violet-50 text-violet-700", border: "border-violet-100" },
  cyan: { icon: "bg-cyan-50 text-cyan-700", soft: "bg-cyan-50", text: "text-cyan-700", bar: "bg-cyan-500", pill: "bg-cyan-50 text-cyan-700", border: "border-cyan-100" },
};

function MetricCard({ label, value, helper, tone, icon: Icon, onClick }: { label: string; value: string; helper: string; tone: Tone; icon: any; onClick?: () => void }) {
  const styles = toneStyles[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-[20px] border border-slate-200 bg-white p-5 text-left shadow-[0_12px_35px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_16px_42px_rgba(37,99,235,0.12)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-3 text-[30px] font-black tracking-[-0.04em] text-slate-950">{value}</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-600"><TrendingUp size={13} /> {helper}</p>
        </div>
        <div className={classNames("rounded-2xl p-3", styles.icon)}><Icon size={21} /></div>
      </div>
    </button>
  );
}

function TerritoryCard({ city, coverage, ambassadors, leads, conversions, tone, status }: { city: string; coverage: number; ambassadors: number; leads: number; conversions: number; tone: Tone; status: string }) {
  const styles = toneStyles[tone];
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-black text-slate-950">{city}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">Couverture terrain</p>
        </div>
        <span className={classNames("rounded-full px-3 py-1 text-xs font-black", styles.pill)}>{status}</span>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm font-black text-slate-800">
        <span>Couverture</span>
        <span>{coverage}%</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className={classNames("h-full rounded-full", styles.bar)} style={{ width: `${Math.max(4, Math.min(100, coverage))}%` }} />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
        <div><p className="text-[11px] font-bold text-slate-400">Ambassadeurs</p><p className="mt-1 text-lg font-black text-slate-950">{formatNumber(ambassadors)}</p></div>
        <div><p className="text-[11px] font-bold text-slate-400">Leads MTD</p><p className="mt-1 text-lg font-black text-slate-950">{formatNumber(leads)}</p></div>
        <div><p className="text-[11px] font-bold text-slate-400">Conv. validées</p><p className="mt-1 text-lg font-black text-slate-950">{formatNumber(conversions)}</p></div>
      </div>
    </div>
  );
}

function Panel({ title, count, action, onAction, children, className }: { title: string; count?: string | number; action?: string; onAction?: () => void; children: React.ReactNode; className?: string }) {
  return (
    <section className={classNames("rounded-[24px] border border-slate-200 bg-white shadow-[0_14px_42px_rgba(15,23,42,0.06)]", className)}>
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-black tracking-[-0.02em] text-slate-950">{title}</h2>
          {count !== undefined ? <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-black text-rose-600">{count}</span> : null}
        </div>
        {action ? <button type="button" onClick={onAction} className="text-xs font-black text-blue-700 hover:text-blue-900">{action}</button> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Row({ icon: Icon, title, helper, badge, tone = "blue", onClick }: { icon: any; title: string; helper: string; badge?: string | number; tone?: Tone; onClick?: () => void }) {
  const styles = toneStyles[tone];
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between gap-4 border-b border-slate-100 py-3 text-left last:border-b-0 hover:bg-slate-50/70">
      <div className="flex min-w-0 items-start gap-3">
        <div className={classNames("mt-0.5 rounded-xl p-2", styles.icon)}><Icon size={15} /></div>
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-900">{title}</p>
          <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{helper}</p>
        </div>
      </div>
      {badge !== undefined ? <span className={classNames("shrink-0 rounded-full px-2.5 py-1 text-xs font-black", styles.pill)}>{badge}</span> : null}
    </button>
  );
}

function MiniTable({ headers, rows, onRowClick }: { headers: string[]; rows: string[][]; onRowClick?: (row: string[], index: number) => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
          <tr>{headers.map((header) => <th key={header} className="px-4 py-3">{header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.length ? rows.map((row, index) => (
            <tr key={`${row.join("-")}-${index}`} onClick={() => onRowClick?.(row, index)} className="cursor-pointer text-slate-700 hover:bg-blue-50/40">
              {row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`} className="px-4 py-3 font-semibold">{cell}</td>)}
            </tr>
          )) : (
            <tr><td colSpan={headers.length} className="px-4 py-8 text-center text-sm font-bold text-slate-400">Aucune donnée synchronisée pour ce bloc.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false, placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <label className="block text-sm font-black text-slate-700">
      {label}{required ? <span className="text-rose-600"> *</span> : null}
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options, required = false }: { label: string; value: string; onChange: (value: string) => void; options: string[]; required?: boolean }) {
  return (
    <label className="block text-sm font-black text-slate-700">
      {label}{required ? <span className="text-rose-600"> *</span> : null}
      <select
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      >
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

export default function AmbassadorCockpitRoute({
  snapshot,
  kpis,
  loading,
  refreshing,
  diagnostics = [],
  onRefresh,
}: AmbassadorCockpitRouteProps) {
  const [apiData, setApiData] = useState<ApiCollection>(emptyApiData);
  const [syncing, setSyncing] = useState(false);
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const ambassadors = useMemo(() => list(snapshot.ambassadors?.length ? snapshot.ambassadors : snapshot.records), [snapshot.ambassadors, snapshot.records]);
  const territories = useMemo(() => list(snapshot.territories), [snapshot.territories]);
  const audit = useMemo(() => list(snapshot.activity?.length ? snapshot.activity : snapshot.audit), [snapshot.activity, snapshot.audit]);
  const recruitment = apiData.recruitment.length ? apiData.recruitment : list(snapshot.recruitment);
  const missions = apiData.missions.length ? apiData.missions : list(snapshot.missions);
  const incentives = apiData.incentives.length ? apiData.incentives : list(snapshot.incentives);
  const leads = apiData.leads;
  const conversions = apiData.conversions;

  const activeAmbassadors = ambassadors.filter((item) => String(item.status || "").toLowerCase() === "active");
  const openMissions = missions.filter((item) => !["completed", "done", "archived", "terminée", "terminee"].includes(String(item.status || "").toLowerCase()));
  const completedMissions = missions.filter((item) => ["completed", "done", "terminée", "terminee"].includes(String(item.status || "").toLowerCase()));
  const pendingIncentives = incentives.filter((item) => ["pending", "approved", "en attente", "à payer", "a payer"].includes(String(item.status || "").toLowerCase()));
  const pendingPayoutTotal = pendingIncentives.reduce((sum, item) => sum + numberValue(item.amount), 0) || numberValue(kpis.incentivesPending);
  const leadsTotal = leads.length || ambassadors.reduce((sum, item) => sum + numberValue(item.leads_generated), 0);
  const conversionsPending = conversions.filter((item) => ["pending", "a_valider", "à valider", "to_validate"].includes(String(item.status || "").toLowerCase())).length;
  const conversionsValidated = conversions.filter((item) => ["validated", "validée", "validee", "approved"].includes(String(item.status || "").toLowerCase())).length || ambassadors.reduce((sum, item) => sum + numberValue(item.conversions || item.conversions_mtd), 0);

  const refreshCollections = useCallback(async () => {
    setSyncing(true);
    try {
      const [nextLeads, nextConversions, nextIncentives, nextMissions, nextRecruitment] = await Promise.all([
        apiGet("/api/market-os/ambassadors/leads"),
        apiGet("/api/market-os/ambassadors/conversions"),
        apiGet("/api/market-os/ambassadors/incentives"),
        apiGet("/api/market-os/ambassadors/missions"),
        apiGet("/api/market-os/ambassadors/recruitment"),
      ]);
      setApiData({
        leads: nextLeads,
        conversions: nextConversions,
        incentives: nextIncentives,
        missions: nextMissions,
        recruitment: nextRecruitment,
        source: "api",
        loadedAt: new Date().toISOString(),
      });
      setActionError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Synchronisation impossible");
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    void refreshCollections();
  }, [refreshCollections]);

  function openAction(mode: Exclude<ActionMode, null>) {
    const firstAmbassador = ambassadors[0];
    const firstTerritory = territories[0];
    setActionMode(mode);
    setActionError(null);
    setActionMessage(null);
    setForm({
      title: mode === "mission" ? "Mission activation terrain" : "",
      city: text(firstTerritory?.city || firstAmbassador?.city, "Casablanca"),
      region: text(firstTerritory?.region || firstAmbassador?.region, "Casablanca-Settat"),
      due_date: todayPlus(3),
      full_name: "",
      candidate_name: "",
      email: "",
      phone: "",
      source: "Referral",
      stage: "sourced",
      lead_name: "",
      parent_name: "",
      lead_type: "Parent",
      status: "new",
      ambassador_id: text(firstAmbassador?.id, ""),
      territory_id: text(firstTerritory?.id, ""),
      amount: "",
      report_type: "ambassador-cockpit",
      notes: "",
    });
  }

  async function completeAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!actionMode) return;
    setActionBusy(true);
    setActionError(null);
    setActionMessage(null);
    try {
      if (actionMode === "mission") {
        await apiSend("/api/market-os/ambassadors/missions", "POST", {
          title: form.title || "Mission activation terrain",
          mission_type: "field_activation",
          priority: "high",
          status: "assigned",
          city: form.city,
          region: form.region,
          due_date: form.due_date,
          ambassador_id: form.ambassador_id || null,
          territory_id: form.territory_id || null,
          description: form.notes || "Mission créée depuis le cockpit ambassadeurs.",
        });
        setActionMessage("Mission créée et synchronisée.");
      }
      if (actionMode === "candidate") {
        await apiSend("/api/market-os/ambassadors/recruitment", "POST", {
          candidate_name: form.candidate_name || form.full_name,
          email: form.email,
          phone: form.phone,
          city: form.city,
          region: form.region,
          source: form.source,
          stage: form.stage || "sourced",
          next_step: "Premier contact à planifier",
          notes: form.notes,
        });
        setActionMessage("Candidat créé et ajouté au pipeline.");
      }
      if (actionMode === "lead") {
        await apiSend("/api/market-os/ambassadors/leads", "POST", {
          lead_name: form.lead_name || form.parent_name || "Lead terrain",
          parent_name: form.parent_name || form.lead_name,
          email: form.email,
          phone: form.phone,
          city: form.city,
          region: form.region,
          source: form.source,
          lead_type: form.lead_type,
          status: "new",
          score: 50,
          ambassador_id: form.ambassador_id || null,
          territory_id: form.territory_id || null,
          next_followup_at: form.due_date,
          notes: form.notes,
        });
        setActionMessage("Lead créé et synchronisé.");
      }
      if (actionMode === "report") {
        const result = await apiSend("/api/market-os/ambassadors/reports/export", "POST", {
          report_type: form.report_type || "ambassador-cockpit",
          title: "Rapport cockpit ambassadeurs",
          filters: { route: "cockpit", source: "operator" },
        });
        const csv = String(result?.data?.csv || "");
        const filename = String(result?.data?.filename || `angelcare-ambassadors-cockpit-${new Date().toISOString().slice(0, 10)}.csv`);
        if (csv) {
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = filename;
          anchor.click();
          URL.revokeObjectURL(url);
        }
        setActionMessage("Rapport généré et téléchargement déclenché.");
      }
      await refreshCollections();
      onRefresh?.();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Action impossible");
    } finally {
      setActionBusy(false);
    }
  }

  async function decideConversion(conversion: AnyRecord, status: "validated" | "rejected") {
    setActionBusy(true);
    setActionError(null);
    try {
      await apiSend("/api/market-os/ambassadors/conversions/decision", "PATCH", {
        id: conversion.id,
        status,
        validation_decision: status,
        validation_note: status === "validated" ? "Validée depuis le cockpit" : "Refusée depuis le cockpit",
      });
      setActionMessage(status === "validated" ? "Conversion validée." : "Conversion refusée.");
      await refreshCollections();
      onRefresh?.();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Décision impossible");
    } finally {
      setActionBusy(false);
    }
  }

  async function decideIncentive(incentive: AnyRecord, decision: "approve" | "pay" | "reject") {
    setActionBusy(true);
    setActionError(null);
    try {
      const endpoint = decision === "approve" ? "/api/market-os/ambassadors/incentives/approve" : decision === "pay" ? "/api/market-os/ambassadors/incentives/pay" : "/api/market-os/ambassadors/incentives/reject";
      await apiSend(endpoint, "PATCH", { id: incentive.id, reason: decision === "reject" ? "Refusé depuis cockpit" : "Décision cockpit" });
      setActionMessage(decision === "pay" ? "Paiement marqué comme payé." : decision === "approve" ? "Incentive approuvé." : "Incentive rejeté.");
      await refreshCollections();
      onRefresh?.();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Décision incentive impossible");
    } finally {
      setActionBusy(false);
    }
  }

  const cityCards = useMemo(() => {
    const cities = ["Rabat", "Casablanca", "Kénitra"];
    return cities.map((city) => {
      const cityAmbassadors = ambassadors.filter((item) => text(item.city).toLowerCase().includes(city.toLowerCase()));
      const cityTerritories = territories.filter((item) => text(item.city).toLowerCase().includes(city.toLowerCase()));
      const coverage = cityTerritories.length
        ? Math.round(cityTerritories.reduce((sum, item) => sum + numberValue(item.coverage_goal || item.coverage_rate || item.coverage), 0) / cityTerritories.length)
        : Math.min(100, Math.max(0, Math.round((cityAmbassadors.length / Math.max(1, activeAmbassadors.length)) * 100)));
      const cityLeads = leads.filter((item) => text(item.city).toLowerCase().includes(city.toLowerCase())).length || cityAmbassadors.reduce((sum, item) => sum + numberValue(item.leads_generated), 0);
      const cityConversions = conversions.filter((item) => text(item.city).toLowerCase().includes(city.toLowerCase()) && ["validated", "approved", "validée", "validee"].includes(text(item.status).toLowerCase())).length;
      const tone: Tone = coverage >= 80 ? "green" : coverage >= 60 ? "amber" : "red";
      return {
        city,
        coverage,
        ambassadors: cityAmbassadors.length,
        leads: cityLeads,
        conversions: cityConversions,
        tone,
        status: coverage >= 80 ? "Sain" : coverage >= 60 ? "Attention" : "À risque",
      };
    });
  }, [activeAmbassadors.length, ambassadors, conversions, leads, territories]);

  const recruitmentRows = recruitment.slice(0, 5).map((item) => [text(item.candidate_name, "Candidat"), text(item.city, "—"), text(item.stage, "Nouveau"), String(item.created_at || "").slice(0, 10)]);
  const missionRows = missions.slice(0, 5).map((item) => [text(item.title, "Mission"), text(item.city, "—"), text(item.status, "—"), String(item.due_date || item.updated_at || "").slice(0, 10)]);
  const conversionRows = (conversions.length ? conversions : leads).slice(0, 5).map((item) => [text(item.id || item.lead_id, "Lead"), text(item.ambassador_name || item.ambassador_id, "—"), text(item.city, "—"), String(item.score || item.value || "—")]);
  const pendingConversions = conversions.filter((item) => ["pending", "a_valider", "à valider", "to_validate"].includes(text(item.status).toLowerCase())).slice(0, 8);

  return (
    <main data-ambassador-cockpit-route="real-sync" className="min-w-0 flex-1 overflow-y-auto bg-[#f6f8fb]">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-5 px-6 py-6 xl:px-8">
        <header className="rounded-[28px] border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.22em] text-blue-700">
                <span className="rounded-full bg-blue-700 px-3 py-1 text-white">Market OS</span>
                <span>Ambassadeurs · synchronisé</span>
              </div>
              <h1 className="mt-4 text-[34px] font-black tracking-[-0.055em] text-slate-950">Cockpit de pilotage</h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                Vue d’ensemble en temps réel des opérations ambassadeurs : recrutement, terrain, leads, conversions, incentives, risques et priorités.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">Source : {text(snapshot.stats?.store || snapshot.source || apiData.source, "runtime")}</span>
                <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">API collections : {apiData.loadedAt ? new Date(apiData.loadedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "en attente"}</span>
                {diagnostics.length ? <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700 ring-1 ring-amber-100">Fallback actif : {diagnostics.length} diagnostic(s)</span> : <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700 ring-1 ring-emerald-100">Supabase / API prêt</span>}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => void refreshCollections()} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:border-blue-200 hover:text-blue-700">
                <RefreshCw size={16} className={syncing || refreshing ? "animate-spin" : ""} /> Actualiser
              </button>
              <button type="button" onClick={() => openAction("mission")} className="inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] hover:bg-blue-800">
                <Plus size={17} /> Créer mission
              </button>
              <button type="button" onClick={() => openAction("candidate")} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:border-blue-200 hover:text-blue-700">
                <UserPlus size={17} /> Nouveau candidat
              </button>
              <button type="button" onClick={() => openAction("lead")} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:border-blue-200 hover:text-blue-700">
                <Target size={17} /> Nouveau lead
              </button>
              <button type="button" onClick={() => openAction("report")} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:border-blue-200 hover:text-blue-700">
                <Download size={17} /> Exporter rapport
              </button>
            </div>
          </div>
        </header>

        {loading || syncing ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-black text-blue-800"><Loader2 size={16} className="mr-2 inline animate-spin" />Synchronisation des opérations ambassadeurs…</div>
        ) : null}
        {actionError ? <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-3 text-sm font-black text-rose-700">{actionError}</div> : null}
        {actionMessage ? <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700">{actionMessage}</div> : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <MetricCard label="Ambassadeurs actifs" value={formatNumber(kpis.activeAmbassadors || activeAmbassadors.length)} helper="donnée runtime" icon={Users} tone="blue" />
          <MetricCard label="Candidats en cours" value={formatNumber(kpis.recruitmentPipeline || recruitment.length)} helper="pipeline réel" icon={UserPlus} tone="purple" onClick={() => openAction("candidate")} />
          <MetricCard label="Missions en cours" value={formatNumber(openMissions.length || kpis.missionsAssigned)} helper="missions actives" icon={Flag} tone="cyan" onClick={() => openAction("mission")} />
          <MetricCard label="Leads générés" value={formatNumber(leadsTotal)} helper="leads + CRM amb." icon={Target} tone="green" onClick={() => openAction("lead")} />
          <MetricCard label="Conversions à valider" value={formatNumber(conversionsPending)} helper={`${formatNumber(conversionsValidated)} validées`} icon={BadgeCheck} tone="amber" onClick={() => setActionMode("conversion")} />
          <MetricCard label="Incentives en attente" value={formatMoney(pendingPayoutTotal)} helper={`${formatNumber(pendingIncentives.length)} lignes`} icon={Wallet} tone="red" onClick={() => setActionMode("payout")} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_0.82fr]">
          {cityCards.map((item) => <TerritoryCard key={item.city} {...item} />)}
          <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-black text-slate-700">Couverture globale</p>
                <p className="mt-2 text-[34px] font-black tracking-[-0.05em] text-blue-700">{kpis.territoryCoverage || 0}%</p>
                <p className="mt-1 flex items-center gap-1 text-xs font-black text-emerald-600"><TrendingUp size={13} /> calculé sur territoires</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 text-blue-700"><MapPinned size={30} /></div>
            </div>
            <button type="button" onClick={() => { window.location.href = "/market-os/ambassadors/territories" }} className="mt-5 w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 hover:bg-blue-100">Voir carte des territoires</button>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.95fr_1fr_1fr]">
          <Panel title="Priorités du jour" count={6} action="Traiter" onAction={() => setActionMode(conversionsPending ? "conversion" : "mission")}>
            <Row icon={BadgeCheck} title="Validations de conversions en attente" helper="Décisions synchronisées avec l’API conversions" badge={conversionsPending} tone="red" onClick={() => setActionMode("conversion")} />
            <Row icon={UserPlus} title="Candidats à contacter" helper="Créer ou qualifier une fiche candidat" badge={recruitment.length} tone="amber" onClick={() => openAction("candidate")} />
            <Row icon={ClipboardCheck} title="Missions actives à suivre" helper="Créer, suivre et clôturer depuis l’API missions" badge={openMissions.length} tone="blue" onClick={() => openAction("mission")} />
            <Row icon={Wallet} title="Incentives à approuver" helper="Approbation / paiement via endpoints incentives" badge={pendingIncentives.length} tone="amber" onClick={() => setActionMode("payout")} />
            <Row icon={Target} title="Leads sans activité" helper="Créer un lead ou planifier un suivi" badge={leads.filter((item) => ["new", "nouveau"].includes(text(item.status).toLowerCase())).length} tone="blue" onClick={() => openAction("lead")} />
          </Panel>

          <Panel title="Flux d’activité" action="Voir tout le flux">
            {(audit.length ? audit : []).slice(0, 6).map((item: any, index: number) => (
              <Row key={`${item.id || item.title || index}`} icon={Clock} title={text(item.summary || item.title || item.event_type, "Activité enregistrée")} helper={text(item.action || item.description || item.created_at, "Journal ambassadeurs")} badge={index === 0 ? "récent" : undefined} tone={index % 3 === 0 ? "blue" : index % 3 === 1 ? "green" : "purple"} />
            ))}
            {!audit.length ? <div className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">Aucun événement d’audit n’est encore synchronisé. Les prochaines actions écriront une trace.</div> : null}
          </Panel>

          <Panel title="Alertes / Risques" count={diagnostics.length || undefined} action="Audit">
            {diagnostics.length ? diagnostics.slice(0, 5).map((item, index) => (
              <Row key={`${item.area || index}`} icon={AlertTriangle} title={`Fallback ${text(item.area, "runtime")}`} helper={text(item.reason, "Source locale utilisée")} badge="à vérifier" tone="amber" />
            )) : (
              <>
                <Row icon={CheckCircle2} title="API cockpit opérationnelle" helper="Leads, conversions, missions et incentives interrogés" badge="OK" tone="green" />
                <Row icon={FileText} title="Migration SQL à appliquer si Supabase manque les tables" helper="database/market-os-ambassadors/20260712_leads_conversions_sync.sql" badge="SQL" tone="blue" />
              </>
            )}
          </Panel>
        </section>

        <section className="grid gap-5 xl:grid-cols-4">
          <Panel title="Pipeline recrutement" action="Nouveau candidat" onAction={() => openAction("candidate")}>
            <MiniTable headers={["Candidat", "Territoire", "Étape", "Ajouté le"]} rows={recruitmentRows} />
          </Panel>
          <Panel title="Exécution des missions" action="Créer mission" onAction={() => openAction("mission")}>
            <MiniTable headers={["Mission", "Territoire", "Statut", "Échéance"]} rows={missionRows} />
          </Panel>
          <Panel title="Conversions à valider" action="Traiter" onAction={() => setActionMode("conversion")}>
            <MiniTable headers={["Lead", "Ambassadeur", "Territoire", "Score"]} rows={conversionRows} />
          </Panel>
          <Panel title="Exposition payouts" action="Contrôler" onAction={() => setActionMode("payout")}>
            <div className="flex items-center gap-5">
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-[conic-gradient(#2563eb_0_57%,#22c55e_57%_78%,#f59e0b_78%_91%,#ef4444_91%_100%)]">
                <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
                  <span className="text-lg font-black text-slate-950">{formatNumber(pendingPayoutTotal)}</span>
                  <span className="text-[10px] font-black uppercase text-slate-400">MAD</span>
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-2 text-sm font-bold text-slate-600">
                <div className="flex justify-between"><span>À approuver</span><strong className="text-slate-950">{formatMoney(pendingPayoutTotal)}</strong></div>
                <div className="flex justify-between"><span>Payés MTD</span><strong className="text-slate-950">{formatMoney(kpis.incentivesPaid || 0)}</strong></div>
                <div className="flex justify-between"><span>Lignes ouvertes</span><strong className="text-slate-950">{formatNumber(pendingIncentives.length)}</strong></div>
              </div>
            </div>
            <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-800">Actions finance reliées aux endpoints approve / pay / reject.</div>
          </Panel>
        </section>
      </div>

      {actionMode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/30 p-4 backdrop-blur-sm">
          <div className="flex max-h-[94vh] w-full max-w-[520px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.32)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Action cockpit</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">{actionMode === "mission" ? "Créer une mission" : actionMode === "candidate" ? "Nouveau candidat" : actionMode === "lead" ? "Nouveau lead" : actionMode === "conversion" ? "Conversions à valider" : actionMode === "payout" ? "Incentives & paiements" : "Exporter rapport"}</h2>
              </div>
              <button type="button" onClick={() => setActionMode(null)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
            </div>

            <form onSubmit={completeAction} className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {actionMode === "mission" ? (
                <div className="space-y-4">
                  <Field label="Titre mission" value={form.title || ""} required onChange={(value) => setForm((prev) => ({ ...prev, title: value }))} />
                  <div className="grid grid-cols-2 gap-4"><Field label="Ville" value={form.city || ""} onChange={(value) => setForm((prev) => ({ ...prev, city: value }))} /><Field label="Échéance" type="date" value={form.due_date || ""} onChange={(value) => setForm((prev) => ({ ...prev, due_date: value }))} /></div>
                  <SelectField label="Ambassadeur" value={form.ambassador_id || ""} onChange={(value) => setForm((prev) => ({ ...prev, ambassador_id: value }))} options={["", ...ambassadors.map((item) => String(item.id || "")).filter(Boolean)]} />
                  <Field label="Instructions" value={form.notes || ""} onChange={(value) => setForm((prev) => ({ ...prev, notes: value }))} placeholder="Objectif, preuve attendue, zone exacte…" />
                </div>
              ) : null}

              {actionMode === "candidate" ? (
                <div className="space-y-4">
                  <Field label="Nom candidat" value={form.candidate_name || ""} required onChange={(value) => setForm((prev) => ({ ...prev, candidate_name: value }))} />
                  <div className="grid grid-cols-2 gap-4"><Field label="Téléphone" value={form.phone || ""} onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))} /><Field label="Ville" value={form.city || ""} onChange={(value) => setForm((prev) => ({ ...prev, city: value }))} /></div>
                  <Field label="Email" type="email" value={form.email || ""} onChange={(value) => setForm((prev) => ({ ...prev, email: value }))} />
                  <SelectField label="Source" value={form.source || "Referral"} onChange={(value) => setForm((prev) => ({ ...prev, source: value }))} options={["Referral", "LinkedIn", "Site carrière", "Terrain", "WhatsApp"]} />
                </div>
              ) : null}

              {actionMode === "lead" ? (
                <div className="space-y-4">
                  <Field label="Nom lead / parent" value={form.lead_name || ""} required onChange={(value) => setForm((prev) => ({ ...prev, lead_name: value }))} />
                  <div className="grid grid-cols-2 gap-4"><Field label="Téléphone" value={form.phone || ""} onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))} /><Field label="Ville" value={form.city || ""} onChange={(value) => setForm((prev) => ({ ...prev, city: value }))} /></div>
                  <Field label="Email" type="email" value={form.email || ""} onChange={(value) => setForm((prev) => ({ ...prev, email: value }))} />
                  <SelectField label="Type lead" value={form.lead_type || "Parent"} onChange={(value) => setForm((prev) => ({ ...prev, lead_type: value }))} options={["Parent", "École", "Entreprise", "Partenaire"]} />
                  <SelectField label="Ambassadeur source" value={form.ambassador_id || ""} onChange={(value) => setForm((prev) => ({ ...prev, ambassador_id: value }))} options={["", ...ambassadors.map((item) => String(item.id || "")).filter(Boolean)]} />
                </div>
              ) : null}

              {actionMode === "conversion" ? (
                <div className="space-y-3">
                  {pendingConversions.length ? pendingConversions.map((item) => (
                    <div key={String(item.id)} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3"><div><p className="font-black text-slate-950">{text(item.lead_name || item.parent_name || item.id, "Conversion")}</p><p className="mt-1 text-xs font-bold text-slate-500">{text(item.city, "—")} · {formatMoney(item.value || item.amount || 0)}</p></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">À valider</span></div>
                      <div className="mt-4 flex gap-2"><button type="button" onClick={() => void decideConversion(item, "validated")} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white">Valider</button><button type="button" onClick={() => void decideConversion(item, "rejected")} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white">Refuser</button></div>
                    </div>
                  )) : <div className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">Aucune conversion en attente. Les nouvelles conversions seront synchronisées dans la table dédiée.</div>}
                </div>
              ) : null}

              {actionMode === "payout" ? (
                <div className="space-y-3">
                  {pendingIncentives.length ? pendingIncentives.slice(0, 8).map((item) => (
                    <div key={String(item.id)} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3"><div><p className="font-black text-slate-950">{text(item.ambassador_name || item.ambassador_id, "Ambassadeur")}</p><p className="mt-1 text-xs font-bold text-slate-500">{text(item.incentive_type, "Incentive")} · {formatMoney(item.amount)}</p></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">{text(item.status, "pending")}</span></div>
                      <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => void decideIncentive(item, "approve")} className="rounded-xl bg-blue-700 px-4 py-2 text-xs font-black text-white">Approuver</button><button type="button" onClick={() => void decideIncentive(item, "pay")} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white">Marquer payé</button><button type="button" onClick={() => void decideIncentive(item, "reject")} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white">Rejeter</button></div>
                    </div>
                  )) : <div className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">Aucun incentive en attente.</div>}
                </div>
              ) : null}

              {actionMode === "report" ? (
                <div className="space-y-4">
                  <SelectField label="Type rapport" value={form.report_type || "ambassador-cockpit"} onChange={(value) => setForm((prev) => ({ ...prev, report_type: value }))} options={["ambassador-cockpit", "ambassadors", "missions", "recruitment", "leads", "conversions", "incentives", "territories"]} />
                  <div className="rounded-2xl bg-blue-50 p-4 text-sm font-bold text-blue-800">Le rapport sera généré via le moteur existant puis téléchargé en CSV.</div>
                </div>
              ) : null}

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button type="button" onClick={() => setActionMode(null)} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700">Fermer</button>
                {["mission", "candidate", "lead", "report"].includes(String(actionMode)) ? <button type="submit" disabled={actionBusy} className="inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white disabled:opacity-60">{actionBusy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Synchroniser</button> : null}
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
