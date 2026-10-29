"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Network,
  ListTree,
  Table2,
  Search,
  RefreshCw,
  Download,
  Plus,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  FileText,
  Languages,
  Target,
  Layers,
  AlertTriangle,
  Check,
  ExternalLink,
  Filter,
  X,
  BookOpen,
} from "lucide-react";
import { useUI, query, mutate, download, Dialog } from "../components/ui";
import { FAMILIES } from "../registry";
import { BASE, tr, type Locale, type Tri } from "../types";
import { InventoryCanvas, Status, type MapNode } from "./Canvas";
import {
  LANGUAGES,
  EMPTY_PLAN,
  hasAuthoringWork,
  subtypeList,
  nodeKey,
  metrics,
  members,
  topicPath,
  orderedTopics,
  coverageCSV,
  validatePlan,
  type Snapshot,
  type Selection,
  type Metrics,
  type Entry,
  type Plan,
} from "./model";
import { importHref, type ImportTarget } from "./import-target";
import s from "./inventory.module.css";
const count = (n: number) => new Intl.NumberFormat().format(n);
const requestId = () => {
  if (crypto.randomUUID) return crypto.randomUUID();
  const a = crypto.getRandomValues(new Uint8Array(16));
  a[6] = (a[6] & 15) | 64;
  a[8] = (a[8] & 63) | 128;
  return [...a]
    .map(
      (n, i) =>
        ([4, 6, 8, 10].includes(i) ? "-" : "") +
        n.toString(16).padStart(2, "0"),
    )
    .join("");
};
const title = (e: Entry, l: Locale) =>
  e.title[l] || e.title.en || e.title.fr || e.title.ar || e.key;
