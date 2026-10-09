"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  ArrowUpRight,
  Check,
  Compass,
  Heart,
  Layers3,
  Pause,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import type {
  CatalogLocale,
  StorefrontExperience,
} from "../catalog-discovery/types";
import { storefrontHero } from "../catalog-discovery/content";
import {
  C,
  PROFILES,
  isImmersiveKey,
  photo,
  tr,
  w,
  type ImmersiveKey,
} from "./content";
import {
  ageRange,
  availabilityLabel,
  baseHref,
  canonicalItems,
  canonicalSubset,
  configuration,
  filterItems,
  INITIAL_FILTERS,
  itemHref,
  priceLabel,
  publicContents,
  safeHref,
  searchHref,
  text,
  type Filters,
} from "./contract";
import { emptyNative, type NativeContext } from "./native-context";
import { Action, Empty, Head, OfferCard, Photo, Rail } from "./ExperienceUI";
import { SignatureExperience } from "./SignatureExperiences";
import { useSelections } from "./useSelections";
import { EducationalDiscovery } from "../business-worlds/EducationalDiscovery";
import s from "./storefront.module.css";

const relatedLabel = (key: string, locale: CatalogLocale) =>
  key in PROFILES
    ? tr(PROFILES[key as ImmersiveKey].label, locale)
    : tr(
        key === "families"
          ? w("Familles", "Families", "العائلات")
          : w("Services à domicile", "Home Services", "الخدمات المنزلية"),
        locale,
      );
const relatedPhoto = (key: string) =>
  key in PROFILES
    ? PROFILES[key as ImmersiveKey].photo
    : key === "families"
      ? "family"
      : "care";
