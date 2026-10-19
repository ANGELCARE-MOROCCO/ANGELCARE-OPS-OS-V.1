"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  availableNodes,
  blankContinuity,
  journeyProgress,
} from "../../digital-customer-experience/continuity";
import { path } from "../catalogue";
import { obj, rows, str, restoreDetailProgress, type Row } from "./model";
import { progressKey } from "./progress";
import {
  Button,
  Editorial,
  Empty,
  Progress,
  Source,
  type PlayerProps,
} from "./shared";
import { local, t } from "./copy";
import s from "./detail.module.css";
export function Community({ m, d, locale }: PlayerProps) {
  const [search, setSearch] = useState(""),
    rules = rows(d.rules).filter(
      (r) =>
        !search ||
        [local(r, "title", locale), local(r, "text", locale)]
          .join(" ")
          .toLocaleLowerCase(locale)
          .includes(search.toLocaleLowerCase(locale)),
    );
  return (
    <div className={s.community}>
      <Editorial m={m} data={d} locale={locale} />
      {rows(d.rules).length ? (
        <label className={s.search}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search", locale)}
            aria-label={t("search", locale)}
          />
        </label>
      ) : null}
      <div className={s.knowledgeGrid}>
        {rules.map((r) => (
          <details key={r.id} className={s.knowledge}>
            <summary>{local(r, "title", locale)}</summary>
            <p>{local(r, "text", locale)}</p>
          </details>
        ))}
      </div>
      {!rules.length && !str(d.body) && !rows(d.sections).length ? (
        <Empty locale={locale} />
      ) : null}
    </div>
  );
}
export function Commerce({ m, d, locale }: PlayerProps) {
  const content = obj(m.bindings.records?.[d.contentId]),
    course = obj(m.bindings.records?.[d.experienceId]),
    offers = rows(d.offers)
      .map((o) => ({ row: o, offer: obj(m.bindings.offers?.[o.nativeId]) }))
      .filter((o) => o.offer.url);
  return (
    <div className={s.commerce}>
      <Editorial
        m={content.id ? content : m}
        data={
          obj(content.definition).body ||
          rows(obj(content.definition).sections).length
            ? obj(content.definition)
            : d
        }
        locale={locale}
      />
      {course.key ? (
        <Link
          href={path(locale, "/experience/" + course.key)}
          className={s.featureLink}
        >
          <span>{course.title}</span>
          <strong>{t("open", locale)} →</strong>
        </Link>
      ) : null}
      {m.audience !== "child" && offers.length ? (
        <section className={s.nativePanel}>
          <span className={s.kicker}>{t("adult", locale)}</span>
          <h2>{t("nativeOffer", locale)}</h2>
          <div className={s.offerGrid}>
            {offers.map(({ row, offer }) => (
              <article key={row.id}>
                <h3>{offer.title || local(row, "label", locale)}</h3>
                {local(row, "label", locale) ? (
                  <p>{local(row, "label", locale)}</p>
                ) : null}
                {typeof offer.price === "number" ? (
                  <strong>
                    {offer.price.toLocaleString(locale)} {offer.currency}
                  </strong>
                ) : null}
                <Link href={offer.url} className={s.button}>
                  {t("nativeOffer", locale)} →
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
export function Bundles({ m, d, locale, state, update, engine }: PlayerProps) {
  const steps = rows(d.steps),
    completed = Array.isArray(state.completed) ? state.completed : [],
    bindings = obj(m.bindings.records),
    readChild = (child: Row) => {
      if (!child.id) return false;
      const data = obj(child.definition),
        store =
          data.continuityPolicy === "device" ? localStorage : sessionStorage;
      try {
        const saved = restoreDetailProgress(
          JSON.parse(store.getItem(progressKey(child.id, locale)) || "null"),
          child.id,
          locale,
          child.revision,
          data,
        );
        return saved?.needsDecision === false && saved.state.complete === true;
      } catch {
        return false;
      }
    };
  useEffect(() => {
    function check() {
      const active = steps
          .filter((step) => readChild(obj(bindings[step.experienceId])))
          .map((step) => step.id),
        next = [...new Set([...completed, ...active])];
      if (next.length !== completed.length) update({ completed: next });
    }
    check();
    window.addEventListener("focus", check);
    window.addEventListener("storage", check);
    return () => {
      window.removeEventListener("focus", check);
      window.removeEventListener("storage", check);
    };
  }, [JSON.stringify(steps), JSON.stringify(completed)]);
  const continuity = { ...blankContinuity(), completed },
    ready = new Set(availableNodes(steps, continuity).map((s) => s.id)),
    progress = journeyProgress(steps, continuity);
  useEffect(() => {
    if (state.complete !== progress.complete)
      update({ complete: progress.complete });
  }, [progress.complete, state.complete]);
  if (!steps.length) return <Empty locale={locale} />;
  return (
    <div
      className={`${s.bundle} ${engine === "dashboard" ? s.bundleDashboard : ""}`}
    >
      <div className={s.bundleOpening}>
        <span className={s.kicker}>{t("progress", locale)}</span>
        <h2>{m.title}</h2>
        <Progress value={progress.percent} label={progress.percent + "%"} />
      </div>
      <div className={s.journeySteps}>
        {steps.map((step, i) => {
          const child = obj(bindings[step.experienceId]),
            done = completed.includes(step.id),
            allowed = ready.has(step.id),
            href = child.key
              ? path(locale, "/experience/" + child.key) +
                "?returnTo=" +
                encodeURIComponent(path(locale, "/experience/" + m.key))
              : "";
          return (
            <article
              key={step.id}
              className={s.journeyStep}
              data-completed={done}
            >
              <span className={s.stepNumber}>
                {done ? "✓" : String(i + 1).padStart(2, "0")}
              </span>
              {child.definition?.coverAssetId ? (
                <Source
                  m={child}
                  id={child.definition.coverAssetId}
                  alt={child.title}
                />
              ) : null}
              <div>
                <span className={s.kicker}>
                  {step.required === false
                    ? t("optional", locale)
                    : t("required", locale)}
                </span>
                <h3>{local(step, "title", locale) || child.title}</h3>
                {local(step, "text", locale) ? (
                  <p>{local(step, "text", locale)}</p>
                ) : null}
                {!child.key ? (
                  <p>{t("empty", locale)}</p>
                ) : !allowed ? (
                  <p>{t("locked", locale)}</p>
                ) : (
                  <Link href={href} className={s.primary}>
                    {t(done ? "review" : "open", locale)} →
                  </Link>
                )}
                {allowed && child.key && step.completion === "manual" ? (
                  <Button
                    onClick={() =>
                      update({
                        completed: done
                          ? completed.filter((id: string) => id !== step.id)
                          : [...completed, step.id],
                      })
                    }
                  >
                    {t(done ? "completed" : "complete", locale)}
                  </Button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
      {progress.complete ? (
        <div className={s.success}>
          <h2>{t("completed", locale)}</h2>
        </div>
      ) : null}
    </div>
  );
}
