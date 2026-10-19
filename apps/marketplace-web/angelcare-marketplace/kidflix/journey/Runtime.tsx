"use client";
import { useEffect, useRef, useState } from "react";
import { tr, type Locale } from "../catalogue";
import { rows, str, obj, type Row } from "../detail/model";
import { usePersonal } from "./store";
import { j } from "./copy";
import s from "./journey.module.css";
import { emitVisitor } from "./events";
import { hasStarted } from "./contract";
export function RuntimeJourney({
  m,
  locale,
  state,
}: {
  m: Row;
  locale: Locale;
  state: Row;
}) {
  const personal = usePersonal(),
    sent = useRef(new Set<string>());
  useEffect(() => {
    if (!personal.ready || !personal.data.preferences.measurement) return;
    const send = (name: string) => {
      if (sent.current.has(name)) return;
      sent.current.add(name);
      emitVisitor(m.key, locale, m.releaseId, name);
    };
    send("discover");
    if (state.updatedAt && Date.now() - state.updatedAt > 60000) send("return");
    if (hasStarted(state)) send("start");
    if (state.complete && !state.completionReceipt) send("completion_reported");
    if (state.index > 0 || (Array.isArray(state.known) && state.known.length))
      send("checkpoint");
    if (
      state.completionReceipt &&
      state.complete &&
      !sent.current.has(state.completionReceipt)
    ) {
      sent.current.add(state.completionReceipt);
      emitVisitor(
        m.key,
        locale,
        m.releaseId,
        "complete",
        state.completionReceipt,
      );
    }
    if (
      state.outcomeReceipt &&
      state.grade &&
      !sent.current.has(state.outcomeReceipt)
    ) {
      sent.current.add(state.outcomeReceipt);
      emitVisitor(
        m.key,
        locale,
        m.releaseId,
        "result_view",
        state.outcomeReceipt,
      );
    }
  }, [
    personal.ready,
    personal.data.preferences.measurement,
    state.index,
    state.started,
    state.complete,
    state.positions,
    state.answers,
    state.known?.length,
    state.outcomeReceipt,
    state.completionReceipt,
    state.grade,
    state.values,
    m.key,
    m.releaseId,
    locale,
  ]);
  useEffect(() => {
    const listen = (e: Event) => {
      const v = (e as CustomEvent).detail;
      if (v?.key === m.key && typeof v.action === "string")
        emitVisitor(m.key, locale, m.releaseId, v.action);
    };
    window.addEventListener("kidflix:visitor", listen);
    return () => window.removeEventListener("kidflix:visitor", listen);
  }, [m.key, m.releaseId, locale]);
  return null;
}
let script: Promise<void> | undefined;
function loadAdSense(publisher: string) {
  if (!script)
    script = new Promise((resolve, reject) => {
      const node = document.createElement("script");
      node.async = true;
      node.crossOrigin = "anonymous";
      node.src =
        "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
        publisher;
      node.onload = () => resolve();
      node.onerror = () => {
        script = undefined;
        node.remove();
        reject(Error("PROVIDER_UNAVAILABLE"));
      };
      document.head.append(node);
    });
  return script;
}
export function AdSlot({
  m,
  locale,
  zone,
}: {
  m: Row;
  locale: Locale;
  zone: string;
}) {
  const personal = usePersonal(),
    ref = useRef<HTMLDivElement>(null),
    ins = useRef<HTMLModElement>(null),
    [config, setConfig] = useState<Row | null>(null),
    [hidden, setHidden] = useState(false),
    requested = useRef(false);
  const authored = rows(m.definition?.adBreaks).some(
    (a) => a.enabled === true && a.event === zone,
  );
  useEffect(() => {
    if (
      !personal.ready ||
      !rows(m.definition?.adBreaks).some(
        (a) => a.enabled === true && a.event === zone,
      ) ||
      !personal.data.preferences.advertising ||
      !location.pathname.startsWith("/kidflix/") ||
      !navigator.onLine
    )
      return;
    const controller = new AbortController();
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting) || requested.current) return;
      requested.current = true;
      emitVisitor(m.key, locale, m.releaseId, "ad_request");
      (async () => {
        const old = obj(
            JSON.parse(sessionStorage.getItem("kidflix.ad.pacing") || "{}"),
          ),
          r = await fetch("/api/kidflix/experience/" + m.key + "/runtime", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              operation: "ad",
              locale,
              zone,
              ...(typeof m.pageFamily === "string"
                ? { pageFamily: m.pageFamily, pageSlot: m.pageSlot }
                : {}),
              consent: true,
              device: innerWidth < 760 ? "mobile" : "desktop",
              count: old.count || 0,
              last: old.last || 0,
              spacing:
                old.lastY == null ? 10000 : Math.abs(scrollY - old.lastY),
            }),
            signal: controller.signal,
          });
        if (!r.ok) throw Error("DECISION_UNAVAILABLE");
        const c = await r.json();
        if (!c.eligible) {
          setHidden(true);
          return;
        }
        setConfig(c);
      })().catch(() => {
        setHidden(true);
        emitVisitor(m.key, locale, m.releaseId, "ad_failed");
      });
    });
    if (ref.current) observer.observe(ref.current);
    return () => {
      controller.abort();
      observer.disconnect();
    };
  }, [personal.ready, personal.data.preferences.advertising, m.key, zone]);
  useEffect(() => {
    if (!config || !ins.current) return;
    let active = true;
    const node = ins.current;
    loadAdSense(config.publisher)
      .then(() => {
        if (!active || !personal.data.preferences.advertising) return;
        try {
          const w = window as unknown as { adsbygoogle: any[] };
          (w.adsbygoogle = w.adsbygoogle || []).push({});
          const old = obj(
            JSON.parse(sessionStorage.getItem("kidflix.ad.pacing") || "{}"),
          );
          sessionStorage.setItem(
            "kidflix.ad.pacing",
            JSON.stringify({
              count: (Number(old.count) || 0) + 1,
              last: Date.now(),
              lastY: scrollY,
            }),
          );
        } catch {
          setHidden(true);
        }
      })
      .catch(() => {
        setHidden(true);
        emitVisitor(m.key, locale, m.releaseId, "ad_failed");
      });
    const monitor = new MutationObserver(() => {
      if (node.dataset.adStatus === "unfilled") {
        setHidden(true);
        emitVisitor(m.key, locale, m.releaseId, "ad_no_fill");
      } else if (node.dataset.adStatus === "filled")
        emitVisitor(m.key, locale, m.releaseId, "ad_filled");
    });
    monitor.observe(node, {
      attributes: true,
      attributeFilter: ["data-ad-status"],
    });
    return () => {
      active = false;
      monitor.disconnect();
    };
  }, [config, personal.data.preferences.advertising]);
  if (!authored || !personal.data.preferences.advertising) return null;
  if (hidden) return <div className={s.adReserve} aria-hidden="true" />;
  return (
    <div ref={ref} className={s.ad}>
      {config ? (
        <>
          <small>{j("ad", locale)}</small>
          <ins
            ref={ins}
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client={config.publisher}
            data-ad-slot={config.slot}
            data-ad-format="auto"
            data-full-width-responsive="true"
            data-tag-for-age-treatment="1"
          />
        </>
      ) : null}
    </div>
  );
}

export function PageAd({
  locale,
  family = "",
  slot,
}: {
  locale: Locale;
  family?: string;
  slot: string;
}) {
  return (
    <AdSlot
      locale={locale}
      zone="after_section"
      m={{
        key: "kidflix-page",
        pageFamily: family,
        pageSlot: slot,
        definition: { adBreaks: [{ enabled: true, event: "after_section" }] },
      }}
    />
  );
}
