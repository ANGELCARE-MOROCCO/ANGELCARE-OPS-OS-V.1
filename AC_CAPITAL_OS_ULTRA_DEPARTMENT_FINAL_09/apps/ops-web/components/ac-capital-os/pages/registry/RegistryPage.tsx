"use client";

import {
  Archive,
  ArrowUpRight,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  CopyCheck,
  Database,
  FileClock,
  FileText,
  GitMerge,
  History,
  Link2,
  MessageSquareText,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  UserRoundCheck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AcCapitalShell } from "../../core/AcCapitalShell";
import { Dialog, Drawer } from "../../core/Overlay";
import type { CapitalActor, Row } from "../../core/types";
import styles from "./registry.module.css";

const text = (value: unknown) => String(value ?? "").trim();
const row = (value: unknown): Row => value && typeof value === "object" && !Array.isArray(value) ? value as Row : {};
const rows = (value: unknown): Row[] => Array.isArray(value) ? value.filter((item): item is Row => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
const pretty = (value: unknown) => { try { return JSON.stringify(value ?? null, null, 2); } catch { return text(value); } };
const formatDate = (value: unknown) => {
  const raw = text(value); if (!raw) return "—";
  const date = new Date(raw); return Number.isNaN(date.getTime()) ? raw : new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(date);
};

const types = [
  ["all", "All institutional records"],
  ["source", "Radar sources"],
  ["opportunity", "Opportunities"],
  ["funder", "Funders"],
  ["qualification", "Qualifications"],
  ["case", "Funding cases"],
  ["document", "Data Room documents"],
  ["pipeline", "Pipeline records"],
  ["coordinator-task", "Coordinator missions"],
  ["approval", "Approvals"],
  ["report", "Reports"],
  ["artifact", "Artifacts"],
] as const;

const workspaceRoutes: Record<string, string> = {
  radar: "/ac-capital-os/radar", funders: "/ac-capital-os/funders", qualification: "/ac-capital-os/qualification",
  cases: "/ac-capital-os/cases", "data-room": "/ac-capital-os/data-room", pipeline: "/ac-capital-os/pipeline",
  coordinator: "/ac-capital-os/coordinator", approvals: "/ac-capital-os/approvals", reports: "/ac-capital-os/reports",
  artifacts: "/ac-capital-os/artifacts",
};

function recordStatus(record: Row) {
  return text(record.display_status || record.lifecycle_status || record.status || record.approval_status || record.verification_status || "active");
}

export function RegistryPage({ actor }: { actor: CapitalActor }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [entityType, setEntityType] = useState("all");
  const [status, setStatus] = useState("all");
  const [records, setRecords] = useState<Row[]>([]);
  const [warnings, setWarnings] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Row | null>(null);
  const [detail, setDetail] = useState<Row>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Row | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [note, setNote] = useState("");
  const [assignee, setAssignee] = useState("");
  const [mergeTarget, setMergeTarget] = useState("");
  const [changes, setChanges] = useState<Row>({});

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ mode: "search", entityType, status, limit: "80" });
      if (query.trim()) params.set("query", query.trim());
      const response = await fetch(`/api/ac-capital-os/institutional?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json() as Row;
      if (!response.ok || payload.ok === false) throw new Error(text(row(payload.error).message || payload.error || payload.message || "REGISTRY_LOAD_FAILED"));
      const data = row(payload.data || payload);
      setRecords(rows(data.records)); setWarnings(rows(data.warnings));
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : text(loadError)); }
    finally { setLoading(false); }
  }, [entityType, query, status]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 220); return () => window.clearTimeout(timer); }, [load]);

  const loadDetail = useCallback(async (record: Row) => {
    setSelected(record); setError("");
    try {
      const params = new URLSearchParams({ entityType: text(record.entity_type), entityId: text(record.id), workspaceKey: text(record.workspace_key) });
      const response = await fetch(`/api/ac-capital-os/institutional?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json() as Row;
      if (!response.ok || payload.ok === false) throw new Error(text(row(payload.error).message || payload.error || payload.message || "DETAIL_LOAD_FAILED"));
      setDetail(row(payload.data || payload));
    } catch (detailError) { setError(detailError instanceof Error ? detailError.message : text(detailError)); }
  }, []);

  const act = useCallback(async (action: string, payload: Row) => {
    setBusy(action); setError("");
    try {
      const response = await fetch("/api/ac-capital-os/institutional", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, payload }) });
      const body = await response.json() as Row;
      if (!response.ok || body.ok === false) throw new Error(text(row(body.error).message || body.error || body.message || "REGISTRY_ACTION_FAILED"));
      const data = row(body.data || body); setResult(data); await load();
      if (selected) await loadDetail(selected);
      return data;
    } catch (actionError) { setError(actionError instanceof Error ? actionError.message : text(actionError)); return null; }
    finally { setBusy(""); }
  }, [load, loadDetail, selected]);

  const statusOptions = useMemo(() => ["all", ...Array.from(new Set(records.map(recordStatus).filter(Boolean))).sort()], [records]);
  const selectedType = text(selected?.entity_type);
  const selectedId = text(selected?.id);
  const entity = row(detail.entity || selected);
  const versions = rows(detail.versions).filter((item) => text(item.entity_type) === selectedType && text(item.entity_id) === selectedId);
  const notes = rows(detail.notes).filter((item) => text(item.entity_type) === selectedType && text(item.entity_id) === selectedId);
  const assignments = rows(detail.assignments).filter((item) => text(item.entity_type) === selectedType && text(item.entity_id) === selectedId);
  const artifacts = rows(detail.artifacts).filter((item) => text(item.entity_type) === selectedType && text(item.entity_id) === selectedId);

  const openEdit = () => {
    setChanges({
      title: entity.title, name: entity.name, case_title: entity.case_title, task_title: entity.task_title,
      status: entity.status, lifecycle_status: entity.lifecycle_status, owner: entity.owner || entity.recommended_owner,
      priority: entity.priority, next_action: entity.next_action, stage: entity.stage, decision_label: entity.decision_label,
    });
    setEditOpen(true);
  };

  return (
    <AcCapitalShell actor={actor} workspaceKey="registry" title="Institutional Record Registry" subtitle="Canonical record operations, optimistic version control, assignments, notes, merge discipline, audit history and cross-workspace traceability." envelope={null} insights={[
      { label: "Visible records", value: String(records.length) },
      { label: "Entity universes", value: String(types.length - 1) },
      { label: "Compatibility warnings", value: String(warnings.length), tone: warnings.length ? "warning" : "success" },
      { label: "Governance", value: "Versioned", tone: "success" },
    ]}>
      <main className={styles.page}>
        <section className={styles.commandBar}>
          <div><span>INSTITUTIONAL CONTROL PLANE</span><h2>One governed registry for the entire capital department</h2><p>Create in the purpose-built workspace; inspect, update, assign, archive, restore, merge, version and trace here.</p></div>
          <button onClick={() => void load()} disabled={loading}><RefreshCw size={16} className={loading ? styles.spin : ""}/> Refresh registry</button>
        </section>

        <section className={styles.filters}>
          <label><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, funder, case, mission or artifact…"/></label>
          <select value={entityType} onChange={(event) => setEntityType(event.target.value)}>{types.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>{statusOptions.map((value) => <option key={value} value={value}>{value === "all" ? "All statuses" : value}</option>)}</select>
          <button onClick={() => { setQuery(""); setEntityType("all"); setStatus("all"); }}><X size={15}/> Clear</button>
        </section>

        {error ? <div className={styles.error}>{error}</div> : null}
        {warnings.length ? <div className={styles.warning}><ShieldCheck size={17}/><div><strong>Registry loaded with compatibility warnings</strong>{warnings.map((item) => <span key={text(item.table)}>{text(item.entityType)} · {text(item.error)}</span>)}</div></div> : null}

        <section className={styles.registryGrid}>
          <div className={styles.tablePanel}>
            <header><div><span>CANONICAL RECORDS</span><h3>{loading ? "Loading institutional records…" : `${records.length} record(s)`}</h3></div><Database size={21}/></header>
            <div className={styles.tableWrap}>
              <table><thead><tr><th>Record</th><th>Universe</th><th>Status</th><th>Owner / next action</th><th>Version</th><th></th></tr></thead>
                <tbody>{records.map((record) => <tr key={`${text(record.entity_type)}-${text(record.id)}`} onClick={() => void loadDetail(record)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") void loadDetail(record); }}>
                  <td><strong>{text(record.display_title)}</strong><small>{formatDate(record.updated_at || record.created_at)}</small></td>
                  <td><span className={styles.entityType}>{text(record.entity_type)}</span></td>
                  <td><span className={styles.status}>{recordStatus(record)}</span></td>
                  <td><strong>{text(record.owner || record.recommended_owner || "Unassigned")}</strong><small>{text(record.next_action || record.decision_requested || "Open record for details")}</small></td>
                  <td>v{Number(record.record_version || record.current_version || 1)}</td>
                  <td><ArrowUpRight size={15}/></td>
                </tr>)}</tbody>
              </table>
              {!loading && !records.length ? <div className={styles.empty}><BookOpenCheck size={30}/><strong>No record matches this view</strong><span>Adjust filters or create the record in its purpose-built AC Capital workspace.</span></div> : null}
            </div>
          </div>

          <aside className={styles.integrityRail}>
            <header><CopyCheck size={20}/><div><span>CRUD INTEGRITY</span><h3>Non-destructive operations</h3></div></header>
            <article><History size={18}/><div><strong>Optimistic locking</strong><span>Concurrent edits cannot silently overwrite a newer record version.</span></div></article>
            <article><GitMerge size={18}/><div><strong>Merge, never erase</strong><span>Duplicates preserve their history and link to the canonical target.</span></div></article>
            <article><Archive size={18}/><div><strong>Archive & restore</strong><span>Governed lifecycle replaces destructive ordinary deletion.</span></div></article>
            <article><FileClock size={18}/><div><strong>Full record evidence</strong><span>Notes, assignments, artifacts and before/after versions stay traceable.</span></div></article>
          </aside>
        </section>
      </main>

      <Drawer open={Boolean(selected)} onClose={() => { setSelected(null); setDetail({}); }} eyebrow={`${selectedType || "record"} · v${Number(entity.record_version || entity.current_version || 1)}`} title={text(entity.display_title || entity.title || entity.name || entity.case_title || entity.task_title || "Institutional record")} footer={<><button className={styles.secondary} onClick={() => setSelected(null)}>Close</button><button className={styles.primary} onClick={openEdit}><Save size={15}/> Edit controlled fields</button></>}>
        {selected ? <div className={styles.drawerBody}>
          <section className={styles.factGrid}>
            <article><span>Status</span><strong>{recordStatus(entity)}</strong></article><article><span>Workspace</span><strong>{text(selected.workspace_key)}</strong></article>
            <article><span>Version</span><strong>v{Number(entity.record_version || entity.current_version || 1)}</strong></article><article><span>Updated</span><strong>{formatDate(entity.updated_at || entity.created_at)}</strong></article>
          </section>
          <section className={styles.actions}>
            <button onClick={() => router.push(workspaceRoutes[text(selected.workspace_key)] || "/ac-capital-os/orchestrator")}><ArrowUpRight size={15}/> Open purpose-built workspace</button>
            {text(entity.lifecycle_status) === "archived" ? <button onClick={() => void act("restore", { entityType: selectedType, entityId: selectedId })}><RotateCcw size={15}/> Restore</button> : <button onClick={() => void act("archive", { entityType: selectedType, entityId: selectedId, reason: "Archived from institutional registry" })}><Archive size={15}/> Archive</button>}
          </section>

          <section className={styles.editorCard}><header><MessageSquareText size={18}/><div><span>INTERNAL NOTE</span><h3>Add governed context</h3></div></header><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Decision context, evidence note, blocker or review instruction…"/><button disabled={!note.trim() || Boolean(busy)} onClick={async () => { const done = await act("add-note", { entityType: selectedType, entityId: selectedId, body: note }); if (done) setNote(""); }}><MessageSquareText size={15}/> Add note</button></section>
          <section className={styles.editorCard}><header><UserRoundCheck size={18}/><div><span>ASSIGNMENT</span><h3>Set accountable owner</h3></div></header><input value={assignee} onChange={(event) => setAssignee(event.target.value)} placeholder="Owner or reviewer name"/><button disabled={!assignee.trim() || Boolean(busy)} onClick={async () => { const done = await act("assign", { entityType: selectedType, entityId: selectedId, assigneeName: assignee, assignmentType: "owner" }); if (done) setAssignee(""); }}><UserRoundCheck size={15}/> Assign record</button></section>
          <section className={styles.editorCard}><header><GitMerge size={18}/><div><span>CANONICAL MERGE</span><h3>Supersede duplicate without deleting history</h3></div></header><input value={mergeTarget} onChange={(event) => setMergeTarget(event.target.value)} placeholder="Canonical target UUID"/><button disabled={!mergeTarget.trim() || Boolean(busy)} onClick={async () => { const done = await act("merge-record", { entityType: selectedType, entityId: selectedId, targetId: mergeTarget, reason: "Canonical duplicate merge" }); if (done) setMergeTarget(""); }}><GitMerge size={15}/> Merge into target</button></section>

          <section className={styles.timeline}><header><History size={18}/><h3>Version history</h3><span>{versions.length}</span></header>{versions.length ? versions.map((version) => <details key={text(version.id)}><summary><strong>v{Number(version.version_no || 1)} · {text(version.change_type)}</strong><span>{formatDate(version.created_at)}</span></summary><pre>{pretty(version.snapshot)}</pre></details>) : <p>No version snapshots are recorded yet.</p>}</section>
          <section className={styles.timeline}><header><MessageSquareText size={18}/><h3>Notes</h3><span>{notes.length}</span></header>{notes.map((item) => <article key={text(item.id)}><strong>{text(item.created_by || "Internal operator")}</strong><span>{formatDate(item.created_at)}</span><p>{text(item.body)}</p></article>)}</section>
          <section className={styles.timeline}><header><UserRoundCheck size={18}/><h3>Assignments</h3><span>{assignments.length}</span></header>{assignments.map((item) => <article key={text(item.id)}><strong>{text(item.assignee_name || item.assignee_id)}</strong><span>{text(item.status)} · {formatDate(item.created_at)}</span><p>{text(item.reason || item.assignment_type)}</p></article>)}</section>
          <section className={styles.timeline}><header><FileText size={18}/><h3>Connected artifacts</h3><span>{artifacts.length}</span></header>{artifacts.map((item) => <article key={text(item.id)}><strong>{text(item.title)}</strong><span>{text(item.approval_status)} · v{Number(item.current_version || 1)}</span><p><a href={`/api/ac-capital-os/artifacts/${text(item.id)}/download?format=pdf`}>Download PDF</a></p></article>)}</section>
          <details className={styles.raw}><summary><Link2 size={15}/> Complete canonical record</summary><pre>{pretty(entity)}</pre></details>
        </div> : null}
      </Drawer>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} eyebrow="OPTIMISTIC VERSION CONTROL" title="Edit controlled institutional fields" footer={<><button className={styles.secondary} onClick={() => setEditOpen(false)}>Cancel</button><button className={styles.primary} disabled={Boolean(busy)} onClick={async () => { const filtered = Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined)); const done = await act("edit-record", { entityType: selectedType, entityId: selectedId, expectedVersion: Number(entity.record_version || 1), changes: filtered }); if (done) setEditOpen(false); }}><CheckCircle2 size={15}/> Save new version</button></>}>
        <div className={styles.editGrid}>{Object.entries(changes).map(([key, value]) => <label key={key}><span>{key.replaceAll("_", " ")}</span><input value={text(value)} onChange={(event) => setChanges((current) => ({ ...current, [key]: event.target.value }))}/></label>)}</div>
      </Dialog>

      <Dialog open={Boolean(result)} onClose={() => setResult(null)} eyebrow="COMMAND EVIDENCE" title="Institutional action completed" footer={<button className={styles.primary} onClick={() => setResult(null)}>Close evidence</button>}><pre className={styles.result}>{pretty(result)}</pre></Dialog>
    </AcCapitalShell>
  );
}
