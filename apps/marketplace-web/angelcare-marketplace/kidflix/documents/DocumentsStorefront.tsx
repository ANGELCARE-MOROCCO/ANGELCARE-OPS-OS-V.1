"use client";
import {Artwork,HeroPlacement} from "../imagery/Runtime";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { tr, path, type Locale, type Tri } from "../catalogue";
import { I } from "../Icons";
import { Modal } from "../storefronts/elements";
import { useGuest } from "../continuity";
import { ArtIcon, useDocumentsSettings } from "./DocumentShell";
import {
  ART,
  SUBTYPES,
  USES,
  NEEDS,
  GRADES,
  SUBJECTS,
  THEMES,
  QUICK,
  documentFilters,
  documentHref,
  documentDetailHref,
  named,
  type DocumentFilters,
  type DocumentsData,
  type DocumentItem,
  type Choice,
} from "./model";
import s from "./documents.module.css";
const words = {
  search: ["Search Documents", "Rechercher des documents", "ابحث عن الوثائق"],
  types: ["Document Type", "Type de document", "نوع الوثيقة"],
  audience: ["Audience", "Public", "الجمهور"],
  grade: ["Grade", "Niveau scolaire", "المستوى الدراسي"],
  subject: ["Subject", "Matière", "المادة"],
  theme: ["Theme / Season", "Thème / Saison", "الموضوع / الموسم"],
  format: ["Format", "Format", "التنسيق"],
  language: ["Content language", "Langue du contenu", "لغة المحتوى"],
  age: ["Age Group", "Âge", "الفئة العمرية"],
  sort: ["Sort by", "Trier par", "الترتيب"],
  download: ["Download document", "Télécharger le document", "تنزيل الوثيقة"],
  noRatings: ["Not yet rated", "Pas encore noté", "لم يقيّم بعد"],
  viewAll: ["View All", "Tout voir", "عرض الكل"],
  empty: [
    "No published documents match this selection.",
    "Aucun document publié ne correspond à cette sélection.",
    "لا توجد وثائق منشورة تطابق هذا الاختيار.",
  ],
  retry: ["Try again", "Réessayer", "حاول مجدداً"],
  reset: ["Reset Filters", "Réinitialiser", "إعادة ضبط المرشحات"],
} satisfies Record<string, Tri>;
const t = (key: keyof typeof words, l: Locale) => tr(words[key], l);
const count = (n: number, l: Locale) =>
  new Intl.NumberFormat(l).format(Math.max(0, n));
const audience = (key: string, l: Locale) =>
  ({
    educator: tr(["Teachers", "Enseignants", "المعلمون"], l),
    parent: tr(["Parents", "Parents", "الآباء"], l),
    child: tr(["Children", "Enfants", "الأطفال"], l),
    school: tr(["Schools", "Écoles", "المدارس"], l),
    professional: tr(["Professionals", "Professionnels", "المهنيون"], l),
  })[key] || key;