export function ImmersiveStorefront({
  experience,
  native = emptyNative(),
  builtinWorldId = null,
}: {
  experience: StorefrontExperience;
  native?: NativeContext;
  builtinWorldId?: string | null;
}) {
  if (!isImmersiveKey(experience.key)) return null;
  return (
    <World
      experience={experience}
      native={native}
      worldKey={experience.key}
      builtinWorldId={builtinWorldId}
    />
  );
}
function World({
  experience,
  native,
  worldKey,
  builtinWorldId,
}: {
  experience: StorefrontExperience;
  native: NativeContext;
  worldKey: ImmersiveKey;
  builtinWorldId: string | null;
}) {
  const { locale } = experience,
    profile = PROFILES[worldKey],
    t = (value: Parameters<typeof tr>[0]) => tr(value, locale),
    base = baseHref(locale);
  const items = useMemo(() => canonicalItems(experience), [experience]),
    selection = useSelections(experience, items);
  const featured = useMemo(
    () => canonicalSubset(items, experience.featured),
    [items, experience.featured],
  );
  const spotlight = featured.length ? featured : items.slice(0, 8);
  const collections = useMemo(
    () =>
      experience.collections.map((collection) => ({
        ...collection,
        items: canonicalSubset(items, collection.items),
      })),
    [experience.collections, items],
  );
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS),
    [limit, setLimit] = useState(18),
    [collectionId, setCollectionId] = useState(""),
    [continuation, setContinuation] = useState<"saved" | "recent">("saved"),
    [nativeLimit, setNativeLimit] = useState(8);
  const results = useMemo(() => filterItems(items, filters), [items, filters]),
    collection =
      collections.find((c) => c.id === collectionId) || collections[0];
  const [chapter, setChapter] = useState(0),
    [paused, setPaused] = useState(false),
    [reduced, setReduced] = useState(true),
    [activeSection, setActiveSection] = useState("sf-top"),
    [progress, setProgress] = useState(0);
  const root = useRef<HTMLDivElement>(null),
    story = useRef<HTMLElement>(null),
    [storyVisible, setStoryVisible] = useState(false);
  const initial = storefrontHero(worldKey, locale),
    copy = native.copy,
    config = experience.experienceConfig || {};
  const title =
    text(copy.title) ||
    (experience.hero.title !== initial.title ? experience.hero.title : "") ||
    t(profile.title);
  const lead =
    text(copy.lead) ||
    (experience.hero.lead !== initial.lead ? experience.hero.lead : "") ||
    t(profile.lead);
  const primary = safeHref(copy.primary_cta_href, `${base}/${profile.primary}`),
    primaryLabel = text(copy.primary_cta_label) || t(profile.primaryLabel);
  const chapters = profile.chapters,
    currentChapter = chapters[chapter],
    kinds = [...new Set(items.map((item) => item.kind))],
    statuses = [
      ...new Set(items.map((item) => item.availability_status).filter(Boolean)),
    ];
  const trustLabels = [
    ...new Set(items.flatMap((item) => item.trust_labels)),
  ].slice(0, 12);
  const setFilter = (key: keyof Filters, value: string) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setLimit(18);
  };
  const nav = [
    ["sf-top", profile.label],
    ["sf-signature", profile.signature],
    ["sf-catalogue", C.catalogue],
    ["sf-collections", C.collections],
    ["sf-journey", C.journey],
    ["sf-compare", C.compare],
    ["sf-continue", C.continue],
  ] as const;
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)"),
      update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!root.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.entered = "true";
            if (entry.target.id) setActiveSection(entry.target.id);
          }
      },
      { rootMargin: "-160px 0px -45% 0px", threshold: 0 },
    );
    root.current
      .querySelectorAll("[data-storefront-module]")
      .forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [worldKey]);
  useEffect(() => {
    if (!story.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => setStoryVisible(entries.some((e) => e.isIntersecting)),
      { threshold: 0.15 },
    );
    observer.observe(story.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (paused || reduced || !storyVisible) return;
    const timer = window.setInterval(() => {
      if (!document.hidden)
        setChapter((previous) => (previous + 1) % chapters.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [paused, reduced, storyVisible, chapters.length]);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const height = document.documentElement.scrollHeight - innerHeight;
        setProgress(
          height > 0 ? Math.min(1, Math.max(0, scrollY / height)) : 0,
        );
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      cancelAnimationFrame(frame);
    };
  }, []);
  const activeNav = nav.some(([id]) => id === activeSection)
    ? activeSection
    : activeSection === "sf-featured"
      ? "sf-top"
      : activeSection === "sf-editorial"
        ? "sf-signature"
        : activeSection === "sf-resources"
          ? "sf-signature"
          : activeSection === "sf-faq"
            ? "sf-journey"
            : "sf-catalogue";
  const filterActive = Object.keys(INITIAL_FILTERS).some(
    (key) =>
      filters[key as keyof Filters] !== INITIAL_FILTERS[key as keyof Filters],
  );
  const continued = (
    continuation === "saved" ? selection.saved : selection.recent
  ).flatMap((id) =>
    items.find((i) => i.id === id) ? [items.find((i) => i.id === id)!] : [],
  );
  const visibleSections = (experience.storefrontSections || []).filter(
    (section) =>
      section.visible !== false &&
      ["editorial", "cta"].includes(String(section.type)),
  );
  const brandStyle = {
    "--accent": profile.color,
    "--companion": profile.companion,
  } as CSSProperties;
  return (
    <div
      className={s.world}
      style={brandStyle}
      ref={root}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-immersive-storefront={worldKey}
      data-version="saturated-worlds-r1"
      data-ac-storefront-key={worldKey}
      data-ac-storefront-runtime="immersive-native"
      data-ac-pea-built-in-storefront={builtinWorldId || undefined}
      data-motion={!reduced}
    >
      <div className={s.campaign}>
        <Sparkles size={15} />
        <span>{t(profile.eyebrow)}</span>
        <Link href={primary}>
          {primaryLabel}
          <ArrowUpRight size={14} />
        </Link>
      </div>
      <section
        className={s.hero}
        id="sf-top"
        data-storefront-module="hero"
        data-hero-world={worldKey}
      >
        <div className={s.heroCopy}>
          <span className={s.eyebrow}>
            <i />
            ANGELCARE · {t(profile.label)}
          </span>
          <h1>{title}</h1>
          <p>{lead}</p>
          <div className={s.heroActions}>
            <Action href="#sf-catalogue">{t(C.explore)}</Action>
            <Action href={primary} soft>
              {primaryLabel}
            </Action>
          </div>
          <div className={s.heroSignals}>
            <span>
              <Layers3 size={14} />
              <b>{items.length}</b> {t(C.published)}
            </span>
            <span>
              <Compass size={14} />
              {t(C.discover)}
            </span>
            <Link href={`${base}/trust`}>
              <ShieldCheck size={14} />
              {t(C.conditions)}
            </Link>
          </div>
        </div>
        <div className={s.heroVisual}>
          <Photo
            src={offerMediaOrEditorial(copy.media_url, profile.photo)}
            alt={t(profile.label)}
            priority
          />
          <div className={s.heroCaption}>
            <span>{t(profile.eyebrow)}</span>
            <strong>{t(profile.signature)}</strong>
          </div>
          <div className={s.heroSpark}>
            <Sparkles size={20} />
          </div>
        </div>
        <aside className={s.heroShelf}>
          {spotlight.slice(0, 2).map((item) => (
            <Link
              key={item.id}
              href={itemHref(item, locale)}
              onClick={() => selection.remember(item.id)}
              className={s.heroOffer}
            >
              <Photo
                src={item.media_url}
                alt={item.media_url ? item.name : t(C.noMedia)}
                contain
              />
              <div>
                <span>{t(C[item.kind])}</span>
                <strong>{item.name}</strong>
                <b>{priceLabel(item, locale)}</b>
                <ArrowUpRight size={16} />
              </div>
            </Link>
          ))}
          {!spotlight.length ? (
            <>
              <Photo
                src={photo(profile.secondaryPhoto)}
                alt={t(profile.signature)}
              />
              <div className={s.heroEmpty}>
                <span>{t(C.discover)}</span>
                <strong>{t(profile.chapters[1].title)}</strong>
                <Link href="#sf-signature">
                  {t(C.prepare)}
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </>
          ) : null}
        </aside>
      </section>
      <nav className={s.chapterNav} aria-label={t(profile.label)}>
        <div>
          {nav.map(([id, label]) => (
            <a
              href={`#${id}`}
              key={id}
              aria-current={activeNav === id ? "location" : undefined}
            >
              {t(label)}
              {id === "sf-compare" && selection.compared.length ? (
                <b>{selection.compared.length}</b>
              ) : null}
            </a>
          ))}
        </div>
        <span
          className={s.readProgress}
          style={{ transform: `scaleX(${progress})` }}
        />
      </nav>
      <div className={s.body}>
        <section className={s.topicsSection} data-storefront-module="topics">
          <Head number="01" title={t(C.topics)} lead={t(profile.lead)} />
          <div className={s.topicGrid}>
            {profile.topics.map((topic, index) => (
              <button
                type="button"
                key={topic.query}
                className={s.topicTile}
                data-tone={index}
                onClick={() => {
                  setFilters({ ...INITIAL_FILTERS, query: topic.query });
                  setLimit(18);
                  document
                    .getElementById("sf-catalogue")
                    ?.scrollIntoView({
                      behavior: reduced ? "instant" : "smooth",
                    });
                }}
              >
                <Photo src={photo(topic.photo)} alt="" />
                <div>
                  <span>
                    0{index + 1}
                    <ArrowUpRight size={16} />
                  </span>
                  <h3>{t(topic.label)}</h3>
                  <p>{t(topic.body)}</p>
                  <small>
                    {t(
                      w(
                        "Chercher dans cet univers",
                        "Search this universe",
                        "البحث في هذا العالم",
                      ),
                    )}
                  </small>
                </div>
              </button>
            ))}
          </div>
        </section>
        <section
          className={s.featuredSection}
          id="sf-featured"
          data-storefront-module="featured"
        >
          <Head
            number="02"
            title={
              text(config.featured_title) ||
              t(featured.length ? C.featured : C.catalogue)
            }
          >
            <Action href="#sf-catalogue" soft>
              {t(C.all)}
            </Action>
          </Head>
          {experience.filterConfig?.show_featured !== false &&
          spotlight.length ? (
            <Rail id="sf-featured-rail" locale={locale}>
              {spotlight.map((item) => (
                <OfferCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  selections={selection}
                />
              ))}
            </Rail>
          ) : (
            <Empty>{t(C.empty)}</Empty>
          )}
        </section>
        {worldKey === 'development' || worldKey === 'kits' || worldKey === 'academy' ? <EducationalDiscovery world={worldKey} locale={locale}/> : null}
        <section
          className={s.signatureSection}
          id="sf-signature"
          data-storefront-module="signature"
        >
          <Head
            number="03"
            title={t(profile.signature)}
            lead={t(profile.signatureLead)}
          />
          <SignatureExperience
            profile={profile}
            locale={locale}
            items={items}
            native={native}
          />
          {["establishments", "corporates", "quality-check"].includes(
            worldKey,
          ) ? (
            <p className={s.plannerNote}>{t(C.note)}</p>
          ) : null}
        </section>
        {worldKey === "health-partners" ? (
          <div className={s.healthBoundary}>
            <ShieldCheck size={21} />
            {t(C.nonMedical)}
          </div>
        ) : null}
        <section
          className={s.storySection}
          id="sf-editorial"
          ref={story}
          data-storefront-module="editorial"
        >
          <div className={s.storyPhoto}>
            <Photo
              src={photo(currentChapter.photo)}
              alt={t(currentChapter.title)}
            />
            <span className={s.storyNumber}>
              0{chapter + 1}
              <small>/ 03</small>
            </span>
          </div>
          <div className={s.storyCopy}>
            <span className={s.kicker}>{t(C.editorial)}</span>
            <h2>{t(currentChapter.title)}</h2>
            <p>{t(currentChapter.body)}</p>
            <Action href="#sf-catalogue">{t(C.explore)}</Action>
            <div className={s.storyControls}>
              <div role="group" aria-label={t(C.editorial)}>
                {chapters.map((c, index) => (
                  <button
                    type="button"
                    aria-label={t(c.title)}
                    aria-pressed={chapter === index}
                    key={index}
                    onClick={() => setChapter(index)}
                  >
                    0{index + 1}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={reduced}
                aria-label={t(paused ? C.play : C.pause)}
                aria-pressed={paused}
                onClick={() => setPaused((p) => !p)}
              >
                {paused || reduced ? <Play size={18} /> : <Pause size={18} />}
              </button>
            </div>
          </div>
        </section>
        <section
          className={s.catalogueSection}
          id="sf-catalogue"
          data-storefront-module="catalogue"
        >
          <Head
            number="04"
            title={text(config.inventory_title) || t(C.catalogue)}
            lead={`${items.length} ${t(C.published)}`}
          >
            <Action href={searchHref(experience)} soft>
              {t(C.all)}
            </Action>
          </Head>
          <div className={s.filterPanel}>
            <label className={s.searchBox}>
              <Search size={19} />
              <input
                type="search"
                aria-label={t(C.search)}
                placeholder={text(config.search_placeholder) || t(C.search)}
                value={filters.query}
                onChange={(event) => setFilter("query", event.target.value)}
              />
            </label>
            <label>
              {t(C.type)}
              <select
                value={filters.kind}
                onChange={(e) => setFilter("kind", e.target.value)}
              >
                <option value="all">{t(C.all)}</option>
                {kinds.map((kind) => (
                  <option value={kind} key={kind}>
                    {t(C[kind])}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t(C.availability)}
              <select
                value={filters.availability}
                onChange={(e) => setFilter("availability", e.target.value)}
              >
                <option value="all">{t(C.all)}</option>
                {statuses.map((status) => (
                  <option value={status} key={status}>
                    {availabilityLabel(
                      { ...items[0], availability_status: status },
                      locale,
                    )}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t(C.sort)}
              <select
                value={filters.sort}
                onChange={(e) => setFilter("sort", e.target.value)}
              >
                {[
                  ["recommended", C.recommended],
                  ["price_asc", C.priceAsc],
                  ["price_desc", C.priceDesc],
                  ["name", C.name],
                ].map(([key, label]) => (
                  <option key={String(key)} value={String(key)}>
                    {t(label as typeof C.name)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className={s.filterSummary} role="status">
            <span>
              <b>{results.length}</b> / {items.length} {t(C.published)}
            </span>
            {filterActive ? (
              <button
                type="button"
                onClick={() => {
                  setFilters(INITIAL_FILTERS);
                  setLimit(18);
                }}
              >
                <X size={14} />
                {t(C.reset)}
              </button>
            ) : null}
          </div>
          <div className={s.offerGrid}>
            {results.slice(0, limit).map((item) => (
              <OfferCard
                key={item.id}
                item={item}
                locale={locale}
                selections={selection}
              />
            ))}
          </div>
          {!results.length ? (
            <Empty>{t(items.length ? C.noMatch : C.empty)}</Empty>
          ) : null}
          {results.length > limit ? (
            <button
              className={s.loadMore}
              type="button"
              onClick={() => setLimit((previous) => previous + 18)}
            >
              {t(C.more)}
              <span>+{Math.min(18, results.length - limit)}</span>
            </button>
          ) : null}
        </section>
        <section
          className={s.collectionsSection}
          id="sf-collections"
          data-storefront-module="collections"
        >
          <Head number="05" title={t(C.collections)} />
          {experience.filterConfig?.show_collections !== false &&
          collections.length ? (
            <>
              <div
                className={s.collectionTabs}
                role="group"
                aria-label={t(C.collections)}
              >
                {collections.map((c) => (
                  <button
                    type="button"
                    aria-pressed={collection?.id === c.id}
                    key={c.id}
                    onClick={() => setCollectionId(c.id)}
                  >
                    {c.title}
                    <b>{c.items.length}</b>
                  </button>
                ))}
              </div>
              {collection ? (
                <div className={s.collectionFrame}>
                  <div className={s.collectionIntro}>
                    <span>{t(C.collections)}</span>
                    <h3>{collection.title}</h3>
                    <p>{collection.subtitle}</p>
                  </div>
                  {collection.items.length ? (
                    <Rail id="sf-collection-rail" locale={locale}>
                      {collection.items.map((item) => (
                        <OfferCard
                          key={item.id}
                          item={item}
                          locale={locale}
                          selections={selection}
                        />
                      ))}
                    </Rail>
                  ) : (
                    <Empty>{t(C.empty)}</Empty>
                  )}
                </div>
              ) : null}
            </>
          ) : (
            <div className={s.collectionEmpty}>
              <Layers3 size={38} />
              <div>
                <h3>
                  {t(
                    w(
                      "Votre prochaine collection commence par une découverte",
                      "Your next collection starts with discovery",
                      "مجموعتكم القادمة تبدأ بالاكتشاف",
                    ),
                  )}
                </h3>
                <p>
                  {t(
                    w(
                      "Les collections publiées dans cet univers apparaissent ici. En attendant, explorez les offres et conservez vos favoris.",
                      "Published collections for this universe appear here. Meanwhile, explore offers and save favourites.",
                      "تظهر المجموعات المنشورة هنا. استكشفوا العروض واحفظوا المفضلة في الأثناء.",
                    ),
                  )}
                </p>
                <Action href="#sf-catalogue" soft>
                  {t(C.explore)}
                </Action>
              </div>
            </div>
          )}
        </section>
        <section
          className={s.resourcesSection}
          id="sf-resources"
          data-storefront-module="resources"
        >
          <Head number="06" title={t(C.resources)} lead={t(C.nativeLead)} />
          <div className={s.resourceGrid}>
            {native.resources.slice(0, nativeLimit).map((resource) => (
              <article
                className={s.resourceCard}
                key={`${resource.kind}-${resource.id}`}
              >
                <span>{t(C.discover)}</span>
                <h3 lang={resource.sourceLocale}>{resource.title}</h3>
                <p lang={resource.sourceLocale}>{resource.body}</p>
                <div className={s.trustTags}>
                  {resource.facts.slice(0, 8).map((fact, index) => (
                    <span key={index}>{fact}</span>
                  ))}
                </div>
                <Action href={resource.href} soft>
                  {t(C.discover)}
                </Action>
              </article>
            ))}
          </div>
          {!native.resources.length ? (
            <div className={s.resourceFallback}>
              <Photo src={photo(profile.secondaryPhoto)} alt="" />
              <div>
                <h3>{t(profile.chapters[1].title)}</h3>
                <p>{t(profile.chapters[1].body)}</p>
                <Action href={primary}>{primaryLabel}</Action>
              </div>
            </div>
          ) : null}
          {native.resources.length > nativeLimit ? (
            <button
              className={s.loadMore}
              type="button"
              onClick={() => setNativeLimit((n) => n + 8)}
            >
              {t(C.more)}
            </button>
          ) : null}
        </section>
        {native.editorial.length || visibleSections.length ? (
          <section
            className={s.publishedEditorial}
            data-storefront-module="published-editorial"
          >
            {native.editorial.map((section) => (
              <article key={section.id} data-layout={section.layout}>
                {section.media ? (
                  <Photo src={section.media} alt={section.title} />
                ) : null}
                <div>
                  <span className={s.kicker}>{section.eyebrow}</span>
                  <h2>{section.title}</h2>
                  <p>{section.body}</p>
                  {section.href ? (
                    <Action href={section.href} soft>
                      {section.label || t(C.discover)}
                    </Action>
                  ) : null}
                </div>
              </article>
            ))}
            {visibleSections.map((section, index) => (
              <article key={String(section.key || index)}>
                <div>
                  <h2>{text(section.title)}</h2>
                  <p>{text(section.body)}</p>
                  {section.type === "cta" ? (
                    <Action href={safeHref(section.cta_href, primary)}>
                      {text(section.cta_label) || primaryLabel}
                    </Action>
                  ) : null}
                </div>
              </article>
            ))}
          </section>
        ) : null}
        <section
          className={s.journeySection}
          id="sf-journey"
          data-storefront-module="journey"
        >
          <Head
            number="07"
            title={t(C.journey)}
            lead={t(profile.signatureLead)}
          />
          <div className={s.stepGrid}>
            {profile.steps.map((step, index) => (
              <article key={index}>
                <span>0{index + 1}</span>
                <div>
                  <h3>{t(step)}</h3>
                  <p>{t(profile.topics[index].body)}</p>
                </div>
                <Check size={18} />
              </article>
            ))}
          </div>
          <div className={s.journeyAction}>
            <p>{t(C.note)}</p>
            <Action href={primary}>{primaryLabel}</Action>
          </div>
        </section>
        <section className={s.trustSection} data-storefront-module="trust">
          <div>
            <ShieldCheck size={34} />
            <h2>{t(C.trust)}</h2>
            <p>{t(C.trustLead)}</p>
            <Action href={`${base}/trust`} soft>
              {t(C.conditions)}
            </Action>
          </div>
          <div className={s.evidenceGrid}>
            {[C.contents, C.price, C.availability, C.conditions].map(
              (label, index) => (
                <article key={index}>
                  <span>0{index + 1}</span>
                  <h3>{t(label)}</h3>
                  <p>
                    {t(
                      [
                        w(
                          "Le contenu renseigné sur chaque fiche.",
                          "Content provided on each offer page.",
                          "المحتوى المذكور في كل صفحة.",
                        ),
                        w(
                          "Les tarifs et unités publiés sur l’offre.",
                          "Prices and units published on the offer.",
                          "الأسعار والوحدات المنشورة.",
                        ),
                        w(
                          "Le statut de l’offre et les conditions du parcours.",
                          "Offer status and journey conditions.",
                          "حالة العرض وشروط المسار.",
                        ),
                        w(
                          "Le périmètre et les modalités avant l’engagement.",
                          "Scope and terms before commitment.",
                          "النطاق والشروط قبل الالتزام.",
                        ),
                      ][index],
                    )}
                  </p>
                </article>
              ),
            )}
          </div>
          {trustLabels.length ? (
            <div className={s.actualTrust}>
              {trustLabels.map((label) => (
                <span key={label}>
                  <ShieldCheck size={13} />
                  {label}
                </span>
              ))}
            </div>
          ) : null}
        </section>
        <section
          className={s.comparisonSection}
          id="sf-compare"
          data-storefront-module="comparison"
        >
          <Head number="08" title={t(C.compareTitle)} />
          {selection.compared.length ? (
            <div className={s.compareGrid}>
              {selection.compared.map((id) => {
                const item = items.find((i) => i.id === id);
                if (!item) return null;
                const config = configuration(item),
                  age = ageRange(item);
                return (
                  <article key={id}>
                    <button
                      type="button"
                      className={s.removeButton}
                      disabled={selection.pending.includes(`compare:${id}`)}
                      aria-label={`${t(C.remove)}: ${item.name}`}
                      onClick={() => void selection.select(id, "compare")}
                    >
                      <X size={17} />
                    </button>
                    <Photo src={item.media_url} alt={item.name} contain />
                    <h3>{item.name}</h3>
                    <dl>
                      <div>
                        <dt>{t(C.price)}</dt>
                        <dd>{priceLabel(item, locale)}</dd>
                      </div>
                      <div>
                        <dt>{t(C.age)}</dt>
                        <dd>
                          {age
                            ? `${age.min}–${age.max} ${t(C.years)}`
                            : t(C.unknown)}
                        </dd>
                      </div>
                      <div>
                        <dt>{t(C.format)}</dt>
                        <dd>
                          {text(config.format) ||
                            text(config.delivery_mode) ||
                            t(C.unknown)}
                        </dd>
                      </div>
                      <div>
                        <dt>{t(C.availability)}</dt>
                        <dd>{availabilityLabel(item, locale)}</dd>
                      </div>
                      <div>
                        <dt>{t(C.contents)}</dt>
                        <dd>
                          {publicContents(item).join(" · ") || t(C.unknown)}
                        </dd>
                      </div>
                    </dl>
                    <Action href={itemHref(item, locale)}>
                      {t(C.discover)}
                    </Action>
                  </article>
                );
              })}
            </div>
          ) : (
            <Empty>{t(C.compareEmpty)}</Empty>
          )}
        </section>
        <section
          className={s.continuationSection}
          id="sf-continue"
          data-storefront-module="continuation"
        >
          <Head number="09" title={t(C.continue)} />
          <div className={s.chips} role="group" aria-label={t(C.continue)}>
            {(["saved", "recent"] as const).map((type) => (
              <button
                type="button"
                key={type}
                aria-pressed={continuation === type}
                onClick={() => setContinuation(type)}
              >
                {t(type === "saved" ? C.save : C.recent)}
                <span>
                  {type === "saved"
                    ? selection.saved.length
                    : selection.recent.length}
                </span>
              </button>
            ))}
          </div>
          {continued.length ? (
            <Rail id="sf-continue-rail" locale={locale}>
              {continued.map((item) => (
                <OfferCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  selections={selection}
                />
              ))}
            </Rail>
          ) : (
            <Empty>
              {t(continuation === "saved" ? C.savedEmpty : C.recentEmpty)}
            </Empty>
          )}
        </section>
        <section className={s.relatedSection} data-storefront-module="related">
          <Head number="10" title={t(C.related)} />
          <div className={s.relatedGrid}>
            {profile.related.map((key, index) => (
              <Link key={key} href={`${base}/${key}`} data-tone={index}>
                <Photo src={photo(relatedPhoto(key))} alt="" />
                <div>
                  <span>ANGELCARE</span>
                  <h3>{relatedLabel(key, locale)}</h3>
                  <ArrowUpRight size={25} />
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section
          className={s.faqSection}
          id="sf-faq"
          data-storefront-module="faq"
        >
          <div>
            <span className={s.kicker}>ANGELCARE · {t(profile.label)}</span>
            <h2>{t(C.faq)}</h2>
            <p>{t(C.trustLead)}</p>
          </div>
          <div>
            {[
              [C.faq1, C.answer1],
              [C.faq2, C.answer2],
              [C.faq3, C.answer3],
            ].map(([question, answer], index) => (
              <details key={index}>
                <summary>
                  {t(question)}
                  <span>+</span>
                </summary>
                <p>{t(answer)}</p>
              </details>
            ))}
          </div>
        </section>
        <section className={s.finalSection} data-storefront-module="final">
          <Photo src={photo(profile.photo)} alt="" />
          <div>
            <span>{t(profile.eyebrow)}</span>
            <h2>{t(C.final)}</h2>
            <p>{t(profile.lead)}</p>
            <div className={s.heroActions}>
              <Action href={primary}>{primaryLabel}</Action>
              <Action href="#sf-catalogue" soft>
                {t(C.explore)}
              </Action>
            </div>
          </div>
        </section>
      </div>
      <div className={s.bottomDock}>
        <a href="#sf-catalogue">
          <Search size={16} />
          {t(C.explore)}
        </a>
        <a href="#sf-continue">
          <Heart size={16} />
          {selection.saved.length}
        </a>
        <Link href={primary}>
          {primaryLabel}
          <ArrowUpRight size={16} />
        </Link>
      </div>
      {selection.error ? (
        <div className={s.toast} role="alert">
          <span>
            {t(selection.error === "limit" ? C.compareLimit : C.selectionError)}
          </span>
          <button
            type="button"
            aria-label={t(C.remove)}
            onClick={selection.dismiss}
          >
            <X size={18} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
function offerMediaOrEditorial(value: unknown, key: string) {
  const href = safeHref(value, "");
  return href || photo(key);
}
