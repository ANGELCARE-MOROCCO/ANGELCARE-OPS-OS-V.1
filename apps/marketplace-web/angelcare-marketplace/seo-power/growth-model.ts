import { type Row, type World, record, root, publicPath } from "./model";
export type InventoryItem = {
  id: string;
  key: string;
  world: World;
  locale: string;
  path: string;
  title: string;
  summary: string;
  group: string;
  topic: string;
  image?: string;
  revision?: string;
  country?: string;
};
export type GrowthPolicy = {
  enabled: boolean;
  automaticDrafts: boolean;
  automaticPublish: boolean;
  automaticMetadata: boolean;
  measurement: boolean;
  minimumItems: number;
  minimumWords: number;
  maxPagesPerDay: number;
  syncMinutes: number;
};
export const GROWTH_DEFAULT: GrowthPolicy = {
  enabled: false,
  automaticDrafts: true,
  automaticPublish: false,
  automaticMetadata: false,
  measurement: false,
  minimumItems: 3,
  minimumWords: 180,
  maxPagesPerDay: 3,
  syncMinutes: 60,
};
export function growthPolicy(v: unknown): GrowthPolicy {
  const r = record(v),
    num = (k: string, min: number, max: number) =>
      Math.max(
        min,
        Math.min(
          max,
          Math.trunc(
            Number(r[k]) || Number(GROWTH_DEFAULT[k as keyof GrowthPolicy]),
          ),
        ),
      );
  return {
    enabled: r.enabled === true,
    automaticDrafts: r.automaticDrafts !== false,
    automaticPublish: r.automaticPublish === true,
    automaticMetadata: r.automaticMetadata === true,
    measurement: r.measurement === true,
    minimumItems: num("minimumItems", 3, 12),
    minimumWords: num("minimumWords", 120, 2000),
    maxPagesPerDay: num("maxPagesPerDay", 1, 30),
    syncMinutes: num("syncMinutes", 15, 1440),
  };
}
export const words = (s: string) =>
  s.trim().split(/\s+/).filter(Boolean).length;
