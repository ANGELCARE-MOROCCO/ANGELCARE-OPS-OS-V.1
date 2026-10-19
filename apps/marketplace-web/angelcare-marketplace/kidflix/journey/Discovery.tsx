"use client";
import Link from "next/link";
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
      location.assign(path(next, tail) + (q.size ? "?" + q : ""));
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
export function GuidedDiscovery({ locale }: { locale: Locale }) {
  const [show, setShow] = useState(false),
    [purpose, setPurpose] = useState(""),
    [minutes, setMinutes] = useState("");
  useEffect(() => {
    setShow(
      !/\/(experience|my|privacy|about|accessibility)(\/|$)/.test(
        location.pathname,
      ),
    );
  }, []);
  const purposes = [
    [
      "print",
      "Printer",
      ["Print something", "Imprimer une ressource", "طباعة مورد"],
    ],
    [
      "listen",
      "Headphones",
      ["Quiet listening", "Écouter au calme", "استماع هادئ"],
    ],
    [
      "classroom",
      "Presentation",
      ["Prepare my classroom", "Préparer ma classe", "تحضير فصلي"],
    ],
    ["play", "Puzzle", ["Try an activity", "Faire une activité", "تجربة نشاط"]],
    ["read", "BookOpen", ["Read a story", "Lire une histoire", "قراءة قصة"]],
    [
      "learn",
      "GraduationCap",
      ["Practise and learn", "Pratiquer et apprendre", "تدرب وتعلم"],
    ],
  ] as const;
  return show ? (
    <div className={s.workspace} style={{ paddingBottom: 0 }}>
      <section className={s.guide}>
        <div>
          <h2>{j("guide", locale)}</h2>
          <p>{j("guideBody", locale)}</p>
        </div>
        <form
          className={s.actions}
          action={path(locale, "/explore")}
          onSubmit={(e) => {
            e.preventDefault();
            const q = new URLSearchParams();
            if (purpose === "classroom") q.set("audience", "educator");
            else if (purpose) q.set("intent", purpose);
            if (minutes) q.set("duration", minutes);
            location.assign(path(locale, "/explore") + (q.size ? "?" + q : ""));
          }}
        >
          <select
            aria-label={j("guide", locale)}
            name="intent"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          >
            <option value="">{j("all", locale)}</option>
            {purposes.map(([key, , label]) => (
              <option key={key} value={key}>
                {tr(label, locale)}
              </option>
            ))}
          </select>
          <label className={s.field}>
            {tr(["Time available", "Temps disponible", "الوقت المتاح"], locale)}
            <select
              name="duration"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            >
              <option value="">—</option>
              {[5, 10, 15, 30, 60].map((n) => (
                <option key={n} value={n}>
                  {n} {j("duration", locale)}
                </option>
              ))}
            </select>
          </label>
          <button className={`${s.button} ${s.primary}`} type="submit">
            {j("explore", locale)}
          </button>
        </form>
        <Link className={s.button} href={path(locale, "/my")}>
          {j("session", locale)}
        </Link>
      </section>
    </div>
  ) : null;
}
