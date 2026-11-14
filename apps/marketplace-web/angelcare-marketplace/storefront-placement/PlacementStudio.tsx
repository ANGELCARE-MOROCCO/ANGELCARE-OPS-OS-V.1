"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Globe2,
  Layers3,
  LoaderCircle,
  RotateCcw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import {
  automaticPlacement,
  ESTABLISHMENT_VIEWS,
  normalizePlacement,
  STOREFRONTS,
  validatePlacement,
  type PlacementSnapshot,
  type StorefrontPlacement,
} from "./model";
import type { StorefrontKey } from "../catalog-discovery/types";
import s from "./placement.module.css";

async function requestSnapshot(
  endpoint: string,
  init?: RequestInit,
): Promise<PlacementSnapshot> {
  const response = await fetch(endpoint, {
    cache: "no-store",
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.data) {
    const error = new Error(
      payload?.error?.message || "Lecture des vitrines impossible. Réessayez.",
    );
    Object.assign(error, { code: payload?.error?.code });
    throw error;
  }
  return payload.data as PlacementSnapshot;
}
const sectionLabel = {
  publication: "la publication",
  categories: "les catégories",
  availability: "la disponibilité",
  territories: "les territoires",
};
const equal = (a: StorefrontPlacement, b: StorefrontPlacement) =>
  JSON.stringify(a) === JSON.stringify(b);
const describe = (config: StorefrontPlacement) =>
  config.mode === "automatic"
    ? "Règles automatiques"
    : config.storefronts.length
      ? STOREFRONTS.filter((row) => config.storefronts.includes(row.key))
          .map((row) => row.label)
          .join(" · ")
      : "Aucune des 12 vitrines";

export function PlacementStudio({
  itemId,
  onSaved,
  onSection,
}: {
  itemId: string;
  onSaved?: (snapshot: PlacementSnapshot) => void;
  onSection?: (
    section: PlacementSnapshot["publicIssues"][number]["section"],
  ) => void;
}) {
  const [snapshot, setSnapshot] = useState<PlacementSnapshot | null>(null),
    [draft, setDraft] = useState<StorefrontPlacement>(automaticPlacement),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [conflict, setConflict] = useState(false),
    [query, setQuery] = useState("");
  const draftBase = useRef(""),
    lock = useRef(false),
    generation = useRef(0),
    draftRef = useRef(draft);
  draftRef.current = draft;
  const endpoint =
      "/api/angelcare-marketplace/admin/catalog/items/" +
      encodeURIComponent(itemId) +
      "/storefront-placement",
    storageKey = "ac.storefront-placement.v1:" + itemId;
  useEffect(() => {
    const controller = new AbortController(),
      at = ++generation.current;
    setLoading(true);
    setSnapshot(null);
    setError("");
    setMessage("");
    setConflict(false);
    lock.current = false;
    requestSnapshot(endpoint, { signal: controller.signal })
      .then((next) => {
        if (controller.signal.aborted || at !== generation.current) return;
        let config = next.config;
        draftBase.current = next.updatedAt;
        try {
          const saved = JSON.parse(
            sessionStorage.getItem(storageKey) || "null",
          );
          if (
            saved?.itemId === itemId &&
            !validatePlacement(saved.config).length
          ) {
            config = normalizePlacement(saved.config);
            if (!equal(config, next.config)) {
              draftBase.current = saved.baseUpdatedAt;
              setConflict(saved.baseUpdatedAt !== next.updatedAt);
              setMessage("Votre sélection non enregistrée a été restaurée.");
            }
          }
        } catch {}
        setSnapshot(next);
        setDraft(config);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted && at === generation.current)
          setLoading(false);
      });
    return () => {
      controller.abort();
      generation.current++;
    };
  }, [endpoint, itemId, storageKey]);
  const dirty = Boolean(snapshot && !equal(draft, snapshot.config)),
    canEdit = snapshot?.canManage === true && !loading && !saving;
  useEffect(() => {
    if (!snapshot || loading) return;
    try {
      if (dirty)
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            itemId,
            baseUpdatedAt: draftBase.current || snapshot.updatedAt,
            config: draft,
          }),
        );
      else sessionStorage.removeItem(storageKey);
    } catch {}
  }, [draft, dirty, itemId, loading, snapshot, storageKey]);
  function update(config: StorefrontPlacement) {
    setDraft(config);
    setMessage("");
    setError("");
  }
  function toggle(key: StorefrontKey, checked: boolean) {
    const storefronts = checked
      ? [...draft.storefronts, key]
      : draft.storefronts.filter((value) => value !== key);
    update(
      normalizePlacement({
        ...draft,
        storefronts,
        establishmentViews:
          key === "establishments"
            ? checked
              ? ESTABLISHMENT_VIEWS.map((row) => row.key)
              : []
            : draft.establishmentViews,
      }),
    );
  }
  async function reload(preserve: boolean) {
    if (lock.current) return;
    lock.current = true;
    setLoading(true);
    setError("");
    const at = generation.current;
    try {
      const next = await requestSnapshot(endpoint);
      if (at !== generation.current) return;
      draftBase.current = next.updatedAt;
      setSnapshot(next);
      setDraft(preserve ? draftRef.current : next.config);
      setConflict(false);
      setMessage(
        preserve
          ? "Version actuelle relue. Votre sélection est conservée ; vérifiez-la avant de l’enregistrer."
          : "Configuration enregistrée rechargée.",
      );
    } catch (e) {
      if (at === generation.current)
        setError(e instanceof Error ? e.message : "Lecture impossible.");
    } finally {
      lock.current = false;
      if (at === generation.current) setLoading(false);
    }
  }
  async function save() {
    if (lock.current || !snapshot || !canEdit || conflict || !dirty) return;
    const errors = validatePlacement(draft);
    if (errors.length) {
      setError(errors.join(" "));
      return;
    }
    lock.current = true;
    setSaving(true);
    setError("");
    setMessage("");
    const at = generation.current;
    try {
      const next = await requestSnapshot(endpoint, {
        method: "PATCH",
        body: JSON.stringify({
          expectedUpdatedAt: snapshot.updatedAt,
          config: normalizePlacement(draft),
        }),
      });
      if (at !== generation.current) return;
      if (
        next.itemId !== itemId ||
        !next.updatedAt ||
        !equal(normalizePlacement(next.config), normalizePlacement(draft))
      )
        throw Error(
          "La réponse ne confirme pas votre sélection. Relisez avant de réessayer.",
        );
      draftBase.current = next.updatedAt;
      setSnapshot(next);
      setDraft(next.config);
      setConflict(false);
      setMessage(
        "Placements enregistrés et relus. Les vitrines publiques ont été actualisées.",
      );
      try {
        sessionStorage.removeItem(storageKey);
      } catch {}
      onSaved?.(next);
    } catch (e) {
      if (at === generation.current) {
        setError(
          e instanceof Error ? e.message : "Enregistrement non confirmé.",
        );
        if ((e as { code?: string }).code === "CONFLICT") setConflict(true);
      }
    } finally {
      lock.current = false;
      if (at === generation.current) setSaving(false);
    }
  }
  if (!snapshot)
    return (
      <section className={s.studio}>
        <header className={s.hero}>
          <Globe2 />
          <div>
            <span>PRODUCT 360 · DIFFUSION COMMERCIALE</span>
            <h2>Une offre. Toutes vos vitrines.</h2>
          </div>
        </header>
        {loading ? (
          <p role="status" className={s.feedback}>
            <LoaderCircle /> Lecture des placements…
          </p>
        ) : (
          <div role="alert" className={s.feedback}>
            <p>{error}</p>
            <button type="button" onClick={() => void reload(false)}>
              Réessayer
            </button>
          </div>
        )}
      </section>
    );
  const manual = draft.mode === "manual",
    shown = STOREFRONTS.filter((row) =>
      (row.label + " " + row.detail)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .includes(
          query
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase(),
        ),
    );
  return (
    <section
      className={s.studio}
      data-storefront-placement={itemId}
      aria-busy={loading || saving}
    >
      <header className={s.hero}>
        <div className={s.orbit}>
          <Globe2 size={32} />
          <b>12</b>
        </div>
        <div>
          <span>PRODUCT 360 · PLACEMENTS FACULTATIFS</span>
          <h2>Une offre. Toutes vos vitrines.</h2>
          <p>
            {snapshot.name} · Choisissez sa présence commerciale, sans changer
            sa nature.
          </p>
        </div>
        <div className={s.heroCount}>
          <strong>{manual ? draft.storefronts.length : "Auto"}</strong>
          <span>
            {manual
              ? "vitrine" +
                (draft.storefronts.length > 1 ? "s" : "") +
                " choisie" +
                (draft.storefronts.length > 1 ? "s" : "")
              : "Règles natives préservées"}
          </span>
        </div>
      </header>
      <div
        className={s.modeBar}
        role="radiogroup"
        aria-label="Mode de placement"
      >
        <label data-active={!manual}>
          <input
            type="radio"
            name={"placement-mode-" + itemId}
            checked={!manual}
            disabled={!canEdit}
            onChange={() => update(automaticPlacement())}
          />
          <ShieldCheck size={21} />
          <span>
            <strong>Automatique</strong>
            <small>
              Aucun réglage obligatoire. Les règles existantes s’appliquent.
            </small>
          </span>
        </label>
        <label data-active={manual}>
          <input
            type="radio"
            name={"placement-mode-" + itemId}
            checked={manual}
            disabled={!canEdit}
            onChange={() => update({ ...automaticPlacement(), mode: "manual" })}
          />
          <SlidersHorizontal size={21} />
          <span>
            <strong>Choisir librement</strong>
            <small>
              Votre sélection exacte remplace le placement automatique.
            </small>
          </span>
        </label>
      </div>
      {!snapshot.canManage ? (
        <p className={s.notice}>
          Consultation seule · Votre rôle ne permet pas de modifier ces
          placements.
        </p>
      ) : null}
      {message ? (
        <p className={s.feedback} role="status">
          <Check size={18} />
          {message}
        </p>
      ) : null}
      {error ? (
        <p className={s.error} role="alert">
          {error}
        </p>
      ) : null}
      {conflict ? (
        <div className={s.conflict} role="alert">
          <strong>
            Une version plus récente existe. Votre sélection reste conservée.
          </strong>
          <p>
            Dernière configuration lue : {describe(snapshot.config)}. Relisez la
            version actuelle avant de remplacer ses placements.
          </p>
          <button
            type="button"
            disabled={loading || saving}
            onClick={() => void reload(true)}
          >
            Relire et conserver ma sélection
          </button>
          <button
            type="button"
            disabled={loading || saving}
            onClick={() => void reload(false)}
          >
            Utiliser la sélection enregistrée
          </button>
        </div>
      ) : null}
      <div className={s.toolbar}>
        <div>
          <span className={s.eyebrow}>DESTINATIONS COMMERCIALES</span>
          <h3>
            {manual
              ? "À vous de choisir."
              : "Vos 12 vitrines, disponibles à tout moment."}
          </h3>
        </div>
        <input
          aria-label="Rechercher une vitrine"
          type="search"
          placeholder="Rechercher une vitrine…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {manual ? (
          <div>
            <button
              type="button"
              disabled={!canEdit}
              onClick={() =>
                update({
                  version: 1,
                  mode: "manual",
                  storefronts: STOREFRONTS.map((row) => row.key),
                  establishmentViews: ESTABLISHMENT_VIEWS.map((row) => row.key),
                })
              }
            >
              Tout sélectionner
            </button>
            <button
              type="button"
              disabled={!canEdit}
              onClick={() =>
                update({ ...automaticPlacement(), mode: "manual" })
              }
            >
              Tout retirer
            </button>
          </div>
        ) : null}
      </div>
      <fieldset
        className={s.grid}
        disabled={!canEdit || !manual}
        aria-label="Les 12 vitrines atomiques"
      >
        {shown.map((row) => (
          <article
            key={row.key}
            className={s.card}
            data-selected={manual && draft.storefronts.includes(row.key)}
          >
            <label className={s.destination}>
              <div className={s.number}>
                {String(
                  STOREFRONTS.findIndex((item) => item.key === row.key) + 1,
                ).padStart(2, "0")}
              </div>
              <div>
                <span>{row.group}</span>
                <strong>{row.label}</strong>
                <small>{row.detail}</small>
              </div>
              <input
                type="checkbox"
                aria-label={row.label}
                checked={manual && draft.storefronts.includes(row.key)}
                onChange={(e) => toggle(row.key, e.target.checked)}
              />
            </label>
            {row.key === "establishments" ? (
              <div className={s.children}>
                <p>
                  <Layers3 size={14} /> Trois explorateurs indépendants
                </p>
                {ESTABLISHMENT_VIEWS.map((view) => (
                  <label key={view.key}>
                    <input
                      type="checkbox"
                      checked={
                        manual &&
                        draft.storefronts.includes("establishments") &&
                        draft.establishmentViews.includes(view.key)
                      }
                      onChange={(e) => {
                        const views = e.target.checked
                          ? [...draft.establishmentViews, view.key]
                          : draft.establishmentViews.filter(
                              (key) => key !== view.key,
                            );
                        update(
                          normalizePlacement({
                            ...draft,
                            storefronts: views.length
                              ? [
                                  ...new Set([
                                    ...draft.storefronts,
                                    "establishments",
                                  ]),
                                ]
                              : draft.storefronts.filter(
                                  (key) => key !== "establishments",
                                ),
                            establishmentViews: views,
                          }),
                        );
                      }}
                    />
                    {view.label}
                  </label>
                ))}
                <small>
                  Ce Partner OS est celui des Établissements ; la vitrine
                  Partner OS autonome reste indépendante.
                </small>
              </div>
            ) : null}
          </article>
        ))}
      </fieldset>
      {!shown.length ? (
        <p className={s.notice}>
          Aucune vitrine ne correspond à cette recherche.
        </p>
      ) : null}
      <section className={s.summary}>
        <div>
          <span className={s.eyebrow}>
            {dirty ? "SÉLECTION À ENREGISTRER" : "CONFIGURATION ENREGISTRÉE"}
          </span>
          <h3>
            {manual
              ? draft.storefronts.length + " / 12 vitrines sélectionnées"
              : "Placement automatique"}
          </h3>
          <p>{describe(draft)}</p>
          {manual && draft.storefronts.includes("establishments") ? (
            <p>
              Établissements :{" "}
              {ESTABLISHMENT_VIEWS.filter((row) =>
                draft.establishmentViews.includes(row.key),
              )
                .map((row) => row.label)
                .join(" · ")}
            </p>
          ) : null}
          {manual && !draft.storefronts.length ? (
            <p className={s.warning}>
              Enregistrer cette sélection retirera l’offre des 12 explorateurs.
              Son statut et sa page publique restent inchangés.
            </p>
          ) : null}
        </div>
        <ShieldCheck size={30} />
      </section>
      <p className={s.localeNote}>
        Les destinations sont communes aux versions FR, EN et AR. Les trois
        explorateurs concernent la vitrine Établissements en français.
      </p>
      <section className={s.visibility}>
        <header>
          <ShieldCheck size={18} />
          <h3>Visibilité réelle de l’offre</h3>
        </header>
        <p>
          Les placements ne publient pas une offre et ne contournent ni les
          territoires, ni la visibilité, ni les conditions de disponibilité.
        </p>
        {snapshot.publicIssues.length ? (
          <div className={s.issues}>
            {snapshot.publicIssues.map((issue) => (
              <article key={issue.code}>
                <p>{issue.message}</p>
                {onSection ? (
                  <button
                    type="button"
                    onClick={() => onSection(issue.section)}
                  >
                    Vérifier {sectionLabel[issue.section]}
                    <ArrowUpRight size={14} />
                  </button>
                ) : (
                  <a
                    href={
                      "/angelcare-marketplace/admin/catalog/items/" +
                      itemId +
                      "/" +
                      issue.section
                    }
                  >
                    Vérifier {sectionLabel[issue.section]}
                    <ArrowUpRight size={14} />
                  </a>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className={s.good}>
            <Check size={16} /> Aucun obstacle de statut, d’adresse ou de
            catégorie détecté pour la lecture française. Les règles du
            territoire visité restent applicables.
          </p>
        )}
      </section>
      {snapshot.config.mode === "manual" &&
      snapshot.config.storefronts.length ? (
        <div className={s.previews}>
          <span>Vitrines enregistrées</span>
          {STOREFRONTS.filter(
            (row) =>
              row.key !== "establishments" &&
              snapshot.config.storefronts.includes(row.key),
          ).map((row) => (
            <a
              key={row.key}
              href={
                "/angelcare-marketplace/fr/" +
                row.key +
                (snapshot.territoryCode
                  ? "?territory=" + encodeURIComponent(snapshot.territoryCode)
                  : "")
              }
              target="_blank"
              rel="noreferrer"
            >
              {row.label}
              <ArrowUpRight size={13} />
            </a>
          ))}
          {snapshot.config.storefronts.includes("establishments")
            ? ESTABLISHMENT_VIEWS.filter((view) =>
                snapshot.config.establishmentViews.includes(view.key),
              ).map((view) => (
                <a
                  key={"establishments-" + view.key}
                  href={
                    "/angelcare-marketplace/fr/establishments" +
                    (snapshot.territoryCode
                      ? "?territory=" +
                        encodeURIComponent(snapshot.territoryCode)
                      : "") +
                    "#" +
                    view.key
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Établissements · {view.label}
                  <ArrowUpRight size={13} />
                </a>
              ))
            : null}
        </div>
      ) : null}
      <footer className={s.footer}>
        <p>
          <strong>Facultatif · Une seule offre canonique.</strong> Vos prix,
          médias, stocks et parcours de commande restent ceux de l’offre.
        </p>
        <div>
          <button
            type="button"
            disabled={!canEdit || !dirty}
            onClick={() => {
              update(snapshot.config);
              setConflict(false);
            }}
          >
            <RotateCcw size={15} /> Annuler mes changements
          </button>
          <button
            type="button"
            className={s.save}
            disabled={!canEdit || !dirty || conflict}
            onClick={() => void save()}
          >
            {saving ? <LoaderCircle size={17} /> : <Save size={17} />}{" "}
            {saving ? "Enregistrement…" : "Enregistrer les vitrines"}
          </button>
        </div>
      </footer>
    </section>
  );
}
