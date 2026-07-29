"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BellRing, Bot, Command, Database, Menu, Search, ShieldCheck, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { getEnvelope } from "./api";
import { capitalNavigation, commandPaletteItems } from "./navigation";
import { StatusBadge } from "./StatusBadge";
import type { ApiEnvelope, CapitalActor, Row } from "./types";
import styles from "./shell.module.css";

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
  const [navOpen, setNavOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Row[]>([]);

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof capitalNavigation>();
    for (const item of capitalNavigation) groups.set(item.group, [...(groups.get(item.group) || []), item]);
    return Array.from(groups.entries());
  }, []);

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

  return <div className={styles.shell}>
    <aside className={`${styles.sidebar} ${navOpen ? styles.sidebarOpen : ""}`}>
      <div className={styles.brand}><div className={styles.brandMark}><span>AC</span></div><div><small>AngelCare</small><strong>Capital OS</strong></div><button className={styles.mobileClose} onClick={() => setNavOpen(false)}><X size={18} /></button></div>
      <div className={styles.roleCard}><ShieldCheck size={18} /><div><strong>{actor.role}</strong><span>{actor.name}</span></div></div>
      <nav>{grouped.map(([group, items]) => <section key={group}><h3>{group}</h3>{items.map((item) => <Link key={item.key} href={item.href} className={`${styles.navItem} ${pathname === item.href ? styles.navActive : ""}`}><span>{item.label}</span>{item.attention ? <i /> : null}</Link>)}</section>)}</nav>
      <div className={styles.sidebarTruth}><StatusBadge value="No Automatic Submission" /><StatusBadge value="AI Dry Run" /><StatusBadge value="Manual Only" /></div>
    </aside>

    <div className={styles.main}>
      <header className={styles.topbar}>
        <div className={styles.topbarStart}><button className={styles.mobileMenu} onClick={() => setNavOpen(true)}><Menu size={19} /></button><div><span>{workspaceKey.replaceAll("-", " ")}</span><strong>{title}</strong></div></div>
        <div className={styles.topbarSignals}><div><Activity size={15} /><span>Data</span><b>{envelope?.dataMode === "supabase-live" ? "Live" : envelope?.dataMode === "disabled" ? "Disabled" : "Fallback"}</b></div><div><Bot size={15} /><span>AI</span><b>Dry Run</b></div><div><Database size={15} /><span>Source</span><b>{envelope?.source || "checking"}</b></div></div>
        <div className={styles.topbarActions}><button onClick={() => setSearchOpen(true)} title="Global capital search"><Search size={18} /></button><button disabled title="Notification delivery is not configured for AC CAPITAL OS yet." aria-label="Capital notifications unavailable"><BellRing size={18} /></button><button onClick={() => setCommandOpen(true)} className={styles.command}><Command size={18} /> New Capital Action</button></div>
      </header>

      <div className={styles.pageHeader}><div><div className={styles.eyebrow}><Sparkles size={14} /> Private Capital Institution</div><h1>{title}</h1><p>{subtitle}</p></div><div className={styles.headerActions}>{envelope ? <StatusBadge value={envelope.dataMode}>{envelope.dataMode}</StatusBadge> : <StatusBadge value="Checking">Checking</StatusBadge>}{primaryAction && onPrimaryAction ? <button onClick={onPrimaryAction}>{primaryAction}</button> : null}</div></div>

      {envelope?.warning ? <div className={styles.truthBanner}><ShieldCheck size={18} /><div><strong>Operational truth boundary</strong><span>{envelope.warning}</span></div></div> : null}

      <div className={styles.workspaceGrid}><main className={styles.content}>{children}</main><aside className={styles.intelligenceRail}><div className={styles.railTitle}><span>Context Intelligence</span><strong>Next safest move</strong></div>{insights.map((item) => <article key={`${item.label}-${item.value}`}><span>{item.label}</span><strong>{item.value}</strong></article>)}<div className={styles.railPolicy}><ShieldCheck size={20} /><strong>Founder-control policy</strong><p>Sensitive financial, legal, equity, external submission and AI-prepared actions remain approval-controlled.</p></div></aside></div>
    </div>

    {navOpen ? <button className={styles.mobileBackdrop} aria-label="Close navigation" onClick={() => setNavOpen(false)} /> : null}

    {commandOpen ? <div className={styles.paletteBackdrop} onMouseDown={() => setCommandOpen(false)}><section className={styles.palette} onMouseDown={(event) => event.stopPropagation()}><header><div><Command size={20} /><div><span>Global Command Palette</span><strong>Start a controlled capital action</strong></div></div><button onClick={() => setCommandOpen(false)}><X size={18} /></button></header><div className={styles.paletteGrid}>{commandPaletteItems.map(([label, href]) => <Link key={label} href={href} onClick={() => setCommandOpen(false)}><strong>{label}</strong><span>Open dedicated workflow</span></Link>)}</div></section></div> : null}

    {searchOpen ? <div className={styles.paletteBackdrop} onMouseDown={() => setSearchOpen(false)}><section className={`${styles.palette} ${styles.searchPanel}`} onMouseDown={(event) => event.stopPropagation()}><header><div><Search size={20} /><div><span>Global Capital Search</span><strong>Search live opportunities, funders, cases, documents, deals and approvals</strong></div></div><button onClick={() => setSearchOpen(false)}><X size={18} /></button></header><div className={styles.searchBar}><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void runSearch(); }} placeholder="Search AC CAPITAL OS…" /><button onClick={() => void runSearch()} disabled={searching}>{searching ? "Searching…" : "Search"}</button></div><div className={styles.searchResults}>{results.length ? results.map((result, index) => <Link key={String(result.id || index)} href={String(result.href || "/ac-capital-os")} onClick={() => setSearchOpen(false)}><strong>{String(result.title || "Capital result")}</strong><span>{String(result.kind || "record")} · {String(result.status || "open")}</span></Link>) : <div className={styles.noResults}>Search returns only records found by the server. No fabricated results.</div>}</div></section></div> : null}
  </div>;
}
