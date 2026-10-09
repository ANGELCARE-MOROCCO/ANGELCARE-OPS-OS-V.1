"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Compass,
  Heart,
  Pause,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  MapPin,
  BookOpen,
  PackageOpen,
  Clock,
  Layers,
  MessageCircle,
} from "lucide-react";
import type {
  HomepageExperience,
  HomepageItem,
} from "../../homepage-flagship/types";
import { getPublicStorefrontNavigation } from "../../public-experience-authority/storefront-navigation";
import { LIVING_MARKETPLACE_WORLD_ID } from "../world";
import {
  canonicalItems,
  canonicalSubset,
  canonicalCollections,
  developmentPool,
  professionalPool,
  matchesNeed,
  discover,
  INITIAL_DISCOVERY,
  matchesRhythm,
  matchesAge,
  matchesGoal,
  configuration,
  strings,
  detailHref,
  collectionHref,
  safeHref,
  canPurchase,
  showcaseItems,
  type Discovery,
  type Rhythm,
  type Goal,
  type Age,
} from "./contract";
import {
  C,
  NEEDS,
  RHYTHMS,
  AGES,
  GOALS,
  FAQ,
  words,
  translate,
  type Words,
} from "./content";
import {
  Action,
  Head,
  Empty,
  Photo,
  Rail,
  OfferRail,
  OfferCard,
  Chips,
  editorial,
  price,
  availability,
} from "./ExperienceUI";
import { useCommerce } from "./useCommerce";
import styles from "./immersive.module.css";

const WORLD_PHOTOS: Record<string, string> = {
  families: "family",
  "home-services": "care",
  development: "montessori",
  kits: "kits",
  academy: "homework",
  establishments: "preschool",
  hospitality: "hospitality",
  "health-partners": "support",
  corporates: "school",
  "partner-os": "digital",
  "quality-check": "support",
  professionals: "care",
};
const CHAPTERS = [
  {
    title: C.signature,
    image: "hero",
    world: "families",
    kicker: words(
      "VOTRE MONDE, EN PLUS GRAND",
      "YOUR WORLD, WITH MORE POSSIBILITY",
      "عالمكم بآفاق أوسع",
    ),
  },
  {
    title: C.growth,
    image: "montessori",
    world: "development",
    kicker: words(
      "PETITES DÉCOUVERTES. GRANDS HORIZONS.",
      "LITTLE DISCOVERIES. BIG HORIZONS.",
      "اكتشافات صغيرة وآفاق كبيرة",
    ),
  },
  {
    title: C.ambition,
    image: "school",
    world: "establishments",
    kicker: words(
      "DE L’IDÉE À LA NOUVELLE ÉCHELLE",
      "FROM AN IDEA TO BIGGER POSSIBILITIES",
      "من الفكرة إلى آفاق أوسع",
    ),
  },
] as const;

