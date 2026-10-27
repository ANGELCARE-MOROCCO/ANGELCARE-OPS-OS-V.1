"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type FormEvent,
} from "react";
import {
  Activity,
  ArrowRight,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Code2,
  Download,
  ExternalLink,
  FilePlus2,
  FileSearch,
  Files,
  Globe2,
  Link2,
  ListChecks,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Undo2,
  Upload,
  Workflow,
  X,
} from "lucide-react";
import {
  type ChangePatch,
  type Page,
  type Project,
  type Row,
  type Snapshot,
  locales,
  parsePolicy,
  record,
  root,
  stageLabel,
} from "./model";
import s from "./seo-power.module.css";

const API = "/api/angelcare-marketplace/admin/seo-power";
const TABS = [
  ["overview", "Pilotage", Activity],
  ["explore", "Exploration", FileSearch],
  ["changes", "Corrections", ListChecks],
  ["publish", "Publication", FilePlus2],
  ["links", "Maillage & liens", Link2],
  ["schema", "Données structurées", Code2],
  ["distribution", "Diffusion", Globe2],
  ["automation", "Automatisation", Workflow],
  ["quality", "Qualité CI", ShieldCheck],
  ["history", "Journal", Clock3],
] as const;
type Modal = {
  kind: string;
  page?: Page;
  project?: Project;
  row?: Row;
  data?: Row;
};
const fmt = (v: unknown) =>
  v ? new Date(String(v)).toLocaleString("fr-FR") : "Non exécuté";
const key = () =>
  globalThis.crypto?.randomUUID?.() ||
  "seo-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
