"use client";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import {
  WORLDS,
  INTENTS,
  world,
  path,
  tr,
  emptyCatalogue,
  type Locale,
  type Catalogue,
  type Tri,
} from "../catalogue";
import { ReferenceCard } from "../ReferenceCards";
import { CategoryMark } from "./WorldHeader";
import {
  discoveryFilters,
  discoveryHref,
  readCatalogue,
  type DiscoveryFilters,
} from "./model";
import s from "./discovery.module.css";
const extraIntents = [
  ["create", ["Create", "Créer", "ابتكر"]],
  [
    "grownups",
    ["Professional practice", "Pratique professionnelle", "الممارسة المهنية"],
  ],
] as const;
const audienceLabels = [
  ["child", ["Children", "Enfants", "الأطفال"]],
  ["parent", ["Parents", "Parents", "الآباء"]],
  ["educator", ["Educators", "Éducateurs", "المربّون"]],
  ["professional", ["Professionals", "Professionnels", "المتخصصون"]],
  ["school", ["Schools", "Écoles", "المدارس"]],
] as const;
function usePublishedCatalogue(
  locale: Locale,
  values: DiscoveryFilters,
  initial: Catalogue,
) {
  const key = locale + ":" + JSON.stringify(values),
    [result, setResult] = useState({
      key,
      data: initial,
      error: !!initial.error,
    }),
    [loading, setLoading] = useState(false),
    [revision, retry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let timedOut = false;
    setLoading(true);
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
      setResult({ key, data: emptyCatalogue, error: true });
      setLoading(false);
    }, 30000);
    fetch(
      "/api/kidflix/discovery?" + new URLSearchParams({ locale, ...values }),
      { signal: controller.signal, cache: "no-store" },
    )
      .then(async (response) => {
        if (!response.ok) throw Error("DISCOVERY_UNAVAILABLE");
        return readCatalogue(await response.json());
      })
      .then((data) => {
        if (!controller.signal.aborted) setResult({ key, data, error: false });
      })
      .catch(() => {
        if (!controller.signal.aborted || timedOut)
          setResult({ key, data: emptyCatalogue, error: true });
      })
      .finally(() => {
        clearTimeout(timer);
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [key, locale, revision]);
  const matches = result.key === key;
  return {
    data: matches ? result.data : emptyCatalogue,
    error: matches && result.error,
    busy: loading || !matches,
    retry: () => retry((n) => n + 1),
  };
}
export function WorldReadFailure({
  locale,
  onRetry,
}: {
  locale: Locale;
  onRetry?: () => void;
}) {
  return (
    <div className={s.failure} role="alert">
      <RotateCcw size={25} />
      <div>
        <h2>
          {tr(
            [
              "Resources could not be refreshed",
              "Impossible d’actualiser les ressources",
              "تعذر تحديث الموارد",
            ],
            locale,
          )}
        </h2>
        <p>
          {tr(
            [
              "Your filters are kept. Please try again.",
              "Vos filtres sont conservés. Réessayez.",
              "احتفظنا بمرشحاتك. حاول مجدداً.",
            ],
            locale,
          )}
        </p>
      </div>
      <button type="button" onClick={onRetry || (() => location.reload())}>
        {tr(["Try again", "Réessayer", "حاول مجدداً"], locale)}
      </button>
    </div>
  );
}
export function Explorer({
  locale,
  family,
  initial,
  initialFilters = {},
}: {
  locale: Locale;
  family?: string;
  initial: Catalogue;
  initialFilters?: Record<string, string>;
}) {
  const pathname = usePathname(),
    search = useSearchParams(),
    router = useRouter(),
    signature = search.toString();
  const values = useMemo(
    () =>
      discoveryFilters(
        Object.fromEntries(new URLSearchParams(signature)),
        family,
      ),
    [signature, family],
  );
  const [query, setQuery] = useState(values.q || ""),
    [expanded, setExpanded] = useState(true),
    [view, setView] = useState<"grid" | "list">("grid");
  const catalogue = usePublishedCatalogue(locale, values, initial),
    w = world(values.family || ""),
    t = (v: Tri) => tr(v, locale);
  // The actual URL is authoritative, including same-component navigation and browser Back/Forward.
  useEffect(() => {
    setQuery(values.q || "");
  }, [signature, pathname, locale]);
  useEffect(() => {
    if (query.trim() === (values.q || "")) return;
    const timer = setTimeout(
      () =>
        router.replace(
          discoveryHref(
            locale,
            { ...values, q: query.trim(), page: "1" },
            family,
          ),
          { scroll: false },
        ),
      350,
    );
    return () => clearTimeout(timer);
  }, [query, signature, pathname, locale, family, router]);
  function update(key: string, value: string) {
    router.push(
      discoveryHref(
        locale,
        { ...values, q: query.trim(), [key]: value, page: "1" },
        family,
      ),
      { scroll: false },
    );
  }
  function clear() {
    setQuery("");
    router.push(
      discoveryHref(
        locale,
        { ...(family ? { family } : {}), page: "1" },
        family,
      ),
      { scroll: false },
    );
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    router.push(
      discoveryHref(locale, { ...values, q: query.trim(), page: "1" }, family),
      { scroll: false },
    );
  }
  const labels: Record<string, string> = {
    q: t(["Search", "Recherche", "بحث"]),
    family: t(["Category", "Catégorie", "الفئة"]),
    intent: t(["Purpose", "Objectif", "الهدف"]),
    subject: t(["Subject", "Matière", "الموضوع"]),
    skill: t(["Learning skill", "Compétence", "المهارة"]),
    age: t(["Age", "Âge", "العمر"]),
    format: t(["Format", "Format", "الصيغة"]),
    audience: t(["For", "Pour", "لـ"]),
    duration: t(["Duration", "Durée", "المدة"]),
    difficulty: t(["Level", "Niveau", "المستوى"]),
    keys: t([
      "Selected resources",
      "Ressources sélectionnées",
      "الموارد المحددة",
    ]),
    notFamily: t(["Excluded category", "Catégorie exclue", "الفئة المستبعدة"]),
  };
  const intentChoices = [
    ...INTENTS.map(([key, , label]) => [key, tr(label, locale)]),
    ...extraIntents.map(([key, label]) => [key, tr(label, locale)]),
  ] as string[][];
  const active = Object.entries(values).filter(
    ([key, value]) =>
      value && !["page", "sort"].includes(key) && !(key === "family" && family),
  );
  const facets: [string, string, string[][]][] = [
    ["family", labels.family, WORLDS.map((w) => [w.key, tr(w.title, locale)])],
    ["intent", labels.intent, intentChoices],
    ["subject", labels.subject, catalogue.data.subjects.map((v) => [v, v])],
    ["skill", labels.skill, catalogue.data.skills.map((v) => [v, v])],
    [
      "age",
      labels.age,
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 16].map((v) => [
        String(v),
        String(v),
      ]),
    ],
    [
      "format",
      labels.format,
      ["PDF", "PNG", "JPEG", "WEBP", "MP3", "MP4", "HTML"].map((v) => [v, v]),
    ],
    [
      "audience",
      t(["Audience", "Public", "الجمهور"]),
      audienceLabels.map(([key, label]) => [key, tr(label, locale)]),
    ],
    [
      "duration",
      labels.duration,
      [5, 10, 15, 30, 60].map((v) => [String(v), "≤ " + v + " min"]),
    ],
    [
      "difficulty",
      labels.difficulty,
      [
        [
          "introductory",
          t([
            "First discoveries",
            "Premières découvertes",
            "الاكتشافات الأولى",
          ]),
        ],
        [
          "developing",
          t(["Growing confidence", "En progression", "ثقة متنامية"]),
        ],
        ["confident", t(["Confident explorer", "À l’aise", "مستكشف واثق"])],
        [
          "advanced",
          t(["Further discovery", "Pour aller plus loin", "اكتشاف متقدم"]),
        ],
      ],
    ],
  ];
  const page = Number(values.page),
    pages = Math.max(
      1,
      Math.ceil(catalogue.data.total / catalogue.data.pageSize),
    );
  function chip(key: string, value: string) {
    if (key === "family" || key === "notFamily")
      return world(value) ? tr(world(value)!.title, locale) : value;
    if (key === "intent")
      return intentChoices.find((row) => row[0] === value)?.[1] || value;
    if (key === "keys")
      return t([
        "Selected resources",
        "Ressources sélectionnées",
        "الموارد المحددة",
      ]);
    return value;
  }
  return (
    <article
      className={s.explorer}
      data-kidflix-world-discovery="r1"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <nav
        className={s.breadcrumb}
        aria-label={t(["Breadcrumb", "Fil d’Ariane", "مسار التنقل"])}
      >
        <Link href={path(locale)}>{t(["Home", "Accueil", "الرئيسية"])}</Link>
        <ChevronRight size={13} />
        <span>
          {t([
            "Resource library",
            "Bibliothèque de ressources",
            "مكتبة الموارد",
          ])}
        </span>
      </nav>
      <header className={s.heading}>
        <div>
          <span className={s.eyebrow}>
            KIDFLIX ·{" "}
            {t([
              "DISCOVER & EXPLORE",
              "DÉCOUVRIR ET EXPLORER",
              "اكتشف واستكشف",
            ])}
          </span>
          <h1>
            {w
              ? tr(w.title, locale)
              : t([
                  "Explore KidFlix resources",
                  "Explorer les ressources KidFlix",
                  "استكشف موارد كيدفليكس",
                ])}
          </h1>
          <p>
            {t([
              "Find published resources for learning, practice and everyday preparation.",
              "Trouvez les ressources publiées pour apprendre, pratiquer et préparer le quotidien.",
              "اعثر على الموارد المنشورة للتعلّم والممارسة والاستعداد اليومي.",
            ])}
          </p>
        </div>
        <Link className={s.libraryLink} href={path(locale, "/my")}>
          {t(["My KidFlix", "Mon KidFlix", "كيدفليكس الخاص بي"])}
          <ArrowRight size={16} />
        </Link>
      </header>
      <section
        className={s.directory}
        aria-label={t([
          "Explore a category",
          "Explorer une catégorie",
          "استكشف فئة",
        ])}
      >
        {WORLDS.map((category, index) => (
          <Link
            key={category.key}
            href={path(locale, "/explore/" + category.key)}
          >
            <CategoryMark index={index} />
            <strong>{tr(category.title, locale)}</strong>
            <ChevronRight size={12} />
          </Link>
        ))}
      </section>
      <section
        className={s.finder}
        aria-label={t([
          "Find your next resource",
          "Trouver votre prochaine ressource",
          "اعثر على موردك القادم",
        ])}
      >
        <div className={s.finderTop}>
          <form role="search" onSubmit={submit}>
            <Search size={19} />
            <input
              type="search"
              maxLength={100}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label={t([
                "Search resources",
                "Rechercher des ressources",
                "ابحث في الموارد",
              ])}
              placeholder={t([
                "A skill, topic, resource or learning goal…",
                "Une compétence, un thème, une ressource…",
                "مهارة أو موضوع أو مورد أو هدف تعليمي…",
              ])}
            />
            <button type="submit">{t(["Search", "Rechercher", "بحث"])}</button>
          </form>
          <button
            type="button"
            className={s.filterToggle}
            aria-expanded={expanded}
            aria-controls="kidflix-world-filters"
            onClick={() => setExpanded((v) => !v)}
          >
            <SlidersHorizontal size={17} />
            {t(["Filters", "Filtres", "المرشحات"])}
          </button>
        </div>
        {expanded ? (
          <div className={s.filters} id="kidflix-world-filters">
            {facets
              .filter(([key]) => !(family && key === "family"))
              .map(([key, label, choices]) => (
                <label key={key}>
                  <span>{label}</span>
                  <select
                    aria-label={label}
                    value={values[key] || ""}
                    onChange={(event) => update(key, event.target.value)}
                  >
                    <option value="">{t(["All", "Tous", "الكل"])}</option>
                    {values[key] &&
                    !choices.some(([value]) => value === values[key]) ? (
                      <option value={values[key]}>
                        {chip(key, values[key])}
                      </option>
                    ) : null}
                    {choices.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
          </div>
        ) : null}
        <div className={s.purposes}>
          <span>
            {t([
              "Explore by purpose",
              "Explorer par objectif",
              "استكشف حسب الهدف",
            ])}
          </span>
          {INTENTS.map(([key, , label]) => (
            <button
              type="button"
              key={key}
              aria-pressed={values.intent === key}
              onClick={() => update("intent", values.intent === key ? "" : key)}
            >
              {tr(label, locale)}
            </button>
          ))}
        </div>
      </section>
      <div className={s.resultTools}>
        <p role="status">
          {catalogue.busy
            ? t([
                "Updating resources…",
                "Actualisation des ressources…",
                "جارٍ تحديث الموارد…",
              ])
            : catalogue.error
              ? t([
                  "Resources unavailable",
                  "Ressources indisponibles",
                  "الموارد غير متاحة",
                ])
              : catalogue.data.total +
                " " +
                t(["resources", "ressources", "موارد"])}
        </p>
        <label>
          <span>{t(["Sort", "Trier", "ترتيب"])}</span>
          <select
            aria-label={t([
              "Sort resources",
              "Trier les ressources",
              "رتّب الموارد",
            ])}
            value={values.sort || "new"}
            onChange={(event) => update("sort", event.target.value)}
          >
            <option value="new">
              {t(["Newest first", "Les plus récents", "الأحدث أولاً"])}
            </option>
            <option value="loved">
              {t(["Most loved", "Les plus aimés", "الأكثر إعجاباً"])}
            </option>
            <option value="popular">
              {t([
                "Popular this week",
                "Populaires cette semaine",
                "الرائجة هذا الأسبوع",
              ])}
            </option>
            <option value="title">
              {t(["Title A–Z", "Titre A–Z", "حسب العنوان"])}
            </option>
          </select>
        </label>
        <div className={s.viewButtons}>
          {(["grid", "list"] as const).map((key) => (
            <button
              type="button"
              key={key}
              aria-label={
                key === "grid"
                  ? t(["Grid view", "Vue grille", "عرض شبكي"])
                  : t(["List view", "Vue liste", "عرض قائمة"])
              }
              aria-pressed={view === key}
              onClick={() => setView(key)}
            >
              {key === "grid" ? <LayoutGrid size={18} /> : <List size={18} />}
            </button>
          ))}
        </div>
      </div>
      {active.length ? (
        <div className={s.chips}>
          {active.map(([key, value]) => (
            <button
              type="button"
              key={key}
              onClick={() => {
                if (key === "q") setQuery("");
                update(key, "");
              }}
              aria-label={
                t(["Remove filter", "Retirer le filtre", "إزالة المرشح"]) +
                " · " +
                labels[key] +
                " · " +
                chip(key, value)
              }
            >
              {labels[key]}: {chip(key, value)}
              <X size={12} />
            </button>
          ))}
          <button type="button" className={s.clear} onClick={clear}>
            {t([
              "Reset filters",
              "Réinitialiser les filtres",
              "إعادة ضبط المرشحات",
            ])}
          </button>
        </div>
      ) : null}
      {catalogue.error ? (
        <WorldReadFailure locale={locale} onRetry={catalogue.retry} />
      ) : catalogue.data.rows.length ? (
        <div
          className={`${s.grid} ${view === "list" ? s.list : ""}`}
          aria-busy={catalogue.busy}
        >
          {catalogue.data.rows.map((resource) => (
            <ReferenceCard
              key={resource.key}
              resource={resource}
              locale={locale}
            />
          ))}
        </div>
      ) : catalogue.busy ? (
        <div
          className={s.skeletons}
          aria-label={t([
            "Loading resources",
            "Chargement des ressources",
            "جارٍ تحميل الموارد",
          ])}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} />
          ))}
        </div>
      ) : (
        <section className={s.empty}>
          <Search size={30} />
          <h2>
            {t([
              "No published resources match this selection",
              "Aucune ressource publiée ne correspond à cette sélection",
              "لا توجد موارد منشورة تطابق هذا الاختيار",
            ])}
          </h2>
          <p>
            {t([
              "Adjust a filter or explore one of the current categories above.",
              "Modifiez un filtre ou explorez une catégorie ci-dessus.",
              "عدّل أحد المرشحات أو استكشف إحدى الفئات أعلاه.",
            ])}
          </p>
          {active.length ? (
            <button type="button" onClick={clear}>
              {t([
                "Reset filters",
                "Réinitialiser les filtres",
                "إعادة ضبط المرشحات",
              ])}
            </button>
          ) : (
            <Link href={path(locale)}>
              {t([
                "Back to KidFlix",
                "Retour à KidFlix",
                "العودة إلى كيدفليكس",
              ])}
              <ArrowRight size={15} />
            </Link>
          )}
        </section>
      )}
      {!catalogue.error && catalogue.data.total > catalogue.data.pageSize ? (
        <nav
          className={s.pagination}
          aria-label={t([
            "Result pages",
            "Pages de résultats",
            "صفحات النتائج",
          ])}
        >
          <button
            type="button"
            disabled={catalogue.busy || page <= 1}
            aria-label={t([
              "Previous page",
              "Page précédente",
              "الصفحة السابقة",
            ])}
            onClick={() =>
              router.push(
                discoveryHref(
                  locale,
                  { ...values, page: String(page - 1) },
                  family,
                ),
                { scroll: false },
              )
            }
          >
            <ChevronLeft size={17} />
          </button>
          <span>
            {page} / {pages}
          </span>
          <button
            type="button"
            disabled={catalogue.busy || page >= pages}
            aria-label={t(["Next page", "Page suivante", "الصفحة التالية"])}
            onClick={() =>
              router.push(
                discoveryHref(
                  locale,
                  { ...values, page: String(page + 1) },
                  family,
                ),
                { scroll: false },
              )
            }
          >
            <ChevronRight size={17} />
          </button>
        </nav>
      ) : null}
    </article>
  );
}