export function InventoryMap() {
  const { locale, boot, open, create, preview } = useUI(),
    params = useSearchParams();
  const L = useCallback(
    (en: string, fr: string, ar: string) => tr([en, fr, ar], locale),
    [locale],
  );
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [selection, setSelection] = useState<Selection>(() => {
    const family = params?.get("category") || "",
      subtype = params?.get("subcategory") || "";
    return FAMILIES.some((f) => f.key === family)
      ? {
          family,
          ...(subtypeList(family).some((t) => t.id === subtype)
            ? { subtype }
            : {}),
        }
      : {};
  });
  const [view, setView] = useState("map"),
    [dimension, setDimension] = useState("categories"),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [language, setLanguage] = useState("all"),
    [expanded, setExpanded] = useState<string[]>([]),
    [wholeTree, setWholeTree] = useState(false),
    [inspectorTab, setInspectorTab] = useState("overview"),
    [entrySearch, setEntrySearch] = useState(""),
    [entryFilter, setEntryFilter] = useState("all"),
    [entryPage, setEntryPage] = useState(1),
    [facet, setFacet] = useState<{ key: string; value: string } | null>(null);
  const [journey, setJourney] = useState(false),
    [journeyFamily, setJourneyFamily] = useState("documents"),
    [journeySubtype, setJourneySubtype] = useState("how-to"),
    [journeyLocale, setJourneyLocale] = useState<Locale>("en"),
    [journeyTopic, setJourneyTopic] = useState("");
  const [targetOpen, setTargetOpen] = useState(false),
    [targetFamily, setTargetFamily] = useState("documents"),
    [targetSubtype, setTargetSubtype] = useState(""),
    [goalValues, setGoalValues] = useState<Record<Locale, string>>({
      en: "",
      fr: "",
      ar: "",
    }),
    [goalRevision, setGoalRevision] = useState(0),
    [saving, setSaving] = useState(false),
    [goalError, setGoalError] = useState("");
  const [help, setHelp] = useState(false);
  const readId = useRef(0),
    receipt = useRef({ signature: "", id: "" });
  const reload = useCallback(async () => {
    const id = ++readId.current;
    setBusy(true);
    setError("");
    try {
      const value = await query<Snapshot>({ op: "inventory_map" });
      if (
        value.version !== 1 ||
        !Array.isArray(value.entries) ||
        !value.scopeKey
      )
        throw Error("Inventory response is incomplete.");
      if (id === readId.current) setSnapshot(value);
    } catch (e) {
      if (id === readId.current) setError((e as Error).message);
    } finally {
      if (id === readId.current) setBusy(false);
    }
  }, []);
  useEffect(() => {
    setSnapshot(null);
    setTargetOpen(false);
    setJourney(false);
    void reload();
    return () => {
      readId.current++;
    };
  }, [reload, boot.actor.id, boot.health.scopeKey]);
  const choose = useCallback((next: Selection) => {
    setSelection(next);
    setEntryPage(1);
    setEntrySearch("");
    setFacet(null);
    setInspectorTab("overview");
    if (next.family) setExpanded((old) => [...new Set([...old, next.family!])]);
  }, []);
  const cache = useMemo(() => {
    const map = new Map<string, Metrics>();
    if (!snapshot) return map;
    map.set("all", metrics(snapshot));
    for (const f of FAMILIES) {
      map.set(f.key, metrics(snapshot, { family: f.key }));
      map.set(
        f.key + "/__unclassified__",
        metrics(snapshot, { family: f.key, subtype: "__unclassified__" }),
      );
      for (const t of subtypeList(f.key))
        map.set(
          f.key + "/" + t.id,
          metrics(snapshot, { family: f.key, subtype: t.id }),
        );
    }
    return map;
  }, [snapshot]);
  const selectedMetrics = useMemo(
    () =>
      snapshot
        ? selection.topic
          ? metrics(snapshot, selection)
          : cache.get(nodeKey(selection)) || metrics(snapshot, selection)
        : null,
    [snapshot, cache, selection],
  );
  const root = cache.get("all");
  const name = useCallback(
    (value: Selection) =>
      value.topic
        ? tr(
            snapshot?.topics.find((t) => t.id === value.topic)?.title || [
              "Topic",
              "Thème",
              "موضوع",
            ],
            locale,
          )
        : value.subtype === "__unclassified__"
          ? L(
              "Unclassified dossiers",
              "Dossiers non classés",
              "ملفات غير مصنفة",
            )
          : value.subtype
            ? tr(
                subtypeList(value.family || "").find(
                  (t) => t.id === value.subtype,
                )?.label || ["Subcategory", "Sous-catégorie", "فئة فرعية"],
                locale,
              )
            : value.family
              ? tr(FAMILIES.find((f) => f.key === value.family)!.name, locale)
              : L(
                  "All KidFlix categories",
                  "Toutes les catégories KidFlix",
                  "جميع فئات كيدفليكس",
                ),
    [locale, snapshot, L],
  );
  const matches = useCallback(
    (label: string, m: Metrics) => {
      if (search && !label.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (filter === "empty" && m.authored + m.published > 0) return false;
      if (filter === "thin" && !m.gap) return false;
      if (filter === "pipeline" && (!m.authored || m.published)) return false;
      if (filter === "unclassified" && !m.unclassified) return false;
      if (language !== "all" && m.languages[language as Locale].published > 0)
        return false;
      return true;
    },
    [search, filter, language],
  );
  const nodes = useMemo(() => {
    if (!snapshot) return [];
    const out: MapNode[] = [];
    if (dimension === "topics") {
      const selected = selection.topic
        ? snapshot.topics.find((t) => t.id === selection.topic)
        : null;
      const visible = snapshot.topics.filter((t) =>
        selected
          ? t.id === selected.id ||
            t.parent === selected.id ||
            t.id === selected.parent
          : !t.parent || !snapshot.topics.some((p) => p.id === t.parent),
      );
      visible.forEach((topic, i) => {
        const pick = {
            ...(selection.family ? { family: selection.family } : {}),
            topic: topic.id,
          },
          m = metrics(snapshot, pick),
          label = tr(topic.title, locale);
        if (!matches(label, m)) return;
        out.push({
          id: "topic/" + topic.id,
          parent: topic.parent ? "topic/" + topic.parent : undefined,
          label,
          subtitle: topic.key,
          color: "#6475bf",
          selection: pick,
          metrics: m,
          x: selected && topic.id === selected.id ? 25 : 400 + (i % 2) * 340,
          y:
            selected && topic.id === selected.id
              ? 250
              : 35 + Math.floor(i / 2) * 215,
          family: topic.id === selected?.id,
        });
      });
      return out;
    }
    const list =
      selection.family && !wholeTree
        ? FAMILIES.filter((f) => f.key === selection.family)
        : FAMILIES;
    let lane = 0;
    for (const f of list) {
      const m = cache.get(f.key)!,
        label = tr(f.name, locale),
        children = subtypeList(f.key),
        base = wholeTree ? lane * 700 : 0,
        hasChildren = wholeTree || !!selection.family;
      const childMatches = children.some((t) =>
        matches(tr(t.label, locale), cache.get(f.key + "/" + t.id)!),
      );
      if (!matches(label, m) && !childMatches) continue;
      const index = FAMILIES.indexOf(f),
        id = f.key;
      out.push({
        id,
        label,
        subtitle: String(f.number).padStart(2, "0") + " · " + f.key,
        color: f.color,
        selection: { family: f.key },
        metrics: m,
        x: hasChildren ? 25 : 25 + (index % 4) * 330,
        y: hasChildren ? base + 230 : 25 + Math.floor(index / 4) * 220,
        family: true,
      });
      if (hasChildren) {
        children.forEach((t, i) => {
          const n = cache.get(f.key + "/" + t.id)!;
          if (!matches(tr(t.label, locale), n)) return;
          out.push({
            id: f.key + "/" + t.id,
            parent: id,
            label: tr(t.label, locale),
            subtitle:
              L("Subcategory", "Sous-catégorie", "فئة فرعية") + " · " + t.id,
            color: f.color,
            selection: { family: f.key, subtype: t.id },
            metrics: n,
            x: 420 + (i % 2) * 330,
            y: base + 20 + Math.floor(i / 2) * 215,
            family: false,
          });
        });
        const unclassified = cache.get(f.key + "/__unclassified__")!;
        if (unclassified.authored || unclassified.published)
          out.push({
            id: f.key + "/__unclassified__",
            parent: id,
            label: L("Unclassified", "Non classés", "غير مصنف"),
            subtitle: L(
              "Classification needs review",
              "Classement à vérifier",
              "التصنيف يحتاج مراجعة",
            ),
            color: "#b96a25",
            selection: { family: f.key, subtype: "__unclassified__" },
            metrics: unclassified,
            x: 420,
            y: base + 665,
            family: false,
          });
      }
      lane++;
    }
    return out;
  }, [snapshot, selection, dimension, wholeTree, cache, locale, matches, L]);
  const rows = useMemo(
    () =>
      snapshot
        ? members(snapshot, selection)
            .filter((row) => {
              const e = row.entry,
                l = language === "all" ? null : (language as Locale);
              if (
                entrySearch &&
                ![e.key, ...Object.values(e.title)]
                  .join(" ")
                  .toLowerCase()
                  .includes(entrySearch.toLowerCase())
              )
                return false;
              if (facet && !e.facets[facet.key]?.includes(facet.value))
                return false;
              if (entryFilter === "published" && !row.live.length) return false;
              if (
                entryFilter === "drafts" &&
                !LANGUAGES.some((l) => hasAuthoringWork(e, l))
              )
                return false;
              if (
                entryFilter === "missing" &&
                !LANGUAGES.some((l) => !e.languages[l].present)
              )
                return false;
              if (l && row.live.some((p) => p.locale === l)) return false;
              return true;
            })
            .sort((a, b) => b.entry.updatedAt.localeCompare(a.entry.updatedAt))
        : [],
    [snapshot, selection, entrySearch, entryFilter, facet, language],
  );
  const facetCounts = useMemo(() => {
    const values = new Map<string, { key: string; value: string; n: number }>();
    if (snapshot)
      for (const row of members(snapshot, selection).filter((r) => r.authored))
        for (const [key, list] of Object.entries(row.entry.facets))
          for (const value of new Set(list)) {
            const k = key + "|" + value;
            const prior = values.get(k);
            values.set(k, { key, value, n: (prior?.n || 0) + 1 });
          }
    return [...values.values()].sort((a, b) => b.n - a.n);
  }, [snapshot, selection]);
  const targetCells = snapshot
    ? Object.values(snapshot.plan.targets).reduce(
        (n, r) => n + Object.keys(r).length,
        0,
      )
    : 0;
  function startJourney() {
    if(selection.family){const edition=language==="all"?"fr":language as Locale;create("experience",selection.family,{topic:selection.topic||null,data:{defaultLocale:edition,requiredLocales:[edition],...(selection.subtype?{subtype:selection.subtype}:{})}});return;}
    const family = selection.family || FAMILIES[0].key,
      subtype =
        selection.subtype &&
        subtypeList(family).some((t) => t.id === selection.subtype)
          ? selection.subtype
          : subtypeList(family)[0].id;
    setJourneyFamily(family);
    setJourneySubtype(subtype);
    setJourneyLocale(language === "all" ? locale : (language as Locale));
    setJourneyTopic(selection.topic || "");
    setJourney(true);
  }
  function openGoals() {
    const family = selection.family || FAMILIES[0].key,
      subtype =
        selection.subtype &&
        subtypeList(family).some((t) => t.id === selection.subtype)
          ? selection.subtype
          : "";
    setTargetFamily(family);
    setTargetSubtype(subtype);
    const values = subtype
      ? snapshot?.plan.targets[family + "/" + subtype]
      : null;
    setGoalValues({
      en: values?.en?.toString() || "",
      fr: values?.fr?.toString() || "",
      ar: values?.ar?.toString() || "",
    });
    setGoalRevision(snapshot?.planRevision || 0);
    setGoalError("");
    setTargetOpen(true);
  }
  async function saveGoals() {
    if (!snapshot) return;
    setSaving(true);
    setGoalError("");
    try {
      const plan: Plan = structuredClone(snapshot.plan),
        subtypes = targetSubtype
          ? [targetSubtype]
          : subtypeList(targetFamily).map((t) => t.id);
      for (const key of subtypes) {
        const values: Partial<Record<Locale, number>> = {};
        for (const l of LANGUAGES)
          if (goalValues[l].trim() !== "") values[l] = Number(goalValues[l]);
        plan.targets[targetFamily + "/" + key] = values;
      }
      const valid = validatePlan(plan),
        payload = {
          action: "inventory_plan_save",
          revision: goalRevision,
          plan: valid,
        },
        signature = snapshot.scopeKey + JSON.stringify(payload);
      if (receipt.current.signature !== signature)
        receipt.current = { signature, id: requestId() };
      const r = await mutate<any>({
        ...payload,
        requestId: receipt.current.id,
      });
      setSnapshot((old) =>
        old ? { ...old, plan: valid, planRevision: r.record.revision } : old,
      );
      setTargetOpen(false);
      setMessage(
        L(
          "Management targets saved.",
          "Objectifs de gestion enregistrés.",
          "تم حفظ أهداف الإدارة.",
        ),
      );
    } catch (e) {
      setGoalError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  const target: ImportTarget = {
    version: 1,
    family: journeyFamily,
    subtype: journeySubtype,
    locale: journeyLocale,
    ...(journeyTopic ? { topic: journeyTopic } : {}),
  };
  if (!snapshot)
    return (
      <div className={s.inventory} dir={locale === "ar" ? "rtl" : "ltr"}>
        <header className={s.hero}>
          <div>
            <span>KIDFLIX · INVENTORY INTELLIGENCE</span>
            <h2>
              {L("Inventory Map", "Carte des ressources", "خريطة المخزون")}
            </h2>
            <p>
              {L(
                "Loading the complete native category and language inventory…",
                "Chargement de l’inventaire natif complet par catégorie et langue…",
                "جار تحميل المخزون الأصلي الكامل حسب الفئة واللغة…",
              )}
            </p>
          </div>
        </header>
        {error ? (
          <section className={s.failure} role="alert">
            <AlertTriangle />
            <h2>
              {L(
                "Inventory is unavailable",
                "Inventaire indisponible",
                "المخزون غير متاح",
              )}
            </h2>
            <p>{error}</p>
            <button onClick={() => void reload()}>
              <RefreshCw size={16} />
              {L(
                "Retry complete refresh",
                "Réessayer le chargement complet",
                "إعادة تحميل المخزون الكامل",
              )}
            </button>
          </section>
        ) : (
          <div className={s.skeleton} aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} />
            ))}
          </div>
        )}
      </div>
    );
  return (
    <div className={s.inventory} dir={locale === "ar" ? "rtl" : "ltr"}>
      <header className={s.hero}>
        <div>
          <span>KIDFLIX · INVENTORY INTELLIGENCE</span>
          <h2>
            {L(
              "See the whole picture. Build what is missing.",
              "Voir l’ensemble. Produire ce qui manque.",
              "رؤية شاملة. وإنتاج ما ينقص.",
            )}
          </h2>
          <p>
            {L(
              "16 native categories · 96 authored subcategories · one connected production view",
              "16 catégories natives · 96 sous-catégories · une vue de production connectée",
              "16 فئة أصلية · 96 فئة فرعية · رؤية إنتاج مترابطة",
            )}
          </p>
        </div>
        <div className={s.heroActions}>
          <button onClick={() => setHelp(true)}>
            <BookOpen size={16} />
            {L("Reading the map", "Lire la carte", "قراءة الخريطة")}
          </button>
          <button disabled={busy} onClick={() => void reload()}>
            <RefreshCw size={16} className={busy ? s.spin : ""} />
            {L("Refresh inventory", "Actualiser l’inventaire", "تحديث المخزون")}
          </button>
          <button
            className={s.primary}
            disabled={!boot.actor.rights.manage}
            onClick={startJourney}
          >
            <Plus size={17} />
            {L("Add a resource", "Ajouter une ressource", "إضافة مورد")}
          </button>
        </div>
      </header>
      <div className={s.freshness}>
        <span>
          <i />
          {L("Native data", "Données natives", "بيانات أصلية")} ·{" "}
          {new Date(snapshot.at).toLocaleString(locale)} ·{" "}
          {snapshot.entries.length}{" "}
          {L(
            "unique dossiers scanned",
            "dossiers uniques analysés",
            "ملفات فريدة تم فحصها",
          )}
        </span>
        <span>
          {targetCells}/288{" "}
          {L(
            "language targets configured",
            "objectifs linguistiques configurés",
            "أهداف لغوية محددة",
          )}
        </span>
      </div>
      {error ? (
        <div className={s.alert} role="alert">
          <AlertTriangle size={18} />
          <span>
            {error}{" "}
            {L(
              "The last successful view is retained.",
              "La dernière vue chargée est conservée.",
              "تم الاحتفاظ بآخر عرض ناجح.",
            )}
          </span>
          <button onClick={() => void reload()}>
            {L("Retry", "Réessayer", "إعادة المحاولة")}
          </button>
        </div>
      ) : null}
      {message ? (
        <div className={s.notice} role="status">
          <Check size={16} />
          {message}
          <button
            aria-label={L(
              "Dismiss message",
              "Fermer le message",
              "إغلاق الرسالة",
            )}
            onClick={() => setMessage("")}
          >
            <X size={14} />
          </button>
        </div>
      ) : null}
      <div className={s.kpis}>
        {[
          [
            L("Authored dossiers", "Dossiers rédigés", "ملفات محررة"),
            root!.authored,
            L(
              "Unique master records",
              "Dossiers maîtres uniques",
              "سجلات رئيسية فريدة",
            ),
            "#0b7285",
          ],
          [
            L("Published dossiers", "Dossiers publiés", "ملفات منشورة"),
            root!.published,
            root!.editions +
              " " +
              L(
                "active language editions",
                "éditions linguistiques actives",
                "إصدارات لغوية نشطة",
              ),
            "#137c53",
          ],
          [
            L("Authoring pipeline", "En cours de rédaction", "قيد التحرير"),
            root!.drafts,
            root!.changed +
              " " +
              L(
                "also have a live edition",
                "ont aussi une édition publiée",
                "لديها إصدار منشور أيضاً",
              ),
            "#8d63b7",
          ],
          [
            L(
              "Empty subcategories",
              "Sous-catégories vides",
              "فئات فرعية فارغة",
            ),
            [...cache.entries()].filter(
              ([k, v]) =>
                k.includes("/") &&
                !k.endsWith("__unclassified__") &&
                v.status === "empty",
            ).length,
            L(
              "Of 96 native subcategories",
              "Sur 96 sous-catégories natives",
              "من أصل 96 فئة فرعية",
            ),
            "#b77231",
          ],
          [
            L("Target deficit", "Déficit aux objectifs", "العجز عن الأهداف"),
            root!.gap,
            root!.target === null
              ? L(
                  "Set explicit targets first",
                  "Définir les objectifs d’abord",
                  "حدد الأهداف أولاً",
                )
              : L(
                  "Unfilled published-edition targets",
                  "Objectifs d’éditions non atteints",
                  "أهداف إصدارات لم تتحقق",
                ),
            "#ba4960",
          ],
        ].map(([label, value, detail, color]) => (
          <section
            className={s.kpi}
            key={String(label)}
            style={{ "--node-color": color } as CSSProperties}
          >
            <small>{label}</small>
            <b>{count(Number(value))}</b>
            <span>{detail}</span>
          </section>
        ))}
      </div>
      <div className={s.toolbar}>
        <div
          className={s.viewSwitch}
          aria-label={L("Inventory view", "Vue de l’inventaire", "عرض المخزون")}
        >
          {[
            ["map", Network, L("Map", "Carte", "خريطة")],
            ["tree", ListTree, L("Tree", "Arbre", "شجرة")],
            ["coverage", Table2, L("Coverage", "Couverture", "التغطية")],
          ].map(([key, Icon, label]: any) => (
            <button
              key={key}
              aria-pressed={view === key}
              onClick={() => setView(key)}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
        <label className={s.search}>
          <Search size={16} />
          <input
            aria-label={L(
              "Search categories and subcategories",
              "Rechercher catégories et sous-catégories",
              "بحث الفئات والفئات الفرعية",
            )}
            placeholder={L(
              "Find a category or branch…",
              "Trouver une catégorie ou branche…",
              "ابحث عن فئة أو فرع…",
            )}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label={L(
            "Inventory status",
            "État de l’inventaire",
            "حالة المخزون",
          )}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {[
            ["all", "All statuses", "Tous les états", "جميع الحالات"],
            ["empty", "Empty branches", "Branches vides", "فروع فارغة"],
            ["thin", "Below target", "Sous l’objectif", "دون الهدف"],
            ["pipeline", "Authoring only", "Rédaction seule", "تحرير فقط"],
            ["unclassified", "Unclassified", "Non classés", "غير مصنف"],
          ].map(([v, ...t]) => (
            <option key={v} value={v}>
              {tr(t as unknown as Tri, locale)}
            </option>
          ))}
        </select>
        <select
          aria-label={L(
            "Publication language gap",
            "Lacune de publication linguistique",
            "فجوة النشر اللغوية",
          )}
          value={language}
          onChange={(e) => {
            setLanguage(e.target.value);
            setEntryPage(1);
          }}
        >
          <option value="all">
            {L("All languages", "Toutes les langues", "جميع اللغات")}
          </option>
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {L("No active ", "Aucune édition ", "لا إصدار نشط ") +
                l.toUpperCase()}
            </option>
          ))}
        </select>
        <button
          disabled={!boot.actor.rights.export}
          title={
            !boot.actor.rights.export
              ? L(
                  "Export permission required",
                  "Droit d’export requis",
                  "يلزم إذن التصدير",
                )
              : undefined
          }
          onClick={() =>
            download(
              "kidflix-inventory-coverage-" + snapshot.at.slice(0, 10) + ".csv",
              coverageCSV(snapshot),
              "text/csv;charset=utf-8",
            )
          }
        >
          <Download size={16} />
          {L("Export", "Exporter", "تصدير")}
        </button>
      </div>
      <div className={s.workspace}>
        <aside className={s.navigator}>
          <div className={s.navTitle}>
            <Layers size={17} />
            <strong>{L("Your catalogue", "Votre catalogue", "كتالوجك")}</strong>
          </div>
          <button
            className={!selection.family && !selection.topic ? s.active : ""}
            onClick={() => {
              choose({});
              setDimension("categories");
              setWholeTree(false);
            }}
          >
            <Network size={15} />
            {L("All 16 categories", "Les 16 catégories", "الفئات الست عشرة")}
            <b>{root!.authored}</b>
          </button>
          {FAMILIES.map((f) => (
            <button
              key={f.key}
              className={selection.family === f.key ? s.active : ""}
              onClick={() => {
                choose({ family: f.key });
                setDimension("categories");
                setWholeTree(false);
              }}
            >
              <span className={s.familyMark} style={{ background: f.color }}>
                {f.number}
              </span>
              <span>{tr(f.name, locale)}</span>
              <b>{cache.get(f.key)!.authored}</b>
              {cache.get(f.key)!.gap > 0 ? <i className={s.gapDot} /> : null}
            </button>
          ))}
          <div className={s.navBottom}>
            <button
              aria-pressed={dimension === "topics"}
              onClick={() => {
                setDimension("topics");
                choose({});
              }}
            >
              <ListTree size={16} />
              {L("Topic hierarchy", "Hiérarchie des thèmes", "شجرة الموضوعات")}
              <b>{snapshot.topics.length}</b>
            </button>
            <button disabled={!boot.actor.rights.manage} onClick={openGoals}>
              <Target size={16} />
              {L("Management targets", "Objectifs de gestion", "أهداف الإدارة")}
            </button>
          </div>
          <small>
            {L(
              "Published and draft work can coexist. Targets are set by your team.",
              "Le publié et le brouillon peuvent coexister. Votre équipe définit les objectifs.",
              "قد تتعايش المسودة والمنشور. يحدد فريقك الأهداف.",
            )}
          </small>
        </aside>
        <main
          className={s.main}
          aria-label={L(
            "Inventory exploration",
            "Exploration de l’inventaire",
            "استكشاف المخزون",
          )}
        >
          <div className={s.breadcrumb}>
            <button
              onClick={() => {
                choose({});
                setWholeTree(false);
              }}
            >
              {L("Catalogue", "Catalogue", "الكتالوج")}
            </button>
            <ChevronRight size={14} />
            <strong>{name(selection)}</strong>
            {selection.subtype ? (
              <button
                className={s.smallLink}
                onClick={() => choose({ family: selection.family })}
              >
                {L("Category map", "Carte catégorie", "خريطة الفئة")}
              </button>
            ) : null}
          </div>
          {view === "map" ? (
            <>
              <div className={s.mapOptions}>
                <span>
                  {dimension === "topics"
                    ? L(
                        "Topics remain a separate native hierarchy.",
                        "Les thèmes gardent leur hiérarchie native distincte.",
                        "للموضوعات شجرة أصلية مستقلة.",
                      )
                    : L(
                        "Click a category to explore its six native subcategories.",
                        "Cliquer sur une catégorie pour explorer ses six sous-catégories.",
                        "انقر فئة لاستكشاف فئاتها الفرعية الست.",
                      )}
                </span>
                {dimension === "categories" ? (
                  <label>
                    <input
                      type="checkbox"
                      checked={wholeTree}
                      onChange={(e) => setWholeTree(e.target.checked)}
                    />
                    {L("Whole tree", "Arbre complet", "الشجرة الكاملة")}
                  </label>
                ) : null}
              </div>
              <InventoryCanvas
                nodes={nodes}
                selected={nodeKey(selection)}
                onSelect={choose}
                locale={locale}
                storageKey={
                  "dce.inventory.map.v1." +
                  boot.actor.id +
                  "." +
                  snapshot.scopeKey
                }
              />
              {!nodes.length ? (
                <div className={s.empty}>
                  {L(
                    "No branches match these filters.",
                    "Aucune branche ne correspond aux filtres.",
                    "لا فروع تطابق هذه الفلاتر.",
                  )}
                  <button
                    onClick={() => {
                      setSearch("");
                      setFilter("all");
                      setLanguage("all");
                    }}
                  >
                    {L("Clear filters", "Effacer les filtres", "مسح الفلاتر")}
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
          {view === "tree" ? (
            <div className={s.tree}>
              <div className={s.treeHead}>
                <h2>
                  {dimension === "topics"
                    ? L(
                        "Topic hierarchy",
                        "Hiérarchie des thèmes",
                        "شجرة الموضوعات",
                      )
                    : L(
                        "Complete native tree",
                        "Arbre natif complet",
                        "الشجرة الأصلية الكاملة",
                      )}
                </h2>
                <button
                  onClick={() =>
                    setExpanded(
                      expanded.length === 16 ? [] : FAMILIES.map((f) => f.key),
                    )
                  }
                >
                  {expanded.length === 16
                    ? L("Collapse", "Replier", "طي")
                    : L("Expand all", "Tout développer", "توسيع الكل")}
                </button>
              </div>
              {dimension === "categories"
                ? FAMILIES.map((f) => {
                    const m = cache.get(f.key)!,
                      children = subtypeList(f.key).filter((t) =>
                        matches(
                          tr(t.label, locale),
                          cache.get(f.key + "/" + t.id)!,
                        ),
                      );
                    if (!matches(tr(f.name, locale), m) && !children.length)
                      return null;
                    return (
                      <section key={f.key}>
                        <div className={s.treeRow}>
                          <button
                            aria-label={L(
                              "Expand " + tr(f.name, locale),
                              "Développer " + tr(f.name, locale),
                              "توسيع " + tr(f.name, locale),
                            )}
                            aria-expanded={expanded.includes(f.key)}
                            onClick={() =>
                              setExpanded((old) =>
                                old.includes(f.key)
                                  ? old.filter((k) => k !== f.key)
                                  : [...old, f.key],
                              )
                            }
                          >
                            {expanded.includes(f.key) ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )}
                          </button>
                          <button onClick={() => choose({ family: f.key })}>
                            <FolderOpen size={18} />
                            <strong>{tr(f.name, locale)}</strong>
                            <small>{f.key}</small>
                          </button>
                          <span>
                            {m.authored} / {m.published}
                          </span>
                          <Status value={m.status} locale={locale} />
                        </div>
                        {expanded.includes(f.key)
                          ? children.map((t) => {
                              const n = cache.get(f.key + "/" + t.id)!;
                              return (
                                <button
                                  className={s.treeChild}
                                  key={t.id}
                                  onClick={() =>
                                    choose({ family: f.key, subtype: t.id })
                                  }
                                >
                                  <FileText size={16} />
                                  <span>
                                    {tr(t.label, locale)}
                                    <small>{t.id}</small>
                                  </span>
                                  <b>{n.authored}</b>
                                  <span>
                                    {n.published}{" "}
                                    {L("published", "publiés", "منشور")}
                                  </span>
                                  <Status value={n.status} locale={locale} />
                                  <ArrowRight size={15} />
                                </button>
                              );
                            })
                          : null}
                      </section>
                    );
                  })
                : orderedTopics(snapshot.topics).map((t) => {
                    const m = metrics(snapshot, { topic: t.id });
                    if (!matches(tr(t.title, locale), m)) return null;
                    return (
                      <button
                        key={t.id}
                        className={s.topicRow}
                        style={{
                          paddingInlineStart:
                            Math.min(
                              5,
                              topicPath(snapshot.topics, t.id).length - 1,
                            ) *
                              18 +
                            12,
                        }}
                        onClick={() => choose({ topic: t.id })}
                      >
                        <ListTree size={16} />
                        <span>
                          {tr(t.title, locale)}
                          <small>{t.key}</small>
                        </span>
                        <b>{m.authored}</b>
                        <Status value={m.status} locale={locale} />
                      </button>
                    );
                  })}
              <p className={s.tableNote}>
                {L(
                  "Counts: authored dossiers / dossiers with an active published edition.",
                  "Comptages : dossiers rédigés / dossiers avec édition publiée active.",
                  "الأعداد: ملفات محررة / ملفات ذات إصدار منشور نشط.",
                )}
              </p>
            </div>
          ) : null}
          {view === "coverage" ? (
            <section className={s.coverage}>
              <h2>
                <Languages size={19} />
                {L(
                  "Publication & language coverage",
                  "Publication et couverture linguistique",
                  "النشر والتغطية اللغوية",
                )}
              </h2>
              <p>
                {L(
                  "Every native subcategory, including branches with no dossiers. Translation completeness and publication are separate.",
                  "Toutes les sous-catégories natives, même sans dossier. La complétude des traductions et la publication sont distinctes.",
                  "كل الفئات الفرعية الأصلية بما فيها الفارغة. اكتمال الترجمة منفصل عن النشر.",
                )}
              </p>
              <div className={s.tableScroll}>
                <table>
                  <thead>
                    <tr>
                      <th>
                        {L(
                          "Category / subcategory",
                          "Catégorie / sous-catégorie",
                          "الفئة / الفئة الفرعية",
                        )}
                      </th>
                      <th>{L("Dossiers", "Dossiers", "ملفات")}</th>
                      {LANGUAGES.map((l) => (
                        <th key={l}>
                          {l.toUpperCase()}
                          <small>
                            {L(
                              "live · complete / authored",
                              "publié · complet / rédigé",
                              "منشور · كامل / محرر",
                            )}
                          </small>
                        </th>
                      ))}
                      <th>{L("Gap", "Déficit", "عجز")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FAMILIES.filter(
                      (f) => !selection.family || selection.family === f.key,
                    ).flatMap((f) =>
                      subtypeList(f.key).map((t) => {
                        const m = cache.get(f.key + "/" + t.id)!;
                        if (
                          !matches(
                            tr(f.name, locale) + " " + tr(t.label, locale),
                            m,
                          )
                        )
                          return null;
                        return (
                          <tr
                            key={f.key + "/" + t.id}
                            data-selected={
                              (selection.subtype === t.id &&
                                selection.family === f.key) ||
                              undefined
                            }
                          >
                            <th>
                              <button
                                onClick={() =>
                                  choose({ family: f.key, subtype: t.id })
                                }
                              >
                                <small>{tr(f.name, locale)}</small>
                                {tr(t.label, locale)}
                              </button>
                            </th>
                            <td>{m.authored}</td>
                            {LANGUAGES.map((l) => (
                              <td
                                key={l}
                                data-empty={
                                  m.languages[l].published === 0 || undefined
                                }
                              >
                                <button
                                  onClick={() => {
                                    choose({ family: f.key, subtype: t.id });
                                    setJourneyLocale(l);
                                  }}
                                >
                                  <b>{m.languages[l].published}</b>
                                  <small>
                                    {m.languages[l].complete} /{" "}
                                    {m.languages[l].present}
                                  </small>
                                </button>
                              </td>
                            ))}
                            <td>
                              {m.target === null ? (
                                <span className={s.muted}>—</span>
                              ) : (
                                <b data-gap={m.gap > 0 || undefined}>{m.gap}</b>
                              )}
                            </td>
                          </tr>
                        );
                      }),
                    )}
                  </tbody>
                </table>
              </div>
              <p className={s.tableNote}>
                {L(
                  "— means no management target. Empty translation titles do not count as covered languages.",
                  "— signifie aucun objectif défini. Les titres de traduction vides ne couvrent pas une langue.",
                  "— تعني عدم تحديد هدف. عناوين الترجمات الفارغة لا تعتبر تغطية لغوية.",
                )}
              </p>
            </section>
          ) : null}
        </main>
        <aside
          className={s.inspector}
          aria-label={L(
            "Branch details",
            "Détails de la branche",
            "تفاصيل الفرع",
          )}
        >
          <div className={s.inspectorTitle}>
            <small>
              {L("BRANCH INTELLIGENCE", "ANALYSE DE BRANCHE", "تحليل الفرع")}
            </small>
            <h2>{name(selection)}</h2>
            <code>{nodeKey(selection)}</code>
            <Status value={selectedMetrics!.status} locale={locale} />
          </div>
          <div className={s.inspectorTabs}>
            {[
              ["overview", "Overview", "Vue d’ensemble", "نظرة عامة"],
              ["dossiers", "Dossiers", "Dossiers", "ملفات"],
              ["dimensions", "Dimensions", "Dimensions", "أبعاد"],
            ].map(([v, ...label]) => (
              <button
                key={v}
                aria-pressed={inspectorTab === v}
                onClick={() => setInspectorTab(v)}
              >
                {tr(label as unknown as Tri, locale)}
              </button>
            ))}
          </div>
          {inspectorTab === "overview" ? (
            <div className={s.inspectorBody}>
              <div className={s.branchCounts}>
                <span>
                  <b>{selectedMetrics!.authored}</b>
                  {L("authored", "rédigés", "محرر")}
                </span>
                <span>
                  <b>{selectedMetrics!.published}</b>
                  {L("published", "publiés", "منشور")}
                </span>
                <span>
                  <b>{selectedMetrics!.drafts}</b>
                  {L("in authoring", "en rédaction", "قيد التحرير")}
                </span>
              </div>
              <h3>
                {L(
                  "Language editions",
                  "Éditions linguistiques",
                  "الإصدارات اللغوية",
                )}
              </h3>
              {LANGUAGES.map((l) => {
                const v = selectedMetrics!.languages[l];
                return (
                  <section className={s.languageCard} key={l}>
                    <div>
                      <b>{l.toUpperCase()}</b>
                      <span data-covered={v.published > 0 || undefined}>
                        {v.published} {L("published", "publiées", "منشور")}
                      </span>
                    </div>
                    <div className={s.track}>
                      <i
                        style={{
                          width:
                            (selectedMetrics!.authored
                              ? Math.min(
                                  100,
                                  (100 * v.complete) /
                                    selectedMetrics!.authored,
                                )
                              : 0) + "%",
                        }}
                      />
                    </div>
                    <small>
                      {v.complete}/{v.present}{" "}
                      {L(
                        "complete authored editions",
                        "éditions rédigées complètes",
                        "إصدارات محررة مكتملة",
                      )}{" "}
                      · {v.missing} {L("absent", "absentes", "غائبة")}
                    </small>
                    <small>
                      {v.public}{" "}
                      {L(
                        "eligible for public discovery",
                        "éligibles à la découverte publique",
                        "مؤهل للاكتشاف العام",
                      )}{" "}
                      · {v.changed}{" "}
                      {L(
                        "live editions have newer work",
                        "publiées avec travail plus récent",
                        "إصدارات منشورة لها عمل أحدث",
                      )}
                    </small>
                    <footer>
                      <span>
                        {v.target === null
                          ? L(
                              "Target not set",
                              "Objectif non défini",
                              "الهدف غير محدد",
                            )
                          : L("Target", "Objectif", "الهدف") + " " + v.target}
                      </span>
                      {v.gap ? <b>−{v.gap}</b> : null}
                    </footer>
                  </section>
                );
              })}
              <p className={s.finePrint}>
                {L(
                  "Translation completeness uses native content fields. Full media/dependency readiness is inspected in the dossier.",
                  "La complétude suit les champs natifs. Les médias et dépendances se contrôlent dans le dossier.",
                  "يُحسب اكتمال الترجمة من الحقول الأصلية. تُفحص الوسائط والتبعيات داخل الملف.",
                )}
              </p>
              <button
                className={s.primary}
                disabled={!boot.actor.rights.manage}
                onClick={startJourney}
              >
                <Plus size={17} />
                {L(
                  "Populate this branch",
                  "Alimenter cette branche",
                  "إضافة موارد لهذا الفرع",
                )}
              </button>
              <button
                disabled={
                  !boot.actor.rights.manage ||
                  !!selection.topic ||
                  selection.subtype === "__unclassified__"
                }
                onClick={openGoals}
              >
                <Target size={16} />
                {L(
                  "Set language targets",
                  "Définir les objectifs par langue",
                  "تحديد الأهداف حسب اللغة",
                )}
              </button>
              <button onClick={() => setInspectorTab("dossiers")}>
                <FileText size={16} />
                {L("Inspect dossiers", "Examiner les dossiers", "فحص الملفات")}
                <ArrowRight size={15} />
              </button>
            </div>
          ) : null}
          {inspectorTab === "dossiers" ? (
            <div className={s.inspectorBody}>
              <label className={s.search}>
                <Search size={15} />
                <input
                  aria-label={L(
                    "Search branch dossiers",
                    "Rechercher les dossiers de la branche",
                    "بحث ملفات الفرع",
                  )}
                  value={entrySearch}
                  onChange={(e) => {
                    setEntrySearch(e.target.value);
                    setEntryPage(1);
                  }}
                  placeholder={L(
                    "Title or stable key",
                    "Titre ou clé stable",
                    "عنوان أو مفتاح ثابت",
                  )}
                />
              </label>
              <select
                aria-label={L(
                  "Dossier state filter",
                  "Filtre d’état des dossiers",
                  "فلتر حالة الملفات",
                )}
                value={entryFilter}
                onChange={(e) => {
                  setEntryFilter(e.target.value);
                  setEntryPage(1);
                }}
              >
                {[
                  ["all", "All dossiers", "Tous les dossiers", "جميع الملفات"],
                  ["published", "Published", "Publiés", "منشور"],
                  [
                    "drafts",
                    "Authoring work",
                    "Travail en rédaction",
                    "عمل تحريري",
                  ],
                  [
                    "missing",
                    "Missing languages",
                    "Langues absentes",
                    "لغات غائبة",
                  ],
                ].map(([v, ...label]) => (
                  <option key={v} value={v}>
                    {tr(label as unknown as Tri, locale)}
                  </option>
                ))}
              </select>
              {facet ? (
                <button onClick={() => setFacet(null)}>
                  <X size={14} />
                  {facet.key}: {facet.value}
                </button>
              ) : null}
              <p className={s.finePrint}>
                {rows.length}{" "}
                {L(
                  "matching dossiers",
                  "dossiers correspondants",
                  "ملفات مطابقة",
                )}
              </p>
              {rows.slice((entryPage - 1) * 12, entryPage * 12).map((row) => (
                <section className={s.entry} key={row.entry.id}>
                  <div className={s.entryHeading}>
                    <FileText size={17} />
                    <button
                      onClick={() => open(row.entry.id, "identity", locale)}
                    >
                      {title(row.entry, locale)}
                    </button>
                  </div>
                  <code>
                    {row.entry.key} · r{row.entry.revision}
                  </code>
                  <div className={s.entryLabels}>
                    <span>{row.entry.lifecycle}</span>
                    {!row.authored && row.live.length ? (
                      <span>
                        {L(
                          "Live classification",
                          "Classement publié",
                          "تصنيف منشور",
                        )}
                      </span>
                    ) : null}
                    {row.entry.legacy ? (
                      <span>
                        {L(
                          "Legacy release",
                          "Publication antérieure",
                          "إصدار قديم",
                        )}
                      </span>
                    ) : null}
                  </div>
                  <div className={s.entryLanguages}>
                    {LANGUAGES.map((l) => {
                      const pub = row.entry.publications.find(
                          (p) => p.locale === l,
                        ),
                        v = row.entry.languages[l];
                      return (
                        <button
                          key={l}
                          data-live={!!pub || undefined}
                          title={
                            (v.complete
                              ? L(
                                  "Complete translation",
                                  "Traduction complète",
                                  "ترجمة مكتملة",
                                )
                              : v.missing.join(", ")) +
                            " · " +
                            v.state
                          }
                          onClick={() => open(row.entry.id, "delivery", l)}
                        >
                          <b>{l.toUpperCase()}</b>
                          <small>
                            {pub
                              ? L("live", "publié", "منشور")
                              : v.present
                                ? v.state
                                : L("missing", "absent", "غائب")}
                          </small>
                          {pub && v.changed ? <i /> : null}
                        </button>
                      );
                    })}
                  </div>
                  <div className={s.entryActions}>
                    <button
                      onClick={() =>
                        open(row.entry.id, "delivery", journeyLocale)
                      }
                    >
                      {L("Open dossier", "Ouvrir le dossier", "فتح الملف")}
                      <ArrowRight size={14} />
                    </button>
                    {row.live.map((p) => (
                      <button
                        key={p.locale}
                        onClick={() => preview(row.entry.id, p.id, p.locale)}
                        aria-label={L(
                          "Preview published " + p.locale.toUpperCase(),
                          "Aperçu publié " + p.locale.toUpperCase(),
                          "معاينة المنشور " + p.locale.toUpperCase(),
                        )}
                      >
                        <ExternalLink size={13} />
                        {p.locale.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  {row.entry.issues.map((issue) => (
                    <small className={s.issue} key={issue}>
                      {issue}
                    </small>
                  ))}
                </section>
              ))}
              {!rows.length ? (
                <div className={s.empty}>
                  <FolderOpen size={25} />
                  <h3>
                    {L(
                      "No matching dossiers",
                      "Aucun dossier correspondant",
                      "لا ملفات مطابقة",
                    )}
                  </h3>
                  <p>
                    {L(
                      "This branch is ready for targeted preparation.",
                      "Cette branche est prête pour une préparation ciblée.",
                      "هذا الفرع جاهز للتحضير الموجّه.",
                    )}
                  </p>
                  <button
                    disabled={!boot.actor.rights.manage}
                    onClick={startJourney}
                  >
                    {L("Add a resource", "Ajouter une ressource", "إضافة مورد")}
                  </button>
                </div>
              ) : null}
              {rows.length > 12 ? (
                <div className={s.pager}>
                  <button
                    disabled={entryPage === 1}
                    onClick={() => setEntryPage((p) => p - 1)}
                  >
                    ←
                  </button>
                  <span>
                    {entryPage} / {Math.ceil(rows.length / 12)}
                  </span>
                  <button
                    disabled={entryPage * 12 >= rows.length}
                    onClick={() => setEntryPage((p) => p + 1)}
                  >
                    →
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
          {inspectorTab === "dimensions" ? (
            <div className={s.inspectorBody}>
              <h3>
                {L(
                  "Native topics & discovery facets",
                  "Thèmes et facettes natifs",
                  "الموضوعات وأبعاد الاكتشاف الأصلية",
                )}
              </h3>
              <p className={s.finePrint}>
                {L(
                  "Facets can overlap. They do not add extra dossiers or redefine subcategories.",
                  "Les facettes se recoupent ; elles ne créent pas de dossiers et ne redéfinissent pas les sous-catégories.",
                  "قد تتداخل الأبعاد؛ لا تضيف ملفات ولا تعيد تعريف الفئات الفرعية.",
                )}
              </p>
              {snapshot.topics
                .filter(
                  (t) =>
                    members(snapshot, { ...selection, topic: t.id }).length > 0,
                )
                .map((t) => (
                  <button
                    className={s.dimension}
                    key={t.id}
                    onClick={() => {
                      setDimension("topics");
                      choose({ ...selection, topic: t.id });
                    }}
                  >
                    <ListTree size={15} />
                    <span>
                      {tr(t.title, locale)}
                      <small>
                        {topicPath(snapshot.topics, t.id)
                          .map((p) => tr(p.title, locale))
                          .join(" › ")}
                      </small>
                    </span>
                    <b>
                      {
                        metrics(snapshot, { ...selection, topic: t.id })
                          .authored
                      }
                    </b>
                  </button>
                ))}
              {facetCounts.map((f) => (
                <button
                  className={s.dimension}
                  key={f.key + "|" + f.value}
                  onClick={() => {
                    setFacet({ key: f.key, value: f.value });
                    setInspectorTab("dossiers");
                    setEntryPage(1);
                  }}
                >
                  <Filter size={14} />
                  <span>
                    {f.value}
                    <small>{f.key}</small>
                  </span>
                  <b>{f.n}</b>
                </button>
              ))}
              {!facetCounts.length && !snapshot.topics.length ? (
                <p>
                  {L(
                    "No authored topic or facet assignments yet.",
                    "Aucune affectation de thème ou de facette rédigée.",
                    "لا توجد تعيينات موضوعات أو أبعاد بعد.",
                  )}
                </p>
              ) : null}
            </div>
          ) : null}
        </aside>
      </div>
      {snapshot.warnings.length ? (
        <details className={s.warnings}>
          <summary>
            <AlertTriangle size={16} />
            {snapshot.warnings.length}{" "}
            {L(
              "inventory observations",
              "observations d’inventaire",
              "ملاحظات عن المخزون",
            )}
          </summary>
          {snapshot.warnings.map((w, i) => (
            <p key={i}>{w}</p>
          ))}
        </details>
      ) : null}
      {journey ? (
        <Dialog
          wide
          title={L(
            "Prepare a targeted import",
            "Préparer un import ciblé",
            "تحضير استيراد موجّه",
          )}
          onClose={() => setJourney(false)}
        >
          <div className={s.journey}>
            <div className={s.journeySteps}>
              {[
                L("Target", "Cibler", "تحديد الهدف"),
                L("Map & inspect", "Mapper et vérifier", "المطابقة والفحص"),
                L("Apply drafts", "Créer les brouillons", "إنشاء المسودات"),
                L("Review & publish", "Réviser et publier", "المراجعة والنشر"),
              ].map((step, i) => (
                <span key={step}>
                  <b>{i + 1}</b>
                  {step}
                </span>
              ))}
            </div>
            <p>
              {L(
                "Choose the exact branch. The existing Import Studio handles templates, mapping, per-resource corrections, media and publication readiness.",
                "Choisir la branche exacte. Le Studio d’import existant gère les modèles, le mapping, les corrections, les médias et la préparation à publier.",
                "حدد الفرع الدقيق. يتولى استوديو الاستيراد الحالي القوالب والمطابقة والتصحيحات والوسائط وجاهزية النشر.",
              )}
            </p>
            <div className={s.journeyFields}>
              <label>
                {L("Category", "Catégorie", "الفئة")}
                <select
                  aria-label={L("Category", "Catégorie", "الفئة")}
                  value={journeyFamily}
                  onChange={(e) => {
                    setJourneyFamily(e.target.value);
                    setJourneySubtype(subtypeList(e.target.value)[0].id);
                  }}
                >
                  {FAMILIES.map((f) => (
                    <option key={f.key} value={f.key}>
                      {tr(f.name, locale)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {L(
                  "Native subcategory",
                  "Sous-catégorie native",
                  "الفئة الفرعية الأصلية",
                )}
                <select
                  aria-label={L(
                    "Native subcategory",
                    "Sous-catégorie native",
                    "الفئة الفرعية الأصلية",
                  )}
                  value={journeySubtype}
                  onChange={(e) => setJourneySubtype(e.target.value)}
                >
                  {subtypeList(journeyFamily).map((t) => (
                    <option key={t.id} value={t.id}>
                      {tr(t.label, locale)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {L("Content language", "Langue du contenu", "لغة المحتوى")}
                <select
                  aria-label={L(
                    "Content language",
                    "Langue du contenu",
                    "لغة المحتوى",
                  )}
                  value={journeyLocale}
                  onChange={(e) => setJourneyLocale(e.target.value as Locale)}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {L(
                  "Optional native topic",
                  "Thème natif facultatif",
                  "موضوع أصلي اختياري",
                )}
                <select
                  aria-label={L(
                    "Optional native topic",
                    "Thème natif facultatif",
                    "موضوع أصلي اختياري",
                  )}
                  value={journeyTopic}
                  onChange={(e) => setJourneyTopic(e.target.value)}
                >
                  <option value="">
                    {L(
                      "No topic preset",
                      "Aucun thème prédéfini",
                      "دون موضوع مسبق",
                    )}
                  </option>
                  {orderedTopics(snapshot.topics).map((t) => (
                    <option key={t.id} value={t.id}>
                      {topicPath(snapshot.topics, t.id)
                        .map((p) => tr(p.title, locale))
                        .join(" › ")}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className={s.targetSummary}>
              <Target size={23} />
              <div>
                <strong>
                  {tr(
                    FAMILIES.find((f) => f.key === journeyFamily)!.name,
                    locale,
                  )}{" "}
                  →{" "}
                  {tr(
                    subtypeList(journeyFamily).find(
                      (t) => t.id === journeySubtype,
                    )!.label,
                    locale,
                  )}
                </strong>
                <small>
                  {journeyLocale.toUpperCase()} · {journeyFamily}/
                  {journeySubtype}
                </small>
              </div>
            </div>
            <p className={s.finePrint}>
              {L(
                "Blank classification cells are filled only after review. Existing conflicting values are blocked. Native stable keys and unit specifications remain required.",
                "Les cellules vides sont complétées après vérification. Les valeurs contradictoires sont bloquées. Les clés stables et spécifications des unités restent requises.",
                "تُملأ الخلايا الفارغة بعد المراجعة وتُمنع القيم المتعارضة. تبقى المفاتيح الثابتة ومواصفات الوحدات مطلوبة.",
              )}
            </p>
            <div className={s.journeyActions}>
              <button
                disabled={!boot.actor.rights.manage}
                onClick={() => {
                  setJourney(false);
                  create("experience", journeyFamily, {
                    ...(journeyTopic ? { topic: journeyTopic } : {}),
                    data: {
                      subtype: journeySubtype,
                      defaultLocale: journeyLocale,
                      requiredLocales: [journeyLocale],
                    },
                  });
                }}
              >
                <Plus size={16} />
                {L(
                  "Create one manually",
                  "Créer un dossier manuellement",
                  "إنشاء ملف يدوياً",
                )}
              </button>
              <Link
                className={s.primary}
                aria-disabled={!boot.actor.rights.manage}
                href={importHref(target)}
                onClick={(e) => {
                  if (!boot.actor.rights.manage) e.preventDefault();
                }}
              >
                {L(
                  "Open native Import Studio",
                  "Ouvrir le Studio d’import natif",
                  "فتح استوديو الاستيراد الأصلي",
                )}
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </Dialog>
      ) : null}
      {targetOpen ? (
        <Dialog
          title={L(
            "Set explicit inventory targets",
            "Définir les objectifs de ressources",
            "تحديد أهداف المخزون",
          )}
          onClose={() => {
            if (!saving) setTargetOpen(false);
          }}
        >
          <div className={s.goalEditor}>
            <p>
              {L(
                "Targets refer to active published language editions in each native subcategory. Leave a field blank to keep that language unplanned; zero is an explicit target.",
                "Les objectifs portent sur les éditions linguistiques publiées actives par sous-catégorie. Un champ vide ne fixe aucun objectif ; zéro est explicite.",
                "تشير الأهداف إلى الإصدارات اللغوية المنشورة النشطة في كل فئة فرعية. الحقل الفارغ دون هدف؛ والصفر هدف صريح.",
              )}
            </p>
            <label>
              {L("Category", "Catégorie", "الفئة")}
              <select
                aria-label={L("Category", "Catégorie", "الفئة")}
                value={targetFamily}
                onChange={(e) => {
                  setTargetFamily(e.target.value);
                  setTargetSubtype("");
                  setGoalValues({ en: "", fr: "", ar: "" });
                }}
              >
                {FAMILIES.map((f) => (
                  <option key={f.key} value={f.key}>
                    {tr(f.name, locale)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {L("Apply to", "Appliquer à", "التطبيق على")}
              <select
                aria-label={L("Apply to", "Appliquer à", "التطبيق على")}
                value={targetSubtype}
                onChange={(e) => {
                  setTargetSubtype(e.target.value);
                  const v =
                    snapshot.plan.targets[targetFamily + "/" + e.target.value];
                  setGoalValues({
                    en: v?.en?.toString() || "",
                    fr: v?.fr?.toString() || "",
                    ar: v?.ar?.toString() || "",
                  });
                }}
              >
                <option value="">
                  {L(
                    "Each of the six subcategories",
                    "Chacune des six sous-catégories",
                    "كل فئة فرعية من الفئات الست",
                  )}
                </option>
                {subtypeList(targetFamily).map((t) => (
                  <option key={t.id} value={t.id}>
                    {tr(t.label, locale)}
                  </option>
                ))}
              </select>
            </label>
            <div className={s.goalLanguages}>
              {LANGUAGES.map((l) => (
                <label key={l}>
                  {l.toUpperCase()}
                  <input
                    aria-label={L(
                      "Published target " + l.toUpperCase(),
                      "Objectif publié " + l.toUpperCase(),
                      "هدف النشر " + l.toUpperCase(),
                    )}
                    type="number"
                    min="0"
                    max="100000"
                    step="1"
                    placeholder="—"
                    value={goalValues[l]}
                    onChange={(e) =>
                      setGoalValues((old) => ({ ...old, [l]: e.target.value }))
                    }
                  />
                </label>
              ))}
            </div>
            {!targetSubtype ? (
              <p className={s.finePrint}>
                {L(
                  "The values above replace the targets for all six subcategories in this category.",
                  "Ces valeurs remplacent les objectifs des six sous-catégories de cette catégorie.",
                  "تستبدل هذه القيم أهداف الفئات الفرعية الست لهذه الفئة.",
                )}
              </p>
            ) : null}
            {goalError ? (
              <p role="alert" className={s.issue}>
                {goalError}
              </p>
            ) : null}
            <button
              className={s.primary}
              disabled={saving || !boot.actor.rights.manage}
              onClick={() => void saveGoals()}
            >
              <Target size={16} />
              {saving
                ? L("Saving…", "Enregistrement…", "جار الحفظ…")
                : L(
                    "Save management targets",
                    "Enregistrer les objectifs",
                    "حفظ أهداف الإدارة",
                  )}
            </button>
            <small>
              {L(
                "Scoped native settings · revision ",
                "Réglages natifs du périmètre · révision ",
                "إعدادات أصلية للنطاق · مراجعة ",
              ) + goalRevision}
            </small>
          </div>
        </Dialog>
      ) : null}
      {help ? (
        <Dialog
          wide
          title={L(
            "How to read this inventory",
            "Comment lire cet inventaire",
            "كيف تقرأ هذا المخزون",
          )}
          onClose={() => setHelp(false)}
        >
          <div className={s.help}>
            <h3>
              {L(
                "Two timelines, one dossier",
                "Deux états dans un dossier",
                "حالتان في ملف واحد",
              )}
            </h3>
            <p>
              {L(
                "A dossier can have newer authoring work while an older language edition remains published. The map counts authored classifications from the master and active published classifications from release snapshots. These can occupy different subcategory branches.",
                "Un dossier peut être modifié pendant qu’une ancienne édition reste publiée. Le classement rédigé vient du maître ; le classement publié vient du snapshot de publication. Ils peuvent relever de branches différentes.",
                "قد يكون للملف عمل أحدث بينما يبقى إصدار سابق منشوراً. يأتي تصنيف التحرير من السجل الرئيسي وتصنيف النشر من لقطة الإصدار، وقد يختلف الفرعان.",
              )}
            </p>
            <h3>
              {L(
                "Coverage is not inferred",
                "Une couverture vérifiée",
                "تغطية غير مفترضة",
              )}
            </h3>
            <p>
              {L(
                "Language presence and translation completeness use native edition contracts. A missing language stays missing. An active publication must match its record and locale. Legacy generic releases are flagged separately.",
                "La présence et la complétude linguistiques suivent les contrats natifs. Une langue absente reste absente. Une publication active doit correspondre au dossier et à la langue. Les publications génériques antérieures sont signalées.",
                "تُحسب اللغة واكتمال ترجمتها وفق العقود الأصلية. تبقى اللغة الغائبة غائبة. يجب أن يطابق النشر النشط الملف واللغة. تُميّز الإصدارات العامة القديمة منفصلة.",
              )}
            </p>
            <h3>
              {L(
                "Targets and movement",
                "Objectifs et disposition",
                "الأهداف والتحريك",
              )}
            </h3>
            <p>
              {L(
                "Below target is calculated only from explicit team targets. Deficits are summed per branch so a surplus cannot conceal another branch’s gap. Moving cards saves a personal canvas arrangement on this browser. The authored taxonomy remains native.",
                "Le déficit se calcule uniquement selon les objectifs définis par l’équipe, branche par branche. Un surplus ne masque pas un manque ailleurs. Le déplacement des cartes enregistre une disposition personnelle sur ce navigateur. La taxonomie reste native.",
                "يُحسب العجز من أهداف الفريق الصريحة لكل فرع؛ فلا يخفي الفائض نقص فرع آخر. يُحفظ ترتيب البطاقات شخصياً في هذا المتصفح وتبقى بنية التصنيف الأصلية.",
              )}
            </p>
            <p>
              {L(
                "Refresh scans the current scoped inventory. Changes made during or after the scan may require another refresh. Media/dependency readiness remains in the native dossier.",
                "L’actualisation analyse l’inventaire du périmètre. Des modifications pendant ou après l’analyse peuvent nécessiter une nouvelle actualisation. La validation des médias et dépendances reste dans le dossier natif.",
                "يفحص التحديث مخزون النطاق الحالي. قد تتطلب التغييرات أثناء الفحص أو بعده تحديثاً آخر. تبقى جاهزية الوسائط والتبعيات داخل الملف الأصلي.",
              )}
            </p>
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}
