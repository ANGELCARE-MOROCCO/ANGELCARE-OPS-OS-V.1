"use client";
import Link from "next/link";
import { ReferenceSection } from "./ReferenceSection";
import { useState, type CSSProperties, type ReactNode } from "react";
import {
  world,
  path,
  tr,
  defaultHome,
  type Locale,
  type Tri,
  type HomeConfig,
  type Catalogue,
  type Resource,
} from "./catalogue";
import { I } from "./Icons";
import { HomeArtwork } from "./HomeArtwork";
import { homeWorldImage, homeAgeImage } from "./home-imagery";
import { ReferenceGallery } from "./ReferenceGallery";
import { ReferenceCard, TopicCard } from "./ReferenceCards";
import {
  AGE_GROUPS,
  SUBJECTS,
  SEASONAL,
  categoryShort,
  discoveryHref,
  familyTopics,
  referenceCover,
  visibleResources,
} from "./reference-content";
import { SavedDiscoveries, ReadFailure } from "./Discovery";
import { GuidedDiscovery } from "./journey/Discovery";
import { PageAd } from "./journey/Runtime";
import s from "./reference.module.css";
const T = (en: string, fr: string, ar: string): Tri => [en, fr, ar];
function Shelf({
  rows,
  family,
  locale,
  compact = false,
  offset = 0,
}: {
  rows: Resource[];
  family: string;
  locale: Locale;
  compact?: boolean;
  offset?: number;
}) {
  const selected = rows
    .filter((r) => r.family === family)
    .slice(0, compact ? 4 : 6);
  return selected.length ? (
    <div className={compact ? s.fourGrid : s.sixGrid}>
      {selected.map((r) => (
        <ReferenceCard key={r.id} resource={r} locale={locale} />
      ))}
    </div>
  ) : (
    <div className={compact ? s.fourGrid : s.sixGrid}>
      {familyTopics(family, offset)
        .slice(0, compact ? 4 : 6)
        .map((topic) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            locale={locale}
            compact={compact}
          />
        ))}
    </div>
  );
}
const labels: Record<string, Tri> = {
  printables: T(
    "Printables with a purpose",
    "Des fiches pour chaque objectif",
    "مطبوعات لكل هدف",
  ),
  stories: T(
    "Stories worth opening",
    "Des histoires à ouvrir",
    "حكايات تستحق القراءة",
  ),
  audio: T(
    "A little listening adventure",
    "Une aventure à écouter",
    "مغامرة للاستماع",
  ),
  learning: T(
    "Learning pathways & meaningful next steps",
    "Parcours et prochaines étapes",
    "مسارات تعلّم وخطوات هادفة",
  ),
  assessments: T(
    "A little challenge. A real discovery.",
    "Un défi pour progresser",
    "تحدٍ صغير واكتشاف حقيقي",
  ),
  tools: T(
    "Try an idea. See what changes.",
    "Tester une idée et observer",
    "اختبر فكرة ولاحظ التغيير",
  ),
  activities: T(
    "Hands-on learning & playful ideas",
    "Apprendre en manipulant et en jouant",
    "تعلّم عملي وأفكار مرحة",
  ),
  planners: T(
    "Classroom tools & useful templates",
    "Outils de classe et modèles utiles",
    "أدوات الصف وقوالب مفيدة",
  ),
  "visual-cards": T(
    "Big ideas in little cards",
    "De grandes idées en petites cartes",
    "أفكار كبيرة في بطاقات صغيرة",
  ),
  presentations: T(
    "Make the next lesson wonderfully clear",
    "Des leçons claires et visuelles",
    "اجعل الدرس القادم واضحًا",
  ),
  video: T(
    "Watch an idea come to life",
    "Voir une idée prendre vie",
    "شاهد الفكرة تنبض بالحياة",
  ),
  documents: T(
    "Read, reflect & prepare",
    "Lire, réfléchir et préparer",
    "اقرأ وتأمل واستعد",
  ),
  bundles: T(
    "Featured resource packs & connected journeys",
    "Kits de ressources et parcours réunis",
    "حقائب موارد ورحلات مترابطة",
  ),
};
export function ReferenceHome({
  locale,
  config,
  catalogue,
}: {
  locale: Locale;
  config: HomeConfig;
  catalogue: Catalogue;
}) {
  const e = config.edition,
    rows = visibleResources(catalogue.rows, e.hidden),
    [intent, setIntent] = useState("all"),
    baseline = defaultHome(locale).edition;
  const worlds = e.familyOrder
    .map((key) => world(key))
    .filter(
      (w): w is NonNullable<typeof w> => !!w && !e.hidden.includes(w.key),
    );
  const available = (family: string) => !e.hidden.includes(family),
    image = (family: string) =>
      homeWorldImage(
        family,
        e.familyImages[family],
        !!e.mediaBindings["family:" + family],
      );
  const filtered = rows.filter(
      (r) => intent === "all" || r.intent.includes(intent),
    ),
    featured = e.featured.length
      ? e.featured
          .map((key) => filtered.find((r) => r.key === key))
          .filter((r): r is Resource => !!r)
      : filtered.slice(0, 6);
  const familySection = (family: string, compact = false, offset = 0) =>
    available(family) ? (
      <ReferenceSection
        key={family}
        title={labels[family] || world(family)!.title}
        sub={categoryShort[family]}
        icon={world(family)!.icon}
        href={discoveryHref(locale, {}, family)}
        locale={locale}
      >
        <Shelf
          family={family}
          rows={rows}
          locale={locale}
          compact={compact}
          offset={offset}
        />
      </ReferenceSection>
    ) : null;
  const pair = (a: string, b: string, offset = 0) => (
    <div className={s.pair}>
      {familySection(a, true, offset)}
      {familySection(b, true, offset)}
    </div>
  );
  const slots: Record<string, ReactNode> = {
    worlds: (
      <ReferenceSection
        id="kidflix-worlds"
        title={T(
          "Browse all 16 resource categories",
          "Explorer les 16 catégories",
          "تصفح فئات الموارد الست عشرة",
        )}
        icon="Compass"
        href={discoveryHref(locale)}
        locale={locale}
      >
        <div className={s.categoryGrid}>
          {worlds.map((w, i) => (
            <Link
              key={w.key}
              href={discoveryHref(locale, {}, w.key)}
              style={
                {
                  "--category-color": w.color,
                  "--category-tint": w.tint,
                } as CSSProperties
              }
            >
              <small>{String(i + 1).padStart(2, "0")}</small>
              <span>
                {e.familyImages[w.key] ? (
                  <HomeArtwork
                    className={s.customCategoryImage}
                    src={image(w.key)}
                    alt=""
                    width={100}
                    height={90}
                    loading="lazy"
                  />
                ) : (
                  <I name={w.icon} size={32} />
                )}
              </span>
              <strong>{tr(w.title, locale)}</strong>
              <p>{tr(categoryShort[w.key], locale)}</p>
            </Link>
          ))}
        </div>
      </ReferenceSection>
    ),
    today: (
      <ReferenceSection
        id="kidflix-today"
        title={T(
          "Find your next favourite discovery",
          "Votre prochaine belle découverte",
          "اكتشافك المفضل القادم",
        )}
        sub={T(
          "Useful ideas, ready for a closer look",
          "Des idées utiles à découvrir de près",
          "أفكار مفيدة تستحق الاكتشاف",
        )}
        icon="Flame"
        href={discoveryHref(locale, intent === "all" ? {} : { intent })}
        locale={locale}
      >
        <div
          className={s.chips}
          role="group"
          aria-label={tr(
            [
              "Choose a discovery purpose",
              "Choisir un usage",
              "اختر غرض الاكتشاف",
            ],
            locale,
          )}
        >
          {[
            ["all", T("For you", "À découvrir", "لك")],
            ["print", T("Print", "Imprimer", "طباعة")],
            ["read", T("Read", "Lire", "قراءة")],
            ["learn", T("Learn", "Apprendre", "تعلّم")],
            ["play", T("Play", "Jouer", "لعب")],
          ].map(([key, title]) => (
            <button
              key={key as string}
              type="button"
              aria-pressed={intent === key}
              onClick={() => setIntent(key as string)}
            >
              {tr(title as Tri, locale)}
            </button>
          ))}
        </div>
        <div className={s.sixGrid}>
          {featured.length
            ? featured
                .slice(0, 6)
                .map((r) => (
                  <ReferenceCard key={r.id} resource={r} locale={locale} />
                ))
            : worlds
                .filter((w) => intent === "all" || w.intent.includes(intent))
                .slice(0, 6)
                .map((w) => (
                  <TopicCard
                    key={w.key}
                    topic={familyTopics(w.key)[0]}
                    locale={locale}
                  />
                ))}
        </div>
      </ReferenceSection>
    ),
    printables: familySection("printables"),
    storytime: pair("stories", "audio"),
    learning: familySection("learning"),
    challenge: pair("assessments", "forms"),
    activities: pair("activities", "planners", 1),
    "visual-cards": pair("visual-cards", "presentations", 2),
    video: pair("video", "documents", 3),
    tools: familySection("tools"),
    ages: (
      <ReferenceSection
        title={T(
          "Discover by age & learning stage",
          "Découvrir par âge et étape",
          "اكتشف حسب العمر والمرحلة",
        )}
        sub={T(
          "Start where your learner is today",
          "Partir des besoins de votre apprenant",
          "ابدأ من مرحلة المتعلم اليوم",
        )}
        icon="Smile"
        href={discoveryHref(locale)}
        locale={locale}
      >
        <div className={s.ageGrid}>
          {AGE_GROUPS.map((age) => (
            <Link key={age.age} href={discoveryHref(locale, { age: age.age })}>
              <HomeArtwork
                src={homeAgeImage(age.image)}
                alt=""
                width={200}
                height={200}
                loading="lazy"
              />
              <strong>{tr(age.title, locale)}</strong>
              <small>{tr(age.caption, locale)}</small>
            </Link>
          ))}
        </div>
      </ReferenceSection>
    ),
    skills: (
      <ReferenceSection
        title={T(
          "Skills for real life & thoughtful learning",
          "Des compétences pour apprendre et grandir",
          "مهارات للحياة والتعلّم الواعي",
        )}
        icon="Sparkles"
        href={discoveryHref(locale)}
        locale={locale}
      >
        <div className={s.subjectGrid}>
          {SUBJECTS.map((subject) => (
            <Link
              key={subject.name[0]}
              href={discoveryHref(locale, { q: tr(subject.query, locale) })}
              style={
                {
                  "--category-color": world(subject.family)!.color,
                  "--category-tint": world(subject.family)!.tint,
                } as CSSProperties
              }
            >
              <span>
                <I name={subject.icon} size={25} />
              </span>
              <strong>{tr(subject.name, locale)}</strong>
            </Link>
          ))}
        </div>
        <div className={s.skillStrip}>
          {(catalogue.skills.length
            ? catalogue.skills.slice(0, 10)
            : SUBJECTS.map((v) => tr(v.name, locale))
          ).map((skill, i) => (
            <Link
              key={skill}
              href={discoveryHref(
                locale,
                catalogue.skills.length
                  ? { skill }
                  : { q: tr(SUBJECTS[i].query, locale) },
              )}
            >
              <I name={SUBJECTS[i % SUBJECTS.length].icon} size={19} />
              {skill}
              <I name="ArrowRight" size={12} />
            </Link>
          ))}
        </div>
      </ReferenceSection>
    ),
    grownups: (
      <div className={s.pair}>
        {[
          {
            family: "documents",
            audience: "educator",
            title: T(
              "New perspectives for educators",
              "De nouvelles pistes pour les éducateurs",
              "آفاق جديدة للمربين",
            ),
          },
          {
            family: "planners",
            audience: "parent",
            title: T(
              "Home learning, thoughtfully prepared",
              "Apprendre à la maison, avec des repères",
              "تعلّم منزلي بإعداد واعٍ",
            ),
          },
        ]
          .filter((v) => available(v.family))
          .map((v) => (
            <ReferenceSection
              key={v.audience}
              title={v.title}
              icon={v.audience === "educator" ? "GraduationCap" : "Heart"}
              href={discoveryHref(locale, { audience: v.audience })}
              locale={locale}
            >
              {rows.some((r) => r.audience === v.audience) ? (
                <div className={s.fourGrid}>
                  {rows
                    .filter((r) => r.audience === v.audience)
                    .slice(0, 4)
                    .map((r) => (
                      <ReferenceCard key={r.id} resource={r} locale={locale} />
                    ))}
                </div>
              ) : (
                <Shelf
                  family={v.family}
                  rows={[]}
                  locale={locale}
                  compact
                  offset={2}
                />
              )}
            </ReferenceSection>
          ))}
      </div>
    ),
    bundles: available("bundles") ? (
      <ReferenceSection
        className={s.highlightBand}
        title={labels.bundles}
        sub={categoryShort.bundles}
        icon="Gift"
        href={discoveryHref(locale, {}, "bundles")}
        locale={locale}
      >
        <Shelf family="bundles" rows={rows} locale={locale} />
      </ReferenceSection>
    ) : null,
    new: (
      <ReferenceSection
        title={T(
          "Seasonal & classroom collections",
          "Collections saisonnières et vie de classe",
          "مجموعات موسمية وحياة الصف",
        )}
        sub={T(
          "Find a timely idea for your next session",
          "Une idée de saison pour votre prochaine séance",
          "فكرة مناسبة لنشاطك القادم",
        )}
        icon="Flower2"
        href={discoveryHref(locale, { sort: "new" })}
        locale={locale}
      >
        <div className={s.sixGrid}>
          {SEASONAL.filter((t) => available(t.family)).map((t) => (
            <TopicCard
              key={t.name[0]}
              topic={{
                id: t.name[0],
                title: t.name,
                family: t.family,
                query: t.query,
                image: referenceCover(t.family, t.index),
              }}
              locale={locale}
            />
          ))}
        </div>
      </ReferenceSection>
    ),
    continuity: (
      <section className={s.continuity}>
        <SavedDiscoveries locale={locale} compact dense />
        <SavedDiscoveries locale={locale} compact recent dense />
        <details>
          <summary>
            <I name="Compass" size={20} />
            {tr(
              [
                "Find resources for your next session",
                "Trouver des ressources pour votre séance",
                "اعثر على موارد لنشاطك القادم",
              ],
              locale,
            )}
            <I name="ChevronDown" size={16} />
          </summary>
          <GuidedDiscovery locale={locale} />
        </details>
      </section>
    ),
    closing: (
      <ReferenceSection
        className={s.closingBand}
        title={T(
          "One useful discovery can lead to another",
          "Une découverte utile en appelle une autre",
          "اكتشاف مفيد يقود إلى آخر",
        )}
        sub={T(
          "Keep exploring at your own pace",
          "Continuez à explorer à votre rythme",
          "واصل الاستكشاف بإيقاعك الخاص",
        )}
        icon="Sparkles"
        locale={locale}
      >
        <div className={s.closingLinks}>
          {worlds
            .filter((w) =>
              ["forms", "community", "commerce", "bundles"].includes(w.key),
            )
            .map((w) => (
              <Link key={w.key} href={discoveryHref(locale, {}, w.key)}>
                <span style={{ background: w.tint, color: w.color }}>
                  <I name={w.icon} size={24} />
                </span>
                <strong>{tr(w.title, locale)}</strong>
                <small>{tr(categoryShort[w.key], locale)}</small>
                <I name="ArrowRight" size={16} />
              </Link>
            ))}
        </div>
      </ReferenceSection>
    ),
  };
  const promos = [
    {
      family: "bundles",
      title: T(
        "Seasonal & classroom collections",
        "Collections et vie de classe",
        "مجموعات وحياة الصف",
      ),
      description: T(
        "A fresh idea for your next session",
        "De nouvelles idées pour vos séances",
        "فكرة جديدة لنشاطك القادم",
      ),
      label: T(
        "Explore collections",
        "Explorer les collections",
        "استكشف المجموعات",
      ),
      image: "/kidflix/reference-public-r1/seasonal.png",
    },
    {
      family: "planners",
      title: T(
        "Teacher planners & templates",
        "Plannings et modèles enseignants",
        "مخططات وقوالب للمعلمين",
      ),
      description: T(
        "Prepare your next great idea",
        "Préparez votre prochaine idée",
        "حضّر فكرتك القادمة",
      ),
      label: T("Find useful templates", "Trouver un modèle", "اعثر على قالب"),
      image:
        e.mediaBindings["family:planners"] ||
        (e.familyImages.planners &&
          !e.familyImages.planners.includes("/home-publisher-r2/"))
          ? image("planners")
          : "/kidflix/reference-public-r1/teacher-planners.png",
    },
    {
      family: "activities",
      title: T(
        "Learning through play",
        "Apprendre en jouant",
        "التعلّم باللعب",
      ),
      description: T(
        "Hands-on ideas. Meaningful discoveries.",
        "Manipuler, essayer et découvrir",
        "أفكار عملية واكتشافات هادفة",
      ),
      label: T(
        "Explore activities",
        "Explorer les activités",
        "استكشف الأنشطة",
      ),
      image: image("activities"),
    },
  ];
  return (
    <div
      className={s.home}
      data-reference-home="r1"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <section className={s.opening} aria-labelledby="kidflix-reference-title">
        <div className={s.mainHero}>
          <ReferenceGallery scenes={e.gallery} locale={locale} />
          <div className={s.heroCopy}>
            <span className={s.eyebrow}>
              {e.eyebrow === baseline.eyebrow
                ? tr(
                    [
                      "A WORLD OF USEFUL DISCOVERIES",
                      "UN MONDE DE DÉCOUVERTES UTILES",
                      "عالم من الاكتشافات المفيدة",
                    ],
                    locale,
                  )
                : e.eyebrow}
            </span>
            <h1 id="kidflix-reference-title">
              {e.headline === baseline.headline ? (
                <>
                  {tr(
                    [
                      "Free educational resources for",
                      "Des ressources gratuites pour",
                      "موارد تعليمية مجانية من أجل",
                    ],
                    locale,
                  )}{" "}
                  <em>
                    {tr(
                      [
                        "brighter learners!",
                        "apprendre et grandir !",
                        "تعلّم مشرق!",
                      ],
                      locale,
                    )}
                  </em>
                </>
              ) : (
                e.headline
              )}
            </h1>
            {e.description !== baseline.description ? (
              <p className={s.customDescription}>{e.description}</p>
            ) : null}
            <ul>
              {[
                T(
                  "Printables, stories, learning tools & more",
                  "Fiches, histoires, outils et bien plus",
                  "مطبوعات وحكايات وأدوات والمزيد",
                ),
                T(
                  "For families, teachers & curious minds",
                  "Pour familles, enseignants et esprits curieux",
                  "للعائلات والمعلمين والعقول الفضولية",
                ),
                T(
                  "Find your purpose. Make your next discovery.",
                  "Un objectif, une nouvelle découverte",
                  "حدد هدفك وانطلق نحو اكتشافك",
                ),
              ].map((line) => (
                <li key={line[0]}>
                  <I name="CircleCheck" size={14} />
                  {tr(line, locale)}
                </li>
              ))}
            </ul>
            <Link className={s.primary} href={discoveryHref(locale)}>
              {tr(
                [
                  "Explore all free resources",
                  "Explorer les ressources gratuites",
                  "استكشف الموارد المجانية",
                ],
                locale,
              )}
              <I name="ArrowRight" size={16} />
            </Link>
          </div>
        </div>
        <div className={s.promoGrid}>
          {promos
            .filter((v) => available(v.family))
            .map((v) => (
              <Link
                key={v.family}
                className={s.promo}
                data-promo-family={v.family}
                href={
                  v.family === "bundles"
                    ? discoveryHref(locale, {
                        q: tr(["seasonal", "saison", "موسم"], locale),
                      })
                    : discoveryHref(locale, {}, v.family)
                }
              >
                <HomeArtwork
                  src={v.image}
                  alt=""
                  width={800}
                  height={533}
                  loading="eager"
                />
                <div>
                  <h2>{tr(v.title, locale)}</h2>
                  <p>{tr(v.description, locale)}</p>
                  <span>
                    {tr(v.label, locale)}
                    <I name="ArrowRight" size={12} />
                  </span>
                </div>
              </Link>
            ))}
        </div>
      </section>
      <div className={s.assurance}>
        {[
          {
            icon: "Gift",
            title: T("Free resources", "Ressources gratuites", "موارد مجانية"),
            detail: T(
              "Explore at your own pace",
              "À découvrir à votre rythme",
              "اكتشف بإيقاعك",
            ),
          },
          {
            icon: "Layers",
            title: T(
              "16 resource categories",
              "16 catégories de ressources",
              "16 فئة من الموارد",
            ),
            detail: T(
              "Many ways to learn",
              "Mille façons d’apprendre",
              "طرق متنوعة للتعلم",
            ),
          },
          {
            icon: "Globe",
            title: T(
              "EN · FR · العربية",
              "FR · EN · العربية",
              "العربية · FR · EN",
            ),
            detail: T(
              "Explore available editions",
              "Explorez les éditions disponibles",
              "استكشف النسخ المتاحة",
            ),
          },
          {
            icon: "Heart",
            title: T(
              "Families & educators",
              "Familles et éducateurs",
              "العائلات والمربون",
            ),
            detail: T(
              "Useful ideas for everyday practice",
              "Des idées utiles au quotidien",
              "أفكار مفيدة للممارسة اليومية",
            ),
          },
        ].map((v) => (
          <div key={v.icon}>
            <I name={v.icon} size={29} />
            <span>
              <strong>{tr(v.title, locale)}</strong>
              <small>{tr(v.detail, locale)}</small>
            </span>
          </div>
        ))}
      </div>
      {catalogue.error ? <ReadFailure locale={locale} /> : null}
      {e.sections.map((key) => (
        <div key={key} data-reference-section={key}>
          {slots[key] || null}
          {e.adSlots.includes("after-" + key) &&
          ["worlds", "printables", "bundles"].includes(key) ? (
            <PageAd locale={locale} slot={"after-" + key} />
          ) : null}
        </div>
      ))}
    </div>
  );
}
