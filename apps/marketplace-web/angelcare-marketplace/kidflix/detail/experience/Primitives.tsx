"use client";
import { artwork } from "./artwork";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { path, tr, world, type Tri } from "../../catalogue";
import {
  asset,
  capabilityFacts,
  obj,
  readyOutputs,
  storyProfile,
  rows,
  str,
  time,
  type Row,
} from "../model";
import { Button, Editorial, Source, type PlayerProps } from "../shared";
import { local, t } from "../copy";
import {
  availableNodes,
  blankContinuity,
} from "../../../digital-customer-experience/continuity";
import { capability } from "../../journey/contract";
import s from "./experience.module.css";
export type ExperienceProps = PlayerProps & {
  children: ReactNode;
  files: ReactNode;
};
const verbs: Record<string, Tri> = {
  documents: [
    "Enter the reading room",
    "Entrer dans l’espace de lecture",
    "ادخل مساحة القراءة",
  ],
  printables: [
    "Open the print workbench",
    "Ouvrir l’atelier d’impression",
    "افتح ورشة الطباعة",
  ],
  stories: ["Enter the story", "Entrer dans le récit", "ادخل الحكاية"],
  learning: [
    "Continue the learning path",
    "Poursuivre le parcours",
    "واصل مسار التعلم",
  ],
  video: [
    "Open the screening room",
    "Ouvrir la salle de visionnage",
    "افتح مساحة المشاهدة",
  ],
  audio: [
    "Open the listening studio",
    "Ouvrir le studio d’écoute",
    "افتح استوديو الاستماع",
  ],
  "visual-cards": [
    "Explore the visual collection",
    "Explorer la collection visuelle",
    "استكشف المجموعة البصرية",
  ],
  presentations: [
    "Open the presentation desk",
    "Ouvrir l’espace de présentation",
    "افتح مساحة العرض",
  ],
  assessments: ["Open the assessment", "Ouvrir l’évaluation", "افتح التقييم"],
  activities: [
    "Enter the investigation lab",
    "Entrer au laboratoire",
    "ادخل المختبر",
  ],
  tools: [
    "Open the working model",
    "Ouvrir le modèle interactif",
    "افتح النموذج التفاعلي",
  ],
  planners: [
    "Open your planning desk",
    "Ouvrir votre espace de planification",
    "افتح مساحة التخطيط",
  ],
  forms: [
    "Open your private questionnaire",
    "Ouvrir votre questionnaire privé",
    "افتح استبيانك الخاص",
  ],
  community: [
    "Browse the knowledge archive",
    "Parcourir les archives de connaissances",
    "تصفح أرشيف المعرفة",
  ],
  commerce: [
    "Explore the resource and its extensions",
    "Explorer la ressource et ses prolongements",
    "استكشف المورد وامتداداته",
  ],
  bundles: [
    "Open the connected pathway",
    "Ouvrir le parcours connecté",
    "افتح المسار المترابط",
  ],
};
export function Art({
  family,
  role = "application",
  className = "",
  locale = "en",
}: {
  family: string;
  role?: string;
  className?: string;
  locale?: PlayerProps["locale"];
}) {
  const meta = artwork[(family + ":" + role) as keyof typeof artwork];
  return (
    <picture className={className}>
      <source
        media="(max-width:640px)"
        srcSet={`/kidflix/detail-r5/${family}/${role}-mobile.webp`}
      />
      <img
        src={`/kidflix/detail-r5/${family}/${role}.webp`}
        alt={meta?.alt[locale] || ""}
        loading={role === "context" ? "eager" : "lazy"}
        decoding="async"
        width={meta?.width || 1200}
        height={meta?.height || 800}
      />
    </picture>
  );
}
export function ExperienceOpening({
  p,
  titleId,
  saved,
  onSave,
}: {
  p: PlayerProps;
  titleId: string;
  saved: boolean;
  onSave: () => void;
}) {
  const { m, d, locale: l } = p,
    w = world(m.family)!,
    facts = capabilityFacts(m, l),
    files = readyOutputs(m),
    cover = asset(m, d.coverAssetId, "image/"),
    tags = [str(d.subject), ...str(d.skillTags).split(/\r?\n/)]
      .filter(Boolean)
      .slice(0, 9);
  return (
    <>
      <header className={`${s.opening} ${s["opening_" + m.family]}`}>
        <div className={s.openingCopy}>
          <span className={s.eyebrow}>KIDFLIX / {tr(w.title, l)}</span>
          <div className={s.badges}>
            <span>{t("free", l)}</span>
            {str(d.edition) ? <span>{d.edition}</span> : null}
            {str(d.level) ? <span>{d.level}</span> : null}
          </div>
          <h1 id={titleId}>{m.title}</h1>
          {local(d, "summary", l) ? (
            <p className={s.lead}>{local(d, "summary", l)}</p>
          ) : null}
          <div className={s.actions}>
            <a
              href={
                m.family === "printables" &&
                capability(m).printPack &&
                !p.preview
                  ? "#r5-print-workbench"
                  : "#kidflix-experience-player"
              }
              className={s.primary}
            >
              {m.family === "printables" &&
              (!capability(m).printPack || p.preview)
                ? tr(
                    [
                      "Inspect the published preview",
                      "Inspecter l’aperçu publié",
                      "افحص المعاينة المنشورة",
                    ],
                    l,
                  )
                : tr(verbs[m.family] || verbs.documents, l)}{" "}
              <span aria-hidden="true">↗</span>
            </a>
            <Button icon="Bookmark" aria-pressed={saved} onClick={onSave}>
              {t(saved ? "saved" : "save", l)}
            </Button>
            {files.length ? (
              <a href="#r5-published-files" className={s.secondary}>
                {t("files", l)} · {files.length}
              </a>
            ) : null}
          </div>
          <div className={s.factGrid}>
            {facts.map((f, i) => (
              <span key={i}>{f.label}</span>
            ))}
          </div>
          {tags.length ? (
            <nav
              className={s.tags}
              aria-label={tr(
                [
                  "Explore related subjects and skills",
                  "Explorer les sujets et compétences liés",
                  "استكشف الموضوعات والمهارات المرتبطة",
                ],
                l,
              )}
            >
              {tags.map((tag, i) => (
                <Link
                  key={i}
                  href={
                    path(l, "/explore/" + m.family) +
                    "?" +
                    (i === 0 && d.subject ? "subject" : "skill") +
                    "=" +
                    encodeURIComponent(tag)
                  }
                >
                  {tag} ↗
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
        <div className={s.openingArt}>
          <Art family={m.family} locale={l} role="context" />
          <span className={s.artMark}>
            {String(w.key === m.family ? worldNumber(m.family) : 1).padStart(
              2,
              "0",
            )}{" "}
            / KIDFLIX
          </span>
          {cover ? (
            <div className={s.actualCover}>
              <Source
                m={m}
                id={d.coverAssetId}
                alt={local(d, "alt", l) || m.title}
              />
              <small>
                {tr(
                  ["Published resource", "Ressource publiée", "المورد المنشور"],
                  l,
                )}
              </small>
            </div>
          ) : null}
          <Art
            family={m.family}
            locale={l}
            role="method"
            className={s.methodInset}
          />
        </div>
      </header>
      <nav
        className={s.sectionNav}
        aria-label={tr(
          ["Resource sections", "Sections de la ressource", "أقسام المورد"],
          l,
        )}
      >
        <a href="#kidflix-experience-player">
          01 / {tr(["Experience", "Expérience", "التجربة"], l)}
        </a>
        <a href="#r5-contents">
          02 / {tr(["Contents", "Contenu", "المحتويات"], l)}
        </a>
        {rows(d.detailSections).length ? (
          <a href="#r5-editorial-chapters">
            03 /{" "}
            {tr(["Deeper exploration", "Approfondissement", "استكشاف أعمق"], l)}
          </a>
        ) : null}
        {files.length ? (
          <a href="#r5-published-files">{t("files", l)} ↙</a>
        ) : null}
        <a href="#r5-next">
          {tr(
            ["Keep discovering", "Continuer à découvrir", "واصل الاكتشاف"],
            l,
          )}{" "}
          ↗
        </a>
      </nav>
    </>
  );
}
function worldNumber(key: string) {
  return (
    [
      "documents",
      "printables",
      "stories",
      "learning",
      "video",
      "audio",
      "visual-cards",
      "presentations",
      "assessments",
      "activities",
      "tools",
      "planners",
      "forms",
      "community",
      "commerce",
      "bundles",
    ].indexOf(key) + 1
  );
}
export function Stage({
  p,
  children,
  label,
}: {
  p: PlayerProps;
  children: ReactNode;
  label: Tri;
}) {
  return (
    <section className={s.stage} data-family={p.m.family}>
      <div className={s.stageBar}>
        <span className={s.eyebrow}>{tr(label, p.locale)}</span>
        <span>
          {tr(
            ["PUBLISHED EDITION", "ÉDITION PUBLIÉE", "الإصدار المنشور"],
            p.locale,
          )}{" "}
          {str(p.d.edition)}
        </span>
      </div>
      {children}
    </section>
  );
}
export function Brief({
  p,
  fields = ["learningObjectives", "materials", "caregiverGuidance"],
}: {
  p: PlayerProps;
  fields?: string[];
}) {
  const labels: Record<string, Tri> = {
    learningObjectives: [
      "Learning intentions",
      "Intentions pédagogiques",
      "أهداف التعلم",
    ],
    materials: [
      "Materials & preparation",
      "Matériel et préparation",
      "المواد والاستعداد",
    ],
    caregiverGuidance: [
      "Facilitation & inclusion",
      "Accompagnement et inclusion",
      "التيسير والشمول",
    ],
    instructions: [
      "How to use this resource",
      "Comment utiliser cette ressource",
      "كيفية استخدام المورد",
    ],
    methodology: [
      "Method & reasoning",
      "Méthode et raisonnement",
      "المنهج والاستدلال",
    ],
    assumptions: [
      "Assumptions & limits",
      "Hypothèses et limites",
      "الافتراضات والحدود",
    ],
    source: ["Sources & provenance", "Sources et provenance", "المصادر والأصل"],
  };
  const actual = fields.filter((k) => local(p.d, k, p.locale));
  return actual.length ? (
    <div className={s.briefGrid}>
      {actual.map((k, i) => (
        <article key={k}>
          <span className={s.cardNumber}>{String(i + 1).padStart(2, "0")}</span>
          <h3>{tr(labels[k] || labels.instructions, p.locale)}</h3>
          <p>{local(p.d, k, p.locale)}</p>
        </article>
      ))}
    </div>
  ) : null;
}
export function Preparation({ p }: { p: PlayerProps }) {
  const list = local(p.d, "materials", p.locale)
      .split(/\r?\n/)
      .map((v) => v.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean),
    selected: string[] = Array.isArray(p.state.preparationChecks)
      ? p.state.preparationChecks
      : [];
  if (!list.length) return null;
  return (
    <section className={s.preparation}>
      <div>
        <span className={s.eyebrow}>
          {tr(
            ["PREPARE YOUR SESSION", "PRÉPARER VOTRE SÉANCE", "جهز جلستك"],
            p.locale,
          )}
        </span>
        <h3>
          {tr(
            ["Ready to begin", "Prêt à commencer", "الاستعداد للبدء"],
            p.locale,
          )}
        </h3>
        <small>
          {tr(
            [
              "These checks organise preparation; they do not mark the resource complete.",
              "Ces cases organisent la préparation ; elles ne valident pas la ressource.",
              "تنظم هذه العلامات الاستعداد ولا تسجل إكمال المورد.",
            ],
            p.locale,
          )}
        </small>
      </div>
      <div>
        {list.map((text, i) => (
          <label key={i}>
            <input
              type="checkbox"
              checked={selected.includes(String(i))}
              onChange={(e) =>
                p.update({
                  preparationChecks: e.target.checked
                    ? [...selected, String(i)]
                    : selected.filter((id) => id !== String(i)),
                })
              }
            />
            <span>{text}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
const collectionFor: Record<string, string> = {
  documents: "units",
  printables: "units",
  stories: "units",
  learning: "units",
  video: "units",
  audio: "units",
  "visual-cards": "cards",
  presentations: "frames",
  assessments: "questions",
  activities: "tasks",
  tools: "inputs",
  planners: "items",
  forms: "fields",
  community: "rules",
  commerce: "offers",
  bundles: "steps",
};
export function Contents({
  p,
  title,
  compact = false,
}: {
  p: PlayerProps;
  title?: Tri;
  compact?: boolean;
}) {
  const { m, d, locale: l, state, update } = p,
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    key = d.engine === "bridge" ? "bridgeChallenges" : collectionFor[m.family],
    all = rows(d[key]).filter(
      (row) =>
        m.family !== "forms" || !["file", "email", "tel"].includes(row.type),
    ),
    filtered = all.filter(
      (row) =>
        (filter === "all" ||
          str(row.type || row.kind || row.module) === filter) &&
        (!query ||
          [
            local(row, "title", l),
            local(row, "label", l),
            local(row, "prompt", l),
            local(row, "text", l),
            local(row, "front", l),
          ]
            .join(" ")
            .toLocaleLowerCase(l)
            .includes(query.toLocaleLowerCase(l))),
    ),
    types = [
      ...new Set(
        all.map((r) => str(r.type || r.kind || r.module)).filter(Boolean),
      ),
    ],
    completed: string[] = Array.isArray(state.completed) ? state.completed : [],
    allowed = new Set(
      availableNodes(all, { ...blankContinuity(), completed }).map((r) => r.id),
    );
  function open(row: Row) {
    const index = all.findIndex((r) => r.id === row.id);
    if (
      m.family === "documents" ||
      m.family === "printables" ||
      m.family === "stories"
    )
      update({ index, readerUnitId: row.id });
    else if (m.family === "visual-cards")
      update({ index, studyIds: null, reviewOnly: false, cardOrder: [] });
    else if (m.family === "activities" && d.engine === "bridge")
      update({ bridgeChallengeId: row.id });
    else if (["video", "audio", "presentations", "learning"].includes(m.family))
      update({ index });
    else if (m.family === "forms" && p.engine === "multistep") {
      const steps = [...new Set(all.map((r) => Number(r.step) || 1))].sort(
        (a, b) => a - b,
      );
      update({ index: steps.indexOf(Number(row.step) || 1) });
    } else if (m.family === "assessments" && state.started) {
      const order = Array.isArray(state.questionOrder)
        ? state.questionOrder
        : all.map((r) => r.id);
      update({ index: order.indexOf(row.id) });
    }
    requestAnimationFrame(() => {
      const id =
          m.family === "assessments"
            ? "r5-question-" + row.id
            : "r5-item-" + m.family + "-" + row.id,
        target =
          document.getElementById(id) ||
          document.getElementById("kidflix-experience-player");
      if (target instanceof HTMLDetailsElement && !target.open)
        target.open = true;
      target?.scrollIntoView({ block: "center", behavior: "smooth" });
      const control = target?.querySelector<HTMLElement>(
        "input,select,textarea,summary",
      );
      control?.focus({ preventScroll: true });
    });
  }
  return (
    <section
      id="r5-contents"
      className={`${s.contents} ${compact ? s.compactContents : ""}`}
    >
      <div className={s.sectionHead}>
        <div>
          <span className={s.eyebrow}>
            {tr(
              [
                "INSIDE THIS RESOURCE",
                "DANS CETTE RESSOURCE",
                "داخل هذا المورد",
              ],
              l,
            )}
          </span>
          <h2>
            {tr(
              title || [
                "Explore the published contents",
                "Explorer les contenus publiés",
                "استكشف المحتويات المنشورة",
              ],
              l,
            )}
          </h2>
        </div>
        <span>
          {filtered.length} / {all.length}
        </span>
      </div>
      {all.length ? (
        <>
          <div className={s.contentsTools}>
            <label className={s.search}>
              <span>{t("search", l)}</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            {types.length > 1 ? (
              <select
                aria-label={tr(
                  ["Content type", "Type de contenu", "نوع المحتوى"],
                  l,
                )}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">
                  {tr(["All types", "Tous les types", "كل الأنواع"], l)}
                </option>
                {types.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            ) : null}
          </div>
          <div className={s.contentsGrid}>
            {filtered.map((row) => {
              const illustration = asset(m, row.assetId, "image/"),
                label =
                  local(row, "title", l) ||
                  local(row, "label", l) ||
                  local(row, "prompt", l) ||
                  str(obj(m.bindings.offers?.[row.nativeId]).title),
                gated =
                  ["learning", "bundles"].includes(m.family) &&
                  !allowed.has(row.id),
                child = obj(m.bindings.records?.[row.experienceId]);
              return (
                <article key={row.id} className={s.contentItem}>
                  {illustration ? (
                    <Source
                      m={m}
                      id={row.assetId}
                      alt={local(row, "alt", l) || label}
                    />
                  ) : (
                    <span className={s.contentIndex}>
                      {String(all.indexOf(row) + 1).padStart(2, "0")}
                    </span>
                  )}
                  <div>
                    <small>
                      {str(row.module || row.type || row.kind)}{" "}
                      {completed.includes(row.id) ? " ✓" : ""}
                    </small>
                    <h3>
                      {label ||
                        tr(
                          [
                            "Untitled published item",
                            "Élément publié sans titre",
                            "عنصر منشور بلا عنوان",
                          ],
                          l,
                        )}
                    </h3>
                    {local(row, "text", l) || local(row, "front", l) ? (
                      <p>
                        {(
                          local(row, "text", l) || local(row, "front", l)
                        ).slice(0, 220)}
                        {(local(row, "text", l) || local(row, "front", l))
                          .length > 220
                          ? "…"
                          : ""}
                      </p>
                    ) : null}
                    {Number(row.duration) > 0 ? (
                      <small>{time(Number(row.duration))}</small>
                    ) : null}
                    {m.family === "bundles" ? (
                      child.key && !gated ? (
                        <Link
                          className={s.textLink}
                          href={
                            path(l, "/experience/" + child.key) +
                            "?returnTo=" +
                            encodeURIComponent(path(l, "/experience/" + m.key))
                          }
                        >
                          {t("open", l)} ↗
                        </Link>
                      ) : (
                        <span>{t(gated ? "locked" : "unavailable", l)}</span>
                      )
                    ) : m.family === "commerce" ? null : m.family ===
                        "stories" &&
                      storyProfile(m).narration &&
                      d.narrationAssetId ? (
                      <a
                        href="#kidflix-experience-player"
                        className={s.textLink}
                      >
                        {tr(
                          [
                            "Open the full recording",
                            "Ouvrir l’enregistrement complet",
                            "افتح التسجيل الكامل",
                          ],
                          l,
                        )}{" "}
                        ↗
                      </a>
                    ) : (
                      <Button disabled={gated} onClick={() => open(row)}>
                        {gated
                          ? t("locked", l)
                          : tr(
                              [
                                "Locate in the experience",
                                "Repérer dans l’expérience",
                                "انتقل إليه في التجربة",
                              ],
                              l,
                            )}{" "}
                        ↗
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          {!filtered.length ? (
            <p role="status">
              {tr(
                [
                  "No contents match this search.",
                  "Aucun contenu ne correspond à cette recherche.",
                  "لا توجد محتويات تطابق البحث.",
                ],
                l,
              )}
            </p>
          ) : null}
        </>
      ) : (
        <p>
          {tr(
            [
              "The resource is presented in the main experience above.",
              "La ressource est présentée dans l’expérience principale ci-dessus.",
              "يُعرض المورد في التجربة الرئيسية أعلاه.",
            ],
            l,
          )}
        </p>
      )}
    </section>
  );
}
const purposeLabels: Record<string, Tri> = {
  overview: ["Overview", "Vue d’ensemble", "نظرة عامة"],
  method: ["Method", "Méthode", "المنهج"],
  preparation: ["Preparation", "Préparation", "الاستعداد"],
  application: ["Application", "Application", "التطبيق"],
  adaptation: ["Adaptation", "Adaptation", "التكييف"],
  discussion: ["Discussion", "Discussion", "النقاش"],
  extension: ["Further exploration", "Prolongement", "استكشاف إضافي"],
  provenance: ["Sources", "Sources", "المصادر"],
};
export function Chapters({ p }: { p: PlayerProps }) {
  const chapters = rows(p.d.detailSections);
  return chapters.length ? (
    <section id="r5-editorial-chapters" className={s.editorialChapters}>
      {chapters.map((chapter, i) => {
        const content = obj(p.m.bindings.records?.[chapter.contentId]),
          next = obj(p.m.bindings.records?.[chapter.experienceId]);
        return (
          <article key={chapter.id} data-purpose={chapter.kind}>
            <div className={s.chapterCopy}>
              <span className={s.eyebrow}>
                {String(i + 1).padStart(2, "0")} /{" "}
                {purposeLabels[chapter.kind]
                  ? tr(purposeLabels[chapter.kind], p.locale)
                  : ""}
              </span>
              <h2>{local(chapter, "title", p.locale)}</h2>
              <p>{local(chapter, "text", p.locale)}</p>
              {content.id ? (
                <Editorial
                  m={content}
                  data={obj(content.definition)}
                  locale={p.locale}
                />
              ) : null}
              {next.key ? (
                <Link
                  className={s.textLink}
                  href={path(p.locale, "/experience/" + next.key)}
                >
                  {next.title} ↗
                </Link>
              ) : null}
            </div>
            {asset(p.m, chapter.assetId, "image/") ? (
              <Source
                m={p.m}
                id={chapter.assetId}
                alt={
                  local(chapter, "alt", p.locale) ||
                  local(chapter, "title", p.locale)
                }
              />
            ) : null}
          </article>
        );
      })}
    </section>
  ) : null;
}
export function Application({
  p,
  title,
  children,
}: {
  p: PlayerProps;
  title: Tri;
  children?: ReactNode;
}) {
  return (
    <section className={s.application}>
      <Art family={p.m.family} locale={p.locale} />
      <div>
        <span className={s.eyebrow}>
          {tr(
            [
              "FROM DISCOVERY TO PRACTICE",
              "DE LA DÉCOUVERTE À LA PRATIQUE",
              "من الاكتشاف إلى التطبيق",
            ],
            p.locale,
          )}
        </span>
        <h2>{tr(title, p.locale)}</h2>
        {children || (
          <Brief p={p} fields={["learningObjectives", "caregiverGuidance"]} />
        )}
      </div>
    </section>
  );
}
export function PublishedFiles({
  p,
  children,
}: {
  p: PlayerProps;
  children: ReactNode;
}) {
  return readyOutputs(p.m).length ? (
    <div id="r5-published-files" className={s.publishedFiles}>
      {children}
    </div>
  ) : null;
}
export function NextDiscovery({ p }: { p: PlayerProps }) {
  const w = world(p.m.family)!;
  return (
    <section id="r5-next" className={s.nextDiscovery}>
      <div>
        <span className={s.eyebrow}>KIDFLIX / {tr(w.title, p.locale)}</span>
        <h2>
          {tr(
            [
              "Your next perspective starts here.",
              "Un autre regard commence ici.",
              "من هنا تبدأ رؤيتك التالية.",
            ],
            p.locale,
          )}
        </h2>
        <p>{tr(w.invitation, p.locale)}</p>
        <Link
          className={s.primary}
          href={path(p.locale, "/explore/" + p.m.family)}
        >
          {tr(
            [
              "Explore this collection",
              "Explorer cette collection",
              "استكشف هذه المجموعة",
            ],
            p.locale,
          )}{" "}
          ↗
        </Link>
      </div>
      <Art family={p.m.family} locale={p.locale} role="extension" />
    </section>
  );
}
