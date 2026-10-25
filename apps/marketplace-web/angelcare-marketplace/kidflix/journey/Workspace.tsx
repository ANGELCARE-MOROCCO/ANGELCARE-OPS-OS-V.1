"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { path, tr, world, type Locale, type Resource } from "../catalogue";
import { usePersonal } from "./store";
import { cleanKeys, LIMITS, sessionLink, type Collection } from "./contract";
import { j } from "./copy";
import { I } from "../Icons";
import s from "./journey.module.css";
import {collectionId} from "../personal/library-model";
import { useLibraryResources as useResources } from "../personal/useLibraryResources";
export { useLibraryResources as useResources } from "../personal/useLibraryResources";
export function Workspace({
  locale,
  initialTab = "session",
  embedded = false,
}: {
  locale: Locale;
  initialTab?: string;
  embedded?: boolean;
}) {
  const p = usePersonal(),
    [tab, setTab] = useState(initialTab),
    [name, setName] = useState(""),
    [message, setMessage] = useState(""),
    [shared, setShared] = useState<string[]>([]),
    [selectedCollection, setSelected] = useState(""),
    [shareURL, setURL] = useState(""),
    [sessionBusy, setSessionBusy] = useState(false),
    [sessionDetails, setSessionDetails] = useState<
      Record<string, { session: boolean; materials: string; guidance: string }>
    >({});
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("plan");
    if (q) setShared(cleanKeys(q.split(","), 30));
  }, []);
  const collection = p.data.collections.find(
      (c) => c.id === selectedCollection,
    ),
    keys =
      tab === "preferences" ? [] : tab === "session"
        ? p.data.queue
        : tab === "saved"
          ? p.data.saved.map((x) => x.key)
          : tab === "recent"
            ? p.data.recent.map((x) => x.key)
            : tab === "collections"
              ? collection?.keys || []
              : p.data.activity
                  .filter(
                    (a) =>
                      a.locale === locale &&
                      (tab === "complete"
                        ? a.complete
                        : tab === "prepared"
                          ? a.prepared
                          : a.started && !a.complete),
                  )
                  .map((a) => a.key),
    resources = useResources([...new Set(keys)], locale),
    by = new Map(resources.data.map((r) => [r.key, r])),
    minutes = resources.data.reduce((a, r) => a + (r.duration || 0), 0);
  useEffect(() => {
    if (tab !== "session") return;
    const c = new AbortController();
    setSessionDetails({});
    (async () => {
      const out: Record<
        string,
        { session: boolean; materials: string; guidance: string }
      > = {};
      for (let i = 0; i < keys.length; i += 4) {
        await Promise.all(
          keys.slice(i, i + 4).map(async (key) => {
            const r = await fetch(
              "/api/kidflix/experience/" +
                key +
                "/journey?locale=" +
                locale +
                "&summary=1",
              { signal: c.signal, cache: "no-store" },
            );
            if (r.ok) {
              const v = await r.json();
              if (typeof v.session === "boolean") out[key] = v;
            }
          }),
        );
      }
      if (!c.signal.aborted) setSessionDetails(out);
    })().catch(() => {});
    return () => c.abort();
  }, [tab, p.data.queue.join(","), locale]);
  function create() {
    if (!name.trim() || p.data.collections.length >= LIMITS.collections) return;
    const c: Collection = {
      id: collectionId(),
      name: name.trim().slice(0, 80),
      keys: [],
    };
    p.change((d) => ({ ...d, collections: [...d.collections, c] }));
    setSelected(c.id);
    setName("");
  }
  async function eligible(keys: string[]) {
    const accepted: string[] = [];
    for (let i = 0; i < keys.length; i += 4) {
      const part = await Promise.all(
        keys.slice(i, i + 4).map(async (key) => {
          const r = await fetch(
            "/api/kidflix/experience/" +
              encodeURIComponent(key) +
              "/journey?locale=" +
              locale +
              "&summary=1",
            { cache: "no-store" },
          );
          if (r.status === 404) return null;
          if (!r.ok) throw Error("SOURCE_UNAVAILABLE");
          const v = await r.json();
          return v.session === true ? key : null;
        }),
      );
      accepted.push(...part.filter((x): x is string => x !== null));
    }
    if (accepted.length !== keys.length) setMessage(j("missing", locale));
    return accepted;
  }
  async function importPlan() {
    if (sessionBusy) return;
    setSessionBusy(true);
    try {
      const accepted = await eligible(shared);
      p.change((d) => ({ ...d, queue: cleanKeys([...d.queue, ...accepted]) }));
      setShared([]);
      setTab("session");
    } catch {
      setMessage(j("error", locale));
    } finally {
      setSessionBusy(false);
    }
  }
  async function enqueue(key: string) {
    if (p.data.queue.includes(key)) {
      p.enqueue(key);
      return;
    }
    if (sessionBusy) return;
    setSessionBusy(true);
    try {
      if ((await eligible([key])).length) p.enqueue(key);
    } catch {
      setMessage(j("error", locale));
    } finally {
      setSessionBusy(false);
    }
  }
  async function share() {
    if (sessionBusy) return;
    setSessionBusy(true);
    try {
      const keys = await eligible(p.data.queue);
      if (!keys.length) return;
      const url = new URL(sessionLink(locale, keys), location.origin).href;
      setURL(url);
      if (navigator.share) await navigator.share({ title: "KidFlix", url });
      else {
        await navigator.clipboard.writeText(url);
        setMessage(j("copied", locale));
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setMessage(j("error", locale));
    } finally {
      setSessionBusy(false);
    }
  }
  return (
    <article className={s.workspace}>
      {!embedded ? (
        <>
          <span className={s.eyebrow}>KIDFLIX · {j("device", locale)}</span>
          <h1 className={s.title}>{j("my", locale)}</h1>
          <div className={s.facts}>
            <span className={s.count}>
              {p.data.saved.length} · {j("saved", locale)}
            </span>
            <span className={s.count}>
              {p.data.queue.length} · {j("session", locale)}
            </span>
            <span className={s.count}>
              {p.data.activity.filter((x) => x.complete).length} ·{" "}
              {j("complete", locale)}
            </span>
          </div>
        </>
      ) : null}
      {p.error ? (
        <p role="alert" className={s.notice}>
          {j("storage", locale)}
        </p>
      ) : null}
      {shared.length ? (
        <section className={s.surface}>
          <h2>{j("session", locale)}</h2>
          <p>
            {shared.length} · {j("add", locale)}
          </p>
          <button
            className={s.button}
            disabled={sessionBusy}
            onClick={() => void importPlan()}
          >
            {j("import", locale)}
          </button>
        </section>
      ) : null}
      <div className={s.tabs} hidden={embedded}>
        {(
          [
            "session",
            "saved",
            "recent",
            "progress",
            "complete",
            "prepared",
            "collections",
            "preferences",
          ] as const
        ).map((k) => (
          <button key={k} aria-pressed={tab === k} onClick={() => setTab(k)}>
            {j(k, locale)}
          </button>
        ))}
      </div>
      {tab === "preferences" ? (
        <section className={s.surface}>
          <h2>{j("preferences", locale)}</h2>
          <p>{j("device", locale)}</p>
          <div className={s.settings}>
            {(["motion", "lowData", "measurement", "advertising"] as const).map(
              (k) => (
                <label key={k} className={s.check}>
                  <input
                    type="checkbox"
                    checked={p.data.preferences[k]}
                    onChange={(e) =>
                      p.change((d) => ({
                        ...d,
                        preferences: {
                          ...d.preferences,
                          [k]: e.target.checked,
                        },
                      }))
                    }
                  />
                  {j(k, locale)}
                </label>
              ),
            )}
          </div>
          <button
            className={`${s.button} ${s.danger}`}
            onClick={async () => {
              if (confirm(j("confirm", locale)))
                try {
                  await p.clear();
                  setMessage(j("reset", locale));
                } catch {
                  setMessage(j("storage", locale));
                }
            }}
          >
            {j("clear", locale)}
          </button>
        </section>
      ) : (
        <>
          {tab === "collections" ? (
            <section className={s.surface}>
              <div className={s.actions}>
                <label className={s.field}>
                  {j("collections", locale)}
                  <select
                    value={selectedCollection}
                    onChange={(e) => setSelected(e.target.value)}
                  >
                    <option value="">—</option>
                    {p.data.collections.map((c) => (
                      <option value={c.id} key={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={s.field}>
                  {j("collection", locale)}
                  <input
                    value={name}
                    maxLength={80}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <button
                  className={s.button}
                  disabled={
                    !name.trim() ||
                    p.data.collections.length >= LIMITS.collections
                  }
                  onClick={create}
                >
                  {j("create", locale)}
                </button>
              </div>
              {collection ? (
                <div className={s.actions}>
                  <input
                    aria-label={j("collection", locale)}
                    value={collection.name}
                    maxLength={80}
                    onChange={(e) =>
                      p.change((d) => ({
                        ...d,
                        collections: d.collections.map((c) =>
                          c.id === collection.id
                            ? { ...c, name: e.target.value || c.name }
                            : c,
                        ),
                      }))
                    }
                  />
                  <button
                    className={s.button}
                    onClick={() => {
                      p.change((d) => ({
                        ...d,
                        collections: d.collections.filter(
                          (c) => c.id !== collection.id,
                        ),
                      }));
                      setSelected("");
                    }}
                  >
                    {j("remove", locale)}
                  </button>
                </div>
              ) : null}
            </section>
          ) : null}
          {tab === "session" && keys.length ? (
            <section className={s.surface}>
              <div className={s.toolbar}>
                <div>
                  <h2>{j("session", locale)}</h2>
                  <p>
                    {minutes} {j("duration", locale)}
                    {resources.data.some((r) => !r.duration)
                      ? " · " + j("unknownTime", locale)
                      : ""}
                  </p>
                </div>
                <div className={s.actions}>
                  <button
                    className={s.button}
                    disabled={sessionBusy || resources.busy}
                    onClick={() => void share()}
                  >
                    {j("share", locale)}
                  </button>
                  <button className={s.button} onClick={() => window.print()}>
                    {j("print", locale)}
                  </button>
                </div>
              </div>
              {shareURL ? (
                <input
                  aria-label={j("copy", locale)}
                  readOnly
                  value={shareURL}
                  onFocus={(e) => e.target.select()}
                />
              ) : null}
            </section>
          ) : null}
          {resources.error ? (
            <div role="alert" className={s.error}>
              {j("error", locale)}{" "}
              <button onClick={resources.retry}>{j("retry", locale)}</button>
            </div>
          ) : null}
          {resources.busy ? (
            <p role="status">
              {tr(
                [
                  "Finding your resources…",
                  "Recherche de vos ressources…",
                  "جارٍ البحث عن مواردك…",
                ],
                locale,
              )}
            </p>
          ) : null}
          {!keys.length ? (
            <div className={s.empty}>
              <h2>{j("empty", locale)}</h2>
              <Link className={s.button} href={path(locale, "/explore")}>
                {j("explore", locale)}
              </Link>
            </div>
          ) : null}
          <div className={s.grid}>
            {keys.map((key, i) => {
              const r = by.get(key);
              if (!r && (resources.busy || resources.error)) return null;
              return (
                <section key={key} className={s.card}>
                  {r?.image ? (
                    <img src={r.image} alt={r.imageAlt} loading="lazy" />
                  ) : null}
                  <span className={s.badge}>
                    {tab === "session"
                      ? String(i + 1).padStart(2, "0")
                      : r
                        ? tr(world(r.family)!.short, locale)
                        : "KidFlix"}
                  </span>
                  <h3>{r?.title || j("missing", locale)}</h3>
                  {p.data.activity.some(
                    (a) => a.key === key && a.locale === locale && a.complete,
                  ) ? (
                    <span className={s.finished}>{j("complete", locale)}</span>
                  ) : null}
                  {r?.summary ? <p>{r.summary}</p> : null}
                  {tab === "session" && sessionDetails[key]?.materials ? (
                    <p>
                      <strong>
                        {tr(["Materials", "Matériel", "المواد"], locale)}
                      </strong>
                      <br />
                      {sessionDetails[key].materials}
                    </p>
                  ) : null}
                  {tab === "session" && sessionDetails[key]?.guidance ? (
                    <p>{sessionDetails[key].guidance}</p>
                  ) : null}
                  {tab === "session" &&
                  sessionDetails[key]?.session === false ? (
                    <p role="status">
                      {tr(
                        [
                          "This resource no longer allows inclusion in a personal session. You can remove it here.",
                          "Cette ressource n’autorise plus son inclusion dans une séance personnelle. Vous pouvez la retirer ici.",
                          "لم يعد هذا المورد يسمح بإدراجه في جلسة شخصية. يمكنك إزالته هنا.",
                        ],
                        locale,
                      )}
                    </p>
                  ) : null}
                  {r?.duration ? (
                    <small>
                      {r.duration} {j("duration", locale)}
                    </small>
                  ) : null}
                  <div className={s.actions}>
                    {r ? (
                      <Link
                        className={`${s.button} ${s.primary}`}
                        href={path(locale, "/experience/" + key + "?session=1")}
                      >
                        {j("resume", locale)}
                      </Link>
                    ) : null}
                    {tab === "session" ? (
                      <>
                        <button
                          className={s.button}
                          aria-label={j("up", locale)}
                          disabled={i === 0}
                          onClick={() => p.move(key, -1)}
                        >
                          ↑
                        </button>
                        <button
                          className={s.button}
                          aria-label={j("down", locale)}
                          disabled={i === keys.length - 1}
                          onClick={() => p.move(key, 1)}
                        >
                          ↓
                        </button>
                        <button
                          className={s.button}
                          disabled={sessionBusy}
                          onClick={() => void enqueue(key)}
                        >
                          {j("remove", locale)}
                        </button>
                      </>
                    ) : (
                      <button
                        className={s.button}
                        disabled={sessionBusy}
                        onClick={() => void enqueue(key)}
                      >
                        {j(
                          p.data.queue.includes(key) ? "added" : "add",
                          locale,
                        )}
                      </button>
                    )}
                    {tab === "saved" ? (
                      <button
                        className={s.button}
                        onClick={() => p.toggle(key)}
                      >
                        {j("remove", locale)}
                      </button>
                    ) : null}
                    {r && p.data.collections.length ? (
                      <select
                        className={s.button}
                        aria-label={j("collections", locale)}
                        value=""
                        onChange={(e) =>
                          p.change((d) => ({
                            ...d,
                            collections: d.collections.map((c) =>
                              c.id === e.target.value
                                ? {
                                    ...c,
                                    keys: cleanKeys(
                                      [...c.keys, key],
                                      LIMITS.collectionItems,
                                    ),
                                  }
                                : c,
                            ),
                          }))
                        }
                      >
                        <option value="">+ {j("collections", locale)}</option>
                        {p.data.collections.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    {collection && tab === "collections" ? (
                      <button
                        className={s.button}
                        onClick={() =>
                          p.change((d) => ({
                            ...d,
                            collections: d.collections.map((c) =>
                              c.id === collection.id
                                ? {
                                    ...c,
                                    keys: c.keys.filter((k) => k !== key),
                                  }
                                : c,
                            ),
                          }))
                        }
                      >
                        {j("remove", locale)}
                      </button>
                    ) : null}
                    {["progress", "complete"].includes(tab) ? (
                      <button
                        className={s.button}
                        onClick={() => {
                          if (!confirm(j("resetConfirm", locale))) return;
                          let failed = false;
                          for (const a of p.data.activity.filter(
                            (a) => a.key === key && a.locale === locale,
                          )) {
                            for (const name of [
                              "localStorage",
                              "sessionStorage",
                            ] as const)
                              try {
                                window[name].removeItem(
                                  "kidflix.progress.r1." +
                                    a.id +
                                    "." +
                                    a.locale,
                                );
                              } catch {
                                failed = true;
                              }
                          }
                          if (failed) {
                            setMessage(j("storage", locale));
                            return;
                          }

                          p.change((d) => ({
                            ...d,
                            activity: d.activity.filter(
                              (a) => a.key !== key || a.locale !== locale,
                            ),
                          }));
                        }}
                      >
                        {j("deleteProgress", locale)}
                      </button>
                    ) : null}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
      {message ? (
        <p className={s.status} role="status">
          {message}
        </p>
      ) : null}
    </article>
  );
}
