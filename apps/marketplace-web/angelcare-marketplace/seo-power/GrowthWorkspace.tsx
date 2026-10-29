"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FilePlus2,
  Globe2,
  Layers3,
  Pause,
  Play,
  RefreshCw,
  Settings2,
  ShieldAlert,
  X,
} from "lucide-react";
import { record, locales, type Row, type Project } from "./model";
import { growthPolicy, type GrowthPolicy } from "./growth-model";
import s from "./growth.module.css";
const API = "/api/angelcare-marketplace/admin/seo-power",
  arr = (v: unknown): Row[] => (Array.isArray(v) ? v.map(record) : []),
  date = (v: unknown) =>
    v ? new Date(String(v)).toLocaleString("fr-FR") : "Non confirmé";
const LABELS: Record<string, string> = {
  NATIVE_INVENTORY_WITHDRAWN:
    "Sources retirées du catalogue : actualisez la sélection",
  INSUFFICIENT_ITEMS: "Au moins trois sources publiées nécessaires",
  INSUFFICIENT_SOURCE_CONTENT:
    "Descriptions sources trop courtes pour une page utile",
  INCOMPLETE_DESCRIPTIONS: "Certaines descriptions sources sont incomplètes",
  OVERLAPPING_SELECTION: "Sélection trop proche d’une page existante",
  candidate: "À enrichir",
  ready: "Prête",
  published: "Publiée",
  stale: "À actualiser",
  parked: "Mise de côté",
};
export function GrowthWorkspace({
  projectId,
  projects,
  permissions,
  pages,
}: {
  projectId: string;
  projects: Project[];
  permissions: { manage: boolean; publish: boolean; rollback?: boolean };
  pages: Row[];
}) {
  const [data, setData] = useState<Row>({}),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [preparing, setPreparing] = useState(false),
    [prepareProgress, setPrepareProgress] = useState(0),
    [page, setPage] = useState(1),
    [filter, setFilter] = useState("all"),
    [view, setView] = useState("opportunities"),
    [selection, setSelection] = useState<string[]>([]),
    [detail, setDetail] = useState<Row | null>(null),
    [policy, setPolicy] = useState<GrowthPolicy | null>(null),
    [policyVersion, setPolicyVersion] = useState(0),
    [policyTarget, setPolicyTarget] = useState(""),
    [correction, setCorrection] = useState("");
  const projectRef = useRef(projectId),
    stopPrepare = useRef(false);
  projectRef.current = projectId;
  const pending = useRef<{ signature: string; key: string } | null>(null),
    busyRef = useRef(false),
    seq = useRef(0),
    dialog = useRef<HTMLDialogElement>(null),
    policyDialog = useRef<HTMLDialogElement>(null),
    mounted = useRef(true);
  const load = useCallback(async () => {
    if (projectId !== projectRef.current) return;
    const token = ++seq.current;
    try {
      const q = new URLSearchParams({
          action: "growth",
          project: projectId,
          state: filter,
          growthPage: String(page),
        }),
        r = await fetch(API + "?" + q, { cache: "no-store" }),
        v = await r.json();
      if (!r.ok)
        throw Error(
          v.error?.message || "Growth indisponible. Appliquez sa migration.",
        );
      if (token === seq.current && mounted.current) {
        setData(v.data);
        setError("");
      }
    } catch (e) {
      if (token === seq.current && mounted.current)
        setError(e instanceof Error ? e.message : "Lecture interrompue.");
    }
  }, [projectId, filter, page]);
  useEffect(() => {
    mounted.current = true;
    void load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible" && !busyRef.current)
        void load();
    }, 15000);
    return () => {
      mounted.current = false;
      clearInterval(timer);
    };
  }, [load]);
  useEffect(() => {
    setSelection([]);
  }, [page, filter]);
  useEffect(() => {
    setDetail((old) =>
      old ? arr(data.opportunities).find((o) => o.id === old.id) || old : null,
    );
  }, [data.opportunities]);
  useEffect(() => {
    stopPrepare.current = true;
    setPage(1);
    setSelection([]);
    setDetail(null);
    setPolicy(null);
  }, [projectId]);
  useEffect(() => {
    if (detail && dialog.current && !dialog.current.open)
      dialog.current.showModal();
  }, [detail]);
  useEffect(() => {
    if (policy && policyDialog.current && !policyDialog.current.open)
      policyDialog.current.showModal();
  }, [policy]);
  async function act(action: string, input: Row): Promise<Row | null> {
    if (busyRef.current) return null;
    const signature = JSON.stringify({ action, input });
    if (pending.current?.signature !== signature)
      pending.current = {
        signature,
        key:
          crypto.randomUUID?.() || "growth-" + Date.now() + "-" + Math.random(),
      };
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
            requestKey: pending.current.key,
          }),
        }),
        v = await r.json();
      if (!r.ok)
        throw Error(
          (v.error?.message || "Action non confirmée.") +
            " · " +
            (v.requestId || ""),
        );
      pending.current = null;
      setNotice("Action confirmée · " + v.requestId);
      await load();
      return record(v.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action non confirmée.");
      return null;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  const opportunities = arr(data.opportunities),
    configs = arr(data.config),
    metrics = arr(data.metrics),
    daily = arr(data.daily),
    native = record(data.nativeOutcomes),
    active = projects.find((p) => p.id === projectId),
    cfg = configs.find((c) => c.project_id === projectId),
    enabled = permissions.manage && !busy && !preparing && !!data.observedAt,
    number = (event: string, channel?: string) =>
      daily
        .filter((m) => m.event === event && (!channel || m.channel === channel))
        .reduce((n, m) => n + Number(m.hits || 0), 0);
  async function prepareAll() {
    if (!active) return;
    stopPrepare.current = false;
    setPreparing(true);
    setPrepareProgress(0);
    const complete = new Set<string>();
    let count = 0;
    try {
      while (
        !stopPrepare.current &&
        mounted.current &&
        projectRef.current === projectId &&
        count < 100 &&
        complete.size < locales(active.world).length
      ) {
        const result = await act("growth-sync", { projectId });
        count++;
        setPrepareProgress(count);
        if (!result) break;
        if (result.complete === true) complete.add(String(result.locale));
      }
      if (complete.size === locales(active.world).length) {
        let result: Row | null = null;
        do {
          if (stopPrepare.current || projectRef.current !== projectId) break;
          result = await act("growth-build", { projectId });
          count++;
          setPrepareProgress(count);
        } while (result?.more === true && count < 200);
      }
      setNotice(
        stopPrepare.current
          ? "Arrêt après le lot courant. Les curseurs sont conservés."
          : "Préparation bornée terminée : " +
              count +
              " lots confirmés ou tentés. Vérifiez la couverture et les motifs avant publication.",
      );
    } finally {
      setPreparing(false);
    }
  }
  async function bulk() {
    for (const id of selection) {
      if (!(await act("growth-publish", { id }))) break;
    }
    setSelection([]);
  }
  function openPolicy(c: Row) {
    setPolicyTarget(String(c.project_id));
    setPolicy(growthPolicy(c.policy));
    setPolicyVersion(Number(c.version));
  }
  const selectedData = record(detail?.data),
    items = arr(selectedData.items),
    evidence = record(selectedData.evidence);
  return (
    <section className={s.root}>
      <header className={s.hero}>
        <div>
          <span>CROISSANCE · CATALOGUE → PUBLICATION → OBSERVATIONS</span>
          <h2>Développer votre couverture utile</h2>
          <p>
            Des sélections fondées sur vos sources publiées. Des corrections
            applicables. Des résultats observés séparés des hypothèses.
          </p>
        </div>
        <button disabled={busy} onClick={() => void load()}>
          <RefreshCw size={16} />
          Actualiser
        </button>
      </header>
      <div className={s.status}>
        <Activity size={15} />
        <strong>Lecture : {date(data.observedAt)}</strong>
        <span>Toutes les 15 s · 30 jours de mesure</span>
        <span>Dernier événement : {date(data.measurementLast)}</span>
      </div>
      {error ? (
        <div className={s.error} role="alert">
          {error}
          <a href={API + "?action=growth-sql"}>Migration complète</a>
          <button
            onClick={() => setError("")}
            aria-label="Fermer l’erreur Growth"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}
      {notice ? (
        <p className={s.notice} role="status">
          <CheckCircle2 size={16} />
          {notice}
        </p>
      ) : null}
      <div className={s.metrics}>
        {[
          [String(data.inventory ?? "—"), "Fiches × langues synchronisées"],
          [
            String(number("pageview", "search")),
            "Entrées avec provenance moteur déclarée",
          ],
          [String(number("resource_open")), "Ouvertures de fiches observées"],
          [
            native.applications == null ? "—" : String(native.applications),
            "Candidatures reçues · toutes provenances",
          ],
          [
            native.inquiries == null ? "—" : String(native.inquiries),
            "Demandes reçues · toutes provenances",
          ],
          [
            String(number("file_response")),
            "Fichiers Documents · réponses HTTP",
          ],
        ].map(([n, l]) => (
          <article key={l}>
            <strong>{n}</strong>
            <span>{l}</span>
          </article>
        ))}
      </div>
      <p className={s.caption}>
        Événements agrégés, pas des visiteurs uniques certifiés. Les clics ne
        sont pas des conversions. L’attribution organique des candidatures et
        demandes est inconnue. Mesure navigateur limitée aux pages disposant du
        composant SEO natif ; respect de DNT/GPC, sans cookie de suivi.{" "}
        {data.telemetrySecretConfigured === false
          ? "Secret de mesure existant absent ou trop court : événements navigateur non collectés."
          : ""}
      </p>
      <nav className={s.tabs} aria-label="Contrôles Growth">
        {[
          ["opportunities", "Opportunités"],
          ["performance", "Résultats"],
          ["automation", "Contrôle & cadence"],
          ["activity", "Journal en direct"],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-current={view === id ? "page" : undefined}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      {view === "opportunities" ? (
        <>
          <section className={s.panel}>
            <div className={s.head}>
              <div>
                <h3>Une action sur les sources, une action sur les pages</h3>
                <p>
                  {active
                    ? active.name
                    : "Choisissez un univers dans le sélecteur principal pour exécuter des actions ciblées."}
                </p>
              </div>
              <div className={s.actions}>
                {preparing ? (
                  <button
                    onClick={() => {
                      stopPrepare.current = true;
                    }}
                  >
                    Arrêter après ce lot · {prepareProgress}
                  </button>
                ) : (
                  <button
                    disabled={!enabled || !active}
                    onClick={() => void prepareAll()}
                  >
                    Synchroniser et préparer le parcours
                  </button>
                )}
                <button
                  disabled={!enabled || !active}
                  onClick={() => void act("growth-sync", { projectId })}
                >
                  <RefreshCw size={15} />
                  Synchroniser un lot
                </button>
                <button
                  disabled={!enabled || !active}
                  onClick={() => void act("growth-build", { projectId })}
                >
                  <Layers3 size={15} />
                  Préparer les opportunités
                </button>
              </div>
            </div>
            <p className={s.caption}>
              Chaque lot conserve son curseur. Le moteur planifié peut
              poursuivre les lots indépendamment de cet écran. Les langues et le
              volume réellement couverts sont visibles dans Contrôle & cadence.
            </p>
          </section>
          <section className={s.panel}>
            <div className={s.head}>
              <div>
                <h3>Sélections et destinations de recherche</h3>
                <p>
                  Le potentiel de recherche est une hypothèse issue du catalogue
                  ; aucun volume externe n’est inventé.
                </p>
              </div>
              <label>
                État
                <select
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  {[
                    "all",
                    "candidate",
                    "ready",
                    "published",
                    "stale",
                    "parked",
                  ].map((k) => (
                    <option key={k} value={k}>
                      {LABELS[k] || "Tous"}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className={s.table}>
              <table>
                <thead>
                  <tr>
                    <th>Sélection</th>
                    <th>Qualité / publication</th>
                    <th>Sources</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((o) => {
                    const d = record(o.data),
                      ev = record(d.evidence),
                      blocks = Array.isArray(d.blocks)
                        ? d.blocks.map(String)
                        : [],
                      canPublish =
                        permissions.publish &&
                        d.ready === true &&
                        o.state !== "parked";
                    return (
                      <tr key={String(o.id)}>
                        <td>
                          <label className={s.select}>
                            <input
                              type="checkbox"
                              disabled={!canPublish || busy}
                              checked={selection.includes(String(o.id))}
                              onChange={(e) =>
                                setSelection((x) =>
                                  e.target.checked
                                    ? [...x, String(o.id)]
                                    : x.filter((id) => id !== o.id),
                                )
                              }
                            />
                            <strong>{String(d.title || o.key)}</strong>
                          </label>
                          <small>{String(o.path)}</small>
                          <small>
                            {String(o.locale).toUpperCase()} · demande non
                            mesurée
                          </small>
                        </td>
                        <td>
                          <span
                            className={s.badge}
                            data-state={String(o.state)}
                          >
                            {LABELS[String(o.state)] || String(o.state)}
                          </span>
                          {blocks.map((b) => (
                            <p key={b}>{LABELS[b] || b}</p>
                          ))}
                          {o.change_id ? (
                            <small>
                              {o.active_publication === false
                                ? "Publication remplacée dans l’autorité native"
                                : o.verified_at
                                  ? "Public vérifié le " + date(o.verified_at)
                                  : "Public encore à vérifier"}
                            </small>
                          ) : null}
                          <small>
                            {Number(o.search_entries || 0)} entrées moteur
                            observées · {Number(o.resource_opens || 0)}{" "}
                            ouvertures depuis cette page
                          </small>
                        </td>
                        <td>
                          {Number(ev.items || 0)} retenues /{" "}
                          {Number(ev.totalNativeItems || ev.items || 0)}{" "}
                          disponibles
                          <small>{Number(ev.words || 0)} mots de source</small>
                        </td>
                        <td>
                          <button onClick={() => setDetail(o)}>
                            <Eye size={14} />
                            Prévisualiser
                          </button>
                          <button
                            disabled={!enabled || !canPublish}
                            onClick={() =>
                              void act("growth-publish", { id: o.id })
                            }
                          >
                            Publier / actualiser
                          </button>
                          <button
                            disabled={!enabled}
                            onClick={() =>
                              void act("growth-park", {
                                projectId: o.project_id,
                                id: o.id,
                                version: o.version,
                                parked: o.state !== "parked",
                              })
                            }
                          >
                            {o.state === "parked"
                              ? "Réexaminer"
                              : "Suspendre les mises à jour"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!opportunities.length ? (
              <div className={s.empty}>
                <FilePlus2 />
                <h3>Aucune opportunité dans cette vue</h3>
                <p>
                  Synchronisez les sources publiées, puis préparez les
                  opportunités. Les sélections insuffisantes restent visibles
                  avec leur motif.
                </p>
              </div>
            ) : null}
            <div className={s.pagination}>
              <button
                disabled={!enabled || !permissions.publish || !selection.length}
                onClick={() => void bulk()}
              >
                Publier la sélection ({selection.length})
              </button>
              <span>
                {Number(data.total || 0)} · page {page}
              </span>
              <button
                aria-label="Opportunités précédentes"
                disabled={page <= 1}
                onClick={() => setPage((n) => n - 1)}
              >
                <ChevronLeft size={15} />
              </button>
              <button
                aria-label="Opportunités suivantes"
                disabled={page * 30 >= Number(data.total || 0)}
                onClick={() => setPage((n) => n + 1)}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </section>
          <section className={s.panel}>
            <h3>Améliorer une page existante</h3>
            <p>
              Préparer une correction des métadonnées manquantes et des liens
              contextuels depuis les faits déjà observés. Publication dans
              l’outil natif Corrections.
            </p>
            <div className={s.actions}>
              <select
                aria-label="Page à améliorer"
                value={correction}
                onChange={(e) => setCorrection(e.target.value)}
              >
                <option value="">
                  Choisir une page inspectée dans l’inventaire courant
                </option>
                {pages
                  .filter((p) => p.facts)
                  .map((p) => (
                    <option key={String(p.id)} value={String(p.id)}>
                      {String(p.path)}
                    </option>
                  ))}
              </select>
              <button
                disabled={!enabled || !correction}
                onClick={() =>
                  void act("growth-suggest", { pageId: correction })
                }
              >
                Préparer la correction
              </button>
            </div>
          </section>
        </>
      ) : null}
      {view === "performance" ? (
        <>
          <section className={s.panel}>
            <h3>Activité quotidienne observée</h3>
            <p>
              Les références moteur proviennent du navigateur. Les visites
              masquées par les protections de confidentialité ou les référents
              absents ne sont pas reconstituées.
            </p>
            <div className={s.chart} aria-label="Événements quotidiens">
              <table>
                <thead>
                  <tr>
                    <th>Jour</th>
                    <th>Événement</th>
                    <th>Provenance</th>
                    <th>Observations</th>
                  </tr>
                </thead>
                <tbody>
                  {daily.map((m, i) => (
                    <tr key={i}>
                      <td>{String(m.day)}</td>
                      <td>{String(m.event)}</td>
                      <td>{String(m.channel)}</td>
                      <td>
                        <meter
                          min={0}
                          max={Math.max(1, ...daily.map((x) => Number(x.hits)))}
                          value={Number(m.hits)}
                        />
                        {Number(m.hits)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!daily.length ? (
              <p>
                Aucune observation collectée. Vérifiez l’activation de mesure,
                son secret existant et les pages instrumentées.
              </p>
            ) : null}
          </section>
          <section className={s.panel}>
            <h3>Pages qui produisent une action</h3>
            <div className={s.table}>
              <table>
                <thead>
                  <tr>
                    <th>Page</th>
                    <th>Événement</th>
                    <th>Provenance</th>
                    <th>Nombre</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((m, i) => (
                    <tr key={i}>
                      <td>{String(m.path)}</td>
                      <td>{String(m.event)}</td>
                      <td>{String(m.channel)}</td>
                      <td>{Number(m.hits)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <small>
              200 premières combinaisons sur 30 jours. Les totaux du bandeau
              utilisent l’agrégation quotidienne complète.
            </small>
          </section>
        </>
      ) : null}
      {view === "automation" ? (
        <>
          <div className={s.worldGrid}>
            {configs.map((c) => {
              const p = projects.find((p) => p.id === c.project_id),
                v = growthPolicy(c.policy);
              return (
                <article key={String(c.project_id)}>
                  <div className={s.head}>
                    <h3>{p?.name || String(c.project_id)}</h3>
                    <span className={s.badge}>
                      {v.enabled ? "Moteur autorisé" : "Moteur arrêté"}
                    </span>
                  </div>
                  <dl>
                    <dt>Préparation des sélections</dt>
                    <dd>{v.automaticDrafts ? "Automatique" : "Manuelle"}</dd>
                    <dt>Publication</dt>
                    <dd>
                      {v.automaticPublish
                        ? "Automatique autorisée"
                        : "Sur action explicite"}
                    </dd>
                    <dt>Mesure</dt>
                    <dd>{v.measurement ? "Activée" : "Désactivée"}</dd>
                    <dt>Limite quotidienne</dt>
                    <dd>{v.maxPagesPerDay} réservations de publication</dd>
                    <dt>Cadence inventaire</dt>
                    <dd>{v.syncMinutes} min</dd>
                    <dt>Publication reportée jusqu’au</dt>
                    <dd>{date(c.publish_after)}</dd>
                    <dt>Dernier déclenchement Growth</dt>
                    <dd>{date(c.last_tick)}</dd>
                    <dt>Bail actif jusqu’au</dt>
                    <dd>{date(c.lease_until)}</dd>
                  </dl>
                  <button
                    disabled={!permissions.manage || busy}
                    onClick={() => openPolicy(c)}
                  >
                    Configurer les règles
                  </button>
                </article>
              );
            })}
          </div>
          <section className={s.panel}>
            <h3>Couverture et reprise des inventaires</h3>
            <div className={s.table}>
              <table>
                <thead>
                  <tr>
                    <th>Univers</th>
                    <th>Langue</th>
                    <th>Prochain lot</th>
                    <th>Inventaire annoncé</th>
                    <th>Dernier cycle terminé</th>
                    <th>Prochaine échéance</th>
                  </tr>
                </thead>
                <tbody>
                  {arr(data.scans).map((q, i) => (
                    <tr key={i}>
                      <td>
                        {projects.find((p) => p.id === q.project_id)?.name}
                      </td>
                      <td>{String(q.locale)}</td>
                      <td>{Number(q.page)}</td>
                      <td>{Number(q.total)}<small>{Number(record(q.last_batch).excluded||0)} non éligibles dans le dernier lot (activité / langue)</small></td>
                      <td>{date(q.last_complete)}</td>
                      <td>{date(q.next_due)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={s.caption}>
              Une absence n’est actée qu’à la fin d’un cycle complet de la
              langue concernée. Les limites de contenu et le chevauchement de
              sélections sont contrôlés avant publication. L’exécution
              automatique utilise le planificateur SEO existant ; son activation
              HTTP et ses extensions restent à vérifier dans Automatisation.
            </p>
          </section>
        </>
      ) : null}
      {view === "activity" ? (
        <section className={s.panel}>
          <h3>Journal des actions et passages</h3>
          <p>
            50 dernières entrées ; une action confirmée n’est pas une preuve de
            trafic.
          </p>
          <div className={s.table}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Univers</th>
                  <th>Action</th>
                  <th>État</th>
                  <th>Preuve</th>
                </tr>
              </thead>
              <tbody>
                {arr(data.activity).map((a) => (
                  <tr key={String(a.id)}>
                    <td>{date(a.created_at)}</td>
                    <td>{projects.find((p) => p.id === a.project_id)?.name}</td>
                    <td>{String(a.action)}</td>
                    <td>{String(a.state)}</td>
                    <td>
                      <details>
                        <summary>Résultat</summary>
                        <pre>{JSON.stringify(a.detail, null, 2)}</pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
      <dialog
        ref={dialog}
        className={s.dialog}
        onClose={() => setDetail(null)}
        onCancel={() => setDetail(null)}
      >
        {detail ? (
          <>
            <div className={s.head}>
              <h2>{String(selectedData.title)}</h2>
              <button
                aria-label="Fermer la prévisualisation"
                onClick={() => dialog.current?.close()}
              >
                <X />
              </button>
            </div>
            {error ? <p role="alert">{error}</p> : null}
            <p>{String(selectedData.description)}</p>
            <div className={s.evidence}>
              <strong>Fondement : catalogue publié</strong>
              <span>
                {Number(evidence.items)} sources · {Number(evidence.words)} mots
                · {String(detail.locale)}
              </span>
              <span>Demande de recherche / volume : non mesurés</span>
            </div>
            <h3>Contenu qui sera réellement exposé</h3>
            {items.map((x) => (
              <article key={String(x.path)}>
                <h4>{String(x.title)}</h4>
                <p>{String(x.summary)}</p>
                <a href={String(x.path)} target="_blank" rel="noreferrer">
                  Consulter la source publique
                </a>
                <code>{String(x.path)}</code>
              </article>
            ))}
            <p>{String(selectedData.body || "").split("\n\n")[0]}</p>
            <p>
              Les données publiées sont figées à la publication ; les fiches
              retirées sont exclues à la lecture. Sous le seuil de qualité, la
              page devient non indexable.
            </p>
            <div className={s.actions}>
              <button
                disabled={
                  !permissions.publish ||
                  busy ||
                  selectedData.ready !== true ||
                  detail.state === "parked"
                }
                onClick={() => void act("growth-publish", { id: detail.id })}
              >
                Publier cette sélection
              </button>
              {detail.change_id && permissions.rollback ? (
                <button
                  disabled={busy || preparing}
                  onClick={() => void act("growth-rollback", { id: detail.id })}
                >
                  Restaurer la publication précédente
                </button>
              ) : null}
              {detail.change_id ? (
                <button
                  disabled={busy || !permissions.manage}
                  onClick={() =>
                    void act("queue", {
                      pageIds: [detail.page_id],
                      kind: "verify",
                    })
                  }
                >
                  Vérifier le public
                </button>
              ) : null}
            </div>
          </>
        ) : null}
      </dialog>
      <dialog
        ref={policyDialog}
        className={s.dialog}
        onClose={() => setPolicy(null)}
        onCancel={() => setPolicy(null)}
      >
        {policy ? (
          <>
            <div className={s.head}>
              <h2>
                Règles · {projects.find((p) => p.id === policyTarget)?.name}
              </h2>
              <button
                aria-label="Fermer les règles"
                onClick={() => policyDialog.current?.close()}
              >
                <X />
              </button>
            </div>
            {error ? <p role="alert">{error}</p> : null}
            <p>
              Une autorisation de publication est nécessaire pour activer la
              publication automatique. Le planificateur existant doit
              fonctionner ; cette configuration ne l’active pas à elle seule.
            </p>
            {[
              ["enabled", "Autoriser les passages Growth"],
              ["automaticDrafts", "Préparer les opportunités automatiquement"],
              [
                "automaticPublish",
                "Autoriser la publication automatique sous contrôles",
              ],
              [
                "automaticMetadata",
                "Compléter automatiquement les métadonnées manquantes depuis les faits natifs",
              ],
              [
                "measurement",
                "Activer la mesure agrégée sur les pages instrumentées",
              ],
            ].map(([k, l]) => (
              <label className={s.check} key={k}>
                <input
                  type="checkbox"
                  disabled={
                    ["automaticPublish", "automaticMetadata"].includes(k) &&
                    !permissions.publish
                  }
                  checked={policy[k as keyof GrowthPolicy] === true}
                  onChange={(e) =>
                    setPolicy({ ...policy, [k]: e.target.checked })
                  }
                />
                {l}
              </label>
            ))}
            <div className={s.formGrid}>
              {[
                ["minimumItems", "Sources minimum", 3, 12],
                ["minimumWords", "Mots de source minimum", 120, 2000],
                ["maxPagesPerDay", "Réservations par jour", 1, 30],
                ["syncMinutes", "Cadence en minutes", 15, 1440],
              ].map(([k, l, min, max]) => (
                <label key={k}>
                  {l}
                  <input
                    type="number"
                    min={min}
                    max={max}
                    value={Number(policy[k as keyof GrowthPolicy])}
                    onChange={(e) =>
                      setPolicy({ ...policy, [k]: Number(e.target.value) })
                    }
                  />
                </label>
              ))}
            </div>
            <button
              disabled={busy || !permissions.manage || !policyTarget}
              onClick={async () => {
                if (
                  await act("growth-policy", {
                    projectId: policyTarget,
                    version: policyVersion,
                    policy,
                  })
                ) {
                  policyDialog.current?.close();
                  setPolicy(null);
                }
              }}
            >
              Enregistrer les règles
            </button>
          </>
        ) : null}
      </dialog>
    </section>
  );
}
