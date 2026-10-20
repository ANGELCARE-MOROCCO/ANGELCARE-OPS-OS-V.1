"use client";
import Link from "next/link";
import {navigateKidFlix}from "../navigation-events";
import { useEffect, useRef, useState } from "react";
import { path, tr, type Locale } from "../catalogue";
import { I } from "../Icons";
import { j } from "./copy";
import s from "./journey.module.css";
export function EditionLanguage({ locale }: { locale: Locale }) {
  const [busy, setBusy] = useState(false),
    [missing, setMissing] = useState<Locale | null>(null),
    [failed, setFailed] = useState(false),
    controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function choose(next: Locale) {
    if (next === locale) return;
    controller.current?.abort();
    controller.current = new AbortController();
    setBusy(true);
    setMissing(null);
    setFailed(false);
    const tail = location.pathname.replace(/^\/kidflix\/(en|fr|ar)/, ""),
      match = tail.match(/^\/experience\/([a-z0-9._-]+)$/);
    try {
      if (match) {
        const r = await fetch(
          "/api/kidflix/experience/" +
            match[1] +
            "/journey?locale=" +
            next +
            "&editions=1",
          { signal: controller.current.signal, cache: "no-store" },
        );
        if (!r.ok) throw Error("EDITION_CHECK_FAILED");
        const data = await r.json();
        if (!data.editions.includes(next)) {
          setMissing(next);
          return;
        }
      }
      const q = new URLSearchParams(location.search);
      q.delete("returnTo");
      navigateKidFlix(path(next, tail) + (q.size ? "?" + q : ""));
    } catch (e) {
      if ((e as Error).name !== "AbortError") setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={s.actions}>
      <label className={s.field}>
        <span className={s.muted}>
          <I name="Globe" size={14} />{" "}
          {tr(["Language", "Langue", "اللغة"], locale)}
        </span>
        <select
          aria-label={tr(["Language", "Langue", "اللغة"], locale)}
          disabled={busy}
          value={locale}
          onChange={(e) => void choose(e.target.value as Locale)}
        >
          <option value="en">EN</option>
          <option value="fr">FR</option>
          <option value="ar">العربية</option>
        </select>
      </label>
      {missing ? (
        <div role="status" className={s.notice}>
          {j("langMissing", locale)}{" "}
          <Link href={path(missing, "/explore")}>{j("explore", missing)}</Link>
          <button
            aria-label={j("cancel", locale)}
            onClick={() => setMissing(null)}
          >
            ×
          </button>
        </div>
      ) : null}
      {failed ? <p role="alert">{j("error", locale)}</p> : null}
    </div>
  );
}
export { Launcher as GuidedDiscovery } from "../Launcher";
