"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { path, tr, world } from "../../catalogue";
import { I } from "../../Icons";
import { asset, capabilityFacts, readingExtent, publishedOutputHref, readyOutputs, str, type Row } from "../model";
import { local, t } from "../copy";
import { Modal, type PlayerProps } from "../shared";
import { LoveButton, SocialToolbar } from "../Social";
import { emitVisitor } from "../../journey/events";
import { capability } from "../../journey/contract";
import { j } from "../../journey/copy";
const CategoryDesk = dynamic(() =>
  import("./CategoryDesk").then((m) => m.CategoryDesk),
);
import { profiles, workspaceEntries, workspaceTags, type Entry } from "./model";
import s from "./workspace.module.css";

type Props = {
  p: PlayerProps;
  titleId: string;
  saved: boolean;
  onSave: () => void;
  children: ReactNode;
  files: ReactNode;
  related?: ReactNode;
};
export function DetailWorkspace({
  p,
  titleId,
  saved,
  onSave,
  children,
  files,
  related,
}: Props) {
  const { m, d, locale: l } = p,
    profile = profiles[m.family] || profiles.documents,
    w = world(m.family)!,
    entries = workspaceEntries(p),
    outputs = readyOutputs(m),
    cover = asset(m, d.coverAssetId, "image/"),
    facts = capabilityFacts(m, l),
    extent = readingExtent(m),
    tags = workspaceTags(d);
  const [tab, setTab] = useState("player"),
    [query, setQuery] = useState(""),
    [share, setShare] = useState(false),
    [focus, setFocus] = useState(false),
    [notice, setNotice] = useState(""),
    [visitedTools, setVisitedTools] = useState(false);
  const tabId = useId(),
    stage = useRef<HTMLDivElement>(null),
    focusButton = useRef<HTMLButtonElement>(null),
    rail = useRef<HTMLElement>(null);
  const current = entries.findIndex((e) => e.current),
    position = Math.max(0, current),
    selectable = entries.some((e) => e.patch),
    matching = entries.filter(
      (e) =>
        !query ||
        [e.label, e.text]
          .join(" ")
          .toLocaleLowerCase(l)
          .includes(query.toLocaleLowerCase(l)),
    );
  const primary = tr(profile.primary, l),
    indexLabel = tr(profile.index, l),
    toolsLabel = tr(
      m.family === "tools" && !["interactive", "comparison"].includes(p.engine)
        ? ["Model & assumptions", "Modèle et hypothèses", "النموذج والافتراضات"]
        : m.family === "visual-cards" && d.sortingEnabled !== true
          ? ["Study guidance", "Repères d’étude", "إرشادات الدراسة"]
          : m.family === "printables" && !capability(m).printPack
            ? ["Preparation notes", "Repères de préparation", "ملاحظات التحضير"]
            : m.family === "commerce" && !entries.length
              ? ["Resource context", "Contexte de la ressource", "سياق المورد"]
              : profile.tools,
      l,
    ),
    privateResource = ["forms", "tools", "planners"].includes(m.family),
    classroomEnabled = capability(m).classroom === true,
    isComplete = p.state.complete === true,
    continuityAvailable = d.continuityPolicy !== "none",
    visibleTags = tags.slice(0, 9),
    keywordLinks = tags.slice(0, 14),
    sourceObjectives = [d.learningObjectives, d.objectives, d.goals, d.outcomes]
      .find((value) => Array.isArray(value)) as unknown[] | undefined,
    learningObjectives = (sourceObjectives || []).map((value) => {
      if (typeof value === "string") return value.trim();
      if (!value || typeof value !== "object") return "";
      const row = value as Row;
      return local(row, "text", l) || local(row, "title", l) || local(row, "label", l) || "";
    }).filter(Boolean).slice(0, 4),
    objectiveLabels = learningObjectives.length ? learningObjectives : (str(d.subject) ? [str(d.subject)] : []);
  const tabs = [
    { id: "player", icon: profile.icon, label: primary },
    ...(entries.length
      ? [{ id: "index", icon: "LayoutGrid", label: indexLabel }]
      : []),
    { id: "tools", icon: "SlidersHorizontal", label: toolsLabel },
  ];
  useEffect(() => {
    const r = rail.current,
      active = r?.querySelector<HTMLElement>("[aria-current]");
    if (!r || !active) return;
    const a = active.getBoundingClientRect(),
      b = r.getBoundingClientRect();
    if (r.scrollHeight > r.clientHeight)
      r.scrollBy({
        top:
          a.top < b.top
            ? a.top - b.top
            : a.bottom > b.bottom
              ? a.bottom - b.bottom
              : 0,
      });
    else
      r.scrollBy({
        left:
          a.left < b.left
            ? a.left - b.left
            : a.right > b.right
              ? a.right - b.right
              : 0,
      });
  }, [position]);
  useEffect(() => {
    if (!focus) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const node = stage.current;
    node?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setFocus(false);
        focusButton.current?.focus();
      }
      if (e.key === "Tab" && node) {
        const all = [
          ...node.querySelectorAll<HTMLElement>(
            'a[href],button:not(:disabled),input,select,textarea,[tabindex="0"]',
          ),
        ].filter((n) => n.getClientRects().length);
        const first = all[0],
          last = all.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", key);
    };
  }, [focus]);
  function openPlayer() {
    setTab("player");
    requestAnimationFrame(() =>
      document
        .getElementById("kidflix-experience-player")
        ?.scrollIntoView({ block: "nearest" }),
    );
  }
  function changeTab(next: string) {
    if (next === "tools") setVisitedTools(true);
    setTab(next);
  }
  function select(e: Entry) {
    if (e.locked) return;
    if (e.patch) p.update(e.patch);
    setTab("player");
    if (e.anchor)
      requestAnimationFrame(() => {
        const target = document.getElementById(e.anchor!),
          control =
            target?.querySelector<HTMLElement>(
              "input,button,summary,a,textarea,select",
            ) || target;
        control?.focus();
        target?.scrollIntoView({ block: "nearest" });
      });
  }
  function keys(e: React.KeyboardEvent, active: number) {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? tabs.length - 1
          : (active +
              (e.key === "ArrowRight" ? 1 : -1) * (l === "ar" ? -1 : 1) +
              tabs.length) %
            tabs.length;
    changeTab(tabs[next].id);
    document.getElementById(tabId + "-" + tabs[next].id)?.focus();
  }
  const pdf = outputs.find((o) => o.mime === "application/pdf"),
    printImage =
      entries[position]?.image || entries.find((e) => e.image)?.image || "",
    printable = d.printAllowed === true && (!!pdf || !!printImage);
  const fieldRows = [
    {
      icon: "Users",
      label: tr(["Age range", "Tranche d’âge", "الفئة العمرية"], l),
      value:
        d.ageMin != null && d.ageMax != null ? `${d.ageMin}–${d.ageMax}` : "",
    },
    {
      icon: "Languages",
      label: tr(["Language", "Langue", "اللغة"], l),
      value: l === "fr" ? "Français" : l === "ar" ? "العربية" : "English",
    },
    {
      icon: "Layers",
      label: tr(extent?.label || profile.noun, l),
      value: extent ? String(extent.count) : entries.length ? String(entries.length) : "",
    },
    {
      icon: "FileText",
      label: tr(["Format", "Format", "الصيغة"], l),
      value: [
        ...new Set(
          outputs.map((o) => (o.mime === "application/pdf" ? "PDF" : "PNG")),
        ),
      ].join(" · "),
    },
    {
      icon: "Clock",
      label: tr(["Duration", "Durée", "المدة"], l),
      value:
        Number(d.estimatedMinutes) > 0
          ? `${d.estimatedMinutes} ${l === "ar" ? "د" : "min"}`
          : "",
    },
    {
      icon: profile.icon,
      label: tr(["Category", "Catégorie", "الفئة"], l),
      value: tr(w.title, l),
    },
    {
      icon: "Target",
      label: tr(["Learning focus", "Objectif", "هدف التعلم"], l),
      value: str(d.subject),
    },
    {
      icon: "ShieldCheck",
      label: tr(["Rights holder", "Titulaire des droits", "صاحب الحقوق"], l),
      value: str(d.rightsHolder),
    },
    {
      icon: "Info",
      label: tr(["Edition", "Édition", "الإصدار"], l),
      value: str(d.edition),
    },
  ].filter((r) => r.value);
  const tile = (e: Entry, i: number, grid = false) => (
    <button
      type="button"
      key={e.id}
      className={grid ? s.indexCard : s.thumbnail}
      aria-current={e.current ? "step" : undefined}
      disabled={e.locked || (!e.patch && !e.anchor)}
      onClick={() => select(e)}
      title={e.label}
    >
      <span className={s.thumbArt}>
        {e.image ? (
          <img src={e.image} alt="" loading={i < 6 ? "eager" : "lazy"} />
        ) : (
          <I
            name={e.locked ? "LockKeyhole" : profile.icon}
            size={grid ? 36 : 26}
          />
        )}
        <small>{String(entries.indexOf(e) + 1).padStart(2, "0")}</small>
      </span>
      <strong>{e.label}</strong>
      {grid && e.text ? <span>{e.text}</span> : null}
      {e.locked ? <span className={s.lockLabel}>{t("locked", l)}</span> : null}
    </button>
  );
  return (
    <div
      className={s.workspace}
      data-detail-workspace={m.family}
      style={
        {
          "--work-accent": profile.accent,
          "--work-glow": profile.glow,
        } as CSSProperties
      }
    >
      <div className={s.mainColumn}>
        <header className={s.identity}>
          <div className={s.cover} data-vm-resource-cover>
            {cover ? (
              <img
                src={cover.url}
                alt={cover.alt || m.title}
                fetchPriority="high"
              />
            ) : (
              <I name={profile.icon} size={46} />
            )}
          </div>
          <div className={s.identityCopy}>
            <div className={s.visualMaxEyebrow}>
              <I name="Sparkles" size={16} />
              {tr(["A discovery worth exploring", "Une découverte à explorer", "اكتشاف يستحق الاستكشاف"], l)}
              {m.releaseId ? (
                <span className={s.publishedMarker}>
                  <I name="CircleCheck" size={13} />
                  {tr(["Published", "Publié", "منشور"], l)}
                </span>
              ) : null}
            </div>
            <div className={s.badges}>
              <span className={s.categoryBadge}>{tr(w.title, l)}</span>
              {outputs.length ? (
                <span className={s.availability}>
                  {t("download", l)} · {outputs.length}
                </span>
              ) : null}
              {d.ageMin != null && d.ageMax != null ? (
                <span className={s.ageBadge}>
                  {d.ageMin}–{d.ageMax}
                </span>
              ) : null}
              <span className={s.languageBadge}>
                <I name="Languages" size={13} />
                {l === "fr" ? "Français" : l === "ar" ? "العربية" : "English"}
              </span>
              {str(d.edition) ? (
                <span className={s.vmEditionBadge}>
                  <I name="ShieldCheck" size={13} /> {str(d.edition)}
                </span>
              ) : null}
              {outputs.some((o) => o.mime === "application/pdf") ? (
                <span className={s.visualMaxPdfBadge}>
                  <I name="FileText" size={13} /> PDF
                </span>
              ) : null}
              {Number(d.estimatedMinutes) > 0 ? (
                <span className={s.visualMaxTimeBadge}>
                  <I name="Clock" size={13} /> {Number(d.estimatedMinutes)} min
                </span>
              ) : null}
              {privateResource ? (
                <span className={s.privateBadge}>
                  <I name="LockKeyhole" size={12} />
                  {t("private", l)}
                </span>
              ) : null}
            </div>
            <h1 id={titleId}>{m.title}</h1>
            {local(d, "summary", l) ? (
              <p className={s.lead}>{local(d, "summary", l)}</p>
            ) : null}
            {str(d.subject) ? (
              <div className={s.visualMaxSubject}>
                <I name="Target" size={16} />
                <span>{str(d.subject)}</span>
              </div>
            ) : null}
            <div className={s.facts}>
              {facts.slice(0, 8).map((f, i) => (
                <span key={i}>
                  <I name={f.icon} size={16} />
                  {f.label}
                </span>
              ))}
              {str(d.level) ? (
                <span>
                  <I name="Target" size={16} />
                  {d.level}
                </span>
              ) : null}
            </div>
          </div>
        </header>
        <nav className={s.visualMaxJumpBar} aria-label={tr(["Resource shortcuts", "Accès rapides", "اختصارات المورد"], l)}>
          <button type="button" aria-current={tab === "player" ? "page" : undefined} onClick={() => changeTab("player")}>
            <I name={profile.icon} size={17} /> {primary}
          </button>
          {entries.length ? <button type="button" aria-current={tab === "index" ? "page" : undefined} onClick={() => changeTab("index")}>
            <I name="LayoutGrid" size={17} /> {indexLabel}
          </button> : null}
          <button type="button" aria-current={tab === "tools" ? "page" : undefined} onClick={() => changeTab("tools")}>
            <I name="Sparkles" size={17} /> {toolsLabel}
          </button>
          <Link href={path(l, "/explore/" + m.family)}>
            <I name="Layers" size={17} /> {tr(["Explore similar resources", "Ressources associées", "موارد مرتبطة"], l)}
          </Link>
          <Link href={path(l, "/my")}>
            <I name="Bookmark" size={17} /> {tr(["My library", "Ma bibliothèque", "مكتبتي"], l)}
          </Link>
        </nav>
        <div
          className={`${s.viewerRow} ${entries.length > 1 ? s.withRail : ""}`}
        >
          {entries.length > 1 ? (
            <aside
              className={s.thumbnailRail}
              ref={rail}
              aria-label={indexLabel}
            >
              {entries.map((e, i) => tile(e, i))}
            </aside>
          ) : null}
          <div
            className={`${s.stage} ${focus ? s.focus : ""}`}
            ref={stage}
            tabIndex={-1}
            role={focus ? "dialog" : undefined}
            aria-modal={focus || undefined}
            aria-label={focus ? m.title : undefined}
            data-shape={profile.shape}
          >
            <div className={s.visualMaxPlayerBrand}>
              <span><I name="BookOpen" size={16} /> {tr(["Learning space", "Espace de découverte", "مساحة التعلم"], l)}</span>
              <small>
                {entries.length > 1
                  ? `${position + 1} / ${entries.length} · ${tr(["sections", "étapes", "خطوات"], l)}`
                  : tr(["Interactive resource viewer", "Lecteur de la ressource", "عارض المورد"], l)}
              </small>
            </div>
            <div className={s.modeRow}>
              <div
                className={s.tabs}
                role="tablist"
                aria-label={tr(
                  ["Resource views", "Vues de la ressource", "طرق عرض المورد"],
                  l,
                )}
              >
                {tabs.map((v, i) => (
                  <button
                    type="button"
                    key={v.id}
                    role="tab"
                    id={tabId + "-" + v.id}
                    aria-controls={tabId + "-panel-" + v.id}
                    aria-selected={tab === v.id}
                    tabIndex={tab === v.id ? 0 : -1}
                    onClick={() => changeTab(v.id)}
                    onKeyDown={(e) => keys(e, i)}
                  >
                    <I name={v.icon} size={17} />
                    <span>{v.label}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={s.focusButton}
                ref={focusButton}
                onClick={() => setFocus((v) => !v)}
                aria-label={tr(
                  focus
                    ? [
                        "Exit focus",
                        "Quitter le plein écran",
                        "إغلاق العرض الكامل",
                      ]
                    : [
                        "Focus / fullscreen",
                        "Concentration / plein écran",
                        "تركيز / ملء الشاشة",
                      ],
                  l,
                )}
              >
                <I name={focus ? "Minimize" : "Maximize"} size={20} />
              </button>
            </div>
            <div
              id={tabId + "-panel-player"}
              role="tabpanel"
              aria-labelledby={tabId + "-player"}
              hidden={tab !== "player"}
              className={s.canvas}
              data-workspace-canvas
            >
              {children}
            </div>
            {entries.length ? (
              <div
                id={tabId + "-panel-index"}
                role="tabpanel"
                aria-labelledby={tabId + "-index"}
                hidden={tab !== "index"}
                className={s.indexPanel}
              >
                <div className={s.indexHeading}>
                  <h2>{indexLabel}</h2>
                  <label className={s.search}>
                    <I name="Search" size={17} />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t("search", l)}
                      aria-label={t("search", l)}
                    />
                  </label>
                </div>
                <p className={s.indexCount} role="status">
                  {matching.length} / {entries.length} {tr(profile.noun, l)}
                </p>
                <div className={s.indexGrid}>
                  {matching.map((e, i) => tile(e, i, true))}
                </div>
                {!matching.length ? (
                  <p role="status">
                    {tr(
                      [
                        "No matching content. Try another search.",
                        "Aucun contenu correspondant. Essayez une autre recherche.",
                        "لا يوجد محتوى مطابق. جرّب بحثاً آخر.",
                      ],
                      l,
                    )}
                  </p>
                ) : null}
              </div>
            ) : null}
            <div
              id={tabId + "-panel-tools"}
              role="tabpanel"
              aria-labelledby={tabId + "-tools"}
              hidden={tab !== "tools"}
              className={s.toolsPanel}
            >
              <h2>{toolsLabel}</h2>
              {visitedTools ? <CategoryDesk p={{ ...p, openPlayer }} /> : null}
            </div>
            {selectable && entries.length > 1 ? (
              <div className={s.position} data-workspace-position>
                <button
                  type="button"
                  aria-label={t("previous", l)}
                  disabled={position <= 0 || !entries[position - 1]?.patch}
                  onClick={() => select(entries[position - 1])}
                >
                  <I
                    name={l === "ar" ? "ChevronRight" : "ChevronLeft"}
                    size={20}
                  />
                </button>
                <input
                  type="range"
                  min={0}
                  max={entries.length - 1}
                  value={position}
                  aria-label={tr(
                    [
                      "Resource position",
                      "Position dans la ressource",
                      "الموضع في المورد",
                    ],
                    l,
                  )}
                  onChange={(e) => {
                    const next = entries[Number(e.target.value)];
                    if (next?.patch) select(next);
                  }}
                />
                <output aria-live="polite">
                  {position + 1} / {entries.length}
                </output>
                <button
                  type="button"
                  aria-label={t("next", l)}
                  disabled={
                    position >= entries.length - 1 ||
                    !entries[position + 1]?.patch
                  }
                  onClick={() => select(entries[position + 1])}
                >
                  <I
                    name={l === "ar" ? "ChevronLeft" : "ChevronRight"}
                    size={20}
                  />
                </button>
              </div>
            ) : null}
          </div>
        </div>
        {(str(d.subject) || visibleTags.length > 0) ? (
          <section className={s.visualMaxLearningStrip}>
            <h2>
              <I name="Target" size={20} />
              {tr(["What you'll explore", "Ce que vous allez explorer", "ما ستستكشفه"], l)}
            </h2>
            <div>
              {[str(d.subject), ...visibleTags]
                .filter(Boolean)
                .filter((x, i, arr) => arr.indexOf(x) === i)
                .slice(0, 6)
                .map((value, i) => (
                  <Link
                    key={value}
                    href={path(l, "/explore?q=" + encodeURIComponent(value))}
                    className={s.visualMaxOutcome}
                  >
                    <I name={i % 2 === 0 ? "CircleCheck" : "Sparkles"} size={14} />
                    {value}
                  </Link>
                ))}
            </div>
          </section>
        ) : null}
        {related ? <div className={s.vmRelated} id="kidflix-related">{related}</div> : null}
      </div>
      <aside
        className={s.sideColumn}
        aria-label={tr(
          [
            "Resource actions and details",
            "Actions et détails de la ressource",
            "إجراءات المورد وتفاصيله",
          ],
          l,
        )}
      >
        <section className={s.acquisition} id="r5-published-files" data-vm-format-count={outputs.length} data-vm-first-format={outputs[0]?.mime === "application/pdf" ? "pdf" : "other"}>
          <header>
            <h2>
              {tr(
                ["Get this resource", "Votre ressource", "احصل على المورد"],
                l,
              )}
            </h2>
            {outputs.length ? (
              <span className={s.available}>
                <I name="CircleCheck" size={14} />
                {tr(["Files ready", "Fichiers disponibles", "ملفات جاهزة"], l)}
              </span>
            ) : null}
          </header>
          <p>
            {tr(
              outputs.length
                ? [
                    "Use the published files at home or in your educational setting.",
                    "Utilisez les fichiers publiés à la maison ou dans votre cadre éducatif.",
                    "استخدم الملفات المنشورة في المنزل أو في بيئتك التعليمية.",
                  ]
                : [
                    "Explore the published experience and keep it in your personal library.",
                    "Explorez l’expérience publiée et retrouvez-la dans votre bibliothèque.",
                    "استكشف التجربة المنشورة واحتفظ بها في مكتبتك.",
                  ],
              l,
            )}
          </p>
          {outputs.length ? (
            <div
              className={`${s.formats} ${outputs.length === 1 ? s.singleFormat : ""}`}
            >
              {outputs.slice(0, 2).map((o) => (
                <article
                  key={o.id}
                  className={
                    o.mime === "application/pdf" ? s.pdf : s.imageFormat
                  }
                >
                  <span className={s.formatIcon}>
                    <I
                      name={o.mime === "application/pdf" ? "FileText" : "Image"}
                      size={34}
                    />
                    <small>
                      {o.mime === "application/pdf" ? "PDF" : "PNG"}
                    </small>
                  </span>
                  <h3>{local(o, "label", l) || o.label}</h3>
                  <p>
                    {[
                      t(
                        o.scope === "page"
                          ? "page"
                          : o.scope === "set"
                            ? "set"
                            : "whole",
                        l,
                      ),
                      o.paper,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <a
                    href={publishedOutputHref(m, o, l, !!p.preview)}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      !p.preview && emitVisitor(m.key, l, m.releaseId, "download_intent")
                    }
                  >
                    <I name="Download" size={17} />
                    {t("download", l)}{" "}
                    {o.mime === "application/pdf" ? "PDF" : "PNG"}
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <a
              href="#kidflix-experience-player"
              className={s.openResource}
              onClick={() => setTab("player")}
            >
              <I name={profile.icon} size={22} />
              {primary}
              <I name="ArrowUpRight" size={18} />
            </a>
          )}
          {outputs.length > 2 ? (
            <details className={s.moreFiles}>
              <summary>
                {tr(
                  [
                    "All published files",
                    "Tous les fichiers publiés",
                    "جميع الملفات المنشورة",
                  ],
                  l,
                )}{" "}
                · {outputs.length}
              </summary>
              {files}
            </details>
          ) : null}
          {classroomEnabled ? (
            <button
              type="button"
              className={s.visualMaxClassMode}
              onClick={() => {
                // Keep the native Class Mode authority in ResourceSurface.
                // The known-good R2 does not have the optional data attribute.
                // Resolve its real localized action label instead of requiring
                // a mutation to journey/Tools.tsx.
                const expectedLabel = j("classroom", l).trim();
                const buttons = Array.from(
                  stage.current?.querySelectorAll<HTMLButtonElement>("button") ?? []
                );
                const classroom = buttons.find((button) =>
                  button.hasAttribute("data-kidflix-open-class-mode") ||
                  button.textContent?.trim() === expectedLabel
                );
                if (classroom) {
                  setTab("player");
                  classroom.click();
                } else {
                  // Never fake the Class Mode action. Expose the native toolbar.
                  setTab("player");
                  const toggle = stage.current?.querySelector<HTMLButtonElement>(
                    "[data-workspace-session-toggle]"
                  );
                  if (toggle?.getAttribute("aria-expanded") === "false") {
                    toggle.click();
                  }
                  setNotice(tr(
                    ["Use the Class Mode control in the opened reader toolbar.",
                    "Utilisez le bouton Mode classe dans la barre du lecteur.",
                    "استخدم زر وضع الفصل في شريط أدوات القارئ."], l
                  ));
                }
              }}
            >
              <I name="Presentation" size={22} />
              <strong>{tr(["Class Mode", "Mode Classe", "وضع الفصل"], l)}</strong>
              {Number(d.estimatedMinutes) > 0 ? <span>{Number(d.estimatedMinutes)} min</span> : null}
              <I name="ArrowRight" size={19} />
            </button>
          ) : null}
          <div className={s.quickActions}>
            <LoveButton locale={l} />
            {printable ? (
              pdf ? (
                <a
                  href={pdf.asset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={tr(
                    [
                      "Open PDF, then use your browser’s Print command",
                      "Ouvrez le PDF, puis utilisez la commande Imprimer du navigateur",
                      "افتح PDF ثم استخدم أمر الطباعة في المتصفح",
                    ],
                    l,
                  )}
                >
                  <I name="Printer" size={20} />
                  {tr(["Print PDF", "Imprimer le PDF", "طباعة PDF"], l)}
                </a>
              ) : (
                <a
                  href={printImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={tr(
                    [
                      "Open the preview, then use your browser’s Print command",
                      "Ouvrez l’aperçu, puis utilisez la commande Imprimer du navigateur",
                      "افتح المعاينة ثم استخدم أمر الطباعة في المتصفح",
                    ],
                    l,
                  )}
                >
                  <I name="Printer" size={20} />
                  {tr(
                    ["Print preview", "Imprimer l’aperçu", "طباعة المعاينة"],
                    l,
                  )}
                </a>
              )
            ) : null}
            <button type="button" onClick={() => setShare(true)}>
              <I name="Share2" size={20} />
              {tr(["Share", "Partager", "مشاركة"], l)}
            </button>
            <button
              type="button"
              onClick={() => {
                onSave();
                setNotice(
                  saved
                    ? tr(
                        [
                          "Removed from saved resources",
                          "Retiré des ressources enregistrées",
                          "تمت الإزالة من الموارد المحفوظة",
                        ],
                        l,
                      )
                    : t("saved", l),
                );
              }}
              aria-pressed={saved}
            >
              <I name={saved ? "BookmarkCheck" : "Bookmark"} size={20} />
              {t(saved ? "saved" : "save", l)}
            </button>
          </div>
          <p className={s.actionStatus} role="status">
            {notice}
          </p>
        </section>
        <section className={s.visualMaxProgress} aria-label={tr(["Reading progress", "Progression", "التقدم"], l)}>
          <div
            className={s.visualMaxProgressRing}
            style={{ "--visual-progress": `${continuityAvailable && isComplete ? 100 : 0}%` } as CSSProperties}
          >
            <span>{continuityAvailable ? (isComplete ? "100%" : "0%") : "—"}</span>
          </div>
          <div className={s.visualMaxProgressBody}>
            <h2>{tr(["Your progress", "Votre progression", "تقدمك"], l)}</h2>
            <p>
              {!continuityAvailable
                ? tr(["Progress is not saved for this resource.", "La progression n’est pas enregistrée pour cette ressource.", "لا يتم حفظ التقدم في هذا المورد."], l)
                : isComplete
                  ? tr(["You've completed this experience.", "Vous avez terminé cette découverte.", "لقد أكملت هذه التجربة."], l)
                  : tr(["Continue this learning experience at your pace.", "Poursuivez votre découverte à votre rythme.", "تابع تجربتك التعليمية وفق وتيرتك."], l)}
            </p>
            <progress value={continuityAvailable && isComplete ? 100 : 0} max={100} aria-label={tr(["Progress", "Progression", "التقدم"], l)} />
          </div>
        </section>
        <section className={s.metadata}>
          <h2>
            {tr(
              ["Resource details", "Détails de la ressource", "تفاصيل المورد"],
              l,
            )}
          </h2>
          <dl>
            {fieldRows.map((r) => (
              <div key={r.label}>
                <dt>
                  <I name={r.icon} size={16} />
                  {r.label}
                </dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
        </section>
        {keywordLinks.length > 0 ? (
          <section className={s.visualMaxKeywords}>
            <h2>
              <I name="Layers" size={21} />
              {tr(["Keywords (tags)", "Mots-clés (tags)", "الكلمات المفتاحية"], l)}
            </h2>
            <div className={s.visualMaxKeywordList}>
              {keywordLinks.map((tag) => (
                <Link
                  key={tag}
                  href={path(l, "/explore?q=" + encodeURIComponent(tag))}
                >
                  {tag}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
        {objectiveLabels.length > 0 ? (
          <section className={s.vmObjectives}>
            <h2><I name="Target" size={24} /> {tr(["Learning objectives", "Objectifs d’apprentissage", "أهداف التعلم"], l)}</h2>
            <ul>
              {objectiveLabels.map((objective, i) => (
                <li key={i}><I name="CircleCheck" size={16} /><span>{objective}</span></li>
              ))}
            </ul>
          </section>
        ) : null}
        <section className={s.personalNote}>
          <I
            name={privateResource ? "LockKeyhole" : "BookmarkCheck"}
            size={24}
          />
          <div>
            <strong>
              {tr(
                privateResource
                  ? [
                      "Your personal workspace",
                      "Votre espace personnel",
                      "مساحتك الشخصية",
                    ]
                  : [
                      "Keep your discoveries together",
                      "Rassemblez vos découvertes",
                      "اجمع اكتشافاتك",
                    ],
                l,
              )}
            </strong>
            <p>
              {tr(
                d.continuityPolicy === "none"
                  ? [
                      "Progress is not stored for this edition.",
                      "La progression n’est pas conservée pour cette édition.",
                      "لا يُحفظ التقدم لهذا الإصدار.",
                    ]
                  : [
                      "Your place follows this edition’s continuity settings.",
                      "Votre position suit les réglages de continuité de cette édition.",
                      "يتبع موضعك إعدادات الاستمرارية لهذا الإصدار.",
                    ],
                l,
              )}
            </p>
            <Link href={path(l, "/my")}>
              {tr(
                ["Open my library", "Ouvrir ma bibliothèque", "افتح مكتبتي"],
                l,
              )}{" "}
              →
            </Link>
          </div>
        </section>
        <button
          type="button"
          className={s.visualMaxGuide}
          onClick={() => {
            changeTab("tools");
            requestAnimationFrame(() => stage.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
          }}
        >
          <I name="Sparkles" size={25} />
          <span>
            <strong>{tr(["How to use it?", "Comment l’utiliser ?", "كيف تستخدمه؟"], l)}</strong>
            <small>{tr(["Discover existing tips, activities and category tools.", "Retrouvez les conseils, activités et outils disponibles.", "اكتشف الإرشادات والأنشطة والأدوات المتاحة."], l)}</small>
          </span>
          <I name={l === "ar" ? "ChevronLeft" : "ChevronRight"} size={20} />
        </button>
      </aside>
      {share ? (
        <Modal
          title={tr(
            [
              "Share this resource",
              "Partager cette ressource",
              "مشاركة المورد",
            ],
            l,
          )}
          locale={l}
          onClose={() => setShare(false)}
        >
          {p.preview ? <p role="status">{tr(["Sharing preview · no public activity is recorded", "Aperçu du partage · aucune activité publique enregistrée", "معاينة المشاركة · لا يُسجّل نشاط عام"], l)}</p> : <SocialToolbar resourceKey={m.key} title={m.title} locale={l} />}
        </Modal>
      ) : null}
    </div>
  );
}