export function LivingCommerceHomepage({
  experience,
}: {
  experience: HomepageExperience;
}) {
  const { locale } = experience,
    t = (value: Words) => translate(value, locale),
    base = `/angelcare-marketplace/${locale}`,
    market = `${base}/marketplace`;
  const root = useRef<HTMLDivElement>(null),
    hero = useRef<HTMLElement>(null);
  const items = useMemo(() => canonicalItems(experience), [experience]),
    commerce = useCommerce(experience, items);
  const byId = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );
  const worlds = useMemo(() => getPublicStorefrontNavigation(locale), [locale]);
  const worldHref = (key: string) =>
    worlds.find((world) => world.key === key)?.href || market;
  const [chapter, setChapter] = useState(0),
    [paused, setPaused] = useState(false),
    [hover, setHover] = useState(false),
    [reduced, setReduced] = useState(true),
    [heroVisible, setHeroVisible] = useState(true),
    [visible, setVisible] = useState(true);
  const [activeSection, setActiveSection] = useState("home-worlds");
  const [filters, setFilters] = useState<Discovery>(INITIAL_DISCOVERY),
    [resultLimit, setResultLimit] = useState(14),
    [rhythm, setRhythm] = useState<Rhythm>("all"),
    [age, setAge] = useState<Age>("all"),
    [goal, setGoal] = useState<Goal>("all");
  const [kitId, setKitId] = useState(""),
    [selection, setSelection] = useState<"featured" | "picks" | "arrivals">(
      "featured",
    ),
    [categoryQuery, setCategoryQuery] = useState(""),
    [collectionId, setCollectionId] = useState(""),
    [continuation, setContinuation] = useState<"recent" | "saved">("recent"),
    [galleryKind, setGalleryKind] = useState<"all" | "product" | "kit">("all");
  const services = useMemo(
    () =>
      items.filter(
        (item) => item.kind === "service" && !matchesNeed(item, "professional"),
      ),
    [items],
  );
  const products = useMemo(
    () =>
      items.filter((item) => item.kind === "product" || item.kind === "kit"),
    [items],
  );
  const galleryItems = showcaseItems(
    products.filter(
      (item) => galleryKind === "all" || item.kind === galleryKind,
    ),
  );
  const kits = useMemo(
    () =>
      products.filter(
        (item) =>
          item.kind === "kit" ||
          ["montessori-development-kit", "activity-subscription-box"].includes(
            item.experience_schema_key ||
              String(item.metadata.experience_schema_key || ""),
          ),
      ),
    [products],
  );
  const development = useMemo(
    () => developmentPool(experience, items),
    [experience, items],
  );
  const academy = useMemo(
    () => items.filter((item) => item.kind === "training"),
    [items],
  );
  const organizations = useMemo(
    () => professionalPool(experience, items),
    [experience, items],
  );
  const results = useMemo(
    () => discover(items, filters, locale),
    [items, filters, locale],
  );
  const collections = useMemo(
    () => canonicalCollections(experience, items),
    [experience, items],
  );
  const currentCollection =
    collections.find((collection) => collection.id === collectionId) ||
    collections[0];
  const kit = kits.find((item) => item.id === kitId) || kits[0],
    components = kit ? strings(configuration(kit).components).slice(0, 12) : [];
  const selections = canonicalSubset(
    selection === "featured"
      ? experience.featuredItems
      : selection === "picks"
        ? experience.bestPickItems
        : experience.newArrivalItems,
    items,
  );
  const recentItems = commerce.recent.flatMap((id) =>
      byId.has(id) ? [byId.get(id)!] : [],
    ),
    savedItems = commerce.saved.flatMap((id) =>
      byId.has(id) ? [byId.get(id)!] : [],
    ),
    comparedItems = commerce.compared.flatMap((id) =>
      byId.has(id) ? [byId.get(id)!] : [],
    );
  const categories = experience.categories.filter((category) =>
    `${category.title} ${category.short_description || ""}`
      .toLocaleLowerCase(locale)
      .includes(categoryQuery.trim().toLocaleLowerCase(locale)),
  );
  const campaign = experience.campaigns[0],
    scene = CHAPTERS[chapter];
  // Mix storefront entrances with actual sellable offers; no invented hero products or prices.
  const heroOffers = [
    services[0],
    kits[0] || products[1],
    products.find((item) => item.id !== kits[0]?.id) || products[0],
  ]
    .filter((item): item is HomepageItem => !!item)
    .filter(
      (item, index, source) =>
        source.findIndex((candidate) => candidate.id === item.id) === index,
    );
  const playing = !paused && !hover && !reduced && heroVisible && visible;
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)"),
      motion = () => setReduced(media.matches),
      visibility = () => setVisible(!document.hidden);
    motion();
    visibility();
    media.addEventListener("change", motion);
    document.addEventListener("visibilitychange", visibility);
    const observer =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            ([entry]) => setHeroVisible(entry.isIntersecting),
            { threshold: 0.15 },
          )
        : null;
    if (hero.current) observer?.observe(hero.current);
    return () => {
      media.removeEventListener("change", motion);
      document.removeEventListener("visibilitychange", visibility);
      observer?.disconnect();
    };
  }, []);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () => setChapter((value) => (value + 1) % CHAPTERS.length),
      8000,
    );
    return () => window.clearInterval(timer);
  }, [playing]);
  useEffect(() => {
    if (reduced || typeof IntersectionObserver === "undefined") return;
    const nodes = root.current?.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-entered", "true");
            observer.unobserve(entry.target);
          }
        }),
      { rootMargin: "40px", threshold: 0.06 },
    );
    nodes?.forEach((node) => {
      if (node.getBoundingClientRect().top > innerHeight) {
        node.setAttribute("data-animated", "true");
        observer.observe(node);
      }
    });
    return () => {
      observer.disconnect();
      nodes?.forEach((node) => node.removeAttribute("data-animated"));
    };
  }, [reduced]);
  useEffect(() => setResultLimit(14), [filters]);
  useEffect(() => {
    const ids = [
      "home-worlds",
      "home-discovery",
      "home-services",
      "home-development",
      "home-kits",
      "home-professional",
    ];
    let frame = 0;
    const updateSection = () => {
      frame = 0;
      const nav = root.current?.querySelector("nav");
      const threshold = (nav?.getBoundingClientRect().bottom || 200) + 80;
      let current = ids[0];
      for (const id of ids) {
        const node = document.getElementById(id);
        if (node && node.getBoundingClientRect().top <= threshold) current = id;
      }
      setActiveSection((previous) =>
        previous === current ? previous : current,
      );
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(updateSection);
    };
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    updateSection();
    return () => {
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  const update = <K extends keyof Discovery>(key: K, value: Discovery[K]) =>
    setFilters((previous) => ({
      ...previous,
      [key]: value,
      ...(key === "need" && value !== "care" ? { rhythm: "all" as const } : {}),
    }));
  const selectNeed = (need: Discovery["need"]) => {
    setFilters({ ...INITIAL_DISCOVERY, need });
    document.getElementById("home-discovery")?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
  };
  const ageLabel = (value: Age) =>
    value === "all" ? t(C.all) : `${value} ${t(C.years)}`;
  const cards = (
    id: string,
    source: readonly HomepageItem[],
    href = market,
  ) => (
    <>
      <OfferRail
        id={id}
        items={source}
        locale={locale}
        commerce={commerce}
        href={href}
        label={t(C.discover)}
        limit={id === "home-discovery-results" ? resultLimit : 14}
      />
      {id === "home-discovery-results" && source.length > 14 ? (
        <div className={styles.continuationActions}>
          <span data-discovery-count>
            {Math.min(resultLimit, source.length)} / {source.length}
          </span>
          {resultLimit < source.length ? (
            <button
              className={styles.reset}
              type="button"
              onClick={() => setResultLimit((value) => value + 14)}
              aria-controls={id}
            >
              {t(
                words(
                  "Découvrir plus d’offres",
                  "Explore more offers",
                  "استكشفوا مزيدًا من العروض",
                ),
              )}
              <ArrowUpRight size={17} />
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
  const professionalKeys = [
    "establishments",
    "hospitality",
    "health-partners",
    "corporates",
  ];
  const rhythmItems = services.filter((item) => matchesRhythm(item, rhythm)),
    goalItems = showcaseItems(
      development.filter((item) => matchesGoal(item, goal)),
    ),
    ageItems = showcaseItems(products.filter((item) => matchesAge(item, age)));
  const activeFilters = [
    filters.need !== "all",
    filters.rhythm !== "all",
    filters.age !== "all",
    filters.goal !== "all",
    !!filters.query,
    !!filters.category,
    filters.available,
    filters.sort !== "curated",
  ].filter(Boolean).length;

  return (
    <div
      ref={root}
      className={styles.home}
      dir={locale === "ar" ? "rtl" : "ltr"}
      lang={locale}
      data-ac-home-world={LIVING_MARKETPLACE_WORLD_ID}
      data-home-version="r4-complete"
      data-home-visual="saturated-commerce"
      data-moving={playing}
    >
      <div className={styles.campaign} data-home-module="campaign">
        {campaign ? (
          <Link href={safeHref(campaign.primary_cta_href, market)}>
            <Sparkles size={15} aria-hidden="true" />
            <strong>{campaign.title}</strong>
            <span>{campaign.primary_cta_label}</span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        ) : (
          <>
            <Sparkles size={15} aria-hidden="true" />
            <span>
              {t(
                words(
                  "Une envie. Un univers. Une nouvelle possibilité.",
                  "An idea. A world. A new possibility.",
                  "فكرة وعالم وخيار جديد.",
                ),
              )}
            </span>
            <Link href="#home-worlds">
              {t(C.explore)}
              <ArrowUpRight size={15} />
            </Link>
          </>
        )}
      </div>

      <section
        ref={hero}
        className={styles.hero}
        data-home-module="hero"
        id="home-top"
        aria-label={t(C.signature)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocusCapture={() => setHover(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null))
            setHover(false);
        }}
      >
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>
            <span />
            {t(scene.kicker)}
          </span>
          <h1 key={chapter}>{t(scene.title)}</h1>
          <p>{t(C.heroLead)}</p>
          <div className={styles.heroActions}>
            <Action href={worldHref(scene.world)}>{t(C.explore)}</Action>
            <Action href="#home-discovery" soft>
              {t(C.discover)}
            </Action>
          </div>
          <div className={styles.heroPromises}>
            <span>
              <Compass size={17} />
              {t(
                words(
                  "Choisissez votre point de départ",
                  "Choose your starting point",
                  "اختاروا نقطة البداية",
                ),
              )}
            </span>
            <span>
              <Layers size={17} />
              FR · EN · AR
            </span>
          </div>
          <div
            className={styles.heroChapters}
            role="group"
            aria-label={t(
              words("Choisir une scène", "Choose a scene", "اختاروا مشهدًا"),
            )}
          >
            {CHAPTERS.map((value, index) => (
              <button
                type="button"
                key={value.world}
                aria-pressed={chapter === index}
                onClick={() => {
                  setChapter(index);
                  setPaused(true);
                }}
              >
                <span>0{index + 1}</span>
                {t(
                  index === 0
                    ? words("Vivre", "Live", "عيشوا")
                    : index === 1
                      ? words("Grandir", "Grow", "انموا")
                      : words("Entreprendre", "Build", "أنجزوا"),
                )}
              </button>
            ))}
            <button
              className={styles.playButton}
              type="button"
              aria-label={t(paused ? C.play : C.pause)}
              aria-pressed={paused}
              onClick={() => setPaused((value) => !value)}
            >
              {paused ? <Play size={17} /> : <Pause size={17} />}
            </button>
          </div>
        </div>
        <div className={styles.heroStage}>
          <div className={styles.heroPhoto} key={scene.image}>
            <Photo src={editorial(scene.image)} priority />
            <span className={styles.photoLabel}>{t(C.editorial)}</span>
            <span
              className={styles.heroProgress}
              key={chapter}
              aria-hidden="true"
            >
              <span />
            </span>
          </div>
          <div className={styles.heroOrb} aria-hidden="true" />
          <div className={styles.heroNote}>
            <span className={styles.noteIcon}>
              <Heart size={22} />
            </span>
            <span>
              <strong>
                {t(
                  words(
                    "La vie, en mieux entourée.",
                    "Life, with more support.",
                    "حياة بمزيد من الدعم.",
                  ),
                )}
              </strong>
              <small>
                {t(
                  words(
                    "Familles · Découvertes · Projets",
                    "Families · Discoveries · Projects",
                    "أسر واكتشافات ومشاريع",
                  ),
                )}
              </small>
            </span>
          </div>
          <div className={styles.heroCounter}>
            <strong>12</strong>
            <span>
              {t(
                words(
                  "univers à explorer",
                  "worlds to explore",
                  "عالمًا للاستكشاف",
                ),
              )}
            </span>
          </div>
          {heroOffers.length ? (
            <div className={styles.heroOffers} aria-label={t(C.discover)}>
              {heroOffers.map((item) => (
                <Link
                  className={styles.heroOffer}
                  key={item.id}
                  href={detailHref(locale, item)}
                  onClick={() => commerce.remember(item.id)}
                >
                  <Photo src={item.media_url} alt="" contain />
                  <span>
                    <strong>{item.name}</strong>
                    <small>{price(item, locale)}</small>
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
        <aside className={styles.heroSide}>
          {[
            { key: "home-services", image: "care", label: C.care },
            { key: "kits", image: "kits", label: C.kitFallback },
          ].map((value) => (
            <Link href={worldHref(value.key)} key={value.key}>
              <Photo src={editorial(value.image)} />
              <div>
                <span>
                  {worlds.find((world) => world.key === value.key)?.label}
                </span>
                <strong>{t(value.label)}</strong>
                <ArrowUpRight size={24} />
              </div>
            </Link>
          ))}
        </aside>
      </section>

      <section
        className={styles.actionStrip}
        data-home-module="actions"
        aria-label={t(C.discover)}
      >
        {NEEDS.slice(1).map((need, index) => (
          <button
            type="button"
            key={need.key}
            onClick={() => selectNeed(need.key)}
          >
            <span className={styles.actionNumber}>0{index + 1}</span>
            <span>
              <strong>{t(need.label)}</strong>
              <small>{t(need.text)}</small>
            </span>
            <ArrowUpRight size={18} />
          </button>
        ))}
      </section>
      <nav className={styles.sectionNav} aria-label={t(C.explore)}>
        {[
          { id: "home-worlds", label: C.explore },
          { id: "home-discovery", label: C.discover },
          { id: "home-services", label: C.service },
          {
            id: "home-development",
            label: words("Développement", "Development", "التطور"),
          },
          { id: "home-kits", label: C.kit },
          {
            id: "home-professional",
            label: words("Organisations", "Organisations", "المؤسسات"),
          },
        ].map((value) => (
          <a
            key={value.id}
            href={`#${value.id}`}
            aria-current={activeSection === value.id ? "location" : undefined}
          >
            {t(value.label)}
          </a>
        ))}
      </nav>

      <section
        className={styles.section}
        id="home-worlds"
        data-home-module="worlds"
        data-reveal
      >
        <Head
          number="01"
          title={C.worldsTitle}
          lead={C.worldsLead}
          locale={locale}
        />
        <div className={styles.worldGrid}>
          {worlds.map((world, index) => (
            <Link
              href={world.href}
              key={world.key}
              className={styles.world}
              data-accent={world.accent}
            >
              <div className={styles.worldPhoto}>
                <Photo src={editorial(WORLD_PHOTOS[world.key] || "family")} />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <strong>{world.label}</strong>
              <ArrowUpRight size={17} />
            </Link>
          ))}
        </div>
      </section>

      <section
        className={`${styles.section} ${styles.discovery}`}
        id="home-discovery"
        data-home-module="discovery"
        data-reveal
      >
        <Head
          number="02"
          title={C.discoveryTitle}
          lead={C.discoveryLead}
          locale={locale}
        >
          <button
            className={styles.reset}
            type="button"
            onClick={() => setFilters({ ...INITIAL_DISCOVERY })}
          >
            {t(C.reset)}
            {activeFilters ? <span>{activeFilters}</span> : null}
          </button>
        </Head>
        <div
          className={styles.needGrid}
          role="group"
          aria-label={t(C.discoveryTitle)}
        >
          {NEEDS.map((need) => (
            <button
              type="button"
              key={need.key}
              aria-pressed={filters.need === need.key}
              onClick={() => update("need", need.key)}
            >
              <span>{t(need.label)}</span>
              <small>{t(need.text)}</small>
              <ArrowUpRight size={18} />
            </button>
          ))}
        </div>
        <div className={styles.filterDeck}>
          <label className={styles.finderSearch}>
            <Search size={19} aria-hidden="true" />
            <input
              aria-label={t(C.search)}
              placeholder={t(C.search)}
              value={filters.query}
              onChange={(event) => update("query", event.target.value)}
            />
          </label>
          <label>
            {t(C.rhythm)}
            <select
              value={filters.rhythm}
              disabled={filters.need !== "all" && filters.need !== "care"}
              onChange={(event) =>
                update("rhythm", event.target.value as Rhythm)
              }
            >
              {RHYTHMS.map((value) => (
                <option value={value.key} key={value.key}>
                  {t(value.label)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t(C.age)}
            <select
              value={filters.age}
              onChange={(event) => update("age", event.target.value as Age)}
            >
              {AGES.map((value) => (
                <option key={value} value={value}>
                  {ageLabel(value)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t(C.goal)}
            <select
              value={filters.goal}
              onChange={(event) => update("goal", event.target.value as Goal)}
            >
              {GOALS.map((value) => (
                <option key={value.key} value={value.key}>
                  {t(value.label)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t(C.category)}
            <select
              value={filters.category}
              onChange={(event) => update("category", event.target.value)}
            >
              <option value="">{t(C.all)}</option>
              {experience.categories.map((value) => (
                <option value={value.category_key} key={value.id}>
                  {value.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t(C.sort)}
            <select
              value={filters.sort}
              onChange={(event) =>
                update("sort", event.target.value as Discovery["sort"])
              }
            >
              <option value="curated">{t(C.curated)}</option>
              <option value="price-low">{t(C.low)}</option>
              <option value="price-high">{t(C.high)}</option>
            </select>
          </label>
        </div>
        <div className={styles.resultsLine}>
          <p role="status" aria-live="polite">
            <strong>{results.length}</strong> {t(C.results)}
          </p>
          <label>
            <input
              type="checkbox"
              checked={filters.available}
              onChange={(event) => update("available", event.target.checked)}
            />
            {t(words("Disponibles uniquement", "Available only", "المتاح فقط"))}
          </label>
        </div>
        {cards("home-discovery-results", results)}
      </section>

      <section
        className={`${styles.section} ${styles.family}`}
        id="home-family"
        data-home-module="family"
        data-reveal
      >
        <Head
          number="03"
          title={C.familyTitle}
          lead={C.familyLead}
          locale={locale}
        >
          <Action href={worldHref("families")} soft>
            {worlds[0]?.label || t(C.explore)}
          </Action>
        </Head>
        <div className={styles.familyMosaic}>
          <Link className={styles.familyMain} href={worldHref("families")}>
            <Photo src={editorial("family")} />
            <div>
              <span>{t(C.editorial)}</span>
              <h3>
                {t(
                  words(
                    "Le temps ensemble a quelque chose de précieux.",
                    "Time together has something precious.",
                    "للوقت معًا قيمة خاصة.",
                  ),
                )}
              </h3>
              <span>
                {t(C.explore)}
                <ArrowUpRight size={20} />
              </span>
            </div>
          </Link>
          <button
            type="button"
            className={styles.babyTile}
            onClick={() => selectNeed("baby")}
          >
            <Photo src={editorial("support")} />
            <span>
              <small>{t(NEEDS[2].label)}</small>
              <strong>
                {t(
                  words(
                    "Les premiers jours. Mieux entourés.",
                    "The first days. More supported.",
                    "الأيام الأولى بمزيد من الدعم.",
                  ),
                )}
              </strong>
              <ArrowUpRight size={25} />
            </span>
          </button>
          <Link className={styles.playTile} href={worldHref("development")}>
            <Photo src={editorial("games")} />
            <div>
              <span>
                {t(
                  words(
                    "À hauteur d’enfant",
                    "Through a child’s eyes",
                    "بعيون الطفل",
                  ),
                )}
              </span>
              <strong>{t(C.growth)}</strong>
              <ArrowUpRight size={23} />
            </div>
          </Link>
          <div className={styles.familyQuote}>
            <Sparkles size={24} />
            <blockquote>
              {t(
                words(
                  "Plus de moments à vivre. Plus de choses à découvrir.",
                  "More moments to live. More things to discover.",
                  "لحظات أكثر للعيش وأشياء أكثر للاكتشاف.",
                ),
              )}
            </blockquote>
            <Action href={worldHref("kits")} soft>
              {t(C.kit)}
            </Action>
          </div>
        </div>
      </section>

      <section
        className={`${styles.section} ${styles.serviceSection}`}
        id="home-services"
        data-home-module="services"
        data-reveal
      >
        <div className={styles.serviceIntro}>
          <Photo src={editorial("care")} />
          <div>
            <span className={styles.eyebrow}>{t(C.service)}</span>
            <h2>{t(C.serviceTitle)}</h2>
            <p>{t(C.serviceLead)}</p>
            <Action href={worldHref("home-services")}>{t(C.explore)}</Action>
            <span className={styles.photoLabel}>{t(C.editorial)}</span>
          </div>
        </div>
        <div className={styles.serviceShelf}>
          <div className={styles.shelfTitle}>
            <Clock size={20} />
            <strong>
              {t(
                words(
                  "Votre relais, selon votre besoin",
                  "Your support, for your needs",
                  "الدعم حسب احتياجكم",
                ),
              )}
            </strong>
            <Link href={worldHref("home-services")}>
              {t(C.all)}
              <ArrowUpRight size={17} />
            </Link>
          </div>
          {cards("home-service-shelf", services, worldHref("home-services"))}
        </div>
      </section>

      <section
        className={`${styles.section} ${styles.rhythmSection}`}
        id="home-rhythms"
        data-home-module="rhythms"
        data-reveal
      >
        <Head
          number="05"
          title={C.rhythmTitle}
          lead={C.rhythmLead}
          locale={locale}
        />
        <div
          className={styles.rhythmTrack}
          role="group"
          aria-label={t(C.rhythm)}
        >
          {RHYTHMS.map((value, index) => (
            <button
              type="button"
              key={value.key}
              aria-pressed={value.key === rhythm}
              onClick={() => setRhythm(value.key)}
            >
              <span>0{index + 1}</span>
              <strong>{t(value.label)}</strong>
              <small>
                {value.key === "all"
                  ? services.length
                  : services.filter((item) => matchesRhythm(item, value.key))
                      .length}{" "}
                {t(words("offres", "offers", "عروض"))}
              </small>
            </button>
          ))}
        </div>
        <div className={styles.rhythmResults} role="status">
          {rhythmItems.length} {t(C.results)}
        </div>
        {cards("home-rhythm-shelf", rhythmItems, worldHref("home-services"))}
      </section>

      <section
        className={`${styles.section} ${styles.development}`}
        id="home-development"
        data-home-module="development"
        data-reveal
      >
        <div className={styles.developmentCopy}>
          <span className={styles.eyebrow}>
            06 ·{" "}
            {t(
              words("EXPLORER & GRANDIR", "EXPLORE & GROW", "استكشفوا وانموا"),
            )}
          </span>
          <h2>{t(C.developmentTitle)}</h2>
          <p>{t(C.developmentLead)}</p>
          <div className={styles.goalGrid} role="group" aria-label={t(C.goal)}>
            {GOALS.map((value, index) => (
              <button
                key={value.key}
                type="button"
                aria-pressed={goal === value.key}
                onClick={() => setGoal(value.key)}
              >
                <span>{["✦", "Aa", "↗", "✳", "◎"][index]}</span>
                {t(value.label)}
              </button>
            ))}
          </div>
          <Action href={worldHref("development")} soft>
            {t(C.explore)}
          </Action>
        </div>
        <div className={styles.developmentStage}>
          <Photo src={editorial("montessori")} />
          <span className={styles.stageCaption}>
            <BookOpen size={18} />
            {t(C.editorial)}
          </span>
        </div>
        <div className={styles.fullWidth}>
          {cards("home-goal-shelf", goalItems, worldHref("development"))}
        </div>
      </section>

      <section
        className={`${styles.section} ${styles.kits}`}
        id="home-kits"
        data-home-module="kits"
        data-reveal
      >
        <Head number="07" title={C.kitsTitle} lead={C.kitsLead} locale={locale}>
          <Action href={worldHref("kits")} soft>
            {t(C.all)}
          </Action>
        </Head>
        <div className={styles.kitTheatre}>
          <div className={styles.kitStage}>
            <span className={styles.kitIndex}>
              KITS /{" "}
              {String(
                Math.max(
                  0,
                  kits.findIndex((item) => item.id === kit?.id),
                ) + 1,
              ).padStart(2, "0")}
            </span>
            <Photo
              src={kit ? kit.media_url : editorial("kits")}
              contain={!!kit}
              alt={kit?.name || ""}
            />
          </div>
          <div className={styles.kitDetails}>
            <span className={styles.kitStamp}>
              <PackageOpen size={24} />
              {t(kit ? C.contents : C.editorial)}
            </span>
            <span className={styles.eyebrow}>
              {t(words("DU TEMPS À PARTAGER", "TIME TO SHARE", "وقت للمشاركة"))}
            </span>
            <h3>{kit?.name || t(C.kitFallback)}</h3>
            <p>{kit?.short_description || t(C.kitsLead)}</p>
            {components.length ? (
              <ul>
                {components.map((component, index) => (
                  <li key={`${component}-${index}`}>
                    <Check size={17} />
                    {component}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.conditions}>{t(C.contentsMissing)}</p>
            )}
            {kit ? (
              <>
                <span
                  className={styles.availability}
                  data-available={canPurchase(kit)}
                >
                  {availability(kit, locale)}
                </span>
                <strong className={styles.kitPrice}>
                  {price(kit, locale)}
                </strong>
                <Action
                  href={detailHref(locale, kit)}
                  onClick={() => commerce.remember(kit.id)}
                >
                  {t(C.view)}
                </Action>
              </>
            ) : (
              <Action href={worldHref("kits")}>{t(C.explore)}</Action>
            )}
          </div>
        </div>
        {kits.length > 1 ? (
          <div className={styles.kitPicker} role="group" aria-label={t(C.kit)}>
            {kits.slice(0, 8).map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={kit?.id === item.id}
                onClick={() => setKitId(item.id)}
              >
                <Photo src={item.media_url} alt="" contain />
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section
        className={`${styles.section} ${styles.gallery}`}
        id="home-gallery"
        data-home-module="gallery"
        data-reveal
      >
        <Head
          number="08"
          title={C.galleryTitle}
          lead={C.galleryLead}
          locale={locale}
        >
          <Chips
            label={t(C.product)}
            value={galleryKind}
            onChange={setGalleryKind}
            items={[
              { key: "all", label: t(C.all) },
              { key: "product", label: t(C.product) },
              { key: "kit", label: t(C.kit) },
            ]}
          />
        </Head>
        {galleryItems.length ? (
          <div className={styles.galleryGrid}>
            {galleryItems.slice(0, 8).map((item, index) => (
              <OfferCard
                key={item.id}
                item={item}
                locale={locale}
                commerce={commerce}
                large={index === 0}
              />
            ))}
          </div>
        ) : (
          <Empty
            locale={locale}
            href={worldHref(galleryKind === "kit" ? "kits" : "development")}
          />
        )}
      </section>

      <section
        className={`${styles.section} ${styles.ages}`}
        id="home-ages"
        data-home-module="ages"
        data-reveal
      >
        <Head
          number="09"
          title={C.agesTitle}
          lead={C.agesLead}
          locale={locale}
        />
        <div className={styles.ageJourney} role="group" aria-label={t(C.age)}>
          {AGES.map((value, index) => (
            <button
              type="button"
              key={value}
              aria-pressed={age === value}
              onClick={() => setAge(value)}
            >
              <span className={styles.ageOrb}>{index === 0 ? "∞" : value}</span>
              <strong>{ageLabel(value)}</strong>
              <small>
                {t(
                  [
                    words(
                      "Ouvrir le champ des possibles",
                      "Open the possibilities",
                      "افتحوا مجال الخيارات",
                    ),
                    words(
                      "Premières découvertes",
                      "First discoveries",
                      "اكتشافات أولى",
                    ),
                    words("Jouer & explorer", "Play & explore", "لعب واكتشاف"),
                    words(
                      "Essayer & comprendre",
                      "Try & understand",
                      "تجربة وفهم",
                    ),
                    words(
                      "Créer & approfondir",
                      "Create & go deeper",
                      "إبداع وتعمق",
                    ),
                  ][index],
                )}
              </small>
            </button>
          ))}
        </div>
        <p className={styles.rhythmResults} role="status">
          {ageItems.length} {t(C.results)}
        </p>
        {cards("home-age-shelf", ageItems, worldHref("development"))}
      </section>

      <section
        className={styles.section}
        id="home-selections"
        data-home-module="selections"
        data-reveal
      >
        <Head
          number="10"
          title={C.selectionTitle}
          lead={C.selectionLead}
          locale={locale}
        >
          <Chips
            label={t(C.selectionTitle)}
            value={selection}
            onChange={setSelection}
            items={[
              { key: "featured", label: t(C.featured) },
              { key: "picks", label: t(C.picks) },
              { key: "arrivals", label: t(C.arrivals) },
            ]}
          />
        </Head>
        {cards("home-editorial-shelf", selections)}
      </section>

      <section
        className={`${styles.section} ${styles.pairings}`}
        id="home-pairings"
        data-home-module="pairings"
        data-reveal
      >
        <Head
          number="11"
          title={C.pairTitle}
          lead={C.pairLead}
          locale={locale}
        />
        <div className={styles.pairGrid}>
          <div className={styles.pairIntro}>
            <Layers size={30} />
            <h3>
              {t(
                words(
                  "Deux chemins. Un même élan.",
                  "Two paths. One shared intention.",
                  "مساران وهدف مشترك.",
                ),
              )}
            </h3>
            <p>
              {t(
                words(
                  "Chaque offre se découvre et se choisit séparément.",
                  "Discover and choose each offer separately.",
                  "اكتشفوا واختاروا كل عرض على حدة.",
                ),
              )}
            </p>
            <Action href={worldHref("families")} soft>
              {t(C.explore)}
            </Action>
          </div>
          {[services[0], products[0]].map((item, index) =>
            item ? (
              <OfferCard
                key={item.id}
                item={item}
                locale={locale}
                commerce={commerce}
              />
            ) : (
              <Empty
                key={index}
                locale={locale}
                href={worldHref(index === 0 ? "home-services" : "development")}
                message={C.configured}
              />
            ),
          )}
        </div>
      </section>

      <section
        className={`${styles.section} ${styles.taxonomy}`}
        id="home-taxonomy"
        data-home-module="taxonomy"
        data-reveal
      >
        <Head
          number="12"
          title={C.taxonomyTitle}
          lead={C.taxonomyLead}
          locale={locale}
        />
        <label className={styles.categorySearch}>
          <Search size={19} />
          <input
            value={categoryQuery}
            onChange={(event) => setCategoryQuery(event.target.value)}
            placeholder={t(C.category)}
            aria-label={t(C.category)}
          />
        </label>
        {categories.length ? (
          <div className={styles.categoryGrid}>
            {categories.map((category, index) => (
              <Link
                href={`${market}/category/${encodeURIComponent(category.slug)}`}
                key={category.id}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{category.title}</h3>
                  {category.short_description ? (
                    <p>{category.short_description}</p>
                  ) : null}
                </div>
                <ArrowUpRight size={22} />
              </Link>
            ))}
          </div>
        ) : (
          <Empty locale={locale} href={market} />
        )}
      </section>

      <section
        className={`${styles.section} ${styles.collections}`}
        id="home-collections"
        data-home-module="collections"
        data-reveal
      >
        <Head
          number="13"
          title={C.collectionsTitle}
          lead={C.collectionsLead}
          locale={locale}
        />
        {currentCollection ? (
          <>
            <Chips
              label={t(C.collectionsTitle)}
              items={collections.map((collection) => ({
                key: collection.id,
                label: collection.title,
              }))}
              value={currentCollection.id}
              onChange={setCollectionId}
            />
            <div className={styles.collectionTheatre}>
              <div className={styles.collectionEditorial}>
                <span className={styles.eyebrow}>
                  {t(
                    words(
                      "UNE COLLECTION À PARCOURIR",
                      "A COLLECTION TO EXPLORE",
                      "مجموعة للاستكشاف",
                    ),
                  )}
                </span>
                <h3>{currentCollection.title}</h3>
                {currentCollection.subtitle ? (
                  <p>{currentCollection.subtitle}</p>
                ) : null}
                <Action
                  href={collectionHref(
                    locale,
                    currentCollection.id,
                    currentCollection.items,
                  )}
                >
                  {t(C.discover)}
                </Action>
              </div>
              {cards("home-collection-shelf", currentCollection.items)}
            </div>
          </>
        ) : (
          <div className={styles.collectionEmpty}>
            <Photo src={editorial("box")} />
            <div>
              <h3>
                {t(
                  words(
                    "Un autre regard sur vos découvertes.",
                    "A fresh look at your discoveries.",
                    "نظرة جديدة إلى اكتشافاتكم.",
                  ),
                )}
              </h3>
              <p>{t(C.configured)}</p>
              <Action href={market} soft>
                {t(C.discover)}
              </Action>
            </div>
          </div>
        )}
      </section>

      <section
        className={`${styles.section} ${styles.comparison}`}
        id="home-comparison"
        data-home-module="comparison"
        data-reveal
      >
        <Head
          number="14"
          title={C.compareTitle}
          lead={C.compareLead}
          locale={locale}
        >
          <Action href={`${market}/compare`} soft>
            {t(C.compare)}
          </Action>
        </Head>
        {comparedItems.length ? (
          <div className={styles.compareGrid}>
            {comparedItems.map((item) => (
              <article key={item.id}>
                <Photo src={item.media_url} alt={item.name} contain />
                <button
                  type="button"
                  aria-label={`${t(C.uncompare)} · ${item.name}`}
                  disabled={commerce.pending.some((key) =>
                    key.startsWith("compare:"),
                  )}
                  onClick={() => void commerce.select(item.id, "compare")}
                >
                  <X size={18} />
                </button>
                <h3>
                  <Link
                    href={detailHref(locale, item)}
                    onClick={() => commerce.remember(item.id)}
                  >
                    {item.name}
                  </Link>
                </h3>
                <dl>
                  <div>
                    <dt>{t(C.category)}</dt>
                    <dd>{item.category_title || t(C[item.kind])}</dd>
                  </div>
                  <div>
                    <dt>{t(words("Prix", "Price", "السعر"))}</dt>
                    <dd>{price(item, locale)}</dd>
                  </div>
                  <div>
                    <dt>
                      {t(words("Disponibilité", "Availability", "التوفر"))}
                    </dt>
                    <dd>{availability(item, locale)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.compareEmpty}>
            <Layers size={26} />
            <p>{t(C.compareEmpty)}</p>
            <a href="#home-discovery">
              {t(C.discover)}
              <ArrowUpRight size={17} />
            </a>
          </div>
        )}
      </section>

      <section
        className={`${styles.section} ${styles.academy}`}
        id="home-academy"
        data-home-module="academy"
        data-reveal
      >
        <div className={styles.academyIntro}>
          <div>
            <span className={styles.eyebrow}>15 · ANGELCARE ACADEMY</span>
            <h2>{t(C.academyTitle)}</h2>
            <p>{t(C.academyLead)}</p>
            <Action href={worldHref("academy")}>{t(C.explore)}</Action>
          </div>
          <div className={styles.academyVisual}>
            <Photo src={editorial("homework")} />
            <span>{t(C.editorial)}</span>
          </div>
        </div>
        {cards("home-academy-shelf", academy, worldHref("academy"))}
        {experience.academyCohorts.length ? (
          <div className={styles.cohortGrid}>
            {experience.academyCohorts.slice(0, 4).map((cohort) => (
              <Link
                key={cohort.id}
                href={`${base}/enrollment/${encodeURIComponent(cohort.course_slug)}`}
              >
                <BookOpen size={21} />
                <span>
                  <strong>{cohort.course_title}</strong>
                  <small>{cohort.name}</small>
                  {cohort.starts_at &&
                  !Number.isNaN(Date.parse(cohort.starts_at)) ? (
                    <time dateTime={cohort.starts_at}>
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                        timeZone: "UTC",
                      }).format(new Date(cohort.starts_at))}
                    </time>
                  ) : null}
                </span>
                <ArrowUpRight size={20} />
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <section
        className={`${styles.section} ${styles.professional}`}
        id="home-professional"
        data-home-module="professional"
        data-reveal
      >
        <Head
          number="16"
          title={C.professionalTitle}
          lead={C.professionalLead}
          locale={locale}
        />
        <div className={styles.professionalGrid}>
          {professionalKeys.map((key, index) => (
            <Link href={worldHref(key)} key={key}>
              <Photo src={editorial(WORLD_PHOTOS[key])} />
              <span className={styles.sectorNumber}>0{index + 1}</span>
              <div>
                <h3>{worlds.find((world) => world.key === key)?.label}</h3>
                <span>
                  {t(C.explore)}
                  <ArrowUpRight size={20} />
                </span>
              </div>
            </Link>
          ))}
        </div>
        <div className={styles.professionalPaths}>
          {worlds
            .filter((world) =>
              ["partner-os", "quality-check", "professionals"].includes(
                world.key,
              ),
            )
            .map((world) => (
              <Link key={world.key} href={world.href}>
                <ShieldCheck size={21} />
                <strong>{world.label}</strong>
                <ArrowUpRight size={20} />
              </Link>
            ))}
        </div>
        {cards(
          "home-professional-shelf",
          organizations,
          worldHref("establishments"),
        )}
      </section>

      <section
        className={`${styles.section} ${styles.continuation}`}
        id="home-continue"
        data-home-module="continue"
        data-reveal
      >
        <Head number="17" title={C.continueTitle} locale={locale}>
          <Chips
            label={t(C.continueTitle)}
            value={continuation}
            onChange={setContinuation}
            items={[
              { key: "recent", label: t(C.recent) },
              { key: "saved", label: t(C.saved) },
            ]}
          />
        </Head>
        {(continuation === "recent" ? recentItems : savedItems).length ? (
          cards(
            "home-continue-shelf",
            continuation === "recent" ? recentItems : savedItems,
          )
        ) : (
          <Empty
            locale={locale}
            href={market}
            message={continuation === "recent" ? C.noRecent : C.noSaved}
          />
        )}
        <div className={styles.continuationActions}>
          {continuation === "recent" && recentItems.length ? (
            <button
              type="button"
              className={styles.reset}
              onClick={commerce.clearRecent}
            >
              {t(C.clearRecent)}
            </button>
          ) : null}
          <Link href={`${base}/account/saved`}>
            {t(C.saved)}
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>

      <section
        className={`${styles.section} ${styles.guidance}`}
        id="home-guidance"
        data-home-module="guidance"
        data-reveal
      >
        <div className={styles.guidancePhoto}>
          <Photo src={editorial("support")} />
          <span>{t(C.editorial)}</span>
        </div>
        <div className={styles.guidanceCopy}>
          <span className={styles.eyebrow}>
            <MessageCircle size={18} />
            18 · {t(words("ÉCHANGEONS", "LET’S TALK", "لنتحدث"))}
          </span>
          <h2>{t(C.guidanceTitle)}</h2>
          <p>{t(C.guidanceLead)}</p>
          <Action href={`${base}/contact`}>{t(C.contact)}</Action>
          <div className={styles.guidanceSteps}>
            {[
              words("Votre besoin", "Your need", "احتياجكم"),
              words("Vos questions", "Your questions", "أسئلتكم"),
              words("Votre prochain pas", "Your next step", "خطوتكم التالية"),
            ].map((value, index) => (
              <span key={index}>
                <b>0{index + 1}</b>
                {t(value)}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section
        className={`${styles.section} ${styles.trust}`}
        id="home-trust"
        data-home-module="trust"
        data-reveal
      >
        <Head
          number="19"
          title={C.trustTitle}
          lead={C.trustLead}
          locale={locale}
        >
          <Action href={`${base}/trust`} soft>
            {t(
              words(
                "Consulter Trust & Quality",
                "Explore Trust & Quality",
                "استكشفوا الثقة والجودة",
              ),
            )}
          </Action>
        </Head>
        <div className={styles.trustGrid}>
          {[
            {
              icon: BookOpen,
              title: words(
                "Des fiches pour comprendre",
                "Pages that explain",
                "صفحات توضح التفاصيل",
              ),
              body: words(
                "Consultez le format, les contenus et les conditions propres à chaque offre.",
                "Review the format, contents and conditions of each offer.",
                "راجعوا صيغة ومحتويات وشروط كل عرض.",
              ),
            },
            {
              icon: MapPin,
              title: words(
                "Le contexte compte",
                "Context matters",
                "السياق مهم",
              ),
              body: words(
                "La disponibilité dépend de l’offre et de votre territoire. Elle est revérifiée dans votre parcours.",
                "Availability depends on the offer and your territory. It is checked again in your journey.",
                "التوفر مرتبط بالعرض ونطاقكم ويُراجع خلال المسار.",
              ),
            },
            {
              icon: ShieldCheck,
              title: words(
                "Une confirmation éclairée",
                "An informed confirmation",
                "تأكيد على بيّنة",
              ),
              body: words(
                "Vérifiez les informations de votre demande avant de confirmer.",
                "Review your request information before confirming.",
                "راجعوا معلومات طلبكم قبل التأكيد.",
              ),
            },
          ].map((value) => (
            <article key={value.title[0]}>
              <value.icon size={26} />
              <h3>{t(value.title)}</h3>
              <p>{t(value.body)}</p>
            </article>
          ))}
        </div>
        {experience.trustSignals.length ? (
          <div className={styles.evidenceList}>
            {experience.trustSignals
              .filter(
                (signal) =>
                  !signal.valid_until ||
                  Date.parse(signal.valid_until) >=
                    Date.parse(experience.generatedAt),
              )
              .map((signal) => (
                <details key={signal.id}>
                  <summary>
                    <ShieldCheck size={18} />
                    {signal.name}
                  </summary>
                  <div>
                    {signal.public_claims.map((claim, index) => (
                      <p key={index}>{claim}</p>
                    ))}
                    <small>{signal.verification_reference}</small>
                  </div>
                </details>
              ))}
          </div>
        ) : null}
      </section>

      <section
        className={`${styles.section} ${styles.faq}`}
        id="home-faq"
        data-home-module="faq"
        data-reveal
      >
        <div>
          <span className={styles.eyebrow}>
            20 · {t(words("VOS QUESTIONS", "YOUR QUESTIONS", "أسئلتكم"))}
          </span>
          <h2>{t(C.faqTitle)}</h2>
          <Action href={`${base}/contact`} soft>
            {t(C.contact)}
          </Action>
        </div>
        <div className={styles.faqList}>
          {FAQ.map(([question, answer], index) => (
            <details key={index}>
              <summary>
                <span>0{index + 1}</span>
                {t(question)}
                <span className={styles.faqPlus}>+</span>
              </summary>
              <p>{t(answer)}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.finale} data-home-module="finale" data-reveal>
        <Photo src={editorial("family")} />
        <div>
          <span className={styles.eyebrow}>
            ANGELCARE ·{" "}
            {t(
              words(
                "LA SUITE VOUS APPARTIENT",
                "THE NEXT CHAPTER IS YOURS",
                "الفصل التالي لكم",
              ),
            )}
          </span>
          <h2>{t(C.finaleTitle)}</h2>
          <p>{t(C.finaleLead)}</p>
          <div className={styles.heroActions}>
            <Action href="#home-worlds">{t(C.explore)}</Action>
            <Action href="#home-discovery" soft>
              {t(C.discover)}
            </Action>
          </div>
        </div>
      </section>
      {commerce.error ? (
        <div className={styles.selectionError} role="alert">
          <p>{t(C[commerce.error])}</p>
          <button
            type="button"
            aria-label={t(words("Fermer", "Close", "إغلاق"))}
            onClick={commerce.dismissError}
          >
            <X size={19} />
          </button>
        </div>
      ) : null}
      <a
        href="#home-continue"
        className={styles.savedDock}
        aria-label={t(C.saved)}
      >
        <Heart size={18} />
        <span>{t(C.saved)}</span>
        <b>{savedItems.length}</b>
      </a>
    </div>
  );
}
