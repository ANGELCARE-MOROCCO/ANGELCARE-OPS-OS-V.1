"use client";

import AngelCareLogo from "@/components/brand/AngelCareLogo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BellRing,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleX,
  Clock3,
  Command,
  Database,
  ExternalLink,
  ListChecks,
  LoaderCircle,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCapitalCommandCenter, type CapitalCommandEvent, type CapitalCommandStatus } from "./action-center";
import { getEnvelope } from "./api";
import { capitalNavigation, commandPaletteItems } from "./navigation";
import { StatusBadge } from "./StatusBadge";
import type { ApiEnvelope, CapitalActor, Row } from "./types";
import styles from "./shell.module.css";

const workspaceProfiles: Record<string, { label: string; institution: string; accent: string; accentSoft: string }> = {
  "command-floor": { label: "Founder Command", institution: "Capital Command Floor", accent: "#1d4ed8", accentSoft: "#dbeafe" },
  "opportunity-radar": { label: "Market Intelligence", institution: "Opportunity Intelligence Radar", accent: "#0f766e", accentSoft: "#ccfbf1" },
  qualification: { label: "Investment Committee", institution: "Qualification Committee", accent: "#7c3aed", accentSoft: "#ede9fe" },
  funders: { label: "Relationship Intelligence", institution: "Funder Intelligence Room", accent: "#be123c", accentSoft: "#ffe4e6" },
  doctrine: { label: "Institutional Knowledge", institution: "Capital Doctrine Vault", accent: "#4338ca", accentSoft: "#e0e7ff" },
  cases: { label: "Case Production", institution: "Fundraising Case Factory", accent: "#b45309", accentSoft: "#fef3c7" },
  "data-room": { label: "Due Diligence", institution: "Due Diligence Vault", accent: "#0369a1", accentSoft: "#e0f2fe" },
  pipeline: { label: "Deal Execution", institution: "Capital Pipeline Command", accent: "#047857", accentSoft: "#d1fae5" },
  coordinator: { label: "Human Execution", institution: "Coordinator Mission Desk", accent: "#c2410c", accentSoft: "#ffedd5" },
  "ai-capital-brain": { label: "AI Sovereignty", institution: "AI Capital Brain Control Lab", accent: "#6d28d9", accentSoft: "#ede9fe" },
  strategy: { label: "Executive Strategy", institution: "Strategy War Room", accent: "#1e40af", accentSoft: "#dbeafe" },
  simulator: { label: "Financial Modelling", institution: "Capital Simulation Laboratory", accent: "#0f766e", accentSoft: "#ccfbf1" },
  reports: { label: "Executive Evidence", institution: "Capital Report Studio", accent: "#9f1239", accentSoft: "#ffe4e6" },
  manual: { label: "Operational Doctrine", institution: "Capital SOP Academy", accent: "#92400e", accentSoft: "#fef3c7" },
  approvals: { label: "Founder Authority", institution: "Founder Approval Chamber", accent: "#be123c", accentSoft: "#ffe4e6" },
  learning: { label: "Institutional Memory", institution: "Capital Learning Center", accent: "#4f46e5", accentSoft: "#e0e7ff" },
  settings: { label: "Governance Control", institution: "Capital System Control", accent: "#334155", accentSoft: "#e2e8f0" },
  production: { label: "Release Authority", institution: "Production Readiness Tower", accent: "#047857", accentSoft: "#d1fae5" },
};

function profileFor(workspaceKey: string) {
  return workspaceProfiles[workspaceKey] || { label: "Capital Institution", institution: workspaceKey.replaceAll("-", " "), accent: "#1d4ed8", accentSoft: "#dbeafe" };
}

function statusIcon(status: CapitalCommandStatus) {
  if (status === "running") return <LoaderCircle size={18} className={styles.spin} />;
  if (status === "completed") return <CheckCircle2 size={18} />;
  if (status === "completed-with-warnings") return <AlertTriangle size={18} />;
  if (status === "awaiting-approval" || status === "blocked") return <CircleAlert size={18} />;
  return <CircleX size={18} />;
}

function statusLabel(status: CapitalCommandStatus) {
  return status.replaceAll("-", " ");
}

function formatTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function BodyPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
}

