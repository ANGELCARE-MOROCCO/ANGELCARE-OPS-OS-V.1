"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileSearch,
  Globe2,
  Layers3,
  Pause,
  Play,
  RefreshCw,
  Search,
  Settings2,
  ShieldAlert,
  Workflow,
  X,
} from "lucide-react";
import { type Row, type Snapshot, record } from "./model";
import { batchMessage, health, recovery } from "./operations-model";
import { SeoPowerTools } from "./NativeWorkspace";
import s from "./operations.module.css";
import { GrowthWorkspace } from "./GrowthWorkspace";
const API = "/api/angelcare-marketplace/admin/seo-power";
const NAV = [
  ["overview", "Pilotage", Activity],
  ["growth", "Croissance", Globe2],
  ["priorities", "Priorités", ShieldAlert],
  ["pages", "Pages", FileSearch],
  ["corrections", "Corrections", Layers3],
  ["executions", "Exécutions", Play],
  ["automation", "Automatisation", Workflow],
  ["history", "Historique", Clock3],
] as const;
const stamp = (v: unknown) => {
  const d = new Date(String(v || ""));
  return Number.isFinite(d.getTime())
    ? d.toLocaleString("fr-FR")
    : "Non confirmé";
};
const rows = (v: unknown): Row[] => (Array.isArray(v) ? v.map(record) : []);
const stateName = (v: unknown) =>
  ({
    queued: "En attente",
    running: "En cours",
    succeeded: "Exécutée",
    failed: "Échec",
    cancelled: "Annulée",
    completed: "Terminé",
    degraded: "Incomplet",
  })[String(v)] || String(v || "Non confirmé");
const uid = () =>
  globalThis.crypto?.randomUUID?.() ||
  "seo-" + Date.now() + "-" + Math.random().toString(36).slice(2);
