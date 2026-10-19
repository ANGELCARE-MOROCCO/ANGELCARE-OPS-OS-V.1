"use client";
import { useEffect, useRef, useState } from "react";
import { capability, LIMITS } from "./contract";
import { j } from "./copy";
import { readyOutputs, type Row } from "../detail/model";
import { boundedFile } from "./outputs";
import type { Locale } from "../catalogue";
import s from "./journey.module.css";
const CACHE = "kidflix-offline-v3";
export function OfflineFiles({
  m,
  locale,
  update,
}: {
  m: Row;
  locale: Locale;
  update: (r: Row) => void;
}) {
  const [busy, setBusy] = useState(false),
    [status, setStatus] = useState(""),
    controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  if (!capability(m).offline || !readyOutputs(m).length) return null;
  async function prepare() {
    if (busy) return;
    controller.current = new AbortController();
    setBusy(true);
    setStatus("");
    try {
      if (!("serviceWorker" in navigator) || !("caches" in window))
        throw Error("OFFLINE_UNAVAILABLE");
      const current = await fetch(
        "/api/kidflix/experience/" + m.key + "/journey?locale=" + locale,
        { cache: "no-store", signal: controller.current.signal },
      );
      if (!current.ok) throw Error("EDITION_UNAVAILABLE");
      const value = await current.json();
      if (!capability(value.manifest).offline)
        throw Error("OFFLINE_NOT_PERMITTED");
      const files = readyOutputs(value.manifest),
        cache = await caches.open(CACHE);
      let used = 0;
      for (const key of await cache.keys()) {
        const r = await cache.match(key);
        used += Number(r?.headers.get("content-length") || 0);
      }
      await navigator.serviceWorker.register("/kidflix/offline-worker.js", {
        scope: "/kidflix/",
      });
      await navigator.serviceWorker.ready;
      await cache.add("/kidflix/offline.html");
      await cache.add("/kidflix/kidflix-official.png");
      for (const f of files) {
        const source = await boundedFile(
          f.asset.url,
          controller.current.signal,
        );
        const key =
          "/kidflix/offline-file/" +
          encodeURIComponent(m.key) +
          "." +
          locale +
          "." +
          encodeURIComponent(f.id);
        const previous = await cache.match(key);
        used +=
          source.size - Number(previous?.headers.get("content-length") || 0);
        if (used > LIMITS.offlineBytes) throw Error("OFFLINE_STORAGE_LIMIT");
        await cache.put(
          key,
          new Response(source.bytes as BodyInit, {
            headers: {
              "Content-Type": f.asset.mime,
              "Content-Length": String(source.size),
              "X-Kidflix-Title": encodeURIComponent(m.title + " · " + f.label),
              "X-Kidflix-Revision": String(value.manifest.revision || 0),
              "X-Kidflix-Release": String(value.releaseId || ""),
              "X-Kidflix-Expires": String(Date.now() + 7 * 86400000),
            },
          }),
        );
      }
      update({ prepared: true });
      setStatus(j("offlineReady", locale));
    } catch (e) {
      if ((e as Error).name !== "AbortError")
        setStatus(
          j(
            [
              "OFFLINE_STORAGE_LIMIT",
              "QuotaExceededError",
              "SecurityError",
            ].includes((e as Error).message) ||
              ["QuotaExceededError", "SecurityError"].includes(
                (e as Error).name,
              )
              ? "offlineLimit"
              : "error",
            locale,
          ),
        );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={s.surface}>
      <h2>{j("offline", locale)}</h2>
      <p>{j("offlineHelp", locale)}</p>
      <div className={s.actions}>
        <button
          className={s.button}
          disabled={busy}
          onClick={() => void prepare()}
        >
          {j("prepareOffline", locale)}
        </button>
        <a className={s.button} href={"/kidflix/offline.html?locale=" + locale}>
          {j("offline", locale)}
        </a>
        {busy ? (
          <button
            className={s.button}
            onClick={() => controller.current?.abort()}
          >
            {j("cancel", locale)}
          </button>
        ) : null}
      </div>
      {status ? <p role="status">{status}</p> : null}
    </section>
  );
}