function State({ value }: { value: unknown }) {
  const text = String(value || "non vérifié");
  return (
    <span className={s.state} data-state={text}>
      {stageLabel(text)}
    </span>
  );
}
function Json({ value }: { value: unknown }) {
  return <pre className={s.json}>{JSON.stringify(value, null, 2)}</pre>;
}
function Empty({ children }: { children: ReactNode }) {
  return (
    <div className={s.empty}>
      <Files size={28} />
      <p>{children}</p>
    </div>
  );
}
function Dialog({
  title,
  drawer = false,
  busy,
  onClose,
  children,
}: {
  title: string;
  drawer?: boolean;
  busy: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    id = useId();
  useEffect(() => {
    const previous = document.activeElement,
      dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={drawer ? s.drawer : s.modal}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className={s.modalHead}>
        <div>
          <small>SEO POWER</small>
          <h2 id={id}>{title}</h2>
        </div>
        <button
          type="button"
          className={s.iconButton}
          aria-label="Fermer le panneau"
          disabled={busy}
          onClick={onClose}
        >
          <X size={19} />
        </button>
      </div>
      <div className={s.modalBody}>{children}</div>
    </dialog>
  );
}
function ChangeForm({
  page,
  initial = {},
  existing,
  busy,
  onSubmit,
}: {
  page: Page;
  initial?: ChangePatch;
  existing?: Row;
  busy: boolean;
  onSubmit: (patch: ChangePatch, reason: string) => Promise<void>;
}) {
  const [patch, setPatch] = useState<ChangePatch>({ ...initial }),
    [preview, setPreview] = useState(false);
  function set<K extends keyof ChangePatch>(field: K, value: ChangePatch[K]) {
    setPatch((v) => ({ ...v, [field]: value }));
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        void onSubmit(patch, String(f.get("reason") || ""));
      }}
    >
      <fieldset disabled={busy} className={s.form}>
        <div className={s.notice}>
          Source : <strong>{page.path}</strong> · Empreinte{" "}
          {page.content_hash?.slice(0, 12) || "nouvelle page"}. Le contenu des
          dossiers natifs reste dans son Studio.
        </div>
        <label>
          Titre de recherche
          <input
            maxLength={180}
            value={patch.title ?? ""}
            onChange={(e) => set("title", e.target.value)}
            placeholder={page.title || "Titre éditorial précis"}
          />
          <small>{(patch.title || "").length}/180 caractères</small>
        </label>
        <label>
          Description
          <textarea
            rows={3}
            maxLength={320}
            value={patch.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            placeholder={
              page.description || "Décrire la valeur réelle de cette page"
            }
          />
        </label>
        <label>
          Chemin canonique
          <input
            value={patch.canonicalPath ?? ""}
            onChange={(e) => set("canonicalPath", e.target.value)}
            placeholder={page.path}
          />
          <small>
            La cible doit appartenir au même univers et avoir été vérifiée
            récemment.
          </small>
        </label>
        <label>
          Liens contextuels — un chemin par ligne
          <textarea
            rows={4}
            value={(patch.relatedPaths || []).join("\n")}
            onChange={(e) =>
              set(
                "relatedPaths",
                e.target.value
                  .split("\n")
                  .map((v) => v.trim())
                  .filter(Boolean),
              )
            }
            placeholder="/kidflix/fr/explore/documents"
          />
          <small>
            12 cibles au maximum, publiquement vérifiées depuis moins de 24
            heures.
          </small>
        </label>
        <label className={s.check}>
          <input
            type="checkbox"
            checked={patch.schema === true}
            onChange={(e) => set("schema", e.target.checked)}
          />
          Ajouter le balisage WebPage, sans modifier les entités métier natives.
        </label>
        {page.kind === "landing" ? (
          <>
            <label>
              Titre principal H1
              <input
                required
                value={patch.heading || ""}
                onChange={(e) => set("heading", e.target.value)}
                maxLength={180}
              />
            </label>
            <label>
              Contenu éditorial
              <textarea
                required
                minLength={150}
                maxLength={24000}
                rows={12}
                value={patch.body || ""}
                onChange={(e) => set("body", e.target.value)}
              />
              <small>
                Paragraphes séparés par une ligne vide. Texte original ; aucun
                HTML exécutable.
              </small>
            </label>
          </>
        ) : null}
        <label>
          Motif de la modification
          <textarea
            required
            minLength={8}
            maxLength={2000}
            name="reason"
            rows={2}
            defaultValue={String(
              existing?.reason ||
                "Correction éditoriale après inspection de la page publique.",
            )}
          />
        </label>
        <div className={s.actions}>
          <button type="button" onClick={() => setPreview((v) => !v)}>
            <Search size={15} />
            {preview ? "Masquer" : "Prévisualiser"}
          </button>
          <button className={s.primary} type="submit">
            <Check size={16} />
            {busy ? "Enregistrement…" : "Enregistrer le brouillon"}
          </button>
        </div>
        {preview ? (
          <div className={s.searchPreview}>
            <small>Aperçu éditorial, sans simulation de classement</small>
            <strong>{patch.title || page.title}</strong>
            <span>{patch.canonicalPath || page.path}</span>
            <p>{patch.description || page.description}</p>
            {patch.body ? <p className={s.bodyPreview}>{patch.body}</p> : null}
          </div>
        ) : null}
      </fieldset>
    </form>
  );
}

export function SeoPowerWorkspace({ initial }: { initial: Snapshot }) {
  const [data, setData] = useState(initial),
    [tab, setTab] = useState("overview"),
    [projectId, setProjectId] = useState(""),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [refreshing, setRefreshing] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [modal, setModal] = useState<Modal | null>(null),
    [issueFilter, setIssueFilter] = useState("open");
  const tabRef = useRef(tab);
  tabRef.current = tab;
  const pending = useRef<{ signature: string; requestKey: string } | null>(
      null,
    ),
    sequence = useRef(0),
    abort = useRef<AbortController | null>(null),
    lastQuery = useRef({ project: "", q: "", page: 1 });
  const current = data.projects.find((p) => p.id === projectId),
    rights = data.permissions,
    enabled = data.ready && rights.manage && !busy;
  function locationState(
    nextTab: string,
    project: string,
    q: string,
    p: number,
  ) {
    const url = new URL(location.href);
    url.searchParams.set("tab", nextTab);
    if (project) url.searchParams.set("project", project);
    else url.searchParams.delete("project");
    if (q) url.searchParams.set("q", q);
    else url.searchParams.delete("q");
    url.searchParams.set("page", String(p));
    history.replaceState(null, "", url);
  }
  useEffect(() => {
    const u = new URL(location.href),
      t = u.searchParams.get("tab") || "overview",
      p = u.searchParams.get("project") || "",
      q = u.searchParams.get("q") || "",
      n = Math.max(1, Number(u.searchParams.get("page")) || 1);
    if (TABS.some((v) => v[0] === t)) setTab(t);
    setProjectId(p);
    setQuery(q);
    setPage(n);
    lastQuery.current = { project: p, q, page: n };
    return () => abort.current?.abort();
  }, []);
  async function load(
    project = lastQuery.current.project,
    q = lastQuery.current.q,
    p = lastQuery.current.page,
  ) {
    const token = ++sequence.current;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setRefreshing(true);
    lastQuery.current = { project, q, page: p };
    try {
      const search = new URLSearchParams({ project, q, page: String(p) }),
        res = await fetch(API + "?" + search, {
          cache: "no-store",
          signal: controller.signal,
        }),
        body = await res.json();
      if (!res.ok) throw Error(body.error?.message || "Lecture indisponible.");
      if (token === sequence.current) {
        setData(body.data);
        setPage(p);
        setProjectId(project);
        setQuery(q);
        locationState(tabRef.current, project, q, p);
      }
    } catch (e) {
      if (!controller.signal.aborted)
        setError(e instanceof Error ? e.message : "Lecture indisponible.");
    } finally {
      if (token === sequence.current) setRefreshing(false);
    }
  }
  async function act(action: string, input: Row): Promise<boolean> {
    const signature = JSON.stringify({ action, input });
    if (pending.current?.signature !== signature)
      pending.current = { signature, requestKey: key() };
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            input,
            requestKey: pending.current.requestKey,
          }),
        }),
        body = await res.json();
      if (!res.ok)
        throw Error(body.error?.message || "Opération non confirmée.");
      pending.current = null;
      setNotice(
        action === "run"
          ? "Lot traité. Consultez les résultats de la file."
          : "Opération confirmée. Référence " + body.requestId,
      );
      await load();
      return true;
    } catch (e) {
      setError(
        (e instanceof Error ? e.message : "Opération non confirmée.") +
          " Une nouvelle tentative identique conserve la même clé de requête.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function openPage(p: Page, kind = "detail") {
    setError("");
    try {
      const r = await fetch(
          API + "?action=detail&id=" + encodeURIComponent(p.id),
          { cache: "no-store" },
        ),
        v = await r.json();
      if (!r.ok) throw Error(v.error?.message || "Page inaccessible.");
      setModal({
        kind,
        page: v.data.page,
        project: v.data.project,
        data: v.data,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Page inaccessible.");
    }
  }
  function go(value: string) {
    setTab(value);
    locationState(value, projectId, query, page);
    setSelected([]);
  }
  function pageName(id: unknown) {
    return data.pages.find((p) => p.id === id)?.path || String(id).slice(0, 12);
  }
  async function queue(kind: string) {
    if (
      await act("queue", {
        pageIds: selected,
        kind,
        options: { discover: true },
      })
    )
      setSelected([]);
  }
  function download(value: unknown, name: string) {
    const blob = new Blob([JSON.stringify(value, null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
  const count = (name: string) =>
    data.ready ? String(data.summary[name] ?? 0) : "—";
  const filteredIssues = data.findings.filter(
    (f) => issueFilter === "all" || f.state === issueFilter,
  );
  function actionsForChange(change: Row) {
    return (
      <div className={s.rowActions}>
        <button onClick={() => setModal({ kind: "receipt", row: change })}>
          Détail
        </button>
        {change.state === "draft" ? (
          <button
            disabled={!enabled}
            onClick={async () => {
              try {
                const r = await fetch(
                    API + "?action=detail&id=" + change.page_id,
                  ),
                  v = await r.json();
                if (!r.ok || !v.data) throw Error();
                setModal({
                  kind: "revise",
                  row: change,
                  page: v.data.page,
                  project: v.data.project,
                });
              } catch {
                setError("Brouillon inaccessible.");
              }
            }}
          >
            Modifier
          </button>
        ) : null}
        {change.state === "draft" ? (
          <button
            disabled={!enabled || !rights.publish}
            onClick={() =>
              void act("approve", { id: change.id, version: change.version })
            }
          >
            <CheckCheck size={14} />
            Approuver
          </button>
        ) : null}
        {change.state === "approved" ? (
          <button
            className={s.primary}
            disabled={!enabled || !rights.publish}
            onClick={() => setModal({ kind: "publish-review", row: change })}
          >
            Publier
          </button>
        ) : null}
        {change.state === "published" ? (
          <>
            <button
              disabled={!enabled}
              onClick={() =>
                void act("queue", { pageIds: [change.page_id], kind: "verify" })
              }
            >
              Vérifier
            </button>
            <button
              disabled={!enabled || !rights.rollback}
              onClick={() => setModal({ kind: "rollback", row: change })}
            >
              <Undo2 size={14} />
              Restaurer
            </button>
          </>
        ) : null}
      </div>
    );
  }
  const registration = (
    <div className={s.actions}>
      <button
        disabled={!enabled}
        onClick={() => setModal({ kind: "register", project: current })}
      >
        <Plus size={16} />
        Ajouter des URL / CSV
      </button>
      <button
        disabled={!enabled || !current}
        onClick={() =>
          current && void act("initialize", { projectId: current.id })
        }
      >
        <Workflow size={16} />
        Initialiser les fronts natifs
      </button>
      <a
        className={s.button}
        href={
          API + "?action=export" + (projectId ? "&project=" + projectId : "")
        }
      >
        <Download size={16} />
        Exporter l’inventaire
      </a>
    </div>
  );
  return (
    <div className={s.root}>
      <header className={s.hero}>
        <div>
          <div className={s.eyebrow}>
            <span />
            ANGELCARE · EXÉCUTION & PUBLICATION
          </div>
          <h1>
            SEO POWER<span>Opérations natives</span>
          </h1>
          <p>
            Explorer. Corriger. Publier. Vérifier. Un seul espace pour les trois
            univers.
          </p>
        </div>
        <div className={s.heroActions}>
          <button disabled={refreshing || busy} onClick={() => void load()}>
            <RefreshCw size={16} className={refreshing ? s.spinning : ""} />
            {refreshing ? "Actualisation…" : "Actualiser"}
          </button>
          <button
            className={s.primary}
            disabled={!enabled}
            onClick={() => void act("run", { projectId: projectId || null })}
          >
            <Play size={16} />
            {busy ? "Traitement…" : "Traiter la file"}
          </button>
          <small>
            {data.actor} ·{" "}
            {rights.publish
              ? "Publication autorisée"
              : "Lecture / gestion selon droits"}
          </small>
        </div>
      </header>
      <div className={s.scopeBar}>
        <div className={s.worlds} role="group" aria-label="Univers SEO">
          <button
            data-active={!projectId}
            onClick={() => {
              setSelected([]);
              void load("", "", 1);
            }}
          >
            Vue consolidée
          </button>
          {data.projects.map((p) => (
            <button
              key={p.id}
              data-world={p.world}
              data-active={projectId === p.id}
              onClick={() => {
                setSelected([]);
                void load(p.id, "", 1);
              }}
            >
              <span />
              {p.name}
              {!p.enabled ? <small>En pause</small> : null}
            </button>
          ))}
        </div>
        <span className={s.scopeStatus}>
          {data.ready ? (
            <>
              <span className={s.liveDot} />
              Données de votre instance
            </>
          ) : (
            "Installation à vérifier"
          )}
        </span>
      </div>
      <nav className={s.tabs} aria-label="Navigation SEO POWER">
        {TABS.map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => go(id)}
            aria-current={tab === id ? "page" : undefined}
            data-active={tab === id}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>
      {error ? (
        <div className={s.error} role="alert">
          {error}
          <button aria-label="Fermer l’erreur" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      ) : null}
      {notice ? (
        <div className={s.success} role="status">
          <Check size={17} />
          {notice}
        </div>
      ) : null}
      {!data.ready ? (
        <section className={s.setup}>
          <ShieldCheck size={32} />
          <h2>Installer l’autorité SEO dans le Supabase existant</h2>
          <p>{data.error || "La connexion à la base n’a pas été confirmée."}</p>
          <a className={s.button} href={API + "?action=sql"}>
            <Download size={16} />
            Télécharger la migration complète
          </a>
          <p>
            Après application dans le SQL Editor Marketplace, actualisez. La
            planification indique séparément la disponibilité de pg_cron, pg_net
            et Vault.
          </p>
        </section>
      ) : null}

      {tab === "overview" ? (
        <>
          <div className={s.stats}>
            {[
              ["pages", "URL suivies", Files],
              ["indexable", "Pages HTTP 200 indexables", Globe2],
              ["issues", "Constats ouverts", FileSearch],
              ["verified", "Corrections publiées et vérifiées", CheckCheck],
            ].map(([id, label, Icon]) => {
              const I = Icon as typeof Files;
              return (
                <section key={String(id)}>
                  <I size={21} />
                  <strong>{count(String(id))}</strong>
                  <span>{String(label)}</span>
                </section>
              );
            })}
          </div>
          <div className={s.columns}>
            <section className={s.panel}>
              <div className={s.panelHead}>
                <div>
                  <small>FLUX D’EXÉCUTION</small>
                  <h2>Du constat à la page publique</h2>
                </div>
                <button onClick={() => go("changes")}>
                  Ouvrir les corrections <ArrowRight size={15} />
                </button>
              </div>
              <div className={s.pipeline}>
                {[
                  ["Exploration", count("pages"), "URL connues"],
                  ["Correction", count("issues"), "constats à traiter"],
                  ["Publication", count("published"), "révisions actives"],
                  ["Vérification", count("verified"), "confirmations servies"],
                ].map((v, i) => (
                  <div key={v[0]}>
                    <span>{i + 1}</span>
                    <h3>{v[0]}</h3>
                    <strong>{v[1]}</strong>
                    <small>{v[2]}</small>
                  </div>
                ))}
              </div>
              <p className={s.note}>
                Une notification reçue, une correction publiée et une page
                vérifiée sont trois états différents. Aucun classement ou trafic
                n’est inventé.
              </p>
            </section>
            <section className={s.panel}>
              <div className={s.panelHead}>
                <div>
                  <small>PRIORITÉS</small>
                  <h2>Actions utiles maintenant</h2>
                </div>
              </div>
              <div className={s.missions}>
                <button onClick={() => go("explore")}>
                  <FileSearch />
                  <span>
                    <strong>Construire l’inventaire public</strong>
                    <small>
                      Fronts natifs, liens découverts et imports d’URL.
                    </small>
                  </span>
                  <ArrowRight />
                </button>
                <button onClick={() => go("changes")}>
                  <ListChecks />
                  <span>
                    <strong>Traiter les constats réels</strong>
                    <small>
                      Préparer, approuver et vérifier chaque correction.
                    </small>
                  </span>
                  <ArrowRight />
                </button>
                <button onClick={() => go("automation")}>
                  <Workflow />
                  <span>
                    <strong>Configurer l’autonomie</strong>
                    <small>
                      Budgets, cadence et règle canonique explicitement activée.
                    </small>
                  </span>
                  <ArrowRight />
                </button>
              </div>
            </section>
          </div>
          <section className={s.panel}>
            <div className={s.panelHead}>
              <div>
                <small>TROIS UNIVERS · UNE AUTORITÉ</small>
                <h2>Vos périmètres d’action</h2>
              </div>
            </div>
            <div className={s.projectGrid}>
              {data.projects.map((p) => (
                <article key={p.id} data-world={p.world}>
                  <div>
                    <Globe2 size={21} />
                    <State value={p.enabled ? "succeeded" : "cancelled"} />
                  </div>
                  <h3>{p.name}</h3>
                  <p>
                    {p.origin}
                    {root(p.world)}
                  </p>
                  <dl>
                    <dt>Budget quotidien</dt>
                    <dd>{p.policy.crawlBudget} tâches</dd>
                    <dt>Cadence</dt>
                    <dd>{p.policy.intervalHours} h</dd>
                    <dt>Découverte planifiée</dt>
                    <dd>
                      {p.policy.scheduleEnabled ? "Activée" : "Désactivée"}
                    </dd>
                    <dt>Correction canonique</dt>
                    <dd>
                      {p.policy.autoCanonical ? "Activée" : "Sur approbation"}
                    </dd>
                  </dl>
                  <div className={s.actions}>
                    <button
                      onClick={() => {
                        void load(p.id, "", 1);
                        go("explore");
                      }}
                    >
                      Explorer
                    </button>
                    <button
                      disabled={!enabled}
                      onClick={() => setModal({ kind: "settings", project: p })}
                    >
                      <Settings2 size={15} />
                      Régler
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {tab === "explore" ? (
        <section className={s.panel}>
          <div className={s.panelHead}>
            <div>
              <small>CRAWLEE · HTML DU SERVEUR</small>
              <h2>Inventaire & inspection</h2>
            </div>
            {registration}
          </div>
          <form
            className={s.searchBar}
            onSubmit={(e) => {
              e.preventDefault();
              setSelected([]);
              void load(projectId, query, 1);
            }}
          >
            <Search size={18} />
            <input
              aria-label="Rechercher une URL"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un chemin, une catégorie, une ressource…"
            />
            <button type="submit">Rechercher</button>
            <span>
              {data.total} URL · page {page}
            </span>
          </form>
          <div className={s.bulk}>
            <span>{selected.length} sélectionnée(s)</span>
            <button
              disabled={!enabled || !selected.length}
              onClick={() => void queue("crawl")}
            >
              <FileSearch size={15} />
              Explorer
            </button>
            <button
              disabled={!enabled || !selected.length}
              onClick={() => void queue("links")}
            >
              <Link2 size={15} />
              Vérifier les liens
            </button>
            <button
              disabled={!enabled || !selected.length}
              onClick={() => void queue("indexnow")}
            >
              <Globe2 size={15} />
              Notifier IndexNow
            </button>
          </div>
          {data.pages.length ? (
            <div className={s.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        aria-label="Sélectionner cette page de résultats"
                        checked={
                          !!data.pages.length &&
                          data.pages.every((p) => selected.includes(p.id))
                        }
                        onChange={(e) =>
                          setSelected(
                            e.target.checked ? data.pages.map((p) => p.id) : [],
                          )
                        }
                      />
                    </th>
                    <th>Page publique</th>
                    <th>Langue / type</th>
                    <th>HTTP</th>
                    <th>Indexabilité observée</th>
                    <th>Dernier contrôle</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pages.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={"Sélectionner " + p.path}
                          checked={selected.includes(p.id)}
                          onChange={(e) =>
                            setSelected((v) =>
                              e.target.checked
                                ? [...v, p.id]
                                : v.filter((id) => id !== p.id),
                            )
                          }
                        />
                      </td>
                      <td>
                        <button
                          className={s.textButton}
                          onClick={() => void openPage(p)}
                        >
                          {p.title || p.path}
                        </button>
                        <small className={s.path}>{p.path}</small>
                      </td>
                      <td>
                        <span className={s.tag}>{p.locale.toUpperCase()}</span>
                        <small>
                          {p.kind === "landing" ? "Page SEO" : "Page native"}
                        </small>
                      </td>
                      <td>
                        <State value={p.http_status ?? "non vérifié"} />
                      </td>
                      <td>
                        {p.last_scanned_at
                          ? p.indexable
                            ? "Indexable"
                            : "Non indexable"
                          : "À explorer"}
                      </td>
                      <td>{fmt(p.last_scanned_at)}</td>
                      <td>
                        <div className={s.rowActions}>
                          <button
                            disabled={!enabled}
                            onClick={() =>
                              void act("queue", {
                                pageIds: [p.id],
                                kind: "crawl",
                                options: { discover: true },
                              })
                            }
                          >
                            Explorer
                          </button>
                          <button
                            disabled={!enabled || !p.facts}
                            onClick={() => void openPage(p, "change")}
                          >
                            Corriger
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>
              Aucune URL dans ce périmètre. Sélectionnez un univers puis
              initialisez ses fronts natifs, ou importez vos URL publiques.
            </Empty>
          )}
          <div className={s.pagination}>
            <button
              disabled={page <= 1 || refreshing}
              onClick={() => void load(projectId, query, page - 1)}
            >
              <ChevronLeft size={16} />
              Précédent
            </button>
            <span>
              {Math.min((page - 1) * 40 + 1, data.total)}–
              {Math.min(page * 40, data.total)} / {data.total}
            </span>
            <button
              disabled={page * 40 >= data.total || refreshing}
              onClick={() => void load(projectId, query, page + 1)}
            >
              Suivant
              <ChevronRight size={16} />
            </button>
          </div>
        </section>
      ) : null}

      {tab === "changes" ? (
        <>
          <section className={s.panel}>
            <div className={s.panelHead}>
              <div>
                <small>DÉTECTION → DÉCISION</small>
                <h2>Constats à traiter</h2>
              </div>
              <label>
                État{" "}
                <select
                  value={issueFilter}
                  onChange={(e) => setIssueFilter(e.target.value)}
                >
                  <option value="open">Ouverts</option>
                  <option value="ignored">Écartés</option>
                  <option value="resolved">Résolus</option>
                  <option value="all">Tous</option>
                </select>
              </label>
            </div>
            {filteredIssues.length ? (
              <div className={s.issueList}>
                {filteredIssues.map((f) => (
                  <article key={String(f.id)}>
                    <span
                      className={s.severity}
                      data-level={String(f.severity)}
                    >
                      {String(f.severity)}
                    </span>
                    <div>
                      <h3>{String(f.message)}</h3>
                      <small>
                        {pageName(f.page_id)} · {String(f.code)}
                      </small>
                      <p>
                        {String(
                          f.evidence ||
                            "Constat issu de la page effectivement servie.",
                        )}
                      </p>
                    </div>
                    <div className={s.rowActions}>
                      <button
                        onClick={() => {
                          const p = data.pages.find((p) => p.id === f.page_id);
                          if (p)
                            void openPage(
                              p,
                              f.action === "metadata" || f.action === "schema"
                                ? "change"
                                : "detail",
                            );
                          else
                            void fetch(API + "?action=detail&id=" + f.page_id)
                              .then(async (r) => {
                                const v = await r.json();
                                if (!r.ok || !v.data) throw Error();
                                return v;
                              })
                              .then((v) =>
                                setModal({
                                  kind: "change",
                                  page: v.data.page,
                                  project: v.data.project,
                                  data: v.data,
                                }),
                              )
                              .catch(() => setError("Détail indisponible."));
                        }}
                      >
                        Examiner
                      </button>
                      <button
                        disabled={!enabled}
                        onClick={() =>
                          void act("issue", {
                            id: f.id,
                            state: f.state === "ignored" ? "open" : "ignored",
                          })
                        }
                      >
                        {f.state === "ignored" ? "Rouvrir" : "Écarter"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <Empty>
                Aucun constat chargé dans cet état. Un inventaire sans
                exploration ne signifie pas que le site est vérifié.
              </Empty>
            )}
          </section>
          <section className={s.panel}>
            <div className={s.panelHead}>
              <div>
                <small>RÉVISIONS</small>
                <h2>Corrections préparées</h2>
              </div>
              <span>80 dernières révisions du périmètre</span>
            </div>
            {data.changes.length ? (
              <div className={s.changeList}>
                {data.changes.map((c) => (
                  <article key={String(c.id)}>
                    <div>
                      <State value={c.state} />
                      <h3>{pageName(c.page_id)}</h3>
                      <p>{String(c.reason)}</p>
                      <small>
                        Révision {String(c.version)} · {fmt(c.created_at)}
                        {c.verified_at ? " · Page servie vérifiée" : ""}
                      </small>
                    </div>
                    {actionsForChange(c)}
                  </article>
                ))}
              </div>
            ) : (
              <Empty>
                Les corrections apparaissent ici après préparation depuis une
                page inspectée.
              </Empty>
            )}
          </section>
        </>
      ) : null}

      {tab === "publish" ? (
        <>
          <section className={s.editorOpening}>
            <div>
              <small>PUBLICATION ÉDITORIALE</small>
              <h2>Créer des pages utiles, reliées à votre contenu réel.</h2>
              <p>
                Guides et collections par univers et langue. Les brouillons,
                l’approbation, la publication et le contrôle public restent
                séparés.
              </p>
              <button
                className={s.primary}
                disabled={!enabled}
                onClick={() => setModal({ kind: "create", project: current })}
              >
                <FilePlus2 size={17} />
                Nouvelle page SEO
              </button>
            </div>
            <div className={s.editorFacts}>
              <span>
                <Check />
                URL native par univers
              </span>
              <span>
                <Check />
                Texte original & liens vérifiés
              </span>
              <span>
                <Check />
                Données structurées typées
              </span>
              <span>
                <Check />
                Historique & restauration
              </span>
            </div>
          </section>
          <section className={s.panel}>
            <div className={s.panelHead}>
              <h2>Publications et vérifications</h2>
              <button onClick={() => go("changes")}>
                Toutes les révisions
                <ArrowRight size={16} />
              </button>
            </div>
            {data.changes.length ? (
              <div className={s.changeList}>
                {data.changes.map((c) => (
                  <article key={String(c.id)}>
                    <div>
                      <State value={c.state} />
                      <h3>
                        {String(record(c.patch).title || pageName(c.page_id))}
                      </h3>
                      <p>{String(c.reason)}</p>
                      <small>
                        {c.verified_at
                          ? "Page servie confirmée le " + fmt(c.verified_at)
                          : c.state === "published"
                            ? "Publication enregistrée ; vérification publique en attente."
                            : "Non publié."}
                      </small>
                    </div>
                    {actionsForChange(c)}
                  </article>
                ))}
              </div>
            ) : (
              <Empty>
                Créez une page ou préparez une correction. Aucun contenu de
                démonstration n’est publié.
              </Empty>
            )}
          </section>
        </>
      ) : null}

      {tab === "links" ? (
        <>
          <section className={s.panel}>
            <div className={s.panelHead}>
              <div>
                <small>LINKINATOR · VÉRIFICATIONS BORNÉES</small>
                <h2>Liens & maillage contextuel</h2>
              </div>
              <button onClick={() => go("explore")}>
                Choisir des pages
                <ArrowRight size={15} />
              </button>
            </div>
            <p className={s.note}>
              Les liens sont extraits du HTML public puis contrôlés par lots. Le
              maillage publié est configuré dans une révision, avec des cibles
              du même univers récemment vérifiées.
            </p>
            <div className={s.linkColumns}>
              {data.pages
                .filter((p) => p.facts)
                .slice(0, 9)
                .map((p) => (
                  <article key={p.id}>
                    <h3>{p.title || p.path}</h3>
                    <small>
                      {p.facts?.links.length || 0} liens publics observés
                    </small>
                    <ul>
                      {p.facts?.links.slice(0, 5).map((l) => (
                        <li key={l.url}>
                          <a
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {l.label || new URL(l.url).pathname}
                            <ExternalLink size={12} />
                          </a>
                        </li>
                      ))}
                    </ul>
                    <button
                      disabled={!enabled}
                      onClick={() => void openPage(p, "change")}
                    >
                      Organiser le maillage
                    </button>
                  </article>
                ))}
            </div>
            {!data.pages.some((p) => p.facts) ? (
              <Empty>
                Explorez une page pour construire son graphe de liens réel.
              </Empty>
            ) : null}
          </section>
          <section className={s.panel}>
            <h2>Dernières preuves Linkinator</h2>
            {data.jobs
              .filter((j) => j.kind === "links" && j.result)
              .map((j) => (
                <details className={s.details} key={String(j.id)}>
                  <summary>
                    {pageName(j.page_id)} · <State value={j.state} />
                  </summary>
                  <Json value={j.result} />
                </details>
              ))}
            {!data.jobs.some((j) => j.kind === "links" && j.result) ? (
              <Empty>Aucun contrôle de liens exécuté.</Empty>
            ) : null}
          </section>
        </>
      ) : null}

      {tab === "schema" ? (
        <section className={s.panel}>
          <div className={s.panelHead}>
            <div>
              <small>SCHEMA-DTS · JSON-LD NATIF</small>
              <h2>Données structurées & cohérence métier</h2>
            </div>
            <button onClick={() => go("explore")}>
              Inspecter une URL
              <ArrowRight size={15} />
            </button>
          </div>
          <div className={s.notice}>
            Le balisage des produits, ressources et offres d’emploi demeure lié
            aux données métier. SEO POWER peut ajouter WebPage / CollectionPage
            ; il ne fabrique ni avis, ni offres, ni résultats enrichis.
          </div>
          <div className={s.schemaGrid}>
            {data.pages
              .filter((p) => p.facts)
              .map((p) => (
                <article key={p.id}>
                  <div className={s.schemaIcon}>
                    <Code2 size={24} />
                  </div>
                  <h3>{p.title || p.path}</h3>
                  <p>
                    {p.facts?.schemas.length || 0} bloc(s) JSON-LD ·{" "}
                    {p.facts?.schemaErrors || 0} erreur(s) de lecture JSON
                  </p>
                  <small>
                    La lecture JSON ne certifie pas toutes les exigences d’un
                    moteur.
                  </small>
                  <div className={s.actions}>
                    <button
                      onClick={() => setModal({ kind: "schema", page: p })}
                    >
                      Voir le balisage
                    </button>
                    <button
                      disabled={!enabled}
                      onClick={() => void openPage(p, "change")}
                    >
                      Préparer une révision
                    </button>
                  </div>
                </article>
              ))}
          </div>
          {!data.pages.some((p) => p.facts) ? (
            <Empty>
              Les données structurées apparaissent après exploration des pages
              réellement publiées.
            </Empty>
          ) : null}
        </section>
      ) : null}

      {tab === "distribution" ? (
        <>
          <section className={s.panel}>
            <div className={s.panelHead}>
              <div>
                <small>DÉCOUVERTE & FRAÎCHEUR</small>
                <h2>Sitemaps, flux & IndexNow</h2>
              </div>
            </div>
            <div className={s.projectGrid}>
              {data.projects.map((p) => (
                <article key={p.id}>
                  <Globe2 size={24} />
                  <h3>{p.name}</h3>
                  <p>
                    Les URL exposées restent publiques et vérifiées. Les pages
                    privées sont exclues.
                  </p>
                  <div className={s.actions}>
                    <a
                      className={s.button}
                      href={
                        p.origin +
                        "/api/angelcare-marketplace/public/seo-power/sitemap?world=" +
                        p.world
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Sitemap
                      <ExternalLink size={14} />
                    </a>
                    <a
                      className={s.button}
                      href={
                        p.origin +
                        "/api/angelcare-marketplace/public/seo-power/feed?world=" +
                        p.world
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Flux RSS
                      <ExternalLink size={14} />
                    </a>
                  </div>
                  <dl>
                    <dt>IndexNow</dt>
                    <dd>{p.policy.indexNowEnabled ? "Activé" : "Désactivé"}</dd>
                    <dt>Confirmation disponible</dt>
                    <dd>Réception de notification</dd>
                  </dl>
                  <button
                    disabled={!enabled}
                    onClick={() => setModal({ kind: "settings", project: p })}
                  >
                    Configurer la diffusion
                  </button>
                </article>
              ))}
            </div>
            <p className={s.note}>
              Un accusé IndexNow confirme la réception d’une URL. Il ne confirme
              ni indexation, ni position, ni trafic.
            </p>
          </section>
          <section className={s.panel}>
            <h2>Reçus de soumission</h2>
            {data.jobs
              .filter((j) => j.kind === "indexnow")
              .map((j) => (
                <details key={String(j.id)} className={s.details}>
                  <summary>
                    {pageName(j.page_id)} · <State value={j.state} />
                  </summary>
                  <Json value={j.result || { error: j.error }} />
                </details>
              ))}
            {!data.jobs.some((j) => j.kind === "indexnow") ? (
              <Empty>
                Aucune soumission exécutée. Activez la diffusion pour l’univers
                concerné.
              </Empty>
            ) : null}
          </section>
        </>
      ) : null}

      {tab === "automation" ? (
        <>
          <section className={s.panel}>
            <div className={s.panelHead}>
              <div>
                <small>SUPABASE EXISTANT · SANS NOUVEAU WORKER</small>
                <h2>Planification & autorisations</h2>
              </div>
              <button
                disabled={!enabled}
                onClick={() =>
                  setModal({ kind: "scheduler", project: current })
                }
              >
                <Settings2 size={16} />
                Configurer le planificateur
              </button>
            </div>
            <div className={s.capabilities}>
              {[
                ["pg_cron", data.runtime.cron],
                ["pg_net", data.runtime.net],
                ["Supabase Vault", data.runtime.vault],
                ["Planificateur SEO", data.runtime.enabled],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <ShieldCheck size={20} />
                  <strong>{String(label)}</strong>
                  <State
                    value={value === true ? "succeeded" : "non disponible"}
                  />
                </div>
              ))}
            </div>
            <p className={s.note}>
              Node {String(data.runtime.node || "non vérifié")} · Dernier
              déclenchement HTTP : {fmt(data.runtime.lastTick)}. Le
              déclenchement du planificateur ne signifie pas que les tâches ont
              réussi.
            </p>
            <div className={s.projectGrid}>
              {data.projects.map((p) => (
                <article key={p.id}>
                  <Workflow size={23} />
                  <h3>{p.name}</h3>
                  <dl>
                    <dt>Rafraîchissement</dt>
                    <dd>{p.policy.intervalHours} heures</dd>
                    <dt>Budget quotidien</dt>
                    <dd>{p.policy.crawlBudget} tâches</dd>
                    <dt>Planification du périmètre</dt>
                    <dd>
                      {p.policy.scheduleEnabled ? "Activée" : "Désactivée"}
                    </dd>
                    <dt>Canonique manquante</dt>
                    <dd>
                      {p.policy.autoCanonical
                        ? "Correction autonome approuvée"
                        : "Approbation manuelle"}
                    </dd>
                  </dl>
                  <button
                    disabled={!enabled}
                    onClick={() => setModal({ kind: "settings", project: p })}
                  >
                    Modifier la politique
                  </button>
                </article>
              ))}
            </div>
          </section>
          <section className={s.panel}>
            <div className={s.panelHead}>
              <h2>File persistante & reprise</h2>
              <button
                disabled={!enabled}
                onClick={() =>
                  void act("run", { projectId: projectId || null })
                }
              >
                <Play size={15} />
                Traiter maintenant
              </button>
            </div>
            {data.jobs.length ? (
              <div className={s.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Tâche</th>
                      <th>Page</th>
                      <th>État</th>
                      <th>Essais</th>
                      <th>Échéance</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.jobs.map((j) => (
                      <tr key={String(j.id)}>
                        <td>{String(j.kind)}</td>
                        <td>
                          {pageName(j.page_id)}
                          {j.error ? (
                            <small className={s.errorText}>
                              {String(j.error)}
                            </small>
                          ) : null}
                        </td>
                        <td>
                          <State value={j.state} />
                        </td>
                        <td>{String(j.attempts)}/3</td>
                        <td>{fmt(j.due_at)}</td>
                        <td>
                          <div className={s.rowActions}>
                            <button
                              onClick={() =>
                                setModal({ kind: "receipt", row: j })
                              }
                            >
                              Résultat
                            </button>
                            {["queued", "running"].includes(String(j.state)) ? (
                              <button
                                disabled={!enabled}
                                onClick={() => void act("cancel", { id: j.id })}
                              >
                                Annuler
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty>
                Aucune tâche dans le périmètre. Les tâches s’ajoutent depuis
                l’inventaire ou la planification activée.
              </Empty>
            )}
          </section>
        </>
      ) : null}

      {tab === "quality" ? (
        <>
          <section className={s.editorOpening}>
            <div>
              <small>LIGHTHOUSE CI · LIVRAISON MARKETPLACE</small>
              <h2>Mesurer le candidat construit, conserver la preuve.</h2>
              <p>
                Les audits CI s’exécutent dans GitHub Actions sur l’image
                Marketplace existante. Les preuves de candidat et les
                observations du site déployé restent distinctes.
              </p>
              <div className={s.actions}>
                <a
                  className={s.button}
                  href="https://github.com/ANGELCARE-MOROCCO/ANGELCARE-OPS-OS-V.1/actions/workflows/build-marketplace-ghcr-oneoff.yml"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ouvrir le pipeline
                  <ExternalLink size={15} />
                </a>
                <button
                  disabled={!enabled}
                  onClick={() => setModal({ kind: "ci" })}
                >
                  <Upload size={16} />
                  Importer un rapport Lighthouse
                </button>
              </div>
            </div>
            <div className={s.editorFacts}>
              <span>
                <ShieldCheck />
                Titre, langue, viewport & SEO technique
              </span>
              <span>
                <Activity />
                Performances mesurées du candidat
              </span>
              <span>
                <Files />
                Artifacts GitHub conservés
              </span>
              <span>
                <CheckCheck />
                Réception CI authentifiée par GitHub OIDC
              </span>
            </div>
          </section>
          <section className={s.panel}>
            <h2>Rapports reçus</h2>
            {data.ci.length ? (
              data.ci.map((c) => (
                <details className={s.details} key={String(c.id)}>
                  <summary>
                    <span className={s.tag}>{String(c.source)}</span>{" "}
                    {String(c.source_sha).slice(0, 12)} · {fmt(c.created_at)}
                  </summary>
                  <Json value={c.results} />
                  <button
                    onClick={() =>
                      download(c, "seo-power-ci-" + String(c.id) + ".json")
                    }
                  >
                    <Download size={15} />
                    Exporter la preuve
                  </button>
                </details>
              ))
            ) : (
              <Empty>
                Aucun rapport reçu. La première livraison peut conserver le
                rapport dans ses artifacts avant que ce nouvel endpoint soit
                déployé ; il peut ensuite être importé ici.
              </Empty>
            )}
          </section>
        </>
      ) : null}

      {tab === "history" ? (
        <section className={s.panel}>
          <div className={s.panelHead}>
            <div>
              <small>PREUVES & TRAÇABILITÉ</small>
              <h2>Journal des commandes</h2>
            </div>
            <button
              onClick={() =>
                download(data.receipts, "seo-power-command-receipts.json")
              }
            >
              <Download size={15} />
              Exporter les reçus chargés
            </button>
          </div>
          <p className={s.note}>
            Les 80 derniers reçus sont affichés. L’historique métier conserve
            acteur, action, révision et résultat confirmé.
          </p>
          {data.receipts.length ? (
            <div className={s.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Action</th>
                    <th>Acteur</th>
                    <th>Clé de requête</th>
                    <th>Preuve</th>
                  </tr>
                </thead>
                <tbody>
                  {data.receipts.map((r) => (
                    <tr key={String(r.id)}>
                      <td>{fmt(r.created_at)}</td>
                      <td>{String(r.action)}</td>
                      <td>
                        {r.actor_id === "00000000-0000-4000-8000-000000000001"
                          ? "Automate SEO"
                          : String(r.actor_id).slice(0, 12)}
                      </td>
                      <td>{String(r.request_key).slice(0, 28)}</td>
                      <td>
                        <button
                          onClick={() => setModal({ kind: "receipt", row: r })}
                        >
                          Ouvrir le reçu
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>
              Aucune commande confirmée. Les opérations réalisées apparaîtront
              ici.
            </Empty>
          )}
        </section>
      ) : null}

      {modal ? (
        <Dialog
          title={
            modal.kind === "detail"
              ? "Dossier de la page"
              : modal.kind === "revise"
                ? "Modifier le brouillon"
                : modal.kind === "change"
                  ? "Préparer une correction"
                  : modal.kind === "create"
                    ? "Créer une page SEO"
                    : modal.kind === "settings"
                      ? "Politique de l’univers"
                      : modal.kind === "scheduler"
                        ? "Planificateur Supabase"
                        : modal.kind === "register"
                          ? "Ajouter des URL publiques"
                          : modal.kind === "publish-review"
                            ? "Revue avant publication"
                            : modal.kind === "rollback"
                              ? "Restaurer la révision précédente"
                              : modal.kind === "schema"
                                ? "JSON-LD observé"
                                : modal.kind === "ci"
                                  ? "Importer un audit Lighthouse"
                                  : "Preuve de l’opération"
          }
          drawer={["detail", "receipt", "schema"].includes(modal.kind)}
          busy={busy}
          onClose={() => setModal(null)}
        >
          {error ? (
            <div role="alert" className={s.error}>
              {error}
            </div>
          ) : null}
          {modal.kind === "revise" && modal.page ? (
            <ChangeForm
              page={modal.page}
              initial={modal.row?.patch as ChangePatch}
              existing={modal.row}
              busy={busy}
              onSubmit={async (patch, reason) => {
                if (
                  await act("revise", {
                    id: modal.row!.id,
                    version: modal.row!.version,
                    patch,
                    reason,
                  })
                )
                  setModal(null);
              }}
            />
          ) : null}
          {modal.kind === "receipt" ? (
            <>
              <Json value={modal.row} />
              <button
                onClick={() => download(modal.row, "seo-power-evidence.json")}
              >
                <Download size={15} />
                Exporter
              </button>
            </>
          ) : null}
          {modal.kind === "schema" ? (
            <>
              <h3>{modal.page?.path}</h3>
              <Json value={modal.page?.facts?.schemas || []} />
            </>
          ) : null}
          {modal.kind === "detail" && modal.page ? (
            <>
              <div className={s.pageIdentity}>
                <State value={modal.page.http_status ?? "non vérifié"} />
                <h3>{modal.page.title || modal.page.path}</h3>
                <a
                  href={modal.project!.origin + modal.page.path}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {modal.page.path}
                  <ExternalLink size={14} />
                </a>
              </div>
              <div className={s.actions}>
                <button
                  disabled={!enabled || !modal.page.facts}
                  onClick={() => setModal({ ...modal, kind: "change" })}
                >
                  Préparer une correction
                </button>
                <button
                  disabled={!enabled}
                  onClick={() =>
                    void act("queue", {
                      pageIds: [modal.page!.id],
                      kind: "crawl",
                      options: { discover: true },
                    })
                  }
                >
                  Explorer
                </button>
              </div>
              <details open className={s.details}>
                <summary>Faits observés</summary>
                <Json
                  value={modal.page.facts || "Aucune exploration effectuée."}
                />
              </details>
              {["issues", "changes", "observations", "jobs"].map((section) => (
                <details className={s.details} key={section}>
                  <summary>
                    {
                      (
                        {
                          issues: "Constats",
                          changes: "Révisions",
                          observations: "Historique des observations",
                          jobs: "Tâches",
                        } as Record<string, string>
                      )[section]
                    }
                  </summary>
                  <Json value={modal.data?.[section]} />
                </details>
              ))}
            </>
          ) : null}
          {modal.kind === "change" && modal.page ? (
            <ChangeForm
              page={modal.page}
              busy={busy}
              initial={{
                title: modal.page.title,
                description: modal.page.description,
                canonicalPath: modal.page.path,
                schema: false,
              }}
              onSubmit={async (patch, reason) => {
                if (
                  await act("propose", {
                    pageId: modal.page!.id,
                    baseHash: modal.page!.content_hash,
                    patch,
                    reason,
                  })
                )
                  setModal(null);
              }}
            />
          ) : null}
          {modal.kind === "register" ? (
            <RegisterForm
              projects={data.projects}
              chosen={modal.project?.id || ""}
              busy={busy}
              onSubmit={async (project, paths) => {
                if (await act("register", { projectId: project, paths }))
                  setModal(null);
              }}
            />
          ) : null}
          {modal.kind === "create" ? (
            <CreateForm
              projects={data.projects}
              chosen={modal.project?.id || ""}
              busy={busy}
              onSubmit={async (input) => {
                if (await act("create-page", input)) setModal(null);
              }}
            />
          ) : null}
          {modal.kind === "settings" && modal.project ? (
            <ProjectForm
              project={modal.project}
              busy={busy}
              canPublish={rights.publish}
              onSubmit={async (input) => {
                if (await act("project", input)) setModal(null);
              }}
            />
          ) : null}
          {modal.kind === "scheduler" ? (
            <form
              className={s.form}
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                if (
                  await act("scheduler", {
                    origin: f.get("origin"),
                    enabled: f.get("enabled") === "on",
                  })
                )
                  setModal(null);
              }}
            >
              <div className={s.notice}>
                Le secret de déclenchement est généré côté serveur et conservé
                dans Supabase Vault. Aucun second serveur ni worker permanent.
              </div>
              <label>
                Domaine public du Marketplace
                <select name="origin">
                  {[...new Set(data.projects.map((p) => p.origin))].map(
                    (origin) => (
                      <option key={origin}>{origin}</option>
                    ),
                  )}
                </select>
              </label>
              <label className={s.check}>
                <input
                  name="enabled"
                  type="checkbox"
                  defaultChecked={data.runtime.enabled === true}
                />
                Activer le déclenchement automatique SEO
              </label>
              <p>
                pg_cron, pg_net et Supabase Vault doivent être disponibles. Les
                cadences de chaque univers restent configurées dans sa
                politique.
              </p>
              <button type="submit" disabled={!enabled} className={s.primary}>
                Enregistrer le planificateur
              </button>
            </form>
          ) : null}
          {modal.kind === "publish-review" ? (
            <>
              <div className={s.notice}>
                Cette publication modifie les champs de recherche ou la page SEO
                indiquée. Les données métier natives restent protégées. Une
                vérification HTTP sera ajoutée à la file.
              </div>
              <Json value={modal.row?.patch} />
              <p>Motif : {String(modal.row?.reason)}</p>
              <button
                className={s.primary}
                disabled={!enabled || !rights.publish}
                onClick={async () => {
                  if (
                    await act("publish", {
                      id: modal.row!.id,
                      version: modal.row!.version,
                    })
                  )
                    setModal(null);
                }}
              >
                Confirmer la publication
              </button>
            </>
          ) : null}
          {modal.kind === "rollback" ? (
            <form
              className={s.form}
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                if (
                  await act("rollback", {
                    id: modal.row!.id,
                    version: modal.row!.version,
                    reason: f.get("reason"),
                  })
                )
                  setModal(null);
              }}
            >
              <p>
                La révision précédente sera restaurée. Une édition ultérieure ne
                peut pas être écrasée par cette commande.
              </p>
              <label>
                Motif de restauration
                <textarea name="reason" required minLength={8} rows={3} />
              </label>
              <button type="submit" disabled={!enabled || !rights.rollback}>
                <Undo2 size={16} />
                Confirmer la restauration
              </button>
            </form>
          ) : null}
          {modal.kind === "ci" ? (
            <form
              className={s.form}
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget),
                  file = f.get("report");
                if (!(file instanceof File) || file.size > 2000000) {
                  setError("Rapport JSON requis, 2 Mo au maximum.");
                  return;
                }
                try {
                  const report = JSON.parse(await file.text());
                  if (
                    await act("ci-import", {
                      report,
                      sourceSha: String(f.get("sha") || ""),
                    })
                  )
                    setModal(null);
                } catch {
                  setError(
                    "Le fichier ne contient pas un rapport Lighthouse JSON lisible.",
                  );
                }
              }}
            >
              <p>
                Les imports manuels sont identifiés comme tels ; ils ne
                deviennent pas des attestations GitHub.
              </p>
              <label>
                Rapport JSON Lighthouse
                <input
                  required
                  type="file"
                  name="report"
                  accept="application/json,.json"
                />
              </label>
              <label>
                Commit source, si connu
                <input
                  name="sha"
                  pattern="[a-fA-F0-9]{40}"
                  placeholder="SHA complet facultatif"
                />
              </label>
              <button className={s.primary} disabled={busy} type="submit">
                Importer le rapport
              </button>
            </form>
          ) : null}
        </Dialog>
      ) : null}
    </div>
  );
}

function RegisterForm({
  projects,
  chosen,
  busy,
  onSubmit,
}: {
  projects: Project[];
  chosen: string;
  busy: boolean;
  onSubmit: (project: string, paths: string[]) => Promise<void>;
}) {
  const [project, setProject] = useState(chosen || projects[0]?.id || ""),
    [value, setValue] = useState(""),
    [preview, setPreview] = useState(false);
  const paths = value
    .split(/\r?\n/)
    .map((v) => v.trim().replace(/^"|"$/g, ""))
    .filter((v) => v && v.toLowerCase() !== "path");
  return (
    <form
      className={s.form}
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit(project, paths);
      }}
    >
      <label>
        Univers
        <select
          required
          value={project}
          onChange={(e) => setProject(e.target.value)}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Importer un CSV à une colonne « path »
        <input
          type="file"
          accept=".csv,text/csv,text/plain"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f && f.size <= 100000) setValue(await f.text());
          }}
        />
      </label>
      <label>
        URL relatives — une par ligne
        <textarea
          required
          rows={10}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={"path\n/kidflix/fr\n/kidflix/fr/explore/documents"}
        />
      </label>
      <small>
        1 à 100 URL canoniques, du même univers, sans paramètres ni espace
        privé.
      </small>
      <div className={s.actions}>
        <button type="button" onClick={() => setPreview((v) => !v)}>
          Prévisualiser les {paths.length} URL
        </button>
        <button
          className={s.primary}
          disabled={busy || paths.length < 1 || paths.length > 100}
          type="submit"
        >
          Ajouter à l’inventaire
        </button>
      </div>
      {preview ? <Json value={paths} /> : null}
    </form>
  );
}
function CreateForm({
  projects,
  chosen,
  busy,
  onSubmit,
}: {
  projects: Project[];
  chosen: string;
  busy: boolean;
  onSubmit: (input: Row) => Promise<void>;
}) {
  const [projectId, setProjectId] = useState(chosen || projects[0]?.id || ""),
    project = projects.find((p) => p.id === projectId),
    [locale, setLocale] = useState("fr"),
    [slug, setSlug] = useState("");
  const p: Page = {
    id: "",
    project_id: projectId,
    path: `${project ? root(project.world) : ""}/${locale}/discover/${slug || "votre-page"}`,
    locale,
    kind: "landing",
    title: "",
    description: "",
    http_status: null,
    indexable: false,
    content_hash: null,
    facts: null,
    last_scanned_at: null,
    published_change_id: null,
    version: 0,
  };
  return (
    <>
      <div className={s.form}>
        <label>
          Univers
          <select
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setLocale("en");
            }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <div className={s.formColumns}>
          <label>
            Langue
            <select value={locale} onChange={(e) => setLocale(e.target.value)}>
              {locales(project?.world || "angelcare").map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
          <label>
            Slug
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              placeholder="guide-observation-enfant"
            />
          </label>
        </div>
      </div>
      <ChangeForm
        page={p}
        busy={busy || !slug}
        onSubmit={(patch, reason) =>
          onSubmit({ projectId, locale, slug, patch, reason })
        }
      />
    </>
  );
}
function ProjectForm({
  project,
  busy,
  canPublish,
  onSubmit,
}: {
  project: Project;
  busy: boolean;
  canPublish: boolean;
  onSubmit: (input: Row) => Promise<void>;
}) {
  return (
    <form
      className={s.form}
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget),
          policy = parsePolicy({
            crawlBudget: Number(f.get("budget")),
            linksPerPage: Number(f.get("links")),
            timeoutSeconds: Number(f.get("timeout")),
            intervalHours: Number(f.get("hours")),
            scheduleEnabled: f.has("scheduled"),
            indexNowEnabled: f.has("indexnow"),
            autoCanonical: f.has("automatic"),
          });
        void onSubmit({
          id: project.id,
          version: project.version,
          origin: f.get("origin"),
          enabled: f.has("enabled"),
          policy,
        });
      }}
    >
      <fieldset disabled={busy} className={s.form}>
        <h3>
          {project.name} · révision {project.version}
        </h3>
        <label>
          Domaine HTTPS public
          <input
            name="origin"
            required
            type="url"
            defaultValue={project.origin}
          />
        </label>
        <label className={s.check}>
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={project.enabled}
          />
          Activer ce périmètre
        </label>
        <div className={s.formColumns}>
          <label>
            Budget quotidien de tâches
            <input
              name="budget"
              type="number"
              min={5}
              max={1000}
              defaultValue={project.policy.crawlBudget}
            />
          </label>
          <label>
            Liens découverts par page
            <input
              name="links"
              type="number"
              min={1}
              max={100}
              defaultValue={project.policy.linksPerPage}
            />
          </label>
          <label>
            Délai HTTP maximal, secondes
            <input
              name="timeout"
              type="number"
              min={3}
              max={12}
              defaultValue={project.policy.timeoutSeconds}
            />
          </label>
          <label>
            Intervalle d’exploration, heures
            <input
              name="hours"
              type="number"
              min={1}
              max={168}
              defaultValue={project.policy.intervalHours}
            />
          </label>
        </div>
        <label className={s.check}>
          <input
            type="checkbox"
            name="scheduled"
            defaultChecked={project.policy.scheduleEnabled}
          />
          Ajouter les explorations de cet univers au planificateur actif
        </label>
        <label className={s.check}>
          <input
            type="checkbox"
            name="indexnow"
            defaultChecked={project.policy.indexNowEnabled}
          />
          Notifier IndexNow après une publication publiquement vérifiée
        </label>
        <label className={s.check}>
          <input
            type="checkbox"
            name="automatic"
            disabled={!canPublish}
            defaultChecked={project.policy.autoCanonical}
          />
          Autoriser uniquement la réparation autonome des canoniques manquantes
        </label>
        <div className={s.notice}>
          La règle autonome ne crée aucun texte, ne modifie pas les règles
          noindex et n’expose pas de contenu privé. Les autres corrections
          restent soumises à approbation.
        </div>
        <button className={s.primary} type="submit">
          Enregistrer la politique
        </button>
      </fieldset>
    </form>
  );
}
