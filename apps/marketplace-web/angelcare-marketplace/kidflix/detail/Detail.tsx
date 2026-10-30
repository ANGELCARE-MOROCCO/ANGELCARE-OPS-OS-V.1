"use client";
import { DetailWorkspace } from "./workspace/Workspace";
import x from "./experience/experience.module.css";
import { LoveProvider, SocialToolbar } from "./Social";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { path, world, tr, type Locale } from "../catalogue";
import { useGuest } from "../continuity";
import { I } from "../Icons";
import { selectResult } from "../../digital-customer-experience/experience-depth";
import {
  asset,
  definition,
  engineFor,
  obj,
  readyOutputs,
  publishedOutputHref,
  rows,
  str,
  validReturn,
  type DetailValue,
  type Row,
} from "./model";
import { useProgress } from "./progress";
import {
  Button,
  Editorial,
  Empty,
  ErrorNote,
  type PlayerProps,
} from "./shared";
import { DiscoveryRails } from "./DiscoveryRails";
import { local, t } from "./copy";
import s from "./detail.module.css";
import {
  ResourceSurface,
  PrivateTools,
  MissedPractice,
} from "../journey/Tools";
import { OutputStudio } from "../journey/OutputStudio";
import { OfflineFiles } from "../journey/Offline";
import { AdSlot, RuntimeJourney } from "../journey/Runtime";
import { emitVisitor } from "../journey/events";
const Reading = dynamic(() => import("./Reading").then((m) => m.Reading)),
  Cards = dynamic(() => import("./VisualCards").then((m) => m.VisualCards)),
  Media = dynamic(() => import("./Media").then((m) => m.MediaExperience)),
  Slides = dynamic(() => import("./Media").then((m) => m.Presentations)),
  Learning = dynamic(() => import("./Learning").then((m) => m.Learning)),
  Quiz = dynamic(() => import("./Interactive").then((m) => m.Assessment)),
  Activities = dynamic(() => import("./Interactive").then((m) => m.Activities)),
  Tools = dynamic(() => import("./Personal").then((m) => m.Tools)),
  Planner = dynamic(() => import("./Personal").then((m) => m.Planners)),
  Questionnaire = dynamic(() =>
    import("./Personal").then((m) => m.Questionnaire),
  ),
  Community = dynamic(() => import("./Collections").then((m) => m.Community)),
  Commerce = dynamic(() => import("./Collections").then((m) => m.Commerce)),
  Bundles = dynamic(() => import("./Collections").then((m) => m.Bundles));
