"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  Clipboard,
  Compass,
  GraduationCap,
  Layers3,
  PackageOpen,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { CatalogLocale, DiscoveryItem } from "../catalog-discovery/types";
import { C, tr, w, type WorldProfile } from "./content";
import { storefrontPhoto } from "./editorial-media";
import {
  ageRange,
  baseHref,
  configuration,
  filterItems,
  INITIAL_FILTERS,
  itemHref,
  priceLabel,
  publicContents,
  text,
} from "./contract";
import type { NativeContext, PublicResource } from "./native-context";
import { Action, Empty, Photo } from "./ExperienceUI";
import s from "./storefront.module.css";

interface Props {
  profile: WorldProfile;
  locale: CatalogLocale;
  items: DiscoveryItem[];
  native: NativeContext;
}
function PublishedLinks({
  items,
  locale,
}: {
  items: DiscoveryItem[];
  locale: CatalogLocale;
}) {
  return (
    <div className={s.miniOffers}>
      {items.slice(0, 4).map((item) => (
        <Link key={item.id} href={itemHref(item, locale)}>
          <span>{item.name}</span>
          <strong>{priceLabel(item, locale)}</strong>
          <ArrowUpRight size={16} />
        </Link>
      ))}
      {!items.length ? <Empty>{tr(C.noMatch, locale)}</Empty> : null}
    </div>
  );
}
function CopySummary({
  value,
  locale,
}: {
  value: string;
  locale: CatalogLocale;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <div className={s.summary}>
      <span>{tr(C.summary, locale)}</span>
      <p tabIndex={0}>{value}</p>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setStatus("copied");
          } catch {
            setStatus("failed");
          }
        }}
      >
        <Clipboard size={16} />
        {tr(C.copy, locale)}
      </button>
      <div role="status">
        {status !== "idle"
          ? tr(status === "copied" ? C.copied : C.copyFailed, locale)
          : ""}
      </div>
    </div>
  );
}
function Priorities({
  profile,
  locale,
  selected,
  onChange,
}: {
  profile: WorldProfile;
  locale: CatalogLocale;
  selected: number[];
  onChange: (index: number) => void;
}) {
  return (
    <div className={s.priorities}>
      {profile.topics.map((topic, index) => (
        <label key={topic.query} data-selected={selected.includes(index)}>
          <input
            type="checkbox"
            checked={selected.includes(index)}
            onChange={() => onChange(index)}
          />
          <span className={s.checkBox}>
            {selected.includes(index) ? <Check size={14} /> : null}
          </span>
          <span>
            <strong>{tr(topic.label, locale)}</strong>
            <small>{tr(topic.body, locale)}</small>
          </span>
        </label>
      ))}
    </div>
  );
}
function usePriorities(profile: WorldProfile, locale: CatalogLocale) {
  const [selected, setSelected] = useState<number[]>([]);
  const toggle = (index: number) =>
    setSelected((previous) =>
      previous.includes(index)
        ? previous.filter((i) => i !== index)
        : [...previous, index],
    );
  return {
    selected,
    toggle,
    summary: `${tr(profile.label, locale)} — ${selected.map((index) => tr(profile.topics[index].label, locale)).join(" · ") || tr(C.prepare, locale)}`,
  };
}
export function DevelopmentStudio({ profile, locale, items, native }: Props) {
  const [age, setAge] = useState("all"),
    [goal, setGoal] = useState("");
  const matched = filterItems(items, { ...INITIAL_FILTERS, age, query: goal });
  return (
    <div className={s.activityStudio} data-signature="development-studio">
      <aside>
        <Photo src={storefrontPhoto("development", "montessori")} alt={tr(profile.signature, locale)} />
        <span className={s.floatingStamp}>
          <Sparkles />{" "}
          {tr(
            w(
              "Explorer à son rythme",
              "Explore at their pace",
              "اكتشاف حسب الإيقاع",
            ),
            locale,
          )}
        </span>
      </aside>
      <div className={s.studioPanel}>
        <span className={s.kicker}>{tr(C.age, locale)}</span>
        <div className={s.chips} role="group" aria-label={tr(C.age, locale)}>
          {[
            ["all", tr(C.all, locale)],
            ["1", `1 ${tr(C.years, locale)}`],
            ["3", `3 ${tr(C.years, locale)}`],
            ["6", `6 ${tr(C.years, locale)}`],
            ["9", `9 ${tr(C.years, locale)}`],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              aria-pressed={age === value}
              onClick={() => setAge(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className={s.smallNote}>
          {tr(
            w(
              "Le filtre âge utilise uniquement les âges renseignés sur les offres.",
              "The age filter uses only ages listed on offers.",
              "مرشح العمر يستخدم الأعمار المذكورة فقط.",
            ),
            locale,
          )}
        </p>
        <label className={s.selectLabel}>
          {tr(
            w(
              "Votre envie du moment",
              "Your current interest",
              "اهتمامكم الحالي",
            ),
            locale,
          )}
          <select
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
          >
            <option value="">{tr(C.all, locale)}</option>
            {profile.topics.map((topic) => (
              <option key={topic.query} value={topic.query}>
                {tr(topic.label, locale)}
              </option>
            ))}
          </select>
        </label>
        <PublishedLinks items={matched} locale={locale} />
        <span className={s.resourceHint}>
          {native.resources.filter((r) => r.kind === "activity").length}{" "}
          {tr(
            w(
              "activités publiées à découvrir plus bas",
              "published activities to explore below",
              "أنشطة منشورة لاستكشافها أدناه",
            ),
            locale,
          )}
        </span>
      </div>
    </div>
  );
}
export function KitWorkbench({ profile, locale, items }: Props) {
  const products = items.filter(
      (i) => i.kind === "kit" || i.kind === "product",
    ),
    [id, setId] = useState(""),
    item = products.find((i) => i.id === id) || products[0];
  const contents = item ? publicContents(item) : [],
    config = item ? configuration(item) : {},
    age = item ? ageRange(item) : null;
  return (
    <div className={s.kitWorkbench} data-signature="kit-workbench">
      <div className={s.kitGallery}>
        {item ? (
          <Photo src={item.media_url} alt={item.name} contain />
        ) : (
          <Photo src={storefrontPhoto("kits", "kits")} alt={tr(profile.label, locale)} />
        )}
        <span className={s.galleryLabel}>
          <PackageOpen size={16} />
          {tr(C.contents, locale)}
        </span>
      </div>
      <div className={s.kitPanel}>
        <label className={s.selectLabel}>
          {tr(
            w(
              "Choisir un produit à explorer",
              "Choose a product to explore",
              "اختيار منتج للاستكشاف",
            ),
            locale,
          )}
          <select
            value={item?.id || ""}
            disabled={!products.length}
            onChange={(event) => setId(event.target.value)}
          >
            {products.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </label>
        {item ? (
          <>
            <h3>{item.name}</h3>
            <p>{item.short_description}</p>
            <div className={s.specGrid}>
              <div>
                <span>{tr(C.age, locale)}</span>
                <strong>
                  {age
                    ? `${age.min}–${age.max} ${tr(C.years, locale)}`
                    : tr(C.unknown, locale)}
                </strong>
              </div>
              <div>
                <span>{tr(C.format, locale)}</span>
                <strong>
                  {text(config.format) ||
                    text(config.product_format) ||
                    tr(C.unknown, locale)}
                </strong>
              </div>
            </div>
            <ul className={s.contentList}>
              {contents.length ? (
                contents.map((value) => (
                  <li key={value}>
                    <Check size={15} />
                    {value}
                  </li>
                ))
              ) : (
                <li>{tr(C.unknown, locale)}</li>
              )}
            </ul>
            <div className={s.kitPrice}>
              <strong>{priceLabel(item, locale)}</strong>
              <Action href={itemHref(item, locale)}>
                {tr(C.discover, locale)}
              </Action>
            </div>
          </>
        ) : (
          <Empty>{tr(C.empty, locale)}</Empty>
        )}
      </div>
    </div>
  );
}
export function AcademyCampus({ profile, locale, items, native }: Props) {
  const programmes = native.resources.filter((r) => r.kind === "programme"),
    [id, setId] = useState(""),
    selected = programmes.find((r) => r.id === id) || programmes[0];
  return (
    <div className={s.campus} data-signature="academy-campus">
      <div className={s.campusMain}>
        <div className={s.campusBadge}>
          <GraduationCap />
          <span>{tr(profile.label, locale)}</span>
        </div>
        <label className={s.selectLabel}>
          {tr(
            w("Votre point de départ", "Your starting point", "نقطة البداية"),
            locale,
          )}
          <select
            value={selected?.id || ""}
            disabled={!programmes.length}
            onChange={(event) => setId(event.target.value)}
          >
            {programmes.map((p) => (
              <option value={p.id} key={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        {selected ? (
          <>
            <h3 lang={selected.sourceLocale}>{selected.title}</h3>
            <p lang={selected.sourceLocale}>{selected.body}</p>
            <div className={s.trustTags}>
              {selected.facts.map((fact) => (
                <span key={fact}>{fact}</span>
              ))}
            </div>
            <Action href={selected.href}>
              {tr(profile.primaryLabel, locale)}
            </Action>
          </>
        ) : (
          <Empty>{tr(C.emptyResources, locale)}</Empty>
        )}
      </div>
      <div className={s.campusPaths}>
        {profile.steps.map((step, index) => (
          <div key={index}>
            <span>0{index + 1}</span>
            <strong>{tr(step, locale)}</strong>
            <p>{tr(profile.topics[index].body, locale)}</p>
          </div>
        ))}
      </div>
      <div className={s.campusShelf}>
        <PublishedLinks
          items={items.filter((i) => i.kind === "training")}
          locale={locale}
        />
      </div>
    </div>
  );
}
export function TransformationMap({ profile, locale }: Props) {
  const selection = usePriorities(profile, locale);
  return (
    <div className={s.transformation} data-signature="transformation-map">
      <div>
        <div className={s.mapTitle}>
          <Compass />
          <h3>{tr(C.prepare, locale)}</h3>
        </div>
        <Priorities
          profile={profile}
          locale={locale}
          selected={selection.selected}
          onChange={selection.toggle}
        />
      </div>
      <div className={s.mapConnections}>
        <div className={s.mapHub}>
          <Layers3 />
          <strong>{tr(profile.label, locale)}</strong>
        </div>
        {[
          ["academy", "Academy"],
          ["quality-check", "Quality Check 360"],
          ["partner-os", "Partner OS"],
        ].map(([key, label]) => (
          <Link key={key} href={`${baseHref(locale)}/${key}`}>
            <span>{label}</span>
            <ArrowUpRight size={17} />
          </Link>
        ))}
      </div>
      <CopySummary value={selection.summary} locale={locale} />
    </div>
  );
}
export function HospitalityItinerary({ profile, locale }: Props) {
  const [moment, setMoment] = useState(0),
    routes = [
      "hospitality/kids-club",
      "hospitality/guest-childcare",
      "hospitality/family-concierge",
      "hospitality/seasonal-programs",
    ],
    topic = profile.topics[moment];
  return (
    <div className={s.itinerary} data-signature="hospitality-itinerary">
      <nav aria-label={tr(profile.signature, locale)}>
        {profile.topics.map((t, index) => (
          <button
            type="button"
            key={t.query}
            aria-pressed={moment === index}
            onClick={() => setMoment(index)}
          >
            <span>0{index + 1}</span>
            <strong>{tr(t.label, locale)}</strong>
          </button>
        ))}
      </nav>
      <div className={s.itineraryImage}>
        <Photo src={storefrontPhoto("hospitality", topic.photo)} alt={tr(topic.label, locale)} />
        <div>
          <span>{tr(profile.label, locale)}</span>
          <h3>{tr(topic.label, locale)}</h3>
        </div>
      </div>
      <aside>
        <span className={s.kicker}>{tr(C.discover, locale)}</span>
        <h3>{tr(topic.label, locale)}</h3>
        <p>{tr(topic.body, locale)}</p>
        <p>{tr(C.note, locale)}</p>
        <Action href={`${baseHref(locale)}/${routes[moment]}`}>
          {tr(C.discover, locale)}
        </Action>
        <Action href={`${baseHref(locale)}/${profile.primary}`} soft>
          {tr(profile.primaryLabel, locale)}
        </Action>
      </aside>
    </div>
  );
}
export function HealthSupport({ profile, locale }: Props) {
  const [stage, setStage] = useState(0);
  return (
    <div className={s.supportJourney} data-signature="health-support">
      <div className={s.supportPortrait}>
        <Photo src={storefrontPhoto("health-partners", "newborn")} alt={tr(profile.title, locale)} />
        <span>
          <ShieldCheck size={19} />
          {tr(
            w("Un cadre non médical", "A non-medical scope", "نطاق غير طبي"),
            locale,
          )}
        </span>
      </div>
      <div>
        <div
          className={s.chips}
          role="group"
          aria-label={tr(profile.signature, locale)}
        >
          {profile.steps.map((step, index) => (
            <button
              type="button"
              key={index}
              aria-pressed={stage === index}
              onClick={() => setStage(index)}
            >
              0{index + 1} · {tr(step, locale)}
            </button>
          ))}
        </div>
        <h3>{tr(profile.steps[stage], locale)}</h3>
        <p>{tr(profile.topics[stage].body, locale)}</p>
        <div className={s.boundary}>
          <ShieldCheck />
          {tr(C.nonMedical, locale)}
        </div>
        <Action href={`${baseHref(locale)}/${profile.primary}`}>
          {tr(profile.primaryLabel, locale)}
        </Action>
      </div>
    </div>
  );
}
export function CorporateBenefits({ profile, locale }: Props) {
  const selection = usePriorities(profile, locale),
    [context, setContext] = useState("team");
  const contexts = [
    ["team", w("Une équipe", "One team", "فريق واحد")],
    ["site", w("Un site", "One location", "موقع واحد")],
    ["multiple", w("Plusieurs sites", "Multiple locations", "عدة مواقع")],
  ] as const;
  return (
    <div className={s.benefits} data-signature="corporate-benefits">
      <div className={s.benefitCopy}>
        <Photo src={storefrontPhoto("corporates", "corporate")} alt={tr(profile.label, locale)} />
        <div>
          <h3>
            {tr(
              w(
                "Le quotidien de vos équipes mérite une place dans votre projet RH.",
                "Everyday family life belongs in your HR project.",
                "الحياة الأسرية اليومية تستحق مكاناً في مشروعكم.",
              ),
              locale,
            )}
          </h3>
        </div>
      </div>
      <div className={s.benefitBuilder}>
        <div
          className={s.chips}
          role="group"
          aria-label={tr(
            w("Contexte du projet", "Project context", "سياق المشروع"),
            locale,
          )}
        >
          {contexts.map(([key, label]) => (
            <button
              type="button"
              key={key}
              aria-pressed={context === key}
              onClick={() => setContext(key)}
            >
              {tr(label, locale)}
            </button>
          ))}
        </div>
        <Priorities
          profile={profile}
          locale={locale}
          selected={selection.selected}
          onChange={selection.toggle}
        />
        <CopySummary
          value={`${tr(contexts.find(([key]) => key === context)![1], locale)} — ${selection.summary}`}
          locale={locale}
        />
      </div>
    </div>
  );
}
function Plan({
  resource,
  locale,
}: {
  resource: PublicResource;
  locale: CatalogLocale;
}) {
  return (
    <article className={s.planCard}>
      <span className={s.planLabel}>{tr(C.plan, locale)}</span>
      <h3 lang={resource.sourceLocale}>{resource.title}</h3>
      <p lang={resource.sourceLocale}>{resource.body}</p>
      <strong className={s.planPrice}>
        {priceLabel(
          {
            price_amount: resource.amount ?? null,
            price_mode: resource.amount === null ? "quote_only" : "fixed",
            currency_label: resource.currency || "",
          },
          locale,
        )}
      </strong>
      {resource.period ? <span>{tr(C[resource.period], locale)}</span> : null}
      {typeof resource.modules === "number" ? (
        <p>
          {resource.modules} {tr(C.modules, locale)}
        </p>
      ) : null}
      <Action href={resource.href}>
        {tr(
          w("Étudier ce plan", "Discuss this plan", "دراسة هذه الخطة"),
          locale,
        )}
      </Action>
    </article>
  );
}
export function PartnerPlanDesk({ locale, native }: Props) {
  const [period, setPeriod] = useState("all"),
    plans = native.resources.filter((r) => r.kind === "plan"),
    periods = [...new Set(plans.map((r) => r.period).filter(Boolean))];
  return (
    <div className={s.planDesk} data-signature="partner-plan-desk">
      <div className={s.planBar}>
        <Layers3 />
        <div className={s.chips} role="group" aria-label={tr(C.plan, locale)}>
          <button
            type="button"
            aria-pressed={period === "all"}
            onClick={() => setPeriod("all")}
          >
            {tr(C.all, locale)}
          </button>
          {periods.map((p) => (
            <button
              type="button"
              key={p}
              aria-pressed={period === p}
              onClick={() => setPeriod(p!)}
            >
              {tr(C[p!], locale)}
            </button>
          ))}
        </div>
      </div>
      <div className={s.planGrid}>
        {plans
          .filter((p) => period === "all" || p.period === period)
          .map((p) => (
            <Plan resource={p} locale={locale} key={p.id} />
          ))}
      </div>
      {!plans.length ? <Empty>{tr(C.emptyResources, locale)}</Empty> : null}
    </div>
  );
}
export function QualityCompass({ profile, locale }: Props) {
  const selection = usePriorities(profile, locale);
  return (
    <div className={s.qualityCompass} data-signature="quality-compass">
      <div className={s.compassDisc}>
        <ShieldCheck size={52} />
        <span>QUALITY CHECK</span>
        <strong>360°</strong>
        <p>
          {tr(
            w(
              "Un périmètre à explorer",
              "A scope to explore",
              "نطاق للاستكشاف",
            ),
            locale,
          )}
        </p>
        <span>
          {tr(
            w(
              "Aucun score généré ici",
              "No score generated here",
              "دون إنشاء نتيجة هنا",
            ),
            locale,
          )}
        </span>
      </div>
      <div>
        <Priorities
          profile={profile}
          locale={locale}
          selected={selection.selected}
          onChange={selection.toggle}
        />
        <CopySummary value={selection.summary} locale={locale} />
      </div>
    </div>
  );
}
export function ProfessionalPath({ profile, locale, items }: Props) {
  const [track, setTrack] = useState(0),
    topic = profile.topics[track],
    matched = filterItems(items, { ...INITIAL_FILTERS, query: topic.query });
  return (
    <div className={s.careerPath} data-signature="professional-path">
      <div className={s.careerSteps}>
        {profile.topics.map((t, index) => (
          <button
            type="button"
            aria-pressed={track === index}
            key={t.query}
            onClick={() => setTrack(index)}
          >
            <span>0{index + 1}</span>
            <div>
              <strong>{tr(t.label, locale)}</strong>
              <small>{tr(t.body, locale)}</small>
            </div>
            <ArrowUpRight size={18} />
          </button>
        ))}
      </div>
      <div className={s.careerPanel}>
        <Photo src={storefrontPhoto("professionals", topic.photo)} alt={tr(topic.label, locale)} />
        <div>
          <h3>{tr(topic.label, locale)}</h3>
          <PublishedLinks items={matched} locale={locale} />
          <Action href={`${baseHref(locale)}/academy`}>
            {tr(
              w(
                "Explorer les formations Academy",
                "Explore Academy training",
                "استكشاف تدريب الأكاديمية",
              ),
              locale,
            )}
          </Action>
        </div>
      </div>
    </div>
  );
}
export function SignatureExperience(props: Props) {
  switch (props.profile.key) {
    case "development":
      return <DevelopmentStudio {...props} />;
    case "kits":
      return <KitWorkbench {...props} />;
    case "academy":
      return <AcademyCampus {...props} />;
    case "establishments":
      return <TransformationMap {...props} />;
    case "hospitality":
      return <HospitalityItinerary {...props} />;
    case "health-partners":
      return <HealthSupport {...props} />;
    case "corporates":
      return <CorporateBenefits {...props} />;
    case "partner-os":
      return <PartnerPlanDesk {...props} />;
    case "quality-check":
      return <QualityCompass {...props} />;
    case "professionals":
      return <ProfessionalPath {...props} />;
  }
}
