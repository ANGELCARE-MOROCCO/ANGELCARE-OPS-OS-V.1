"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { copy } from "./copy";
import { path, safeImage, tr, world, type Locale } from "./catalogue";
import { useGuest } from "./continuity";
import { I } from "./Icons";
import s from "./kidflix.module.css";
export function InformationPage({
  locale,
  topic,
}: {
  locale: Locale;
  topic: "about" | "privacy" | "accessibility";
}) {
  const guest = useGuest(),
    [cleared, setCleared] = useState(false),
    title =
      topic === "about" ? "about" : topic === "privacy" ? "privacy" : "access",
    body =
      topic === "about"
        ? "aboutBody"
        : topic === "privacy"
          ? "privacyBody"
          : "accessBody";
  return (
    <article className={s.infoPage}>
      <Link className={s.breadcrumb} href={path(locale)}>
        <I name="ArrowLeft" size={14} />
        {copy("home", locale)}
      </Link>
      <span className={s.eyebrow}>KIDFLIX · ANGELCARE</span>
      <h1>{copy(title, locale)}</h1>
      <p>{copy(body, locale)}</p>
      {topic === "privacy" ? (
        <>
          <button
            className={s.outline}
            onClick={() => {
              guest.clear();
              setCleared(true);
            }}
          >
            {copy("erase", locale)}
          </button>
          {cleared ? <p role="status">{copy("erased", locale)}</p> : null}
        </>
      ) : (
        <Link href={path(locale, "/explore")} className={s.primary}>
          {copy("explore", locale)}
          <I name="ArrowRight" size={17} />
        </Link>
      )}
    </article>
  );
}
const obj = (v: any): Record<string, any> =>
  v && typeof v === "object" && !Array.isArray(v) ? v : {};
const list = (v: any): Record<string, any>[] =>
  Array.isArray(v) ? v.filter((x) => x && typeof x === "object") : [];
const str = (v: any) => (typeof v === "string" ? v : "");
/** Resource overview and governed native media. Specialist full-screen players are a separate chapter. */
export function ResourceOverview({
  locale,
  value,
}: {
  locale: Locale;
  value: any;
}) {
  const guest = useGuest(),
    m = obj(value?.manifest),
    d = obj(m.definition),
    w = world(str(m.family)),
    l = obj(obj(d.locales)[locale]),
    media = obj(obj(m.bindings).media),
    cover = obj(media[str(d.coverAssetId)]);
  useEffect(() => {
    if (m.key) guest.visit(m.key);
  }, [m.key]);
  if (!w)
    return (
      <article className={s.infoPage}>
        <h1>{copy("editionUnavailable", locale)}</h1>
        <Link className={s.primary} href={path(locale, "/explore")}>
          {copy("back", locale)}
        </Link>
      </article>
    );
  const units = [
      "units",
      "pages",
      "sections",
      "chapters",
      "lessons",
      "modules",
      "cards",
      "frames",
      "entries",
    ].flatMap((k) => list(d[k])),
    outputs = list(d.outputs).filter((o) => o.enabled !== false),
    downloadable = d.downloadAllowed === true;
  function local(u: Record<string, any>, key: string) {
    return str(obj(obj(u.locales)[locale])[key]) || str(u[key]);
  }
  function Media({ id }: { id: string }) {
    const a = obj(media[id]),
      url = str(a.url);
    if (!safeImage(url)) return null;
    return a.mime?.startsWith("image/") ? (
      <img src={url} alt={str(a.alt) || m.title} loading="lazy" />
    ) : a.mime?.startsWith("audio/") ? (
      <audio src={url} controls preload="metadata" />
    ) : a.mime?.startsWith("video/") ? (
      <video src={url} controls playsInline preload="metadata" />
    ) : a.mime === "application/pdf" ? (
      <>
        <iframe src={url} title={m.title} />
        <a
          className={s.outline}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {copy("read", locale)}
          <I name="ExternalLink" size={14} />
        </a>
      </>
    ) : null;
  }
  return (
    <>
      <section
        className={s.detailHero}
        style={{ "--accent": w.color, "--tint": w.tint } as React.CSSProperties}
      >
        <div>
          <Link
            className={s.breadcrumb}
            href={path(locale, "/explore/" + w.key)}
          >
            <I name="ArrowLeft" size={14} />
            {tr(w.title, locale)}
          </Link>
          <span className={s.eyebrow}>
            <I name={w.icon} size={16} />
            {copy("free", locale)}
          </span>
          <h1>{str(m.title)}</h1>
          {l.summary ? <p>{str(l.summary)}</p> : null}
          <div className={s.heroCTA}>
            <button
              className={s.outline}
              aria-pressed={guest.saved.includes(m.key)}
              onClick={() => guest.toggle(m.key)}
            >
              <I name="Heart" size={17} />
              {copy(guest.saved.includes(m.key) ? "unsave" : "save", locale)}
            </button>
            <Link
              href={path(locale, "/explore/" + w.key)}
              className={s.outline}
            >
              {copy("related", locale)}
              <I name="ArrowRight" size={17} />
            </Link>
          </div>
        </div>
        <div>
          {safeImage(cover.url) ? (
            <img
              src={cover.url}
              alt={str(cover.alt) || m.title}
              width={650}
              height={450}
            />
          ) : (
            <I name={w.icon} size={110} />
          )}
        </div>
      </section>
      {l.instructions ? (
        <section className={s.reader}>
          <h2>{copy("instructions", locale)}</h2>
          <p>{str(l.instructions)}</p>
        </section>
      ) : null}
      {l.body || d.body || units.length ? (
        <section className={s.reader}>
          {l.body || d.body ? <p>{str(l.body) || str(d.body)}</p> : null}
          {units.map((u, i) => (
            <details key={str(u.id) || i} open={i === 0}>
              <summary>
                {local(u, "title") ||
                  local(u, "label") ||
                  `${tr(w.short, locale)} ${i + 1}`}
              </summary>
              {local(u, "text") || local(u, "body") ? (
                <p>{local(u, "text") || local(u, "body")}</p>
              ) : null}
              {u.assetId || u.contentAssetId ? (
                <Media id={str(u.assetId) || str(u.contentAssetId)} />
              ) : null}
            </details>
          ))}
        </section>
      ) : null}
      <section className={s.reader}>
        {!units.length && d.coverAssetId ? (
          <Media id={str(d.coverAssetId)} />
        ) : null}
        {downloadable && outputs.length ? (
          <div className={s.outputLinks}>
            {outputs.map((o, i) => {
              const a = obj(media[str(o.assetId) || str(o.sourceAssetId)]);
              return safeImage(a.url) &&
                [
                  "application/pdf",
                  "image/png",
                  "image/jpeg",
                  "image/webp",
                ].includes(a.mime) ? (
                <a
                  className={s.primary}
                  key={str(o.id) || i}
                  href={a.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <I name="Download" size={17} />
                  {copy("download", locale)}{" "}
                  {o.mime === "application/pdf"
                    ? "PDF"
                    : o.mime === "image/png"
                      ? "PNG"
                      : str(o.format)}
                </a>
              ) : null;
            })}
          </div>
        ) : null}
        <Link className={s.outline} href={path(locale, "/explore/" + w.key)}>
          {copy("related", locale)}
          <I name="ArrowRight" size={16} />
        </Link>
      </section>
    </>
  );
}
