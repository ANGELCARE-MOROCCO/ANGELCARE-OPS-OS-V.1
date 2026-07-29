"use client";

import {
  Archive,
  BookOpenCheck,
  CheckCircle2,
  Download,
  FileArchive,
  FileBarChart2,
  FileSpreadsheet,
  FileText,
  LockKeyhole,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AcCapitalShell } from "../../core/AcCapitalShell";
import { Dialog, Drawer } from "../../core/Overlay";
import type { CapitalActor, Row } from "../../core/types";
import styles from "./artifacts.module.css";

const text = (value: unknown) => String(value ?? "").trim();
const rows = (value: unknown): Row[] => Array.isArray(value) ? value.filter((item): item is Row => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
const record = (value: unknown): Row => value && typeof value === "object" && !Array.isArray(value) ? value as Row : {};
const formatDate = (value: unknown) => {
  const raw = text(value); if (!raw) return "—";
  const date = new Date(raw); return Number.isNaN(date.getTime()) ? raw : new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(date);
};

const catalogue = [
  ["founder-capital-brief", "Founder Capital Brief", "Executive decision brief from the live capital department."],
  ["opportunity-qualification-pack", "Opportunity Qualification Pack", "Evidence, scores, risks, proof gaps and committee recommendation."],
  ["funding-case-book", "Funding Case Book", "Complete funder-specific case narrative, financial strategy, impact and risks."],
  ["bank-financing-dossier", "Bank Financing Dossier", "Bank-ready financing pack with proof and approval controls."],
  ["grant-application-pack", "Grant Application Pack", "Evidence-bound application response and annex roadmap."],
  ["data-room-index", "Data Room Index", "Controlled proof catalogue, missing evidence and readiness."],
  ["coordinator-execution-pack", "Coordinator Execution Pack", "Approved mission, message, attachments, checklist and proof."],
  ["weekly-capital-report", "Weekly Capital Report", "Portfolio, deadlines, risks, decisions and next actions."],
] as const;

const formatIcon: Record<string, typeof FileText> = { pdf: FileText, docx: BookOpenCheck, xlsx: FileSpreadsheet, zip: FileArchive, csv: FileSpreadsheet, json: FileBarChart2 };

export function ArtifactsPage({ actor }: { actor: CapitalActor }) {
  const [data, setData] = useState<Row>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Row | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [form, setForm] = useState({ artifactType: "founder-capital-brief", title: "Founder Capital Brief", entityType: "", entityId: "", reportId: "", audience: "Founder / Management", purpose: "Produce an evidence-bound executive capital decision pack.", aiCompose: true });

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/ac-capital-os/artifacts", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) throw new Error(payload.warning || payload.code || "ARTIFACT_LOAD_FAILED");
      setData(record(payload.data));
    } catch (reason) { setError(reason instanceof Error ? reason.message : text(reason)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  const artifacts = rows(data.artifacts);
  const versions = rows(data.versions);
  const approved = artifacts.filter((item) => text(item.approval_status) === "approved");
  const generatedFormats = new Set(versions.map((item) => text(item.format)).filter(Boolean));

  const selectedVersions = useMemo(() => selected ? versions.filter((item) => text(item.artifact_id) === text(selected.id)) : [], [selected, versions]);

  async function generate() {
    setBusy("generate"); setError("");
    try {
      const response = await fetch("/api/ac-capital-os/artifacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, formats: ["pdf", "docx", "xlsx", "zip"] }) });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) throw new Error(payload.warning || payload.code || "ARTIFACT_GENERATION_FAILED");
      setGenerateOpen(false); await load(); setSelected(record(record(payload.data).artifact));
    } catch (reason) { setError(reason instanceof Error ? reason.message : text(reason)); }
    finally { setBusy(""); }
  }

  async function decideArtifact(decision: "pending" | "approved" | "rejected") {
    if (!selected) return;
    setBusy(`artifact-${decision}`); setError("");
    try {
      const response = await fetch("/api/ac-capital-os/orchestrator", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "artifact-approval", payload: { artifactId: selected.id, decision, version: selected.current_version || 1 } }),
      });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) throw new Error(payload.warning || payload.code || payload.message || "ARTIFACT_APPROVAL_FAILED");
      await load(); setSelected(record(record(payload.data).artifact));
    } catch (reason) { setError(reason instanceof Error ? reason.message : text(reason)); }
    finally { setBusy(""); }
  }

  const insights = [
    { label: "Artifacts", value: String(artifacts.length) },
    { label: "Approved", value: String(approved.length), tone: approved.length ? "success" : "warning" },
    { label: "Formats generated", value: String(generatedFormats.size) },
    { label: "Release boundary", value: "Human controlled" },
  ];

  return (
    <AcCapitalShell actor={actor} workspaceKey="artifacts" title="Capital Document & Artifact Factory" subtitle="Generate premium evidence-bound PDF, DOCX, XLSX, CSV, JSON and ZIP packs with version history, approval status and immutable release snapshots." envelope={null} insights={insights} primaryAction="Generate Artifact" onPrimaryAction={() => setGenerateOpen(true)}>
      <main className={styles.page}>
        <section className={styles.hero}>
          <div><span><Sparkles size={16}/> INSTITUTIONAL DOCUMENT FACTORY</span><h2>Turn approved capital intelligence into polished, traceable and downloadable executive artifacts.</h2><p>Every file is regenerated from a persisted source snapshot, versioned, hashed and kept under founder-controlled external release.</p><div><button onClick={() => setGenerateOpen(true)}><Plus size={16}/> Generate artifact</button><button className={styles.secondary} onClick={() => void load()}><RefreshCw size={16}/> Refresh</button></div></div>
          <aside><LockKeyhole size={30}/><strong>Approval-bound output</strong><span>Draft waterline, immutable approved snapshot and SHA-256 evidence.</span></aside>
        </section>

        {error ? <section className={styles.error}>{error}</section> : null}

        <section className={styles.catalogue}><header><span>ARTIFACT CATALOGUE</span><h3>Purpose-built capital documents</h3></header><div>{catalogue.map(([key,label,detail]) => <button key={key} onClick={() => { setForm((current) => ({ ...current, artifactType:key, title:label })); setGenerateOpen(true); }}><FileText/><strong>{label}</strong><span>{detail}</span><em>Generate</em></button>)}</div></section>

        <section className={styles.library}><header><div><span>ARTIFACT LIBRARY</span><h3>Generated versions and release state</h3></div><strong>{artifacts.length}</strong></header>
          {loading ? <div className={styles.empty}>Loading artifact library…</div> : artifacts.length ? <div className={styles.grid}>{artifacts.map((artifact) => <button key={text(artifact.id)} onClick={() => setSelected(artifact)}><div><span data-status={text(artifact.approval_status)}>{text(artifact.approval_status || "not-requested")}</span><em>v{Number(artifact.current_version || 1)}</em></div><FileArchive/><strong>{text(artifact.title)}</strong><p>{text(artifact.artifact_type).replaceAll("-", " ")}</p><footer><span>{Array.isArray(artifact.formats) ? artifact.formats.map(String).join(" · ") : "pdf · docx"}</span><time>{formatDate(artifact.updated_at || artifact.created_at)}</time></footer></button>)}</div> : <div className={styles.empty}><FileArchive/><strong>No artifacts generated yet</strong><span>Generate the first Founder Capital Brief or Funding Case Book.</span><button onClick={() => setGenerateOpen(true)}>Generate artifact</button></div>}
        </section>
      </main>

      <Drawer open={Boolean(selected)} title={text(selected?.title || "Capital artifact")} eyebrow="Versioned artifact inspection" onClose={() => setSelected(null)} footer={<><button className={styles.secondaryButton} onClick={() => setSelected(null)}>Close</button><a className={styles.primaryLink} href={`/api/ac-capital-os/artifacts/${text(selected?.id)}/download?format=zip`}><Download size={15}/> Download full ZIP</a></>}>
        {selected ? <div className={styles.drawer}>
          <section className={styles.factGrid}><article><span>Type</span><strong>{text(selected.artifact_type).replaceAll("-", " ")}</strong></article><article><span>Version</span><strong>v{Number(selected.current_version || 1)}</strong></article><article><span>Approval</span><strong>{text(selected.approval_status)}</strong></article><article><span>Confidentiality</span><strong>{text(selected.confidentiality)}</strong></article></section>
          <section className={styles.approvalCommands}><button onClick={() => void decideArtifact("pending")} disabled={Boolean(busy)}><ShieldCheck size={15}/> Request founder approval</button><button onClick={() => void decideArtifact("approved")} disabled={Boolean(busy)}><CheckCircle2 size={15}/> Approve exact version</button><button onClick={() => void decideArtifact("rejected")} disabled={Boolean(busy)}><Archive size={15}/> Reject / rework</button></section>
          <section className={styles.downloads}><h3>Generate or download format</h3><div>{["pdf","docx","xlsx","csv","json","zip"].map((format) => { const Icon = formatIcon[format] || FileText; return <a key={format} href={`/api/ac-capital-os/artifacts/${text(selected.id)}/download?format=${format}`}><Icon/><strong>{format.toUpperCase()}</strong><span>Versioned download</span><Download size={14}/></a>; })}</div></section>
          <section className={styles.versionList}><header><h3>Generation history</h3><strong>{selectedVersions.length}</strong></header>{selectedVersions.length ? selectedVersions.map((version) => <article key={text(version.id)}><div><strong>{text(version.format).toUpperCase()} · v{Number(version.version_no || 1)}</strong><span>{text(version.status)}</span></div><code>{text(version.sha256) || "Hash created on download"}</code><time>{formatDate(version.generated_at)}</time></article>) : <p>No format has been downloaded yet. The first download creates the version hash record.</p>}</section>
          <details open><summary>Persisted content snapshot</summary><pre>{JSON.stringify(selected.content_snapshot || {}, null, 2)}</pre></details>
          <details><summary>Source snapshot</summary><pre>{JSON.stringify(selected.source_snapshot || {}, null, 2)}</pre></details>
        </div> : null}
      </Drawer>

      <Dialog open={generateOpen} title="Generate Capital Artifact" eyebrow="Evidence-bound document production" wide onClose={() => setGenerateOpen(false)} footer={<><button className={styles.secondaryButton} onClick={() => setGenerateOpen(false)}>Cancel</button><button className={styles.primaryButton} onClick={() => void generate()} disabled={Boolean(busy)}>{busy ? "Generating…" : "Generate governed artifact"}</button></>}>
        <div className={styles.form}>
          <label><span>Artifact type</span><select value={form.artifactType} onChange={(event) => { const selected = catalogue.find(([key]) => key === event.target.value); setForm({ ...form, artifactType:event.target.value, title:selected?.[1] || form.title }); }}>{catalogue.map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label><span>Title</span><input value={form.title} onChange={(event) => setForm({ ...form, title:event.target.value })}/></label>
          <label><span>Entity type</span><select value={form.entityType} onChange={(event) => setForm({ ...form, entityType:event.target.value })}><option value="">Department-wide brief</option><option value="qualification">Qualification</option><option value="case">Funding case</option><option value="pipeline">Pipeline record</option><option value="document">Data Room document</option></select></label>
          <label><span>Entity ID</span><input value={form.entityId} onChange={(event) => setForm({ ...form, entityId:event.target.value })} placeholder="Optional canonical record UUID"/></label>
          <label><span>Audience</span><input value={form.audience} onChange={(event) => setForm({ ...form, audience:event.target.value })}/></label>
          <label className={styles.wide}><span>Purpose</span><textarea value={form.purpose} onChange={(event) => setForm({ ...form, purpose:event.target.value })}/></label>
          <label className={styles.toggle}><input type="checkbox" checked={form.aiCompose} onChange={(event) => setForm({ ...form, aiCompose:event.target.checked })}/><span><strong>Compose substantive sections with OpenRouter Free</strong><small>Uses the persisted AC Capital source snapshot only. Human review remains mandatory.</small></span></label>
        </div>
        <section className={styles.safety}><ShieldCheck/><div><strong>External release remains locked</strong><span>Generation does not send, submit, publish or create a legal or financial commitment.</span></div><CheckCircle2/></section>
      </Dialog>
    </AcCapitalShell>
  );
}
