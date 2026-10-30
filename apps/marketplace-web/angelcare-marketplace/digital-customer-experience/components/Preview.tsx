"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  array,
  localized,
  object,
  text,
  number,
  tr,
  type Data,
  type DceRecord,
  type Locale,
} from "../types";
import {
  gradeBridge,
  gradeClassification,
  gradeSoundPair,
  gradeTaskActivity,
} from "../detail-interactions";
import { DetailWorkspace } from "../../kidflix/detail/workspace/Workspace";

import { NativeDetailPlayer } from "../../kidflix/detail/Detail";
import rx from "../../kidflix/detail/experience/experience.module.css";
import {
  publicManifest,
  calculate,
  scoreQuestions,
  graphErrors,
  safeHref,
} from "../model";
import { availableNodes, blankContinuity } from "../continuity";
import { familyByKey } from "../registry";
import {
  Badge,
  Button,
  Dialog,
  Empty,
  Field,
  Icon,
  query,
  State,
  Switch,
  T,
  useUI,
  useQuery,
  download,
} from "./ui";
import { EditorialBlocks } from "./Editorial";
import { editionProjection, outputReadiness } from "../experience-contract";
import { effectiveLayout } from "../composition";
import { compatibleDefinition, modeContract } from "../capabilities";
import {
  ReadingStage,
  TimedStage,
  LearningStage,
  VisualStage,
  PresentationStage,
} from "./previews/Reading";
import {
  AssessmentStage,
  ActivityStage,
  ToolStage,
  PlannerStage,
} from "./previews/Interactive";
import {
  FormStage,
  CommunityStage,
  CommerceStage,
  BundleStage,
} from "./previews/Flows";
import { ExperienceOutcomes } from "./ExperienceOutcomes";
import { CertificatePreview } from "./CertificatePreview";
import s from "./workspace.module.css";
export function localizedUnit(unit: Data, field: string, locale: Locale) {
  return text(object(object(unit.locales)[locale])[field]) || text(unit[field]);
}
function Media({
  binding,
  title,
  onComplete,
}: {
  binding: Data;
  title: string;
  onComplete?: () => void;
}) {
  const mime = text(binding.mime),
    url = text(binding.url);
  if (!safeHref(url))
    return (
      <Empty
        icon="FileWarning"
        title={
          <T
            v={[
              "No usable media binding",
              "Média non disponible",
              "وسائط غير متاحة",
            ]}
          />
        }
      />
    );
  if (mime.startsWith("image/"))
    return <img src={url} alt={text(binding.alt) || title} loading="lazy" />;
  if (mime.startsWith("audio/"))
    return <audio src={url} controls preload="metadata" onEnded={onComplete} />;
  if (mime.startsWith("video/"))
    return (
      <video
        src={url}
        poster={text(binding.poster) || undefined}
        controls
        preload="metadata"
        onEnded={onComplete}
        playsInline
      />
    );
  if (mime === "application/pdf")
    return (
      <>
        <iframe src={url + "#toolbar=1"} title={title} />
        <a href={url} target="_blank" rel="noopener noreferrer">
          <T
            v={[
              "Open document in a new tab",
              "Ouvrir le document dans un onglet",
              "فتح المستند في تبويب جديد",
            ]}
          />
        </a>
      </>
    );
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {title}
    </a>
  );
}
export function PreviewWindow({
  id,
  releaseId,
  onClose,
  initialLanguage,
}: {
  id: string;
  releaseId?: string;
  initialLanguage?: Locale;
  onClose: () => void;
}) {
  const { locale } = useUI(),
    [device, setDevice] = useState("desktop"),
    [lang, setLang] = useState<Locale>(initialLanguage || locale),
    q = useQuery<any>(
      { op: releaseId ? "release" : "record", id: releaseId || id },
      null,
    ),
    [bindings, setBindings] = useState<Data>({}),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setBindings({}); setError("");
    if (releaseId) return;
    import("./ui")
      .then(({ mutate }) => mutate({ action: "preview", id, locale: lang }))
      .then((v) => {
        if (active) setBindings(v.bindings);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id, releaseId, lang, q.value?.revision]);
  const selected = (q.value?.manifest?.editionLocale as Locale) || lang,
    r = q.value
      ? releaseId
        ? {
            ...q.value.snapshot,
            title: q.value.manifest?.title || q.value.snapshot.title,
            data: q.value.manifest?.definition || {},
          }
        : editionProjection(q.value, selected)
      : null;
  return (
    <Dialog
      wide
      title={
        <T
          v={[
            "Protected experience preview",
            "Aperçu protégé de l’expérience",
            "معاينة التجربة المحمية",
          ]}
        />
      }
      onClose={onClose}
    >
      <div
        className={s.root}
        dir={selected === "ar" ? "rtl" : "ltr"}
        lang={selected}
      >
        <div className={s.toolbar}>
          <Badge tone="orange">
            <T
              v={[
                "Staff preview · no advertising or public submissions",
                "Aperçu interne · sans publicité ni soumission publique",
                "معاينة داخلية · دون إعلانات أو إرسال عام",
              ]}
            />
          </Badge>
          <select
            aria-label="Preview language"
            value={selected}
            disabled={Boolean(releaseId && q.value?.manifest?.editionLocale)}
            onChange={(e) => setLang(e.target.value as Locale)}
          >
            {["fr", "en", "ar"].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <select
            aria-label="Preview device"
            value={device}
            onChange={(e) => setDevice(e.target.value)}
          >
            <option value="desktop">Desktop</option>
            <option value="mobile">Mobile · 375px</option>
          </select>
        </div>
        {error && <p role="alert">{error}</p>}
        <State {...q} retry={q.reload}>
          <RuntimePreview
            key={[id, releaseId || q.value?.revision || 0, selected].join(":")}
            record={r}
            bindings={
              releaseId ? object(q.value?.manifest?.bindings) : bindings
            }
            locale={selected}
            device={device}
            onDetailAction={
              releaseId
                ? (operation, input) =>
                    import("./ui").then(({ mutate }) =>
                      mutate({
                        action: "master_preview_detail",
                        releaseId,
                        locale: selected,
                        operation,
                        input,
                      }),
                    )
                : undefined
            }
            onActivity={
              releaseId
                ? (input) =>
                    import("./ui").then(({ mutate }) =>
                      mutate({
                        action: "master_preview_activity",
                        releaseId,
                        input,
                      }),
                    )
                : undefined
            }
            onGrade={
              releaseId
                ? (answers) =>
                    import("./ui").then(({ mutate }) =>
                      mutate({
                        action: "master_preview_grade",
                        releaseId,
                        answers,
                      }),
                    )
                : undefined
            }
          />
        </State>
      </div>
    </Dialog>
  );
}
export function RuntimePreview({
  record,
  bindings = {},
  locale = "en",
  device = "desktop",
  onGrade,
  onActivity,
  onExperienceState,
  onDetailAction,
}: {
  onDetailAction?: (operation: string, input: Data) => Promise<any>;
  onExperienceState?: (state: Data) => void;
  record: DceRecord | null;
  bindings?: Data;
  locale?: Locale;
  device?: string;
  onActivity?: (input: Data) => Promise<{ correct: boolean }>;
  onGrade?: (
    answers: Record<string, string>,
  ) => Promise<ReturnType<typeof scoreQuestions>>;
}) {
  const stateListener = useRef(onExperienceState);
  stateListener.current = onExperienceState;
  const [detailLayout, setDetailLayout] = useState(true),
    [personal, setPersonal] = useState<Data>({}),
    [restored, setRestored] = useState<Data>({}),
    [generation, setGeneration] = useState(0);
  const onPersonal = useCallback(
    (patch: Data) => setPersonal((old) => ({ ...old, ...patch })),
    [],
  );
  const onOutcome = useCallback(
    (score: number) =>
      setPersonal((old) => ({ ...old, score, complete: true })),
    [],
  );
  useEffect(() => stateListener.current?.(personal), [personal]);
  const surface = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1),
    [outputSource, setOutputSource] = useState(""),
    [outputNotice, setOutputNotice] = useState("");
  const [bookmarked, setBookmarked] = useState(false),
    [completed, setCompleted] = useState(false),
    [shared, setShared] = useState(false),
    [accountScenario, setAccountScenario] = useState(false),
    [entitledScenario, setEntitledScenario] = useState(false),
    [selectedBinding, setSelectedBinding] = useState("");
  if (!record) return null;
  const family = familyByKey(
      record.family || (record.kind === "bundle" ? "bundles" : ""),
    ),
    adapted = compatibleDefinition(record.family, record.data),
    data = adapted.data,
    layout = effectiveLayout(data, bindings),
    sections = array(layout.sections),
    mode = modeContract(family, data),
    boundUnit =
      selectedBinding ||
      text(sections.find((section) => section.region === "stage")?.binding),
    props = {
      record,
      data: boundUnit
        ? {
            ...data,
            ...Object.fromEntries(
              (family?.collections || [])
                .filter((c) =>
                  array(data[c.key]).some((u) => u.id === boundUnit),
                )
                .map((c) => [
                  c.key,
                  array(data[c.key]).filter((u) => u.id === boundUnit),
                ]),
            ),
          }
        : data,
      bindings,
      locale,
      engine: mode?.engine || "",
      onGrade,
      onActivity,
      onPersonal,
      onOutcome,
      initialPersonal: restored,
    },
    title = localized(data, "title", locale) || record.title;
  let stage: React.ReactNode;
  if (["documents", "printables", "stories"].includes(record.family || ""))
    stage = <ReadingStage {...props} />;
  else if (["video", "audio"].includes(record.family || ""))
    stage = <TimedStage {...props} />;
  else if (record.family === "learning") stage = <LearningStage {...props} />;
  else if (record.family === "visual-cards") stage = <VisualStage {...props} />;
  else if (record.family === "presentations")
    stage = <PresentationStage {...props} />;
  else if (record.family === "assessments")
    stage = <AssessmentStage {...props} />;
  else if (record.family === "activities") stage = <ActivityStage {...props} />;
  else if (record.family === "tools") stage = <ToolStage {...props} />;
  else if (record.family === "planners") stage = <PlannerStage {...props} />;
  else if (record.family === "forms") stage = <FormStage {...props} />;
  else if (record.family === "community") stage = <CommunityStage {...props} />;
  else if (record.family === "commerce") stage = <CommerceStage {...props} />;
  else if (record.family === "bundles" || record.kind === "bundle")
    stage = <BundleStage {...props} />;
  else
    stage = (
      <article className={s.readingPage}>
        <EditorialBlocks data={data} bindings={bindings} locale={locale} />
      </article>
    );
  if (family && detailLayout) {
    const detailProps = {
      preview: true,
      m: {
        ...publicManifest(record, bindings),
        title,
        bindings,
        releaseId: "",
      },
      d: data,
      locale,
      engine: mode?.engine || "",
      state: personal,
      update: onPersonal,
      runAction: async (operation: string, input: any) => {
        const values = object(input.input);
        if (operation === "grade")
          return onGrade
            ? onGrade(object(input.answers) as Record<string, string>)
            : scoreQuestions(
                array(data.questions),
                object(input.answers) as Record<string, string>,
              );
        if (operation === "check_question") {
          if (onDetailAction) return onDetailAction(operation, input);
          const q = array(data.questions).find(
            (q) => q.id === input.questionId,
          );
          if (!q || data.feedbackPolicy !== "immediate")
            throw Error("INVALID_OPERATION");
          return scoreQuestions([q], { [text(q.id)]: String(input.answer) });
        }
        if (operation === "activity" && data.engine !== "bridge")
          return onActivity
            ? onActivity(values)
            : gradeTaskActivity(data, values);
        if (onDetailAction) return onDetailAction(operation, values);
        return operation === "sort_cards"
          ? gradeClassification(data, values)
          : operation === "match_audio"
            ? gradeSoundPair(data, values)
            : gradeBridge(data, values);
      },
    };
    stage = <NativeDetailPlayer {...detailProps} />;
    stage = (
      <div className={rx.experienceRoot} dir={locale === "ar" ? "rtl" : "ltr"}>
        <DetailWorkspace
          p={detailProps}
          titleId={"staff-preview-" + record.id}
          saved={bookmarked}
          onSave={() => setBookmarked((v) => !v)}
          files={
            <p>
              {tr(
                [
                  "File availability is inspected in the native output controls below.",
                  "La disponibilité des fichiers est inspectée dans les contrôles natifs ci-dessous.",
                  "تُفحص الملفات المتاحة في أدوات الإخراج الأصلية أدناه.",
                ],
                locale,
              )}
            </p>
          }
        >
          <div id="kidflix-experience-player">{stage}</div>
        </DetailWorkspace>
      </div>
    );
  }
  const actions = [
      ...new Set([
        ...(Array.isArray(data.actions)
          ? data.actions
              .map(String)
              .filter(
                (a) =>
                  ![
                    "upload",
                    "submit",
                    "comment",
                    "rate",
                    "report",
                    "track_status",
                  ].includes(a),
              )
          : []),
        ...(array(data.outputs).length ? ["download"] : []),
      ]),
    ],
    sources = (
      Array.isArray(data.outputs)
        ? outputReadiness(data, bindings)
            .filter((o) => o.ready && o.enabled !== false)
            .map((o) => ({
              ...o.asset,
              id: text(o.id),
              title: text(o.label),
              mime: text(o.mime),
            }))
        : Object.entries(object(bindings.media))
            .map<Data & { id: string }>(([id, value]) => ({
              ...object(value),
              id,
            }))
            .filter(
              (o) =>
                safeHref(o.url) &&
                ["application/pdf", "image/png"].includes(text(o.mime)),
            )
    ) as (Data & { id: string })[],
    source = sources.find((o) => o.id === outputSource) || sources[0];
  return (
    <div
      ref={surface}
      className={s.preview}
      data-device={device}
      dir={locale === "ar" ? "rtl" : "ltr"}
      lang={locale}
    >
      {family ? (
        <div
          className={s.previewActions}
          role="group"
          aria-label={tr(
            ["Preview layout", "Disposition de l’aperçu", "تخطيط المعاينة"],
            locale,
          )}
        >
          <button
            type="button"
            className={s.button}
            onClick={() => setDetailLayout(true)}
            aria-pressed={detailLayout}
          >
            {tr(
              [
                "KidFlix detail experience",
                "Expérience détaillée KidFlix",
                "تجربة كيدفليكس التفصيلية",
              ],
              locale,
            )}
          </button>
          <button
            type="button"
            className={s.button}
            onClick={() => setDetailLayout(false)}
            aria-pressed={!detailLayout}
          >
            {tr(
              [
                "Authored layout inspector",
                "Inspecteur de composition éditée",
                "فاحص التخطيط المحرر",
              ],
              locale,
            )}
          </button>
        </div>
      ) : null}
      <div className={s.previewHead}>
        <div>
          <Badge tone="purple">
            {family ? tr(family.name, locale) : record.kind} · {text(data.mode)}
          </Badge>
          <h2>{title}</h2>
          <p className={s.subtitle}>{localized(data, "summary", locale)}</p>
        </div>
        <Icon name={family?.icon || "Layers"} size={32} />
      </div>
      {actions.some((action) =>
        ["zoom", "fullscreen", "download", "print"].includes(action),
      ) && (
        <div className={s.toolbar}>
          {actions.includes("zoom") && (
            <>
              <Button
                disabled={zoom <= 0.75}
                onClick={() => setZoom((v) => Math.max(0.75, v - 0.25))}
                title="Zoom out"
              >
                −
              </Button>
              <Badge>{Math.round(zoom * 100)}%</Badge>
              <Button
                disabled={zoom >= 2}
                onClick={() => setZoom((v) => Math.min(2, v + 0.25))}
                title="Zoom in"
              >
                +
              </Button>
            </>
          )}
          {actions.includes("fullscreen") && (
            <Button
              icon="Monitor"
              onClick={() => {
                if (document.fullscreenElement) {
                  document
                    .exitFullscreen()
                    .catch((e) => setOutputNotice(e.message));
                  return;
                }
                if (surface.current?.requestFullscreen)
                  surface.current
                    .requestFullscreen()
                    .catch((e) => setOutputNotice(e.message));
                else
                  setOutputNotice(
                    tr(
                      [
                        "Fullscreen is unavailable in this preview host.",
                        "Le plein écran est indisponible dans cet hôte.",
                        "ملء الشاشة غير متاح في مضيف المعاينة.",
                      ],
                      locale,
                    ),
                  );
              }}
            >
              <T v={["Fullscreen", "Plein écran", "ملء الشاشة"]} />
            </Button>
          )}
          {actions.some((action) => ["download", "print"].includes(action)) && (
            <details className={s.advanced}>
              <summary>
                <T
                  v={[
                    "Inspect permitted outputs",
                    "Inspecter les sorties autorisées",
                    "فحص المخرجات المسموحة",
                  ]}
                />
              </summary>
              <select
                aria-label="Output source"
                value={source?.id || ""}
                onChange={(e) => setOutputSource(e.target.value)}
              >
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {text(source.title) || source.id} · {text(source.mime)}
                  </option>
                ))}
              </select>
              {source ? (
                <>
                  <p>
                    {text(source.rights)} ·{" "}
                    {Number(source.bytes || 0).toLocaleString()} bytes ·{" "}
                    {text(source.mime)}
                  </p>
                  {actions.includes("download") &&
                    (data.downloadAllowed === true ? (
                      <a
                        className={s.button}
                        href={text(source.url)}
                        download={text(source.title)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <T
                          v={[
                            "Open download source",
                            "Ouvrir la source de téléchargement",
                            "فتح مصدر التنزيل",
                          ]}
                        />
                      </a>
                    ) : (
                      <Badge tone="orange">
                        <T
                          v={[
                            "Download disabled by definition",
                            "Téléchargement désactivé par la définition",
                            "التنزيل معطل في التعريف",
                          ]}
                        />
                      </Badge>
                    ))}
                  {actions.includes("print") &&
                    (data.printAllowed === true &&
                    [
                      "application/pdf",
                      "image/jpeg",
                      "image/png",
                      "image/webp",
                    ].includes(text(source.mime)) ? (
                      <a
                        className={s.button}
                        href={text(source.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <T
                          v={[
                            "Open print-ready source",
                            "Ouvrir la source imprimable",
                            "فتح المصدر الجاهز للطباعة",
                          ]}
                        />
                      </a>
                    ) : (
                      <Badge tone="orange">
                        <T
                          v={[
                            "Printing disabled or incompatible source",
                            "Impression désactivée ou source incompatible",
                            "الطباعة معطلة أو المصدر غير متوافق",
                          ]}
                        />
                      </Badge>
                    ))}
                </>
              ) : (
                <p>
                  <T
                    v={[
                      "Bind a compatible source to inspect outputs.",
                      "Liez une source compatible pour inspecter les sorties.",
                      "اربط مصدراً متوافقاً لفحص المخرجات.",
                    ]}
                  />
                </p>
              )}
            </details>
          )}
        </div>
      )}
      {outputNotice && <p role="status">{outputNotice}</p>}
      {adapted.notices.map((notice, i) => (
        <div className={s.notice} key={i}>
          <p>{notice.message}</p>
        </div>
      ))}
      {!detailLayout &&
        sections.length > 0 &&
        sections.some(
          (section) => section.condition && section.condition !== "always",
        ) && (
          <details className={s.advanced}>
            <summary>
              <T
                v={[
                  "Inspect composition conditions",
                  "Inspecter les conditions de composition",
                  "فحص شروط التكوين",
                ]}
              />
            </summary>
            <Switch
              label={
                <T
                  v={["Account scenario", "Scénario de compte", "سيناريو حساب"]}
                />
              }
              value={accountScenario}
              onChange={setAccountScenario}
            />
            <Switch
              label={
                <T
                  v={[
                    "Recognized access scenario",
                    "Scénario d’accès reconnu",
                    "سيناريو وصول معترف به",
                  ]}
                />
              }
              value={entitledScenario}
              onChange={setEntitledScenario}
            />
          </details>
        )}
      {sections.length && !detailLayout ? (
        <div
          key={generation}
          id="dce-experience-stage"
          className={s.composedPreview}
          data-density={text(layout.density)}
        >
          {(Array.isArray(layout.regions) ? layout.regions : []).map(
            (region) => {
              const section = sections.find((s) => s.region === region);
              if (
                !section ||
                section.visible === false ||
                (device === "mobile" && section.mobile === "hide") ||
                (section.condition === "authenticated" && !accountScenario) ||
                (section.condition === "entitled" && !entitledScenario) ||
                (section.condition === "has_content" &&
                  !family?.collections.some((c) => array(data[c.key]).length))
              )
                return null;
              let content: React.ReactNode;
              if (["reading", "media"].includes(text(section.component)))
                content = (
                  <div
                    className={s.modeStage}
                    style={{
                      maxWidth:
                        device === "mobile"
                          ? "100%"
                          : number(layout.stageRatio, 70) + "%",
                      marginInline: "auto",
                    }}
                  >
                    {stage}
                  </div>
                );
              else if (section.component === "chapters")
                content = (
                  <div className={s.stepPills}>
                    {family?.collections
                      .flatMap((c) => array(data[c.key]))
                      .map((u) => (
                        <button
                          key={text(u.id)}
                          aria-current={
                            selectedBinding === u.id ? "step" : undefined
                          }
                          onClick={() => setSelectedBinding(text(u.id))}
                        >
                          {localizedUnit(u, "title", locale) ||
                            localizedUnit(u, "label", locale) ||
                            text(u.id)}
                        </button>
                      ))}
                  </div>
                );
              else if (section.component === "related")
                content = (
                  <div className={s.definitionBoard}>
                    {Object.entries(object(bindings.records)).map(
                      ([id, value]) => (
                        <div key={id}>
                          <strong>{text(object(value).key)}</strong>
                          <p>
                            {text(object(object(value).definition).summary)}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                );
              else if (section.component === "access_notice")
                content = (
                  <div className={s.notice}>
                    {text(data.visibility) || "free"} ·{" "}
                    {data.downloadAllowed === true
                      ? "download permitted"
                      : "download disabled"}
                  </div>
                );
              else if (section.component === "progress")
                content = (
                  <div className={s.modePills}>
                    <Badge>
                      {bookmarked ? "bookmarked" : "not bookmarked"}
                    </Badge>
                    <Badge>{shared ? "sharing inspected" : "not shared"}</Badge>
                    <Badge>
                      {completed
                        ? "explicit completion"
                        : "not explicitly completed"}
                    </Badge>
                  </div>
                );
              else if (section.component === "ad_placeholder")
                content = (
                  <div className={s.adSketch}>
                    <strong>
                      <T
                        v={[
                          "Governed advertising placeholder · no impressions",
                          "Emplacement publicitaire gouverné · sans impressions",
                          "موضع إعلاني محكوم · دون ظهور إعلاني",
                        ]}
                      />
                    </strong>
                  </div>
                );
              else
                content = (
                  <p className={s.subtitle}>
                    <T
                      v={[
                        "Relevant experience actions appear below.",
                        "Les actions de l’expérience apparaissent ci-dessous.",
                        "تظهر إجراءات التجربة ذات الصلة أدناه.",
                      ]}
                    />
                  </p>
                );
              return (
                <section
                  key={String(region)}
                  className={s.composedRegion}
                  data-region={String(region)}
                >
                  {device === "mobile" && section.mobile === "collapse" ? (
                    <details>
                      <summary>{String(region)}</summary>
                      {content}
                    </details>
                  ) : (
                    content
                  )}
                </section>
              );
            },
          )}
        </div>
      ) : (
        <div id="dce-experience-stage" className={s.previewViewport}>
          <div
            style={{ zoom }}
            className={s.modeStage}
            key={
              record.id +
              ":" +
              record.revision +
              ":" +
              text(data.mode) +
              ":" +
              locale +
              ":" +
              generation
            }
          >
            {stage}
          </div>
        </div>
      )}

      <ExperienceOutcomes
        bindings={bindings}
        record={record}
        data={data}
        locale={locale}
        state={personal}
        onRestore={(v) => {
          setPersonal(v);
          setRestored(v);
          setGeneration((n) => n + 1);
        }}
        onReset={(retry) => {
          const next: Data = retry
            ? { attempts: number(personal.attempts) }
            : {};
          setPersonal(next);
          setRestored(next);
          setGeneration((n) => n + 1);
        }}
      />
      {record.family === "learning" && (
        <CertificatePreview data={data} title={title} locale={locale} />
      )}
      <div className={s.previewActions}>
        {Array.isArray(data.actions) &&
          data.actions.some((a) =>
            ["save", "bookmark", "favorite"].includes(String(a)),
          ) && (
            <Button icon="Bookmark" onClick={() => setBookmarked((v) => !v)}>
              {bookmarked ? "✓ " : ""}
              <T
                v={[
                  "Bookmark preview",
                  "Marquer l’aperçu",
                  "حفظ المعاينة للمراجعة",
                ]}
              />
            </Button>
          )}
        {Array.isArray(data.actions) && data.actions.includes("share") && (
          <Button icon="Share" onClick={() => setShared((v) => !v)}>
            {shared ? "✓ " : ""}
            <T
              v={[
                "Inspect sharing state",
                "Inspecter l’état de partage",
                "فحص حالة المشاركة",
              ]}
            />
          </Button>
        )}
        {Array.isArray(data.actions) && data.actions.includes("complete") && (
          <Button icon="CircleCheck" onClick={() => setCompleted((v) => !v)}>
            {completed ? "✓ " : ""}
            <T
              v={[
                "Explicit completion scenario",
                "Scénario de complétion explicite",
                "سيناريو إكمال صريح",
              ]}
            />
          </Button>
        )}
      </div>
      <details className={s.advanced}>
        <summary>
          <T
            v={[
              "Authored action capabilities",
              "Capacités d’action définies",
              "قدرات الإجراءات المؤلفة",
            ]}
          />
        </summary>
        <div className={s.tableScroll}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Action</th>
                <th>Prerequisites</th>
                <th>Preview contract</th>
              </tr>
            </thead>
            <tbody>
              {family?.capabilities
                ?.filter(
                  (c) =>
                    Array.isArray(data.actions) && data.actions.includes(c.id),
                )
                .map((capability) => (
                  <tr key={capability.id}>
                    <td>{tr(capability.label, locale)}</td>
                    <td>
                      {capability.requires.join(" · ") ||
                        "authored stage content"}
                    </td>
                    <td>
                      {capability.preview === "native"
                        ? "Inspect canonical native handoff"
                        : capability.preview === "inspect"
                          ? "Inspect policy without a customer mutation"
                          : capability.preview === "source"
                            ? "Inspect real governed source"
                            : "Specialist stage interaction"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
      <details className={s.advanced}>
        <summary>
          <T
            v={[
              "Definition, access and delivery inspection",
              "Inspection de définition, accès et livraison",
              "فحص التعريف والوصول والتسليم",
            ]}
          />
        </summary>
        <p>
          {text(data.visibility) || "free"} · r{record.revision} · v
          {number(data.definitionVersion, 1)}
        </p>
        <p>
          <T
            v={[
              "Bookmark, sharing and completion remain independent. Staff preview makes no advertising or commercial requests.",
              "Marquage, partage et complétion restent indépendants. L’aperçu n’émet aucune requête publicitaire ou commerciale.",
              "تبقى الإشارة المرجعية والمشاركة والإكمال مستقلة. لا ترسل المعاينة طلبات إعلانية أو تجارية.",
            ]}
          />
        </p>
        <Badge>
          {data.downloadAllowed === true
            ? "download permitted"
            : "download disabled"}
        </Badge>{" "}
        <Badge>
          {data.printAllowed === true ? "print permitted" : "print disabled"}
        </Badge>
      </details>
    </div>
  );
}