export function AcCapitalShell({ actor, workspaceKey, title, subtitle, envelope, insights, primaryAction, onPrimaryAction, children }: {
  actor: CapitalActor;
  workspaceKey: string;
  title: string;
  subtitle: string;
  envelope: ApiEnvelope | null;
  insights: Array<{ label: string; value: string; tone?: string }>;
  primaryAction?: string;
  onPrimaryAction?: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const profile = profileFor(workspaceKey);
  const [navOpen, setNavOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Row[]>([]);
  const [zones, setZones] = useState<Array<{ id: string; label: string }>>([]);
  const [activeZone, setActiveZone] = useState("");
  const contentRef = useRef<HTMLElement>(null);
  const commandCenter = useCapitalCommandCenter();

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof capitalNavigation>();
    for (const item of capitalNavigation) groups.set(item.group, [...(groups.get(item.group) || []), item]);
    return Array.from(groups.entries());
  }, []);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    const sections = Array.from(root.querySelectorAll<HTMLElement>(":scope > section"));
    const seenIds = new Map<string, number>();
    const next = sections.map((section, index) => {
      const fallbackId = `capital-zone-${workspaceKey}-${index + 1}`;
      const baseId = (section.id || fallbackId).trim() || fallbackId;
      const occurrence = seenIds.get(baseId) || 0;
      seenIds.set(baseId, occurrence + 1);
      const id = occurrence === 0 ? baseId : `${baseId}-${index + 1}`;
      section.id = id;
      section.dataset.zoneIndex = String(index + 1).padStart(2, "0");
      const heading = section.querySelector("h2, h3");
      const label = heading?.textContent?.trim() || `Operational zone ${index + 1}`;
      return { id, label };
    });
    setZones(next);
    setActiveZone(next[0]?.id || "");
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
      if (visible) setActiveZone((visible.target as HTMLElement).id);
    }, { rootMargin: "-18% 0px -64% 0px", threshold: [0.05, 0.2, 0.45] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [children, workspaceKey]);

  async function runSearch() {
    if (query.trim().length < 2) return;
    setSearching(true);
    try {
      const response = await getEnvelope<{ results: Row[] }>(`/api/ac-capital-os/search?q=${encodeURIComponent(query.trim())}`);
      setResults(Array.isArray(response.data.results) ? response.data.results : []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function openCommandResult(event: CapitalCommandEvent) {
    commandCenter.markRead(event.id);
    if (event.actionHref && event.actionHref !== pathname) window.location.assign(event.actionHref);
    else setActivityOpen(true);
  }

  const shellStyle = {
    "--workspace-accent": profile.accent,
    "--workspace-accent-soft": profile.accentSoft,
  } as React.CSSProperties;

  return <div className={styles.shell} style={shellStyle} data-workspace={workspaceKey}>
    <aside className={`${styles.sidebar} ${navOpen ? styles.sidebarOpen : ""}`}>
      <div className={styles.brand}>
        <div className={styles.brandLogo}><AngelCareLogo size="sm" /></div>
        <div className={styles.brandWords}><small>AngelCare Institution</small><strong>AC CAPITAL OS</strong><span>Capital Intelligence & Fundraising</span></div>
        <button className={styles.mobileClose} onClick={() => setNavOpen(false)} aria-label="Close navigation"><X size={18} /></button>
      </div>
      <div className={styles.confidentiality}><ShieldCheck size={15} /><span>Confidential founder environment</span></div>
      <div className={styles.roleCard}><ShieldCheck size={18} /><div><strong>{actor.role}</strong><span>{actor.name}</span></div></div>
      <nav>{grouped.map(([group, items]) => <section key={group}><h3>{group}</h3>{items.map((item) => <Link key={item.key} href={item.href} className={`${styles.navItem} ${pathname === item.href ? styles.navActive : ""}`}><span>{item.label}</span>{item.attention ? <i /> : null}</Link>)}</section>)}</nav>
      <div className={styles.sidebarTruth}><StatusBadge value="Founder Controlled" /><StatusBadge value="Evidence First" /><StatusBadge value="No Auto Submission" /></div>
    </aside>

    <div className={styles.main}>
      <header className={styles.topbar}>
        <div className={styles.topbarStart}><button className={styles.mobileMenu} onClick={() => setNavOpen(true)} aria-label="Open navigation"><Menu size={19} /></button><div><span>{profile.label}</span><strong>{profile.institution}</strong></div></div>
        <div className={styles.topbarSignals}><div><Activity size={15} /><span>Data</span><b>{envelope?.dataMode === "supabase-live" ? "Live" : envelope?.dataMode === "disabled" ? "Disabled" : "Fallback"}</b></div><div><Bot size={15} /><span>AI</span><b>{workspaceKey === "ai-capital-brain" ? "Governed" : "Controlled"}</b></div><div><Database size={15} /><span>Source</span><b>{envelope?.source || "checking"}</b></div></div>
        <div className={styles.topbarActions}><button onClick={() => setSearchOpen(true)} title="Global capital search"><Search size={18} /></button><button onClick={() => setActivityOpen(true)} className={styles.notificationButton} title="Command Activity Center"><BellRing size={18} />{commandCenter.unread || commandCenter.running.length ? <span>{commandCenter.running.length || commandCenter.unread}</span> : null}</button><button onClick={() => setCommandOpen(true)} className={styles.command}><Command size={18} /> New Capital Action</button></div>
      </header>

      <section className={styles.institutionHeader}>
        <div className={styles.institutionIdentity}><div className={styles.institutionLogo}><AngelCareLogo size="md" /></div><div><span>ANGELCARE · PRIVATE CAPITAL INSTITUTION</span><strong>AC CAPITAL OS</strong><small>Founder-controlled capital intelligence, execution and evidence</small></div></div>
        <div className={styles.institutionAuthority}><span>Operating authority</span><strong>{actor.role}</strong><small>{actor.name}</small></div>
      </section>

      <div className={styles.pageHeader}><div><div className={styles.eyebrow}><Sparkles size={14} /> {profile.label}</div><h1>{title}</h1><p>{subtitle}</p></div><div className={styles.headerActions}>{envelope ? <StatusBadge value={envelope.dataMode}>{envelope.dataMode}</StatusBadge> : <StatusBadge value="Checking">Checking</StatusBadge>}{primaryAction && onPrimaryAction ? <button onClick={onPrimaryAction}>{primaryAction}<ChevronRight size={16} /></button> : null}</div></div>

      {envelope?.warning ? <div className={styles.truthBanner}><ShieldCheck size={18} /><div><strong>Operational truth boundary</strong><span>{envelope.warning}</span></div></div> : null}

      {zones.length > 1 ? <nav className={styles.zoneNavigator} aria-label="Workspace sections"><div><ListChecks size={16} /><strong>Operational zones</strong></div><div>{zones.map((zone, index) => <button key={`${zone.id}-${index}`} className={activeZone === zone.id ? styles.zoneActive : ""} onClick={() => document.getElementById(zone.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}><span>{String(index + 1).padStart(2, "0")}</span>{zone.label}</button>)}</div></nav> : null}

      <div className={styles.workspaceGrid}><main ref={contentRef} className={styles.content}>{children}</main><aside className={styles.intelligenceRail}><div className={styles.railTitle}><span>Context Intelligence</span><strong>Next safest move</strong></div>{insights.map((item) => <article key={`${item.label}-${item.value}`}><span>{item.label}</span><strong>{item.value}</strong></article>)}<button className={styles.railActivity} onClick={() => setActivityOpen(true)}><Activity size={18} /><div><strong>{commandCenter.running.length} running · {commandCenter.unread} unread</strong><span>Open command evidence</span></div><ChevronRight size={16} /></button><div className={styles.railPolicy}><ShieldCheck size={20} /><strong>Founder-control policy</strong><p>Sensitive financial, legal, equity, external submission and AI-prepared actions remain approval-controlled.</p></div></aside></div>
    </div>

    {navOpen ? <button className={styles.mobileBackdrop} aria-label="Close navigation" onClick={() => setNavOpen(false)} /> : null}

    {commandOpen ? <BodyPortal><div className={styles.paletteBackdrop} onMouseDown={() => setCommandOpen(false)}><section className={styles.palette} onMouseDown={(event) => event.stopPropagation()}><header><div><Command size={20} /><div><span>Global Command Palette</span><strong>Start a controlled capital action</strong></div></div><button onClick={() => setCommandOpen(false)}><X size={18} /></button></header><div className={styles.paletteGrid}>{commandPaletteItems.map(([label, href]) => <Link key={label} href={href} onClick={() => setCommandOpen(false)}><strong>{label}</strong><span>Open dedicated workflow</span></Link>)}</div></section></div></BodyPortal> : null}

    {searchOpen ? <BodyPortal><div className={styles.paletteBackdrop} onMouseDown={() => setSearchOpen(false)}><section className={`${styles.palette} ${styles.searchPanel}`} onMouseDown={(event) => event.stopPropagation()}><header><div><Search size={20} /><div><span>Global Capital Search</span><strong>Search live opportunities, funders, cases, documents, deals and approvals</strong></div></div><button onClick={() => setSearchOpen(false)}><X size={18} /></button></header><div className={styles.searchBar}><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void runSearch(); }} placeholder="Search AC CAPITAL OS…" /><button onClick={() => void runSearch()} disabled={searching}>{searching ? "Searching…" : "Search"}</button></div><div className={styles.searchResults}>{results.length ? results.map((result, index) => <Link key={String(result.id || index)} href={String(result.href || "/ac-capital-os")} onClick={() => setSearchOpen(false)}><strong>{String(result.title || "Capital result")}</strong><span>{String(result.kind || "record")} · {String(result.status || "open")}</span></Link>) : <div className={styles.noResults}>Search returns only records found by the server. No fabricated results.</div>}</div></section></div></BodyPortal> : null}

    {activityOpen ? <BodyPortal><div className={styles.activityBackdrop} onMouseDown={() => setActivityOpen(false)}><aside className={styles.activityCenter} onMouseDown={(event) => event.stopPropagation()}><header><div className={styles.activityBrand}><AngelCareLogo size="sm" /><div><span>AC CAPITAL OS</span><strong>Command Activity Center</strong></div></div><div><button onClick={commandCenter.markAllRead}>Mark all read</button><button onClick={() => setActivityOpen(false)} aria-label="Close activity center"><X size={19} /></button></div></header><section className={styles.activitySummary}><article><LoaderCircle size={18} /><strong>{commandCenter.running.length}</strong><span>Running</span></article><article><BellRing size={18} /><strong>{commandCenter.unread}</strong><span>Unread</span></article><article><CheckCircle2 size={18} /><strong>{commandCenter.events.filter((item) => item.status === "completed").length}</strong><span>Completed</span></article></section><div className={styles.activityList}>{commandCenter.events.length ? commandCenter.events.map((event) => <article key={event.id} className={`${styles.activityItem} ${styles[`activity_${event.status.replaceAll("-", "_")}`] || ""}`}><div className={styles.activityIcon}>{statusIcon(event.status)}</div><div><div className={styles.activityItemTop}><strong>{event.title}</strong><span>{statusLabel(event.status)}</span></div><p>{event.message}</p><footer><span><Clock3 size={13} /> {formatTime(event.completedAt || event.startedAt)}</span><span>{event.workspaceKey.replaceAll("-", " ")}</span>{event.auditRef ? <span>{event.auditRef}</span> : null}</footer>{event.detail ? <details><summary>Execution evidence</summary><pre>{JSON.stringify(event.detail, null, 2)}</pre></details> : null}</div><button className={styles.activityOpen} onClick={() => openCommandResult(event)} title="Open result"><ExternalLink size={16} /></button></article>) : <div className={styles.activityEmpty}><Activity size={30} /><strong>No capital commands recorded yet</strong><p>Every meaningful action will appear here with its outcome and evidence.</p></div>}</div></aside></div></BodyPortal> : null}

    {commandCenter.latestToast ? <BodyPortal><aside className={`${styles.toast} ${styles[`toast_${commandCenter.latestToast.status.replaceAll("-", "_")}`] || ""}`} role="status"><div className={styles.toastIcon}>{statusIcon(commandCenter.latestToast.status)}</div><div><span>{statusLabel(commandCenter.latestToast.status)}</span><strong>{commandCenter.latestToast.title}</strong><p>{commandCenter.latestToast.message}</p><footer><button onClick={() => { setActivityOpen(true); commandCenter.markRead(commandCenter.latestToast!.id); }}>View evidence</button>{commandCenter.latestToast.actionHref ? <button onClick={() => openCommandResult(commandCenter.latestToast!)}>Open result</button> : null}<button onClick={() => commandCenter.markRead(commandCenter.latestToast!.id)}>Dismiss</button></footer></div></aside></BodyPortal> : null}
  </div>;
}