const PLAYER: Record<string, React.ComponentType<PlayerProps>> = {
  documents: Reading,
  printables: Reading,
  stories: Reading,
  "visual-cards": Cards,
  video: Media,
  audio: Media,
  presentations: Slides,
  learning: Learning,
  assessments: Quiz,
  activities: Activities,
  tools: Tools,
  planners: Planner,
  forms: Questionnaire,
  community: Community,
  commerce: Commerce,
  bundles: Bundles,
};
export function NativeDetailPlayer(p: PlayerProps) {
  const Player = PLAYER[p.m.family];
  return Player ? <Player {...p} /> : <Empty locale={p.locale} />;
}
export function Detail({
  locale,
  value,
}: {
  locale: Locale;
  value: DetailValue | null;
}) {
  if (!value || !world(value.manifest.family))
    return (
      <article className={s.unavailable}>
        <h1>{t("unavailable", locale)}</h1>
        <Link href={path(locale, "/explore")} className={s.primary}>
          {t("allWorlds", locale)}
        </Link>
      </article>
    );
  return <DetailReady key={value.releaseId} locale={locale} value={value} />;
}
function DetailReady({
  locale,
  value,
}: {
  locale: Locale;
  value: DetailValue;
}) {
  const manifest = value.manifest,
    d = definition(manifest.family, obj(manifest.definition)),
    m: Row = { ...manifest, definition: d, releaseId: value.releaseId },
    w = world(m.family)!,
    guest = useGuest(),
    progress = useProgress(value, locale),
    [returnTo, setReturnTo] = useState(""),
    engine = engineFor(m.family, d),
    Player = PLAYER[m.family],
    outputs = readyOutputs(m),
    saved = guest.saved.includes(m.key),
    titleId = useId();
  useEffect(() => {
    guest.visit(m.key);
    setReturnTo(
      validReturn(
        new URLSearchParams(location.search).get("returnTo") || "",
        locale,
      ),
    );
  }, [m.key, locale]);
  const props: PlayerProps = {
    m,
    d,
    locale,
    engine,
    state: progress.state,
    update: progress.update,
  };
  return (
    <LoveProvider resourceKey={m.key} locale={locale}>
      <article
        className={`${s.detail} ${s["world_" + m.family]} ${s.reference}`}
        dir={locale === "ar" ? "rtl" : "ltr"}
        style={{ "--accent": w.color, "--tint": w.tint } as CSSProperties}
        aria-labelledby={titleId}
      >
        <nav
          className={s.breadcrumb}
          aria-label={tr(["Breadcrumb", "Fil d’Ariane", "مسار التصفح"], locale)}
        >
          <Link href={path(locale)}>KidFlix</Link>
          <span>/</span>
          <Link href={path(locale, "/explore/" + m.family)}>
            {tr(w.title, locale)}
          </Link>
          <span>/</span>
          <span>{m.title}</span>
        </nav>
        {returnTo ? (
          <Link className={s.returnTo} href={returnTo}>
            ← {t("backToJourney", locale)}
          </Link>
        ) : null}
        {progress.error ? (
          <p role="status" className={s.callout}>
            {t("storage", locale)}
          </p>
        ) : null}
        {progress.recovery ? (
          <div className={s.callout}>
            <p>{t("changed", locale)}</p>
            <div className={s.controls}>
              <Button onClick={progress.restore}>{t("restore", locale)}</Button>
              <Button onClick={progress.reset}>{t("discard", locale)}</Button>
            </div>
          </div>
        ) : null}
        <DetailWorkspace p={props} titleId={titleId} saved={saved} onSave={() => {
          guest.toggle(m.key);
          if (!saved) emitVisitor(m.key, locale, m.releaseId, "bookmark");
        }} files={<Files {...props} />}>
          <section
            id="kidflix-experience-player"
            className={s.playerSurface}
            aria-busy={!progress.ready}
          >
            {progress.ready ? (
              <ResourceSurface props={props} compact>
                <Player {...props} />
              </ResourceSurface>
            ) : (
              <div className={s.loading} role="status">
                {t("loading", locale)}
              </div>
            )}
          </section>
        </DetailWorkspace>
        <DiscoveryRails m={m} locale={locale} context={{score: progress.state.score ?? progress.state.assessment?.score, complete: progress.state.complete === true}} />
        <AdSlot m={m} locale={locale} zone="after_intro" />
        <Dossier {...props} />
        <PrivateTools {...props} />
        <MissedPractice {...props} />
        <OutputStudio m={m} locale={locale} update={progress.update} />
        <OfflineFiles m={m} locale={locale} update={progress.update} />
        <RuntimeJourney m={m} locale={locale} state={progress.state} />
        <AdSlot m={m} locale={locale} zone="after_section" />
        <Outcome {...props} />
        {progress.state.complete ? (
          <AdSlot m={m} locale={locale} zone="after_completion" />
        ) : null}
        {d.continuityPolicy !== "none" && progress.ready ? (
          <div className={s.continuity}>
            <span>{t("private", locale)}</span>
            <Button
              icon="RotateCcw"
              onClick={() => {
                if (confirm(t("clearConfirm", locale))) progress.reset();
              }}
            >
              {t("clear", locale)}
            </Button>
          </div>
        ) : null}
        <div className={x.repeatActions}>
          <Button
            icon="Bookmark"
            aria-pressed={saved}
            onClick={() => {
              guest.toggle(m.key);
              if (!saved) emitVisitor(m.key, locale, m.releaseId, "bookmark");
            }}
          >
            {t(saved ? "saved" : "save", locale)}
          </Button>
          <a href="#kidflix-experience-player" className={x.secondary}>
            {t("open", locale)} ↑
          </a>
          {outputs.length ? (
            <a href="#r5-published-files" className={x.secondary}>
              {t("files", locale)} ↑
            </a>
          ) : null}
        </div>
        <SocialToolbar
          resourceKey={m.key}
          title={m.title}
          locale={locale}
          lower
        />

      </article>
    </LoveProvider>
  );
}
function Files({ m, d, locale }: PlayerProps) {
  const outputs = readyOutputs(m);
  return outputs.length ? (
    <section className={s.files}>
      <span className={s.kicker}>
        <I name="Download" size={17} /> {t("files", locale)}
      </span>
      {outputs.map((output) => (
        <article key={output.id} className={s.file}>
          <span className={s.fileIcon}>
            {output.mime === "application/pdf" ? "PDF" : "PNG"}
          </span>
          <div>
            <h3>{local(output, "label", locale) || output.label}</h3>
            <small>
              {output.mime === "application/pdf" ? "PDF" : "PNG"} ·{" "}
              {t(
                output.scope === "page"
                  ? "page"
                  : output.scope === "set"
                    ? "set"
                    : "whole",
                locale,
              )}
              {output.paper ? " · " + output.paper : ""}
            </small>
          </div>
          <a
            onClick={() =>
              emitVisitor(m.key, locale, m.releaseId, "download_intent")
            }
            href={publishedOutputHref(m, output, locale)}
            target="_blank"
            rel="noopener noreferrer"
            download
            className={s.primary}
          >
            <I name="Download" size={17} />
            {t("download", locale)}
          </a>
        </article>
      ))}
      {d.printAllowed === true ? (
        <details>
          <summary>{t("printGuide", locale)}</summary>
          <p>{t("printHelp", locale)}</p>
        </details>
      ) : null}
    </section>
  ) : null;
}
function Dossier({ m, d, locale }: PlayerProps) {
  const options = [
      {
        id: "about",
        label: t("about", locale),
        content:
          local(d, "body", locale) ||
          rows(d.sections).length ||
          rows(d.blocks).length,
      },
      {
        id: "instructions",
        label: t("instructions", locale),
        content: local(d, "instructions", locale),
      },
      {
        id: "objectives",
        label: tr(
          ["What you’ll discover", "Vos découvertes", "ما ستكتشفه"],
          locale,
        ),
        content: local(d, "learningObjectives", locale),
      },
      {
        id: "materials",
        label: tr(
          ["Things you’ll need", "Ce qu’il vous faut", "ما تحتاجه"],
          locale,
        ),
        content: local(d, "materials", locale),
      },
      {
        id: "guidance",
        label: t("adult", locale),
        content: local(d, "caregiverGuidance", locale),
      },
      {
        id: "source",
        label: t("source", locale),
        content: local(d, "source", locale) || str(d.rightsHolder),
      },
    ].filter((o) => !!o.content),
    [active, setActive] = useState(options[0]?.id || ""),
    id = useId(),
    index = options.findIndex((o) => o.id === active);
  if (!options.length) return null;
  return (
    <section className={s.dossier}>
      <div className={s.tabs} role="tablist" aria-label={t("about", locale)}>
        {options.map((option, i) => (
          <button
            key={option.id}
            id={id + "-tab-" + option.id}
            role="tab"
            aria-selected={active === option.id}
            aria-controls={id + "-" + option.id}
            tabIndex={active === option.id ? 0 : -1}
            onClick={() => setActive(option.id)}
            onKeyDown={(e) => {
              if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
                e.preventDefault();
                const n =
                  e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? options.length - 1
                      : (i +
                          (e.key === "ArrowRight"
                            ? locale === "ar"
                              ? -1
                              : 1
                            : locale === "ar"
                              ? 1
                              : -1) +
                          options.length) %
                        options.length;
                setActive(options[n].id);
                document.getElementById(id + "-tab-" + options[n].id)?.focus();
              }
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div
        id={id + "-" + active}
        role="tabpanel"
        aria-labelledby={id + "-tab-" + active}
        tabIndex={0}
        className={s.dossierBody}
      >
        {active === "about" ? (
          <Editorial m={m} data={d} locale={locale} />
        ) : active === "instructions" ? (
          <p>{local(d, "instructions", locale)}</p>
        ) : ["objectives", "materials", "guidance"].includes(active) ? (
          <p>
            {local(
              d,
              active === "objectives"
                ? "learningObjectives"
                : active === "materials"
                  ? "materials"
                  : "caregiverGuidance",
              locale,
            )}
          </p>
        ) : (
          <p>{local(d, "source", locale) || str(d.rightsHolder)}</p>
        )}
      </div>
    </section>
  );
}
function Outcome({ m, d, locale, state, update }: PlayerProps) {
  const score = typeof state.score === "number" ? state.score : undefined,
    result: Row | null =
      d.resultsEnabled === true
        ? (selectResult(
            d,
            score,
            state.complete === true,
            state.timeout === true,
          ) as Row)
        : null,
    layouts = rows(d.exportLayouts).filter((l) => l.enabled === true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    [message, setMessage] = useState(""),
    controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function output(layout: Row) {
    if (busy) return;
    emitVisitor(m.key, locale, m.releaseId, "output_prepare");
    setBusy(true);
    setError(false);
    controller.current = new AbortController();
    try {
      const { generatePersonalOutput } = await import(
          "../../digital-customer-experience/personal-output"
        ),
        out = await generatePersonalOutput(
          d,
          layout,
          {
            ...state,
            resultTitle: result ? local(result, "title", locale) : "",
            guidance: result ? local(result, "guidance", locale) : "",
          },
          locale,
          controller.current.signal,
          obj(m.bindings),
        ),
        url = URL.createObjectURL(out.blob),
        a = document.createElement("a");
      emitVisitor(m.key, locale, m.releaseId, "output_ready");
      update({ prepared: true });
      a.href = url;
      a.download = out.name;
      document.body.append(a);
      emitVisitor(m.key, locale, m.releaseId, "download_intent");
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setMessage(t("outputReady", locale));
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError(true);
        emitVisitor(m.key, locale, m.releaseId, "action_failed");
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {result && (score !== undefined || state.complete) ? (
        <section className={s.authoredResult} role="status">
          {local(result, "badgeLabel", locale) ? (
            <span className={s.free}>
              {local(result, "badgeLabel", locale)}
            </span>
          ) : null}
          <h2>{local(result, "title", locale)}</h2>
          <p>{local(result, "text", locale)}</p>
          {local(result, "guidance", locale) ? (
            <p>{local(result, "guidance", locale)}</p>
          ) : null}
          {result.experienceId &&
          m.bindings.records?.[result.experienceId]?.key ? (
            <Link
              href={path(
                locale,
                "/experience/" + m.bindings.records[result.experienceId].key,
              )}
              className={s.primary}
            >
              {t("open", locale)} →
            </Link>
          ) : null}
        </section>
      ) : null}
      {d.downloadAllowed === true && layouts.length ? (
        <section className={s.personalOutputs}>
          <h2>{t("export", locale)}</h2>
          <div className={s.controls}>
            {layouts.map((l) => (
              <Button
                key={l.id}
                disabled={busy}
                icon="Download"
                onClick={() => void output(l)}
              >
                {local(l, "title", locale) || t("export", locale)} ·{" "}
                {l.mime === "image/png" ? "PNG" : "PDF"}
              </Button>
            ))}
            {busy ? (
              <Button onClick={() => controller.current?.abort()}>
                {t("cancel", locale)}
              </Button>
            ) : null}
          </div>
          {busy ? <p role="status">{t("outputBusy", locale)}</p> : null}
          {message ? <p role="status">{message}</p> : null}
          {error ? <ErrorNote locale={locale} /> : null}
        </section>
      ) : null}
    </>
  );
}