export function SeoPowerWorkspace({ initial }: { initial: Snapshot }) {
  const [data, setData] = useState(initial),
    [world, setWorld] = useState(""),
    [tab, setTab] = useState("overview"),
    [busy, setBusy] = useState(false),
    [refreshing, setRefreshing] = useState(false),
    [error, setError] = useState(""),
    [readError, setReadError] = useState(""),
    [notice, setNotice] = useState(""),
    [connected, setConnected] = useState(true),
    [clock, setClock] = useState(Date.now()),
    [draining, setDraining] = useState(false),
    [drainBatches, setDrainBatches] = useState(0),
    [queue, setQueue] = useState<Row>({}),
    [queuePage, setQueuePage] = useState(1),
    [queueState, setQueueState] = useState("attention"),
    [queueError, setQueueError] = useState(""),
    [detail, setDetail] = useState<Row | null>(null),
    [guide, setGuide] = useState(false),
    [search, setSearch] = useState("");
  const worldRef = useRef(world),
    busyRef = useRef(false),
    stop = useRef(false),
    mounted = useRef(true),
    request = useRef<{ signature: string; key: string } | null>(null),
    seq = useRef(0),
    queueSeq = useRef(0),
    dialog = useRef<HTMLDialogElement>(null),
    guideDialog = useRef<HTMLDialogElement>(null);
  worldRef.current = world;
  const load = useCallback(async (project = worldRef.current) => {
    const token = ++seq.current;
    setRefreshing(true);
    try {
      const response = await fetch(
          API + "?project=" + encodeURIComponent(project),
          { cache: "no-store" },
        ),
        v = await response.json();
      if (
        response.ok &&
        (!v.data ||
          !Array.isArray(v.data.projects) ||
          typeof v.data.ready !== "boolean")
      )
        throw Error(
          "Réponse de lecture invalide ; données précédentes conservées.",
        );
      if (!response.ok)
        throw Error(v.error?.message || "Lecture indisponible.");
      if (token === seq.current && mounted.current) {
        setData(v.data);
        setConnected(true);
        setReadError("");
      }
    } catch (e) {
      if (token === seq.current && mounted.current) {
        setConnected(false);
        setReadError(
          e instanceof Error ? e.message : "Actualisation interrompue.",
        );
      }
    } finally {
      if (token === seq.current && mounted.current) setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    const u = new URL(location.href),
      w = u.searchParams.get("project") || "",
      t = u.searchParams.get("tab") || "overview";
    setWorld(w);
    worldRef.current = w;
    if (NAV.some((n) => n[0] === t)) setTab(t);
    void load(w);
    const timer = setInterval(() => {
      setClock(Date.now());
      if (document.visibilityState === "visible" && !busyRef.current)
        void load();
    }, 15000);
    const visible = () => {
      if (document.visibilityState === "visible" && !busyRef.current)
        void load();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      mounted.current = false;
      stop.current = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [load]);
  useEffect(() => {
    if (detail && dialog.current && !dialog.current.open)
      dialog.current.showModal();
  }, [detail]);
  useEffect(() => {
    if (guide && guideDialog.current && !guideDialog.current.open)
      guideDialog.current.showModal();
  }, [guide]);
  const ops = record(data.operations),
    projects = rows(ops.projects),
    runtime = record(data.runtime),
    rights = data.permissions,
    enabled = data.ready && rights.manage && !busy && !data.operationsError,
    observed = Date.parse(String(data.observedAt || ops.observedAt || "")),
    age = Number.isFinite(observed)
      ? Math.max(0, Math.floor((clock - observed) / 1000))
      : null;
  const stale = !connected || age === null || age > 45,
    selected = data.projects.find((p) => p.id === world),
    sum = (key: string) =>
      projects.reduce((n, p) => n + Number(p[key] || 0), 0);
  function go(t: string) {
    setTab(t);
    const u = new URL(location.href);
    u.searchParams.set("tab", t);
    history.replaceState(null, "", u);
  }
  function selectWorld(id: string) {
    setWorld(id);
    worldRef.current = id;
    setQueuePage(1);
    setDetail(null);
    const u = new URL(location.href);
    if (id) u.searchParams.set("project", id);
    else u.searchParams.delete("project");
    history.replaceState(null, "", u);
    void load(id);
  }
  async function act(action: string, input: Row = {}): Promise<Row | null> {
    if (busyRef.current) return null;
    const signature = JSON.stringify({ action, input });
    if (request.current?.signature !== signature)
      request.current = { signature, key: uid() };
    busyRef.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            input,
            requestKey: request.current.key,
          }),
        }),
        v = await r.json();
      if (!r.ok)
        throw Error(
          (v.error?.message || "Opération non confirmée.") +
            " · " +
            (v.requestId || ""),
        );
      request.current = null;
      setNotice(
        action === "run"
          ? batchMessage(v.data)
          : "Opération confirmée · " + v.requestId,
      );
      await load();
      return Array.isArray(v.data) ? { items: v.data } : record(v.data);
    } catch (e) {
      setError(
        (e instanceof Error ? e.message : "Opération interrompue.") +
          " Réessayer la même action conserve sa clé de reprise.",
      );
      return null;
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  const loadQueue = useCallback(async () => {
    const token = ++queueSeq.current;
    try {
      const q = new URLSearchParams({
          action: "queue-page",
          project: world,
          state: queueState,
          queuePage: String(queuePage),
        }),
        r = await fetch(API + "?" + q, { cache: "no-store" }),
        v = await r.json();
      if (!r.ok) throw Error(v.error?.message || "File indisponible.");
      if (mounted.current && token === queueSeq.current) {
        setQueue(v.data);
        setQueueError("");
      }
    } catch (e) {
      if (mounted.current && token === queueSeq.current)
        setQueueError(e instanceof Error ? e.message : "File indisponible.");
    }
  }, [world, queueState, queuePage]);
  useEffect(() => {
    if (tab === "executions" || tab === "priorities") void loadQueue();
  }, [tab, loadQueue, data.observedAt]);
  async function drain() {
    stop.current = false;
    setDraining(true);
    setDrainBatches(0);
    let batches = 0;
    try {
      while (!stop.current && mounted.current && batches < 20) {
        const v = await act("run", { projectId: worldRef.current || null });
        batches++;
        setDrainBatches(batches);
        if (!v || !rows(v.results).length || Number(v.problems) > 0) break;
      }
    } finally {
      if (mounted.current) {
        setDraining(false);
        setNotice(
          (v) => v + " Passage borné terminé (" + batches + " lot(s)).",
        );
      }
    }
  }
  async function begin(inspect = false) {
    if (!selected) return;
    const v = await act("initialize", { projectId: selected.id });
    if (!v) return;
    if (inspect) {
      const ids = Array.isArray(v.items) ? v.items : [];
      if (!ids.length) {
        setError(
          "Initialisation sans identifiants confirmés. Ouvrez Pages et sélectionnez les URL.",
        );
        return;
      }
      const queued = await act("queue", {
        pageIds: ids,
        kind: "crawl",
        options: { discover: true },
      });
      if (!queued) return;
      setGuide(false);
      go("executions");
      setNotice(
        "Fronts natifs placés dans la file. Lancez le traitement suivi ; aucune publication automatique n’a été activée.",
      );
    } else {
      setGuide(false);
      go("pages");
      setNotice(
        "Inventaire natif initialisé. Sélectionnez les pages à explorer.",
      );
    }
  }
  const openJob = (job: Row) => setDetail(job);
  const detailResult = record(detail?.result),
    detailFollowup = record(detailResult.followup),
    detailRecovery = recovery(detailFollowup.code || detailResult.code),
    detailEvidence = record(detailResult.evidence);
  return (
    <main className={s.root}>
      <header className={s.header}>
        <div>
          <span className={s.eyebrow}>ANGELCARE · OPÉRATIONS WEB</span>
          <h1>
            SEO POWER <span>Centre de pilotage</span>
          </h1>
          <p>Ce qui fonctionne. Ce qui bloque. La prochaine action utile.</p>
        </div>
        <div className={s.headerActions}>
          <button disabled={busy || refreshing} onClick={() => void load()}>
            <RefreshCw size={16} />
            {refreshing ? "Actualisation…" : "Actualiser"}
          </button>
          <button
            className={s.primary}
            disabled={!enabled || draining}
            onClick={() => setGuide(true)}
          >
            <Play size={16} />
            Lancer un parcours
          </button>
        </div>
      </header>
      <section className={s.live} data-stale={stale} aria-live="polite">
        <span className={s.dot} />
        <strong>
          {stale ? "Observation à actualiser" : "Connexion confirmée"}
        </strong>
        <span>
          Lecture : {stamp(data.observedAt)}
          {age !== null ? " · il y a " + age + " s" : ""}
        </span>
        <span>Toutes les 15 s · dates dans le fuseau du navigateur</span>
      </section>
      <div className={s.worlds} role="group" aria-label="Périmètre SEO">
        <button
          aria-pressed={!world}
          disabled={busy || draining}
          onClick={() => selectWorld("")}
        >
          Tous les univers
        </button>
        {data.projects.map((p) => (
          <button
            key={p.id}
            disabled={busy || draining}
            aria-pressed={world === p.id}
            onClick={() => selectWorld(p.id)}
          >
            <Globe2 size={16} />
            {p.name}
          </button>
        ))}
      </div>
      <nav className={s.nav} aria-label="SEO POWER">
        {NAV.map(([id, label, Icon]) => (
          <button
            key={id}
            aria-current={tab === id ? "page" : undefined}
            onClick={() => go(id)}
          >
            <Icon size={17} />
            {label}
            {id === "priorities" &&
            sum("failed") + sum("followup") + sum("mismatches") > 0 ? (
              <b>{sum("failed") + sum("followup") + sum("mismatches")}</b>
            ) : null}
          </button>
        ))}
      </nav>
      {error || readError ? (
        <div className={s.error} role="alert">
          {error || readError}
          <button
            onClick={() => {
              setError("");
              setReadError("");
            }}
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>
      ) : null}
      {notice ? (
        <div className={s.notice} role="status">
          <CheckCircle2 size={17} />
          {notice}
        </div>
      ) : null}
      {!data.ready || data.operationsError ? (
        <section className={s.warning}>
          <ShieldAlert />
          <div>
            <h2>Statut opérationnel non confirmé</h2>
            <p>{data.error || data.operationsError}</p>
            <a href={API + "?action=operations-sql"}>
              Télécharger la migration Operations R2
            </a>
            <p>
              À appliquer après la migration R1 dans le Supabase Marketplace
              existant. Cela n’active pas le moteur.
            </p>
          </div>
        </section>
      ) : null}
      {tab === "growth" ? (
        <GrowthWorkspace
          projectId={world}
          projects={data.projects}
          permissions={rights}
          pages={data.pages as unknown as Row[]}
        />
      ) : null}
      {tab === "overview" ? (
        <>
          <div className={s.metrics}>
            {[
              ["waiting", "En attente"],
              ["running", "En cours"],
              ["failed", "Échecs non repris"],
              ["verified", "Publications vérifiées"],
              ["unscanned", "Pages jamais inspectées"],
              ["stale", "Observations anciennes"],
            ].map(([k, label]) => (
              <section key={k}>
                <span>{label}</span>
                <strong>
                  {!data.ready || ops.version !== 2 ? "—" : sum(k)}
                </strong>
                <small>
                  {k === "verified"
                    ? "Résultat public confirmé"
                    : k === "stale"
                      ? "Selon la cadence de chaque univers"
                      : "Comptage complet en base"}
                </small>
              </section>
            ))}
          </div>
          <div className={s.worldGrid}>
            {projects.map((p) => {
              const h = health(p, runtime, clock),
                project = data.projects.find((v) => v.id === p.id),
                policy = record(p.policy),
                execution = record(p.execution);
              return (
                <article className={s.worldCard} key={String(p.id)}>
                  <div className={s.cardHead}>
                    <Globe2 />
                    <h2>{project?.name || String(p.world)}</h2>
                    <span
                      className={s.state}
                      data-state={stale ? "unverified" : h.state}
                    >
                      {stale ? "Données anciennes" : h.label}
                    </span>
                  </div>
                  <p>{h.reason}</p>
                  <dl>
                    <dt>File due / en attente</dt>
                    <dd>
                      {Number(p.due)} / {Number(p.waiting)}
                    </dd>
                    <dt>Budget utilisé aujourd’hui UTC</dt>
                    <dd>
                      {Number(p.used)} / {Number(policy.crawlBudget)}
                    </dd>
                    <dt>Dernière observation</dt>
                    <dd>{stamp(p.last_observation)}</dd>
                    <dt>Dernière exécution terminée</dt>
                    <dd>{stamp(execution.finished_at)}</dd>
                    <dt>Plus ancienne attente</dt>
                    <dd>{stamp(p.oldest_waiting)}</dd>
                    <dt>Prochaine tâche due</dt>
                    <dd>{stamp(p.next_due)}</dd>
                    <dt>Mode</dt>
                    <dd>
                      {policy.scheduleEnabled ? "Planifié" : "Manuel"} ·{" "}
                      {p.enabled ? "Univers activé" : "En pause"}
                    </dd>
                  </dl>
                  <div className={s.actions}>
                    <button
                      disabled={!enabled || draining || p.enabled !== true}
                      onClick={() => void act("run", { projectId: p.id })}
                    >
                      <Play size={15} />
                      Exécuter un lot
                    </button>
                    <button
                      onClick={() => {
                        selectWorld(String(p.id));
                        go("priorities");
                      }}
                    >
                      Examiner
                      <ArrowRight size={15} />
                    </button>
                    {project ? (
                      <button
                        disabled={!enabled || draining}
                        onClick={() =>
                          void act("project", {
                            ...project,
                            enabled: !project.enabled,
                          })
                        }
                      >
                        {project.enabled ? (
                          <Pause size={14} />
                        ) : (
                          <Play size={14} />
                        )}{" "}
                        {project.enabled ? "Mettre en pause" : "Reprendre"}
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
          <section className={s.panel}>
            <div className={s.sectionHead}>
              <div>
                <small>DE LA DÉCOUVERTE À LA PREUVE</small>
                <h2>Un parcours, des résultats distincts</h2>
              </div>
              <button onClick={() => setGuide(true)}>
                Préparer un parcours
                <ArrowRight size={15} />
              </button>
            </div>
            <div className={s.journey}>
              {[
                "1 · Inventorier",
                "2 · Inspecter",
                "3 · Corriger et autoriser",
                "4 · Publier",
                "5 · Vérifier le public",
              ].map((t) => (
                <div key={t}>{t}</div>
              ))}
            </div>
            <p>
              Une tâche exécutée ne prouve ni une correction réussie, ni une
              indexation. Les publications vérifiées et les réponses IndexNow
              sont suivies séparément. Le trafic organique n’est pas mesuré par
              ces contrôles.
            </p>
          </section>
        </>
      ) : null}
      {tab === "priorities" ? (
        <>
          <section className={s.panel}>
            <h2>Décisions à prendre maintenant</h2>
            <div className={s.priorityGrid}>
              {projects.flatMap((p) => {
                const rules: [boolean, string, string, string][] = [
                  [
                    Number(p.failed) +
                      Number(p.followup) +
                      Number(p.mismatches) >
                      0,
                    "Résultats à traiter",
                    "Échecs, suites incomplètes ou publication non conforme.",
                    "executions",
                  ],
                  [
                    Number(p.unscanned) + Number(p.stale) > 0,
                    "Inventaire à inspecter",
                    `${p.unscanned} page(s) jamais inspectée(s), ${p.stale} observation(s) ancienne(s).`,
                    "pages",
                  ],
                  [
                    Number(p.issues) > 0,
                    "Constats ouverts",
                    `${p.issues} constat(s) à corriger via la source ou les adaptations autorisées.`,
                    "corrections",
                  ],
                  [
                    Number(p.awaiting_verification) > 0,
                    "Publication sans preuve",
                    `${p.awaiting_verification} correction(s) attend(ent) une vérification publique.`,
                    "corrections",
                  ],
                  [
                    record(p.policy).scheduleEnabled === true &&
                      runtime.enabled !== true,
                    "Moteur planifié arrêté",
                    "Activer la planification uniquement après vérification de sa configuration.",
                    "automation",
                  ],
                ];
                return rules
                  .filter((r) => r[0])
                  .map(([, title, desc, target]) => (
                    <button
                      key={String(p.id) + title}
                      onClick={() => {
                        selectWorld(String(p.id));
                        go(target);
                      }}
                    >
                      <small>{String(p.world)}</small>
                      <strong>{title}</strong>
                      <span>{desc}</span>
                      <ArrowRight size={16} />
                    </button>
                  ));
              })}
            </div>
            {!projects.length ? (
              <p>
                Les priorités attendent une lecture opérationnelle confirmée.
              </p>
            ) : null}
          </section>
          <section className={s.panel}>
            <h2>Tâches demandant une intervention</h2>
            {queueView()}
          </section>
        </>
      ) : null}
      {tab === "executions" ? (
        <>
          <section className={s.panel}>
            <div className={s.sectionHead}>
              <div>
                <h2>File persistante</h2>
                {draining ? (
                  <p role="status">
                    Suivi actif · {drainBatches} lot(s) terminé(s)
                  </p>
                ) : null}
                <p>
                  Deux tâches maximum par requête. Le passage suivi enchaîne
                  jusqu’à 20 lots et s’arrête au premier problème. Ce suivi
                  manuel nécessite de garder cet onglet ouvert ; les tâches
                  restent conservées en base.
                </p>
              </div>
              <div className={s.actions}>
                {draining ? (
                  <button
                    onClick={() => {
                      stop.current = true;
                      setNotice(
                        "Arrêt demandé : le lot courant terminera avant l’arrêt.",
                      );
                    }}
                  >
                    Arrêter après le lot courant
                  </button>
                ) : (
                  <button
                    className={s.primary}
                    disabled={!enabled}
                    onClick={() => void drain()}
                  >
                    <Play size={15} />
                    Traiter avec suivi
                  </button>
                )}
                <button
                  disabled={!enabled || draining}
                  onClick={() => void act("run", { projectId: world || null })}
                >
                  Un seul lot
                </button>
              </div>
            </div>
            {queueView()}
          </section>
          <section className={s.panel}>
            <h2>Passages du moteur</h2>
            <p>
              Un déclenchement HTTP du planificateur ne compte pas comme un
              passage terminé.
            </p>
            <div className={s.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Début</th>
                    <th>Origine</th>
                    <th>État</th>
                    <th>Fin</th>
                    <th>Résultat</th>
                  </tr>
                </thead>
                <tbody>
                  {rows(ops.executions).map((e) => (
                    <tr key={String(e.id)}>
                      <td>{stamp(e.started_at)}</td>
                      <td>
                        {e.source === "scheduler" ? "Planificateur" : "Manuel"}
                      </td>
                      <td>
                        {stateName(e.state)}
                        {e.state === "running" &&
                        clock - Date.parse(String(e.started_at)) > 120000
                          ? " · périmé"
                          : ""}
                      </td>
                      <td>{stamp(e.finished_at)}</td>
                      <td>
                        <button onClick={() => setDetail(e)}>
                          Ouvrir le reçu
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <small>
              30 derniers passages. Les tâches disposent de leur propre
              pagination complète.
            </small>
          </section>
        </>
      ) : null}
      {tab === "automation" ? (
        <section className={s.panel}>
          <h2>Chaîne de fonctionnement</h2>
          <div className={s.statusGrid}>
            {[
              ["cron", "pg_cron installé"],
              ["net", "pg_net installé"],
              ["vault", "Vault installé"],
              ["enabled", "Déclenchement activé"],
              ["nodeCompatible", "Node compatible"],
            ].map(([k, label]) => (
              <div key={k}>
                <span>{label}</span>
                <strong>
                  {runtime[k] === true ? "Confirmé" : "Non confirmé"}
                </strong>
              </div>
            ))}
          </div>
          <dl className={s.facts}>
            <dt>Endpoint configuré</dt>
            <dd>{String(runtime.endpoint || "Absent")}</dd>
            <dt>Dernier envoi HTTP</dt>
            <dd>{stamp(runtime.lastTick)}</dd>
            <dt>Réponse du dernier envoi</dt>
            <dd>
              {record(ops.dispatchResponse).status
                ? String(record(ops.dispatchResponse).status)
                : "Non disponible / rétention expirée"}
            </dd>
          </dl>
          <p>
            Concurrence globale : {Number(ops.globalRunning || 0)} / 3 tâches
            avec bail actif. La réception HTTP et l’exécution utile sont
            distinctes. Vérifier les passages terminés dans Exécutions ; chaque
            univers garde son activation, son budget et sa cadence.
          </p>
          <button onClick={() => go("executions")}>
            Voir les passages
            <ArrowRight size={15} />
          </button>
        </section>
      ) : null}
      {["pages", "corrections", "automation", "history"].includes(tab) ? (
        <section className={s.tools}>
          <SeoPowerTools
            key={tab + world}
            initial={data}
            initialTab={
              tab === "pages"
                ? "explore"
                : tab === "corrections"
                  ? "changes"
                  : tab === "automation"
                    ? "automation"
                    : "history"
            }
            embedded
          />
        </section>
      ) : null}
      <details className={s.advanced}>
        <summary>
          <Settings2 size={16} />
          Tous les outils natifs · publication, maillage, schéma, diffusion et
          qualité CI
        </summary>
        <SeoPowerTools
          key={"all" + world}
          initial={data}
          initialTab="overview"
          embedded
        />
      </details>
      {guide ? (
        <dialog
          ref={guideDialog}
          className={s.guide}
          aria-labelledby="guide-title"
          onClose={() => setGuide(false)}
          onCancel={() => setGuide(false)}
        >
          <div>
            <button
              aria-label="Fermer le parcours"
              onClick={() => setGuide(false)}
            >
              <X />
            </button>
            <h2 id="guide-title">Préparer le parcours SEO</h2>
            <p>
              Choisissez l’univers, initialisez ses fronts natifs, puis
              sélectionnez les pages à explorer. Les corrections et leur
              publication restent soumises à vos autorisations.
            </p>
            <label>
              Univers
              <select
                value={world}
                onChange={(e) => selectWorld(e.target.value)}
              >
                <option value="">Choisir un univers</option>
                {data.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            {selected && !selected.enabled ? (
              <p>
                Univers en pause : reprenez-le depuis Pilotage avant de lancer
                une inspection.
              </p>
            ) : null}
            <ol>
              <li>Initialiser les URL natives sans inventer de pages.</li>
              <li>Sélectionner les URL et lancer « Explorer ».</li>
              <li>Traiter la file avec suivi et ouvrir les constats.</li>
              <li>Préparer et autoriser les corrections applicables.</li>
              <li>Publier, puis vérifier la version réellement servie.</li>
            </ol>
            <button
              className={s.primary}
              disabled={!enabled || !selected}
              onClick={() => void begin(false)}
            >
              Initialiser et choisir les pages
              <ArrowRight size={16} />
            </button>
            <button
              className={s.primary}
              disabled={!enabled || !selected || !selected.enabled}
              onClick={() => void begin(true)}
            >
              Initialiser et inspecter les fronts natifs
            </button>
          </div>
        </dialog>
      ) : null}
      <dialog
        ref={dialog}
        className={s.dialog}
        onClose={() => setDetail(null)}
        onCancel={() => setDetail(null)}
      >
        {detail ? (
          <>
            <div className={s.sectionHead}>
              <h2>Preuve et reprise</h2>
              <button
                onClick={() => {
                  dialog.current?.close();
                  setDetail(null);
                }}
                aria-label="Fermer"
              >
                <X />
              </button>
            </div>
            <p>{String(detail.path || detail.id)}</p>
            <dl className={s.facts}>
              <dt>État</dt>
              <dd>{stateName(detail.state)}</dd>
              <dt>Code observé</dt>
              <dd>
                {String(
                  detailFollowup.code ||
                    detailResult.code ||
                    "Aucun code d’erreur",
                )}
              </dd>
              <dt>Début / échéance</dt>
              <dd>{stamp(detail.started_at || detail.due_at)}</dd>
              <dt>Fin confirmée</dt>
              <dd>{stamp(detail.finished_at)}</dd>
            </dl>
            {detail.error || detailFollowup.message ? (
              <p role="status">
                {String(detail.error || detailFollowup.message)}
              </p>
            ) : null}
            {detailResult.verified === false ? (
              <section>
                <h3>La page publique ne correspond pas encore</h3>
                <p>
                  La tâche a été exécutée, mais la correction n’est pas
                  confirmée. Comparer les champs avant toute nouvelle
                  publication.
                </p>
                <dl className={s.facts}>
                  {Object.entries(record(detailResult.checks)).map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v === true ? "Conforme" : "À corriger"}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}
            {detailEvidence.robotsUrl ? (
              <section>
                <h3>Directive robots observée</h3>
                <p>
                  URL : {String(detailEvidence.url)} · Agent :{" "}
                  {String(detailEvidence.userAgent)}
                </p>
                <a
                  href={String(detailEvidence.robotsUrl)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ouvrir robots.txt
                </a>
                <pre>{String(detailEvidence.directives || "")}</pre>
                {detailEvidence.truncated ? (
                  <small>Extrait limité à 12 000 caractères.</small>
                ) : null}
              </section>
            ) : null}
            <section>
              <h3>
                {detailResult.verified === false
                  ? "Comparer puis vérifier à nouveau"
                  : detailRecovery.label}
              </h3>
              <p>
                {detailResult.verified === false
                  ? "La version servie diffère de la correction publiée. Réinspecter la page, contrôler la publication native et le cache, puis relancer la vérification courante."
                  : detailRecovery.detail}
              </p>
            </section>
            <details>
              <summary>Données techniques et reçu complet</summary>
              <pre>{JSON.stringify(detail, null, 2)}</pre>
            </details>
            {detail.page_id ? (
              <div className={s.actions}>
                <button
                  disabled={!enabled}
                  onClick={() =>
                    void act("queue", {
                      pageIds: [detail.page_id],
                      kind: "crawl",
                    })
                  }
                >
                  Réinspecter la page
                </button>
                <button
                  onClick={() => {
                    dialog.current?.close();
                    setDetail(null);
                    go("corrections");
                  }}
                >
                  Ouvrir les corrections
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </dialog>
    </main>
  );
  function queueView() {
    const items = rows(queue.items),
      filtered = items.filter(
        (j) =>
          !search ||
          String(j.path || "")
            .toLowerCase()
            .includes(search.toLowerCase()),
      );
    return (
      <>
        <div className={s.queueFilters}>
          <label>
            État
            <select
              value={queueState}
              onChange={(e) => {
                setQueueState(e.target.value);
                setQueuePage(1);
              }}
            >
              {[
                ["attention", "À examiner"],
                ["all", "Tous"],
                ["queued", "En attente"],
                ["running", "En cours"],
                ["failed", "Échecs"],
                ["succeeded", "Terminées"],
                ["cancelled", "Annulées"],
              ].map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label>
            <Search size={14} />
            Filtrer cette page
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Chemin de page"
            />
          </label>
          <button onClick={() => void loadQueue()}>Actualiser la file</button>
        </div>
        {queueError ? (
          <p role="alert" className={s.error}>
            {queueError}
          </p>
        ) : null}
        <div className={s.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Page / tâche</th>
                <th>État / raison</th>
                <th>Échéance / essai</th>
                <th>Prochaine action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((j) => {
                const result = record(j.result),
                  followup = record(result.followup),
                  rec = recovery(followup.code || result.code),
                  mismatch = j.kind === "verify" && result.verified === false;
                return (
                  <tr key={String(j.id)}>
                    <td>
                      <button className={s.path} onClick={() => openJob(j)}>
                        {String(j.path)}
                      </button>
                      <small>
                        {String(j.kind)} · {String(j.id).slice(0, 8)}
                      </small>
                    </td>
                    <td>
                      <span
                        className={s.state}
                        data-state={
                          j.state === "failed"
                            ? "blocked"
                            : j.state === "running"
                              ? "working"
                              : "waiting"
                        }
                      >
                        {mismatch
                          ? "Public non conforme"
                          : followup.code
                            ? "Suite incomplète"
                            : stateName(j.state)}
                      </span>
                      <p>
                        {String(
                          j.error || followup.message || result.code || "",
                        )}
                      </p>
                      {j.recovered_at ? (
                        <small>
                          Reprise effectuée : {stamp(j.recovered_at)}
                        </small>
                      ) : null}
                    </td>
                    <td>
                      {stamp(j.due_at)}
                      <small>Essai {Number(j.attempts)} / 3</small>
                    </td>
                    <td>
                      <button onClick={() => openJob(j)}>
                        Détails et preuve
                      </button>
                      {["queued", "running"].includes(String(j.state)) ? (
                        <button
                          disabled={!enabled || draining}
                          onClick={() => void act("cancel", { id: j.id })}
                        >
                          Annuler la tâche
                        </button>
                      ) : null}
                      {["failed", "cancelled"].includes(String(j.state)) ||
                      followup.code ||
                      mismatch ? (
                        <button
                          disabled={!enabled || draining}
                          title={
                            mismatch
                              ? "Comparer les champs servis à la correction publiée."
                              : rec.detail
                          }
                          onClick={() => void act("retry-job", { id: j.id })}
                        >
                          Réessayer explicitement
                        </button>
                      ) : null}
                      {rec.kind === "configuration" ? (
                        <button onClick={() => go("automation")}>
                          Configurer
                        </button>
                      ) : null}
                      <small>
                        {mismatch
                          ? "Comparer les champs servis à la correction publiée."
                          : rec.detail}
                      </small>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!items.length && !queueError ? (
          <div className={s.empty}>
            <CheckCircle2 />
            <h3>Aucune tâche dans cette vue</h3>
            <p>
              Choisissez un autre état ou lancez une exploration depuis Pages.
            </p>
          </div>
        ) : null}
        <div className={s.pagination}>
          <span>
            {Number(queue.total || 0)} tâche(s) · page {queuePage} /{" "}
            {Math.max(1, Math.ceil(Number(queue.total || 0) / 40))}
          </span>
          <button
            aria-label="Page précédente"
            disabled={queuePage <= 1}
            onClick={() => setQueuePage((n) => n - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            aria-label="Page suivante"
            disabled={queuePage * 40 >= Number(queue.total || 0)}
            onClick={() => setQueuePage((n) => n + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </>
    );
  }
}