export const plain = (v: unknown, max = 6000) =>
  String(v || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
export const groups = (items: InventoryItem[]) => {
  const map = new Map<string, InventoryItem[]>();
  for (const x of items) {
    const key = x.locale + "|" + x.group + "|" + x.topic;
    map.set(key, [...(map.get(key) || []), x]);
  }
  return map;
};
export const slug = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
const COPY = {
  fr: {
    selection: "Sélection",
    available: "Contenus publiés à découvrir",
    guide: "Comparer les contenus disponibles",
    intro:
      "Cette sélection rassemble des contenus actuellement publiés. Consultez chaque fiche pour connaître les informations, les conditions et les possibilités proposées par sa source.",
    how: "Choisissez un contenu selon son descriptif et ouvrez sa fiche pour vérifier son adéquation à votre besoin. Les informations de disponibilité restent gérées par le catalogue d’origine.",
    open: "Ouvrir la fiche",
    empty: "Cette sélection est en cours de mise à jour.",
  },
  ar: {
    selection: "مجموعة",
    available: "محتوى منشور للاستكشاف",
    guide: "قارن المحتوى المتاح",
    intro:
      "تجمع هذه الصفحة محتوى منشوراً حالياً. افتح كل صفحة للاطلاع على المعلومات والشروط والإمكانات المتاحة من المصدر.",
    how: "اختر المحتوى حسب وصفه وافتح صفحته للتحقق من ملاءمته لاحتياجاتك. يبقى توفر المحتوى مرتبطاً بالكتالوج الأصلي.",
    open: "فتح الصفحة",
    empty: "هذه المجموعة قيد التحديث.",
  },
  en: {
    selection: "Selection",
    available: "Published content to explore",
    guide: "Compare available content",
    intro:
      "This selection brings together currently published content. Open each listing to check the information, conditions and options provided by its original source.",
    how: "Choose an item using its description and open its page to assess its suitability. Availability remains controlled by the original catalogue.",
    open: "Open listing",
    empty: "This selection is being updated.",
  },
  es: {
    selection: "Selección",
    available: "Contenido publicado",
    guide: "Comparar el contenido disponible",
    intro:
      "Esta selección reúne contenido publicado. Abre cada ficha para consultar la información y las condiciones de su fuente original.",
    how: "Compara las descripciones y consulta la ficha original para confirmar su adecuación y disponibilidad.",
    open: "Abrir ficha",
    empty: "Selección en actualización.",
  },
  hi: {
    selection: "चयन",
    available: "प्रकाशित सामग्री",
    guide: "उपलब्ध सामग्री की तुलना करें",
    intro:
      "यह चयन वर्तमान प्रकाशित सामग्री दिखाता है। जानकारी और शर्तों के लिए मूल पृष्ठ खोलें।",
    how: "विवरणों की तुलना करें और उपलब्धता की पुष्टि मूल पृष्ठ पर करें।",
    open: "पृष्ठ खोलें",
    empty: "चयन अपडेट किया जा रहा है।",
  },
  tl: {
    selection: "Pinili",
    available: "Nailathalang nilalaman",
    guide: "Ihambing ang mga pagpipilian",
    intro:
      "Naglalaman ang pahinang ito ng kasalukuyang nailathalang nilalaman. Buksan ang orihinal na pahina para sa mga detalye at kundisyon.",
    how: "Ihambing ang paglalarawan at tiyakin ang pagiging angkop at availability sa orihinal na pahina.",
    open: "Buksan",
    empty: "Ina-update ang pagpili.",
  },
  id: {
    selection: "Pilihan",
    available: "Konten terbit",
    guide: "Bandingkan konten tersedia",
    intro:
      "Pilihan ini berisi konten yang saat ini diterbitkan. Buka halaman sumber untuk melihat informasi dan persyaratan.",
    how: "Bandingkan deskripsi dan periksa kesesuaian serta ketersediaan di halaman asli.",
    open: "Buka halaman",
    empty: "Pilihan sedang diperbarui.",
  },
};
export const growthCopy = (locale: string) =>
  COPY[locale as keyof typeof COPY] || COPY.en;
export function candidate(items: InventoryItem[], policy: GrowthPolicy) {
  const unique = [...new Map(items.map((x) => [x.path, x])).values()]
      .slice(0, 12)
      .map((x) => ({ ...x, summary: plain(x.summary, 1200) })),
    first = unique[0];
  if (!first) throw Error("EMPTY_INVENTORY");
  for (const item of unique) {
    publicPath(item.path, item.world);
    if (item.world !== first.world || item.locale !== first.locale)
      throw Error("MIXED_INVENTORY");
  }
  const c = growthCopy(first.locale),
    topic = first.topic || first.group,
    heading = `${c.selection} · ${topic}`,
    body = [c.intro, c.how].join("\n\n");
  const evidence = {
    source: "native_published_inventory",
    searchVolume: null,
    searchDemand: "hypothesis",
    items: unique.length,
    words: words(unique.map((x) => x.title + " " + x.summary).join(" ")),
    locales: [first.locale],
    coverage: "bounded_page_sample",
  };
  const blocks = [];
  if (unique.length < policy.minimumItems) blocks.push("INSUFFICIENT_ITEMS");
  if (evidence.words < policy.minimumWords)
    blocks.push("INSUFFICIENT_SOURCE_CONTENT");
  if (unique.some((x) => x.summary.length < 40))
    blocks.push("INCOMPLETE_DESCRIPTIONS");
  return {
    locale: first.locale,
    group: first.group,
    topic,
    key: first.locale + "|" + first.group + "|" + topic,
    path: `${root(first.world)}/${first.locale}/discover/${slug(first.group) || "selection"}-${slug(topic) || "collection"}`,
    title: heading,
    description: plain(unique.map((x) => x.title).join(" · "), 155),
    body,
    items: unique,
    evidence,
    blocks,
    ready: blocks.length === 0,
  };
}
export function overlap(a: InventoryItem[], b: InventoryItem[]) {
  const x = new Set(a.map((v) => v.path));
  const y = new Set(b.map((v) => v.path));
  return (
    [...x].filter((v) => y.has(v)).length /
    Math.max(1, Math.min(x.size, y.size))
  );
}
export function safeSuggestion(page: Row, others: Row[]) {
  const facts = record(page.facts);
  if (
    Number(facts.status) !== 200 ||
    /noindex/i.test(String(facts.robots)) ||
    !facts.sourceStamp
  )
    return null;
  const patch: Row = { sourceStamp: facts.sourceStamp };
  const headings = Array.isArray(facts.headings)
    ? facts.headings.map(String)
    : [];
  if (!String(facts.title || "").trim() && headings[0])
    patch.title = plain(headings[0], 90);
  if (
    !String(facts.description || "").trim() &&
    String(facts.text || "").length >= 100
  )
    patch.description = plain(facts.text, 155);
  if (!facts.canonical) patch.canonicalPath = page.path;
  const tokens = new Set(
    plain(String(page.title || "") + " " + String(facts.text || ""), 3000)
      .toLowerCase()
      .match(/[\p{L}\p{N}]{4,}/gu) || [],
  );
  const related = others
    .filter(
      (p) =>
        p.id !== page.id &&
        p.locale === page.locale &&
        p.project_id === page.project_id &&
        p.indexable === true &&
        Number(p.http_status) === 200,
    )
    .map((p) => ({
      p,
      score: (
        plain(p.title, 300)
          .toLowerCase()
          .match(/[\p{L}\p{N}]{4,}/gu) || []
      ).filter((t) => tokens.has(t)).length,
    }))
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((x) => x.p.path);
  if (facts.bodyHook === "r1" && related.length) patch.relatedPaths = related;
  return Object.keys(patch).length > 1 ? patch : null;
}
