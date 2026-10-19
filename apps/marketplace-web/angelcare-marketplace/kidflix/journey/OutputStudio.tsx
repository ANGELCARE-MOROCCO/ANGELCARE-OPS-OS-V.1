"use client";
import { useEffect, useRef, useState } from "react";
import { capability, LIMITS, moveKey } from "./contract";
import { usePersonal } from "./store";
import { j } from "./copy";
import { readyOutputs, obj, str, type Row } from "../detail/model";
import type { Locale } from "../catalogue";
import { preparePack } from "./outputs";
import { emitVisitor } from "./events";
import s from "./journey.module.css";
export function OutputStudio({
  m,
  locale,
  update,
}: {
  m: Row;
  locale: Locale;
  update: (r: Row) => void;
}) {
  const personal = usePersonal(),
    [expanded, setExpanded] = useState(false),
    [resources, setResources] = useState<Row[]>([m]),
    [selected, setSelected] = useState<string[]>([]),
    [ranges, setRanges] = useState<Record<string, string>>({}),
    [paper, setPaper] = useState("A4"),
    [landscape, setLandscape] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState(0),
    [ready, setReady] = useState<{
      url: string;
      pages: number;
      bytes: number;
    } | null>(null),
    controller = useRef<AbortController | null>(null),
    live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      controller.current?.abort();
    };
  }, []);
  useEffect(
    () => () => {
      if (ready) URL.revokeObjectURL(ready.url);
    },
    [ready],
  );
  if (!capability(m).printPack) return null;
  const files = resources
    .filter((r) => capability(r).printPack)
    .flatMap((r) =>
      readyOutputs(r).map((o) => ({
        id: r.key + "." + o.id,
        key: r.key,
        outputId: o.id,
        title: r.title + " · " + o.label,
        asset: o.asset,
      })),
    )
    .filter((f) =>
      ["application/pdf", "image/png", "image/jpeg"].includes(f.asset.mime),
    );
  async function addSession() {
    if (busy) return;
    setBusy(true);
    setError("");
    controller.current = new AbortController();
    try {
      const out = [m];
      for (const key of personal.data.queue.filter((k) => k !== m.key)) {
        const r = await fetch(
          "/api/kidflix/experience/" + key + "/journey?locale=" + locale,
          { signal: controller.current.signal, cache: "no-store" },
        );
        if (r.status === 404) continue;
        if (!r.ok) throw Error("READ_FAILED");
        const value = await r.json();
        if (capability(value.manifest).printPack) out.push(value.manifest);
      }
      setResources(out);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError(j("error", locale));
    } finally {
      if (live.current) setBusy(false);
    }
  }
  async function prepare() {
    if (busy || !selected.length) return;
    setBusy(true);
    setReady(null);
    setError("");
    setDone(0);
    emitVisitor(m.key, locale, m.releaseId, "output_prepare");
    controller.current = new AbortController();
    const signal = controller.current.signal;
    try {
      const fresh = new Map<string, Row>();
      for (const f of files.filter((f) => selected.includes(f.id))) {
        if (!fresh.has(f.key)) {
          const r = await fetch(
            "/api/kidflix/experience/" + f.key + "/journey?locale=" + locale,
            { signal, cache: "no-store" },
          );
          if (!r.ok) throw Error("EDITION_OR_RIGHTS_CHANGED");
          const v = await r.json();
          if (!capability(v.manifest).printPack)
            throw Error("PERMISSION_CHANGED");
          fresh.set(f.key, v.manifest);
        }
      }
      const plan = selected
        .map((id) => files.find((f) => f.id === id))
        .filter((f): f is NonNullable<typeof f> => Boolean(f))
        .map((f) => {
          const current = readyOutputs(fresh.get(f.key)!).find(
            (o) => o.id === f.outputId,
          );
          if (!current) throw Error("OUTPUT_CHANGED");
          return {
            url: current.asset.url,
            mime: current.asset.mime,
            selection: ranges[f.id] || "",
          };
        });
      const unique = [
        ...new Map(plan.map((f) => [f.url + "|" + f.selection, f])).values(),
      ];
      const value = await preparePack(
        unique,
        paper,
        landscape,
        signal,
        setDone,
      );
      if (!live.current) return;
      setReady({
        url: URL.createObjectURL(value.blob),
        pages: value.pages,
        bytes: value.blob.size,
      });
      update({ prepared: true });
      emitVisitor(m.key, locale, m.releaseId, "output_ready");
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError(
          j(
            [
              "INVALID_PAGE_SELECTION",
              "PAGE_LIMIT",
              "FILE_TOO_LARGE",
              "PACK_TOO_LARGE",
              "FILE_COUNT_LIMIT",
            ].includes((e as Error).message)
              ? "pageError"
              : "error",
            locale,
          ),
        );
        emitVisitor(m.key, locale, m.releaseId, "action_failed");
      }
    } finally {
      if (live.current) setBusy(false);
    }
  }
  return (
    <section className={s.surface}>
      <h2>{j("printStudio", locale)}</h2>
      <button
        className={s.button}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        {j("select", locale)}
      </button>
      {expanded ? (
        <>
          <p className={s.status}>
            PDF / PNG · {LIMITS.packPages} {j("pages", locale)} ·{" "}
            {LIMITS.fileBytes / 1024 / 1024} MB/file
          </p>
          {personal.data.queue.length ? (
            <button
              className={s.button}
              disabled={busy}
              onClick={() => void addSession()}
            >
              {j("session", locale)}
            </button>
          ) : null}
          {[
            ...selected
              .map((id) => files.find((f) => f.id === id))
              .filter((f): f is NonNullable<typeof f> => Boolean(f)),
            ...files.filter((f) => !selected.includes(f.id)),
          ].map((f) => (
            <div className={s.row} key={f.id}>
              <label className={s.check}>
                <input
                  type="checkbox"
                  checked={selected.includes(f.id)}
                  onChange={(e) => {
                    setSelected((a) =>
                      e.target.checked
                        ? [...a, f.id]
                        : a.filter((id) => id !== f.id),
                    );
                    setReady(null);
                  }}
                />
                {f.title} · {f.asset.mime === "application/pdf" ? "PDF" : "PNG"}
                {f.asset.bytes
                  ? " · " + Math.ceil(f.asset.bytes / 1024) + " KB"
                  : ""}
              </label>
              {selected.includes(f.id) ? (
                <div className={s.actions}>
                  <button
                    className={s.button}
                    aria-label={j("up", locale) + " · " + f.title}
                    disabled={selected.indexOf(f.id) === 0 || busy}
                    onClick={() => {
                      setSelected((a) => moveKey(a, f.id, -1));
                      setReady(null);
                    }}
                  >
                    ↑
                  </button>
                  <button
                    className={s.button}
                    aria-label={j("down", locale) + " · " + f.title}
                    disabled={
                      selected.indexOf(f.id) === selected.length - 1 || busy
                    }
                    onClick={() => {
                      setSelected((a) => moveKey(a, f.id, 1));
                      setReady(null);
                    }}
                  >
                    ↓
                  </button>
                </div>
              ) : null}
              <label className={s.field}>
                {j("pages", locale)}
                <input
                  placeholder="1-3,5"
                  aria-label={j("pages", locale) + " · " + f.title}
                  value={ranges[f.id] || ""}
                  onChange={(e) => {
                    setRanges((r) => ({ ...r, [f.id]: e.target.value }));
                    setReady(null);
                  }}
                />
              </label>
            </div>
          ))}
          <p className={s.status}>{j("paperHelp", locale)}</p>
          <div className={s.actions}>
            <select
              aria-label={j("paper", locale)}
              value={paper}
              onChange={(e) => {
                setPaper(e.target.value);
                setReady(null);
              }}
            >
              <option>A4</option>
              <option>Letter</option>
            </select>
            <label className={s.check}>
              <input
                type="checkbox"
                checked={landscape}
                onChange={(e) => {
                  setLandscape(e.target.checked);
                  setReady(null);
                }}
              />
              {j("landscape", locale)}
            </label>
            <button
              className={`${s.button} ${s.primary}`}
              disabled={busy || !selected.length}
              onClick={() => void prepare()}
            >
              {j("prepare", locale)}
            </button>
            {busy ? (
              <>
                <span role="status">
                  {done} / {selected.length}
                </span>
                <button
                  className={s.button}
                  onClick={() => controller.current?.abort()}
                >
                  {j("cancel", locale)}
                </button>
              </>
            ) : null}
          </div>
          {error ? (
            <p role="alert" className={s.error}>
              {error}
            </p>
          ) : null}
          {ready ? (
            <div>
              <p>
                {ready.pages} {j("pages", locale)} ·{" "}
                {Math.ceil(ready.bytes / 1024)} KB
              </p>
              <a
                className={`${s.button} ${s.primary}`}
                onClick={() =>
                  emitVisitor(m.key, locale, m.releaseId, "download_intent")
                }
                href={ready.url}
                download="KidFlix-pack.pdf"
              >
                {j("ready", locale)}
              </a>
              <iframe
                className={s.preview}
                src={ready.url}
                title={j("printStudio", locale)}
              />
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