function Heading({
  slot,
  icon,
  title,
  children,
  action,
}: {
  icon: number;
  slot:string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={s.sectionHeading}>
      <h2>
        <ArtIcon slot={`heading.${slot}`} index={icon} />
        {title}
      </h2>
      {children ? <span>{children}</span> : null}
      {action}
    </div>
  );
}
function Jump({
  children,
  href,
  onClick,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  return href ? (
    <Link className={s.viewAll} href={href}>
      {children}
      <I name="ArrowRight" size={14} />
    </Link>
  ) : (
    <button className={s.viewAll} onClick={onClick}>
      {children}
      <I name="ArrowRight" size={14} />
    </button>
  );
}
function Stars({ rating }: { rating: number }) {
  return (
    <span className={s.fiveStars} aria-label={String(rating) + " / 5"}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} data-filled={i < Math.round(rating)}>
          ★
        </span>
      ))}
    </span>
  );
}
function DocumentCard({
  resource,
  locale,
  onDownload,
}: {
  resource: DocumentItem;
  locale: Locale;
  onDownload: (r: DocumentItem) => void;
}) {
  const guest = useGuest(),
    href = documentDetailHref(resource),
    topic = resource.documentUses[0]
      ? named(USES, resource.documentUses[0], locale)
      : resource.subject || named(SUBTYPES, resource.subtype, locale),
    grade = resource.grades.length
      ? resource.grades
          .slice(0, 2)
          .map((k) => named(GRADES, k, locale))
          .join(" · ")
      : resource.ageMin !== null && resource.ageMax !== null
        ? `${resource.ageMin}–${resource.ageMax} ${tr(["years", "ans", "سنوات"], locale)}`
        : tr(
            ["See resource details", "Voir les détails", "راجع تفاصيل المورد"],
            locale,
          );
  return (
    <article className={s.resourceCard} data-document-key={resource.key}>
      <Link
        className={s.previewImage}
        href={href}
        onClick={() => guest.visit(resource.key)}
      >
        {resource.image ? (
          <img data-imagery-owner="resource-owned" data-imagery-record={resource.id}
            src={resource.image}
            alt={resource.imageAlt || resource.title}
            loading="lazy"
            width={360}
            height={225}
          />
        ) : (
          <span className={s.noCover}>
            <ArtIcon index={0} size={55} />
            <small>
              {tr(
                [
                  "Preview not published",
                  "Aperçu non publié",
                  "المعاينة غير منشورة",
                ],
                locale,
              )}
            </small>
          </span>
        )}
      </Link>
      <div className={s.cardBody}>
        <Link
          className={s.cardTitle}
          href={href}
          onClick={() => guest.visit(resource.key)}
        >
          {resource.title}
        </Link>
        <div className={s.cardTags}>
          {topic ? <span>{topic}</span> : null}
          <span>{grade}</span>
        </div>
        <div className={s.cardBottom}>
          {resource.rating !== null && resource.ratingCount > 0 ? (
            <span className={s.rating}>
              <b>★</b>
              <strong>{resource.rating.toFixed(1)}</strong>
              <small>({count(resource.ratingCount, locale)})</small>
            </span>
          ) : (
            <span className={s.noRating}>
              <b>★</b>
              {t("noRatings", locale)}
            </span>
          )}
          {resource.outputs.length ? (
            <button
              className={s.download}
              onClick={() => onDownload(resource)}
              aria-label={t("download", locale) + " · " + resource.title}
            >
              <I name="Download" size={21} />
            </button>
          ) : (
            <Link
              className={s.download}
              href={href}
              aria-label={
                tr(
                  ["Read resource", "Lire la ressource", "اقرأ المورد"],
                  locale,
                ) +
                " · " +
                resource.title
              }
            >
              <I name="BookOpen" size={20} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
export function DocumentsStorefront({
  locale,
  initial,
  initialFilters = {},
  preview = false,
}: {
  locale: Locale;
  initial: DocumentsData;
  initialFilters?: DocumentFilters;
  preview?: boolean;
}) {
  const { publish } = useDocumentsSettings();
  const previewValue = useRef(initial);
  const [directory, setDirectory] = useState<
    "categories" | "needs" | "packs" | "feedback" | null
  >(null);
  const [filters, setFilters] = useState<DocumentFilters>(() =>
      documentFilters(initialFilters),
    ),
    [search, setSearch] = useState(initialFilters.q || ""),
    [data, setData] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(Boolean(initial.error)),
    [retry, setRetry] = useState(0),
    [download, setDownload] = useState<DocumentItem | null>(null),
    [feedback, setFeedback] = useState(0),
    [refresh, setRefresh] = useState(true),
    [notice, setNotice] = useState(""),
    dialog = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLElement | null>(null),
    loaded = useRef(JSON.stringify(documentFilters(initialFilters))),
    request = useRef(0);
  useEffect(() => publish(data.edition), [data.edition, publish]);
  const signature = JSON.stringify(filters),
    view = filters.view === "list" ? "list" : "grid";
  useEffect(() => {
    if (preview) return;
    function pop() {
      try {
        const f = documentFilters(
          Object.fromEntries(new URLSearchParams(location.search)),
        );
        setSearch(f.q || "");
        setFilters(f);
      } catch {
        setNotice(
          tr(
            [
              "Invalid browsing link. Reset the selection.",
              "Lien de recherche invalide. Réinitialisez la sélection.",
              "رابط تصفح غير صالح. أعد ضبط الاختيار.",
            ],
            locale,
          ),
        );
      }
    }
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, [locale]);
  useEffect(() => {
    if (loaded.current === signature && retry === 0) return;
    const controller = new AbortController(),
      id = ++request.current;
    setBusy(true);
    setError(false);
    const timer = setTimeout(async () => {
      try {
        const query = new URLSearchParams({ ...filters, locale });
        const r = await fetch("/api/kidflix/documents?" + query, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!r.ok) throw Error();
        const next = await r.json();
        if (id === request.current) {
          setData(
            preview
              ? {
                  ...next,
                  edition: previewValue.current.edition,
                  testimonials: previewValue.current.testimonials,
                  rows: next.rows.map((r: DocumentItem) => {
                    const ratings = previewValue.current.testimonials.filter(
                      (t) => t.resourceKey === r.key,
                    );
                    return {
                      ...r,
                      rating: ratings.length
                        ? ratings.reduce((n, t) => n + t.rating, 0) /
                          ratings.length
                        : null,
                      ratingCount: ratings.length,
                    };
                  }),
                }
              : next,
          );
          setError(false);
          loaded.current = signature;
          setFeedback(0);
        }
      } catch (e) {
        if (!controller.signal.aborted && id === request.current)
          setError(true);
      } finally {
        if (!controller.signal.aborted && id === request.current)
          setBusy(false);
      }
    }, 120);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [signature, retry, locale]);
  useEffect(() => {
    if (!refresh) return;
    let active = true;
    const timer = setInterval(async () => {
      if (document.hidden) return;
      try {
        const r = await fetch(
          "/api/kidflix/documents?" +
            new URLSearchParams({ ...filters, locale }),
          { cache: "no-store" },
        );
        if (!r.ok) return;
        const next = await r.json();
        if (!active) return;
        setData((old) => ({
          ...old,
          ranked: next.ranked,
          today: next.today,
          todayTotal: next.todayTotal,
          downloadTotal: next.downloadTotal,
          updatedAt: next.updatedAt,
        }));
      } catch {}
    }, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [refresh, locale, signature]);
  useEffect(() => {
    if (download && dialog.current) {
      trigger.current = document.activeElement as HTMLElement;
      dialog.current.showModal();
    }
    return () => {
      if (download) {
        dialog.current?.close();
        trigger.current?.focus();
      }
    };
  }, [download]);
  function change(key: string, value: string, scroll = false) {
    const next = documentFilters({
      ...filters,
      [key]: value,
      page: key === "page" ? value : key === "view" ? filters.page || "1" : "1",
    });
    for (const k of Object.keys(next)) if (!next[k]) delete next[k];
    setFilters(next);
    if (!preview) history.pushState(null, "", documentHref(locale, next));
    if (scroll)
      document.getElementById("documents-search")?.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
  }
  function fromDirectory(key: string, value: string) {
    if (key === "collection") {
      const next = documentFilters({
        collection: value,
        language: filters.language || "",
        view: filters.view || "",
        page: "1",
      });
      setFilters(next);
      setSearch("");
      if (!preview) history.pushState(null, "", documentHref(locale, next));
    } else change(key, value);
    setDirectory(null);
    requestAnimationFrame(() => {
      const panel = document.getElementById("documents-search");
      panel?.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
      panel?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
    });
  }
  function reset() {
    const next = { page: "1" };
    setSearch("");
    setFilters(next);
    if (!preview) history.pushState(null, "", documentHref(locale, next));
  }
  function choose(key: string, value: string) {
    change(key, filters[key] === value ? "" : value, true);
  }
  function select(
    key: string,
    label: string,
    all: string,
    options: { key: string; label: string }[],
  ) {
    return (
      <label className={s.filter}>
        <span>{label}</span>
        <select
          value={filters[key] || ""}
          aria-label={label}
          onChange={(e) => change(key, e.target.value)}
        >
          <option value="">{all}</option>
          {options.map((o) => (
            <option value={o.key} key={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    );
  }
  const options = (choices: Choice[]) =>
    choices.map((x) => ({ key: x.key, label: tr(x.title, locale) }));
  const subjectOptions = [
    ...options(SUBJECTS),
    ...(data.facets.subject || [])
      .filter((k) => !SUBJECTS.some((x) => x.key === k))
      .map((key) => ({ key, label: key })),
  ];
  const active = Object.entries(filters).filter(
    ([key, value]) => value && !["page", "sort", "view"].includes(key),
  );
  const explore = () =>
    document.getElementById("documents-search")?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  const testimonial =
    data.testimonials[feedback % Math.max(1, data.testimonials.length)];
  const heroHeadline =
    data.edition.headline &&
    ![
      "Guides & Articles",
      "Guides & articles",
      "الأدلة والمقالات",
      "A clearer perspective. A more thoughtful practice.",
      "Un regard plus clair. Des pratiques plus réfléchies.",
      "رؤية أوضح وممارسة أكثر تأملاً.",
    ].includes(data.edition.headline)
      ? data.edition.headline
      : "";
  return (
    <div
      className={s.page}
      data-documents-storefront
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <section className={s.hero} aria-labelledby="documents-title">
        <Artwork slot="opening.hero" sequence
          className={s.heroArt}
          src={ART + (locale === "en" ? "hero.png" : `hero-${locale}.png`)}
          alt=""
          width={2048}
          height={683}
          fetchPriority="high"
        />
        <div className={s.heroCopy}>
          <div className={s.heroKicker}>
            <ArtIcon slot="opening.kicker" index={0} />
            {tr(["DOCUMENTS", "DOCUMENTS", "الوثائق"], locale)}
          </div>
          <h1 id="documents-title">
            {heroHeadline || (
              <>
                {tr(
                  [
                    "Free Documents, Forms,",
                    "Documents, formulaires,",
                    "وثائق ونماذج مجانية،",
                  ],
                  locale,
                )}
                <em>
                  {tr(
                    ["Guides & Templates", "Guides et modèles", "أدلة وقوالب"],
                    locale,
                  )}
                </em>
              </>
            )}
          </h1>
          <strong>
            {tr(
              [
                "Everything you need for your classroom, home or school.",
                "Des ressources pour votre classe, votre famille ou votre école.",
                "موارد لفصلك ومنزلك ومدرستك.",
              ],
              locale,
            )}
          </strong>
          <p>
            {tr(
              [
                "Find classroom forms, parent communication, policies, planning documents and practical guides.",
                "Découvrez formulaires, communication parents, politiques, préparation et guides pratiques.",
                "اكتشف نماذج الفصل والتواصل مع الوالدين والسياسات والتخطيط والأدلة العملية.",
              ],
              locale,
            )}
          </p>
          <button className={s.primary} onClick={explore}>
            {tr(
              [
                "Explore Free Documents",
                "Explorer les documents gratuits",
                "استكشف الوثائق المجانية",
              ],
              locale,
            )}
            <I name="ArrowRight" size={19} />
          </button>
        </div>
        <div className={s.heroScript}>
          {tr(["Organize", "Organiser", "نظّم"], locale)}
          <br />
          {tr(["Plan", "Préparer", "خطّط"], locale)}
          <br />
          {tr(["Communicate", "Communiquer", "تواصل"], locale)}
          <em>{tr(["Succeed!", "Réussir !", "انجح!"], locale)}</em>
        </div>
      </section>
      <div className={s.assurances}>
        <div>
          <ArtIcon slot="assurance.inventory" index={0} />
          <span>
            <b>{count(data.inventoryTotal, locale)}</b>
            {tr(["Documents", "Documents", "وثائق"], locale)}
          </span>
        </div>
        <div>
          <ArtIcon slot="assurance.collections" index={23} />
          <span>
            <b>{tr(["100% Free", "100 % gratuit", "مجاني بالكامل"], locale)}</b>
            {tr(
              ["Published resources", "Ressources publiées", "موارد منشورة"],
              locale,
            )}
          </span>
        </div>
        <div>
          <ArtIcon slot="assurance.formats" index={24} />
          <span>
            <b>{tr(["For Teachers,", "Enseignants,", "للمعلمين،"], locale)}</b>
            {tr(
              [
                "Parents & Learners",
                "Parents et apprenants",
                "الآباء والمتعلمين",
              ],
              locale,
            )}
          </span>
        </div>
        <div>
          <ArtIcon slot="assurance.downloads" index={25} />
          <span>
            <b>{count(data.downloadTotal, locale)}</b>
            {tr(["Downloads", "Téléchargements", "تنزيلات"], locale)}
          </span>
        </div>
        <div>
          <ArtIcon slot="assurance.quality" index={29} />
          <span>
            <b>{tr(["Made for", "Pensé pour", "مصمم من أجل"], locale)}</b>
            {tr(
              [
                "Families & educators",
                "Familles et éducateurs",
                "الأسر والمربين",
              ],
              locale,
            )}
          </span>
        </div>
      </div>
      <section
        className={s.searchPanel}
        id="documents-search"
        aria-labelledby="documents-search-title"
      >
        <div className={s.searchHeading}>
          <ArtIcon slot="assurance.offline" index={26} />
          <div>
            <h2 id="documents-search-title" tabIndex={-1}>
              {t("search", locale)}
            </h2>
            <p>
              {tr(
                [
                  "Find the perfect documents, forms and templates for your needs",
                  "Trouvez les documents, formulaires et modèles adaptés à vos besoins",
                  "اعثر على الوثائق والنماذج والقوالب المناسبة لاحتياجاتك",
                ],
                locale,
              )}
            </p>
          </div>
        </div>
        <div className={s.searchDecoration} aria-hidden="true">
          <span>
            {tr(
              [
                "All documents are free!",
                "Tous les documents sont gratuits !",
                "كل الوثائق مجانية!",
              ],
              locale,
            )}
          </span>
          <ArtIcon slot="finder.documents" index={0} />
          <ArtIcon slot="finder.season" index={15} />
        </div>
        <form
          className={s.documentSearch}
          onSubmit={(e) => {
            e.preventDefault();
            change("q", search);
          }}
          role="search"
        >
          <I name="Search" size={19} />
          <label className={s.srOnly} htmlFor="documents-query">
            {t("search", locale)}
          </label>
          <input
            id="documents-query"
            type="search"
            maxLength={100}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tr(
              [
                "Search documents, e.g. lesson plan, parent form, checklist…",
                "Rechercher : préparation, formulaire parents, liste…",
                "ابحث عن وثائق، مثل خطة درس أو نموذج أو قائمة…",
              ],
              locale,
            )}
          />
          <button>{tr(["Search", "Rechercher", "ابحث"], locale)}</button>
        </form>
        <div className={s.filters}>
          {select(
            "subtype",
            t("types", locale),
            tr(["All Types", "Tous les types", "كل الأنواع"], locale),
            options(SUBTYPES),
          )}
          {select(
            "audience",
            t("audience", locale),
            tr(["All Audiences", "Tous les publics", "كل الجماهير"], locale),
            (data.facets.audience || []).map((key) => ({
              key,
              label: audience(key, locale),
            })),
          )}
          {select(
            "grade",
            t("grade", locale),
            tr(["All Grades", "Tous les niveaux", "كل المستويات"], locale),
            options(GRADES),
          )}
          {select(
            "subject",
            t("subject", locale),
            tr(["All Subjects", "Toutes les matières", "كل المواد"], locale),
            subjectOptions,
          )}
          {select(
            "theme",
            t("theme", locale),
            tr(["All Themes", "Tous les thèmes", "كل المواضيع"], locale),
            options(THEMES),
          )}
          {select(
            "format",
            t("format", locale),
            tr(["All Formats", "Tous les formats", "كل التنسيقات"], locale),
            (data.facets.format || []).map((key) => ({ key, label: key })),
          )}
          {select(
            "language",
            t("language", locale),
            tr(
              ["English content", "Contenu en français", "المحتوى العربي"],
              locale,
            ),
            [
              {
                key: "all",
                label: tr(
                  ["All Languages", "Toutes les langues", "كل اللغات"],
                  locale,
                ),
              },
              { key: "en", label: "English" },
              { key: "fr", label: "Français" },
              { key: "ar", label: "العربية" },
            ],
          )}
          {select(
            "age",
            t("age", locale),
            tr(["All Ages", "Tous les âges", "كل الأعمار"], locale),
            [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(
              (n) => ({
                key: String(n),
                label:
                  count(n, locale) +
                  " " +
                  tr(["years", "ans", "سنوات"], locale),
              }),
            ),
          )}
          <label className={`${s.filter} ${s.sort}`}>
            <span>↕ {t("sort", locale)}</span>
            <select
              aria-label={t("sort", locale)}
              value={filters.sort || "downloads"}
              onChange={(e) => change("sort", e.target.value)}
            >
              <option value="downloads">
                {tr(
                  ["Most Downloaded", "Les plus téléchargés", "الأكثر تنزيلاً"],
                  locale,
                )}
              </option>
              <option value="new">
                {tr(["Newest Documents", "Les plus récents", "الأحدث"], locale)}
              </option>
              <option value="title">
                {tr(["Title A–Z", "Titre A–Z", "العنوان"], locale)}
              </option>
              <option value="rating">
                {tr(
                  ["Highest Rated", "Les mieux notés", "الأعلى تقييماً"],
                  locale,
                )}
              </option>
            </select>
          </label>
        </div>
        <div className={s.quickFilters}>
          <b>
            {tr(
              ["Quick Filters:", "Filtres rapides :", "مرشحات سريعة:"],
              locale,
            )}
          </b>
          {QUICK.map((key) => (
            <button
              key={key}
              aria-pressed={filters.use === key}
              onClick={() => choose("use", key)}
            >
              {tr(
                (
                  {
                    checklists: [
                      "Checklists",
                      "Listes de contrôle",
                      "قوائم التحقق",
                    ],
                    "lesson-plans": [
                      "Lesson Plans",
                      "Préparations",
                      "خطط الدروس",
                    ],
                    "parent-communication": [
                      "Parent Letters",
                      "Lettres aux parents",
                      "رسائل الوالدين",
                    ],
                    certificates: ["Certificates", "Certificats", "شهادات"],
                    reports: ["Report Forms", "Rapports", "نماذج التقارير"],
                    routines: ["Routines", "Routines", "الروتين"],
                    policies: ["Policies", "Politiques", "السياسات"],
                    homeschool: [
                      "Homeschool",
                      "École à la maison",
                      "التعلم المنزلي",
                    ],
                    "special-education": [
                      "Special Education",
                      "Éducation inclusive",
                      "التربية الخاصة",
                    ],
                  } as Record<string, Tri>
                )[key],
                locale,
              )}
            </button>
          ))}
        </div>
        {active.length ? (
          <div
            className={s.activeFilters}
            aria-label={tr(
              ["Active filters", "Filtres actifs", "المرشحات النشطة"],
              locale,
            )}
          >
            {active.map(([key, value]) => (
              <button
                key={key}
                onClick={() => {
                  if (key === "q") setSearch("");
                  change(key, "");
                }}
              >
                {key}:{" "}
                {key === "subtype"
                  ? named(SUBTYPES, value, locale)
                  : key === "use"
                    ? named(USES, value, locale)
                    : key === "grade"
                      ? named(GRADES, value, locale)
                      : key === "theme"
                        ? named(THEMES, value, locale)
                        : value}
                <I name="X" size={12} />
              </button>
            ))}
          </div>
        ) : null}
        <div className={s.resultsToolbar}>
          <p role="status" aria-live="polite">
            <b>{count(data.total, locale)}</b>{" "}
            {tr(["documents found", "documents trouvés", "وثيقة"], locale)}
            {busy ? (
              <span>
                {" "}
                · {tr(["Updating…", "Actualisation…", "جار التحديث…"], locale)}
              </span>
            ) : null}
          </p>
          <div>
            <button className={s.reset} onClick={reset}>
              <I name="RotateCcw" size={17} />
              {t("reset", locale)}
            </button>
            <div
              className={s.viewToggle}
              role="group"
              aria-label={tr(
                ["Results view", "Affichage des résultats", "عرض النتائج"],
                locale,
              )}
            >
              <button
                aria-pressed={view === "grid"}
                onClick={() => change("view", "grid")}
              >
                <span aria-hidden="true">▦</span>
                {tr(["Grid", "Grille", "شبكة"], locale)}
              </button>
              <button
                aria-pressed={view === "list"}
                onClick={() => change("view", "list")}
              >
                <span aria-hidden="true">☷</span>
                {tr(["List", "Liste", "قائمة"], locale)}
              </button>
            </div>
          </div>
        </div>
      </section>
      {notice ? (
        <p role="status" className={s.notice}>
          {notice}
        </p>
      ) : null}
      <section className={s.section} data-documents-section="categories">
        <Heading slot="categories"
          icon={0}
          title={tr(
            [
              "Browse Document Categories",
              "Explorer les catégories de documents",
              "تصفح فئات الوثائق",
            ],
            locale,
          )}
          action={
            <Jump onClick={() => setDirectory("categories")}>
              {tr(
                ["View All Categories", "Toutes les catégories", "كل الفئات"],
                locale,
              )}
            </Jump>
          }
        />
        <div
          className={s.subtypes}
          aria-label={tr(
            [
              "Six document families",
              "Six familles de documents",
              "ست عائلات للوثائق",
            ],
            locale,
          )}
        >
          {SUBTYPES.map((x) => (
            <button
              key={x.key}
              aria-pressed={filters.subtype === x.key}
              onClick={() => choose("subtype", x.key)}
            >
              <ArtIcon slot={`categories.subtype.${x.key}`} index={x.icon} />
              {tr(x.title, locale)}
            </button>
          ))}
        </div>
        <div className={s.useGrid}>
          {USES.map((x, i) => (
            <button
              key={x.key}
              data-tone={i % 6}
              aria-pressed={filters.use === x.key}
              onClick={() => choose("use", x.key)}
            >
              <ArtIcon slot={`categories.use.${x.key}`} index={x.icon} />
              <strong>{tr(x.title, locale)}</strong>
            </button>
          ))}
        </div>
      </section>
      <section
        className={s.section}
        id="documents-results"
        data-documents-section="resources"
      >
        <Heading slot="catalogue"
          icon={0}
          title={tr(
            [
              "Document Resources",
              "Ressources documentaires",
              "الموارد الوثائقية",
            ],
            locale,
          )}
          action={
            <Jump
              onClick={() => {
                reset();
                explore();
              }}
            >
              {t("viewAll", locale)}
            </Jump>
          }
        >
          {count(data.total, locale)}{" "}
          {tr(["results", "résultats", "نتيجة"], locale)}
        </Heading>
        {error ? (
          <div role="alert" className={s.error}>
            <p>
              {tr(
                [
                  "The document catalogue could not be refreshed. Your choices and previous results are preserved.",
                  "Le catalogue n’a pas pu être actualisé. Vos choix et résultats précédents sont conservés.",
                  "تعذر تحديث الكتالوج. احتفظنا باختياراتك والنتائج السابقة.",
                ],
                locale,
              )}
            </p>
            <button onClick={() => setRetry((x) => x + 1)}>
              {t("retry", locale)}
            </button>
          </div>
        ) : null}
        {data.setupRequired ? (
          <div className={s.notice} role="status">
            {tr(
              [
                "Documents discovery is being prepared. Please try again shortly.",
                "La recherche documentaire est en préparation. Réessayez prochainement.",
                "جار إعداد البحث في الوثائق. حاول مجدداً قريباً.",
              ],
              locale,
            )}
          </div>
        ) : null}
        <div aria-busy={busy} className={busy ? s.refreshing : ""}>
          {data.rows.length ? (
            <div
              className={`${s.resourceGrid} ${view === "list" ? s.listView : ""}`}
            >
              {data.rows.map((r) => (
                <DocumentCard
                  key={r.key + ":" + r.contentLocale}
                  resource={r}
                  locale={locale}
                  onDownload={setDownload}
                />
              ))}
            </div>
          ) : !busy && !error ? (
            <div className={s.empty}>
              <ArtIcon slot="catalogue.empty" index={0} size={55} />
              <h3>{t("empty", locale)}</h3>
              <p>
                {tr(
                  [
                    "Published resources appear here automatically. You can explore another selection or reset your filters.",
                    "Les ressources publiées apparaissent ici automatiquement. Explorez un autre choix ou réinitialisez les filtres.",
                    "تظهر الموارد المنشورة هنا تلقائياً. اختر تصنيفاً آخر أو أعد ضبط المرشحات.",
                  ],
                  locale,
                )}
              </p>
              <button onClick={reset}>{t("reset", locale)}</button>
              {(!filters.language || filters.language === locale) && (data.facets.language || []).some(l => l !== locale) ? <div>
                <p>{tr(["Published documents are available in other content languages.", "Des documents publiés sont disponibles dans d’autres langues de contenu.", "توجد وثائق منشورة بلغات محتوى أخرى."], locale)}</p>
                <button onClick={() => change("language", "all")}>{tr(["Show all content languages", "Afficher toutes les langues de contenu", "عرض جميع لغات المحتوى"], locale)}</button>
              </div> : null}
            </div>
          ) : null}
        </div>
        {data.total > 10 ? (
          <nav
            className={s.pagination}
            aria-label={tr(
              ["Document pages", "Pages de documents", "صفحات الوثائق"],
              locale,
            )}
          >
            <button
              disabled={busy || data.page <= 1}
              onClick={() => {
                change("page", String(data.page - 1));
              }}
            >
              ← {tr(["Previous", "Précédent", "السابق"], locale)}
            </button>
            <span>
              {data.page} / {Math.ceil(data.total / 10)}
            </span>
            <button
              disabled={busy || data.page * 10 >= data.total}
              onClick={() => change("page", String(data.page + 1))}
            >
              {tr(["Next", "Suivant", "التالي"], locale)} →
            </button>
          </nav>
        ) : null}
      </section>
      <section className={s.section} data-documents-section="needs">
        <Heading slot="needs"
          icon={30}
          title={tr(
            ["Browse by Need", "Explorer selon vos besoins", "تصفح حسب الحاجة"],
            locale,
          )}
          action={
            <Jump onClick={() => setDirectory("needs")}>
              {t("viewAll", locale)}
            </Jump>
          }
        >
          {tr(
            [
              "Find documents for your specific needs",
              "Des documents pour vos besoins précis",
              "اعثر على وثائق لاحتياجاتك المحددة",
            ],
            locale,
          )}
        </Heading>
        <div className={s.needGrid}>
          {NEEDS.map((x, i) => (
            <button
              key={x.key}
              data-tone={i % 6}
              aria-pressed={filters.need === x.key}
              onClick={() => choose("need", x.key)}
            >
              <ArtIcon slot={`needs.${x.key}`} index={x.icon} />
              <strong>{tr(x.title, locale)}</strong>
              <p>{tr(x.body!, locale)}</p>
            </button>
          ))}
        </div>
      </section>
      <section className={s.packs} data-documents-section="packs">
        <Heading slot="packs"
          icon={23}
          title={tr(
            [
              "Recommended Document Packs",
              "Collections de documents recommandées",
              "مجموعات وثائق مقترحة",
            ],
            locale,
          )}
          action={
            <Jump onClick={() => setDirectory("packs")}>
              {tr(
                ["View All Packs", "Toutes les collections", "كل المجموعات"],
                locale,
              )}
            </Jump>
          }
        >
          {tr(
            [
              "Curated collections of published documents",
              "Sélections de documents publiés",
              "مجموعات منتقاة من الوثائق المنشورة",
            ],
            locale,
          )}
        </Heading>
        {data.collections.length ? (
          <div className={s.packGrid}>
            {data.collections.slice(0, 5).map((c) => (
              <button
                className={s.packCard}
                key={c.id}
                onClick={() => choose("collection", c.id)}
              >
                <span className={s.packPreview}>
                  {c.rows.slice(0, 3).map((r, i) => (
                    <span
                      key={r.key}
                      style={{ "--sheet-index": i } as React.CSSProperties}
                    >
                      {r.image ? (
                        <img
                          data-imagery-owner="resource-owned" data-imagery-record={r.id} src={r.image}
                          alt={r.title}
                          loading="lazy"
                          width={200}
                          height={160}
                        />
                      ) : (
                        <ArtIcon index={0} />
                      )}
                    </span>
                  ))}
                </span>
                <strong>{c.title}</strong>
                <p>
                  {c.description ||
                    `${count(c.rows.length, locale)} ${tr(["published documents", "documents publiés", "وثائق منشورة"], locale)}`}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className={s.packEmpty}>
            <ArtIcon slot="packs.empty" index={23} />
            <p>
              {tr(
                [
                  "Curated packs will appear here when published. Browse all document resources while new collections are prepared.",
                  "Les collections apparaîtront ici dès publication. Explorez les documents disponibles en attendant.",
                  "تظهر المجموعات هنا عند نشرها. تصفح الوثائق المتاحة أثناء إعداد مجموعات جديدة.",
                ],
                locale,
              )}
            </p>
            <button onClick={explore}>
              {tr(
                ["Browse Documents", "Explorer les documents", "تصفح الوثائق"],
                locale,
              )}
            </button>
          </div>
        )}
      </section>
      <div className={s.discoveryPanels} data-documents-section="directories">
        <section>
          <Heading slot="ages"
            icon={12}
            title={tr(
              [
                "Browse by Grade / Age",
                "Par niveau / âge",
                "حسب المستوى / العمر",
              ],
              locale,
            )}
            action={
              <Jump onClick={explore}>
                <span className={s.srOnly}>{t("viewAll", locale)}</span>
              </Jump>
            }
          />
          <div className={s.gradeGrid}>
            {GRADES.map((x) => (
              <button
                key={x.key}
                aria-pressed={filters.grade === x.key}
                onClick={() => choose("grade", x.key)}
              >
                {tr(x.title, locale)}
              </button>
            ))}
            <button onClick={() => change("grade", "", true)}>
              <I name="Smile" size={16} />
              {tr(["All Ages", "Tous les âges", "كل الأعمار"], locale)}
            </button>
          </div>
          <small className={s.gradeNote}>
            {tr(
              [
                "Grade labels follow the resource’s published metadata.",
                "Niveaux selon les métadonnées publiées.",
                "المستويات وفق بيانات المورد المنشورة.",
              ],
              locale,
            )}
          </small>
        </section>
        <section>
          <Heading slot="subjects"
            icon={14}
            title={tr(
              ["Browse by Subject", "Par matière", "حسب المادة"],
              locale,
            )}
            action={
              <Jump onClick={explore}>
                <span className={s.srOnly}>{t("viewAll", locale)}</span>
              </Jump>
            }
          />
          <div className={s.subjectGrid}>
            {SUBJECTS.map((x) => (
              <button
                key={x.key}
                aria-pressed={filters.subject === x.key}
                onClick={() => choose("subject", x.key)}
              >
                {tr(x.title, locale)}
              </button>
            ))}
          </div>
        </section>
        <section>
          <Heading slot="seasons"
            icon={15}
            title={tr(
              [
                "Seasonal Document Collections",
                "Collections saisonnières",
                "مجموعات وثائق موسمية",
              ],
              locale,
            )}
            action={
              <Jump onClick={explore}>
                <span className={s.srOnly}>{t("viewAll", locale)}</span>
              </Jump>
            }
          />
          <div className={s.seasonGrid}>
            {THEMES.map((x) => (
              <button
                key={x.key}
                aria-pressed={filters.theme === x.key}
                onClick={() => choose("theme", x.key)}
              >
                <ArtIcon slot={`seasons.${x.key}`} index={x.icon} />
                <strong>{tr(x.title, locale)}</strong>
              </button>
            ))}
          </div>
        </section>
      </div>
      <div className={s.lowerPanels} data-documents-section="activity">
        <section>
          <Heading slot="rankings"
            icon={7}
            title={tr(
              [
                "Most Downloaded Documents",
                "Documents les plus téléchargés",
                "الوثائق الأكثر تنزيلاً",
              ],
              locale,
            )}
            action={
              <Jump
                onClick={() => {
                  reset();
                  explore();
                }}
              >
                {t("viewAll", locale)}
              </Jump>
            }
          />
          {data.ranked.length ? (
            <ol className={s.ranked}>
              {data.ranked.map((r, i) => (
                <li key={r.key}>
                  <b>{i + 1}</b>
                  <Link href={documentDetailHref(r)}>
                    {r.image ? (
                      <img
                        data-imagery-owner="resource-owned" data-imagery-record={r.id} src={r.image}
                        alt=""
                        width={40}
                        height={35}
                        loading="lazy"
                      />
                    ) : (
                      <ArtIcon index={0} />
                    )}
                    <span>{r.title}</span>
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <p className={s.smallEmpty}>
              {tr(
                [
                  "Rankings appear after document files have been served.",
                  "Le classement apparaîtra après les premiers fichiers délivrés.",
                  "يظهر الترتيب بعد تقديم ملفات الوثائق.",
                ],
                locale,
              )}
            </p>
          )}
        </section>
        <section>
          <Heading slot="feedback"
            icon={13}
            title={tr(
              [
                "What Educators Say",
                "Les éducateurs témoignent",
                "آراء المربين",
              ],
              locale,
            )}
            action={
              testimonial ? (
                <Jump onClick={() => setDirectory("feedback")}>
                  {t("viewAll", locale)}
                </Jump>
              ) : undefined
            }
          />
          {testimonial ? (
            <>
              <div className={s.testimonial} aria-live="polite">
                <div className={s.testimonialTop}>
                  {testimonial.portrait ? (
                    <img
                      src={testimonial.portrait}
                      alt={testimonial.name}
                      width={80}
                      height={80}
                      loading="lazy"
                    />
                  ) : (
                    <span className={s.initials} aria-hidden="true">
                      {testimonial.name.slice(0, 1)}
                    </span>
                  )}
                  <div>
                    <Stars rating={testimonial.rating} />
                    <blockquote>“{testimonial.body}”</blockquote>
                  </div>
                </div>
                <p>
                  <strong>{testimonial.name}</strong>
                  <small>{testimonial.role}</small>
                </p>
              </div>
              <div className={s.testimonialDots}>
                {data.testimonials.map((x, i) => (
                  <button
                    key={x.id}
                    aria-label={
                      tr(["Testimonial", "Témoignage", "شهادة"], locale) +
                      " " +
                      (i + 1)
                    }
                    aria-pressed={feedback === i}
                    onClick={() => setFeedback(i)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className={s.testimonialEmpty}>
              <ArtIcon slot="feedback.empty" index={14} />
              <p>
                {tr(
                  [
                    "Published educator feedback will appear here once approved with permission.",
                    "Les témoignages apparaîtront après validation et autorisation de publication.",
                    "تظهر آراء المربين بعد اعتمادها والحصول على إذن النشر.",
                  ],
                  locale,
                )}
              </p>
            </div>
          )}
        </section>
        <section>
          <Heading slot="today"
            icon={25}
            title={tr(
              [
                "Free Document Downloads Today",
                "Téléchargements du jour",
                "تنزيلات الوثائق اليوم",
              ],
              locale,
            )}
            action={
              <button
                className={s.live}
                aria-pressed={refresh}
                onClick={() => setRefresh((v) => !v)}
              >
                <span />
                {tr(
                  refresh
                    ? ["Live updates", "Actualisation", "تحديثات مباشرة"]
                    : ["Updates paused", "En pause", "التحديثات متوقفة"],
                  locale,
                )}
              </button>
            }
          />
          {data.today.length ? (
            <div className={s.todayGrid}>
              {data.today.map((r) => (
                <Link key={r.key} href={documentDetailHref(r)}>
                  {r.image ? (
                    <img
                      data-imagery-owner="resource-owned" data-imagery-record={r.id} src={r.image}
                      alt=""
                      width={110}
                      height={130}
                      loading="lazy"
                    />
                  ) : (
                    <ArtIcon index={0} />
                  )}
                  <strong>{r.title}</strong>
                  <small>
                    {count(r.todayDownloads, locale)}{" "}
                    {tr(["downloads", "téléchargements", "تنزيلات"], locale)}
                  </small>
                </Link>
              ))}
            </div>
          ) : (
            <p className={s.smallEmpty}>
              {tr(
                [
                  "No document downloads recorded today yet.",
                  "Aucun téléchargement enregistré aujourd’hui pour le moment.",
                  "لم تسجل تنزيلات وثائق اليوم بعد.",
                ],
                locale,
              )}
            </p>
          )}
          <small className={s.metricNote}>
            {tr(
              [
                "Downloads today · UTC · updated every minute",
                "Téléchargements du jour · UTC · actualisés chaque minute",
                "تنزيلات اليوم · UTC · تحدث كل دقيقة",
              ],
              locale,
            )}
          </small>
        </section>
      </div>
      {directory ? (
        <Modal
          locale={locale}
          title={tr(
            directory === "packs"
              ? [
                  "All Document Packs",
                  "Toutes les collections",
                  "كل مجموعات الوثائق",
                ]
              : directory === "needs"
                ? [
                    "Browse by Need",
                    "Explorer selon vos besoins",
                    "تصفح حسب الحاجة",
                  ]
                : directory === "feedback"
                  ? [
                      "Educator Feedback",
                      "Témoignages des éducateurs",
                      "آراء المربين",
                    ]
                  : [
                      "Document Categories",
                      "Catégories de documents",
                      "فئات الوثائق",
                    ],
            locale,
          )}
          onClose={() => setDirectory(null)}
        >
          <div className={s.directoryModal}>
            {directory === "feedback" ? (
              data.testimonials.map((v) => (
                <article key={v.id}>
                  <Stars rating={v.rating} />
                  <blockquote>“{v.body}”</blockquote>
                  <strong>{v.name}</strong>
                  <small>{v.role}</small>
                  <a
                    href={v.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {tr(
                      ["Original source", "Source originale", "المصدر الأصلي"],
                      locale,
                    )}{" "}
                    ↗
                  </a>
                </article>
              ))
            ) : directory === "packs" ? (
              data.collections.length ? (
                data.collections.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      fromDirectory("collection", c.id);
                    }}
                  >
                    <ArtIcon index={23} />
                    <span>
                      <strong>{c.title}</strong>
                      <small>
                        {c.rows.length}{" "}
                        {tr(
                          [
                            "published documents",
                            "documents publiés",
                            "وثائق منشورة",
                          ],
                          locale,
                        )}
                      </small>
                    </span>
                    <I name="ArrowRight" />
                  </button>
                ))
              ) : (
                <p>
                  {tr(
                    [
                      "No curated document packs are published yet.",
                      "Aucune collection documentaire publiée pour le moment.",
                      "لا توجد مجموعات وثائق منشورة بعد.",
                    ],
                    locale,
                  )}
                </p>
              )
            ) : (
              <>
                {(directory === "needs" ? NEEDS : [...SUBTYPES, ...USES]).map(
                  (x) => (
                    <button
                      key={x.key}
                      onClick={() => {
                        fromDirectory(
                          directory === "needs"
                            ? "need"
                            : SUBTYPES.some((v) => v.key === x.key)
                              ? "subtype"
                              : "use",
                          x.key,
                        );
                      }}
                    >
                      <ArtIcon slot={`directory.${directory}.${x.key}`} index={x.icon} />
                      <strong>{tr(x.title, locale)}</strong>
                      <I name="ArrowRight" />
                    </button>
                  ),
                )}
              </>
            )}
          </div>
        </Modal>
      ) : null}
      <dialog
        className={s.downloadDialog}
        ref={dialog}
        onCancel={() => setDownload(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setDownload(null);
        }}
        aria-labelledby="document-download-title"
      >
        {download ? (
          <>
            <button
              className={s.dialogClose}
              onClick={() => setDownload(null)}
              aria-label={tr(["Close", "Fermer", "إغلاق"], locale)}
            >
              <I name="X" />
            </button>
            <h2 id="document-download-title">{download.title}</h2>
            <p>
              {tr(
                [
                  "Choose a PDF or image to download.",
                  "Choisissez le PDF ou l’image à télécharger.",
                  "اختر ملف PDF أو صورة للتنزيل.",
                ],
                locale,
              )}
            </p>
            {download.outputs.map((o) => (
              <a
                key={o.id}
                className={s.fileOption}
                href={
                  "/api/kidflix/documents/download?" +
                  new URLSearchParams({
                    locale: download.contentLocale,
                    key: download.key,
                    output: o.id,
                    release: download.releaseId || "",
                  })
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                <I name="Download" />
                {o.label}
                <small>{o.mime === "application/pdf" ? "PDF" : "PNG"}</small>
              </a>
            ))}
          </>
        ) : null}
      </dialog>
    </div>
  );
}
