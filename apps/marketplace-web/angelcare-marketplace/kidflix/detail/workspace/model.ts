import {
  availableNodes,
  blankContinuity,
} from "../../../digital-customer-experience/continuity";
import { asset, clampIndex, obj, rows, str, type Row } from "../model";
import { local } from "../copy";
import type { PlayerProps } from "../shared";
import type { Tri } from "../../catalogue";
export type WorkspaceProfile = {
  icon: string;
  accent: string;
  glow: string;
  primary: Tri;
  index: Tri;
  tools: Tri;
  noun: Tri;
  shape: string;
};
export const profiles: Record<string, WorkspaceProfile> = {
  documents: {
    icon: "BookOpen",
    accent: "#0059e3",
    glow: "#78d4ff",
    primary: ["Read", "Lire", "قراءة"],
    index: ["Outline & pages", "Sommaire et pages", "الفهرس والصفحات"],
    tools: ["Reading desk", "Repères de lecture", "مكتب القراءة"],
    noun: ["pages", "pages", "صفحات"],
    shape: "paper",
  },
  printables: {
    icon: "Printer",
    accent: "#e92262",
    glow: "#ffcd3f",
    primary: ["Inspect pages", "Inspecter les pages", "فحص الصفحات"],
    index: [
      "Worksheet collection",
      "Collection de fiches",
      "مجموعة أوراق العمل",
    ],
    tools: ["Prepare & print", "Préparer et imprimer", "تجهيز وطباعة"],
    noun: ["pages", "pages", "صفحات"],
    shape: "paper",
  },
  stories: {
    icon: "BookOpen",
    accent: "#8144d9",
    glow: "#c699f9",
    primary: ["Enter the story", "Entrer dans le récit", "ادخل الحكاية"],
    index: ["Story scenes", "Scènes du récit", "مشاهد القصة"],
    tools: ["Story routes", "Parcours narratifs", "مسارات القصة"],
    noun: ["scenes", "scènes", "مشاهد"],
    shape: "story",
  },
  learning: {
    icon: "GraduationCap",
    accent: "#0764d7",
    glow: "#6bd9ec",
    primary: ["Your lesson", "Votre leçon", "درسك"],
    index: ["Course programme", "Programme de formation", "برنامج التعلم"],
    tools: ["Learning pathway", "Parcours pédagogique", "مسار التعلم"],
    noun: ["lessons", "leçons", "دروس"],
    shape: "lesson",
  },
  video: {
    icon: "Play",
    accent: "#6337cf",
    glow: "#8b99fc",
    primary: ["Watch", "Regarder", "شاهد"],
    index: ["Episodes & chapters", "Épisodes et chapitres", "الحلقات والفصول"],
    tools: ["Observation desk", "Carnet d’observation", "مكتب الملاحظة"],
    noun: ["videos", "vidéos", "فيديوهات"],
    shape: "cinema",
  },
  audio: {
    icon: "Headphones",
    accent: "#087f9e",
    glow: "#62d4cc",
    primary: ["Listen", "Écouter", "استمع"],
    index: ["Tracks & episodes", "Pistes et épisodes", "المقاطع والحلقات"],
    tools: ["Listening practice", "Pratique d’écoute", "تمرين الاستماع"],
    noun: ["recordings", "enregistrements", "تسجيلات"],
    shape: "sound",
  },
  "visual-cards": {
    icon: "Layers",
    accent: "#0059e3",
    glow: "#6dd2f6",
    primary: ["Explore & study", "Explorer et apprendre", "استكشف وتعلم"],
    index: ["Visual collection", "Collection visuelle", "المجموعة البصرية"],
    tools: ["Classify & compare", "Classer et comparer", "صنّف وقارن"],
    noun: ["cards", "cartes", "بطاقات"],
    shape: "cards",
  },
  presentations: {
    icon: "Monitor",
    accent: "#2652cc",
    glow: "#73cce1",
    primary: ["Present", "Présenter", "اعرض"],
    index: ["Slide sorter", "Trieuse de diapositives", "ترتيب الشرائح"],
    tools: ["Facilitation desk", "Espace d’animation", "مكتب التيسير"],
    noun: ["slides", "diapositives", "شرائح"],
    shape: "slides",
  },
  assessments: {
    icon: "ClipboardCheck",
    accent: "#f05b23",
    glow: "#ffbe66",
    primary: ["Your assessment", "Votre évaluation", "تقييمك"],
    index: ["Question map", "Carte des questions", "خريطة الأسئلة"],
    tools: ["Assessment brief", "Repères d’évaluation", "دليل التقييم"],
    noun: ["questions", "questions", "أسئلة"],
    shape: "assessment",
  },
  activities: {
    icon: "FlaskConical",
    accent: "#087d62",
    glow: "#83d19d",
    primary: ["Experiment", "Expérimenter", "جرّب"],
    index: ["Tasks & challenges", "Tâches et défis", "المهام والتحديات"],
    tools: ["Prepare the activity", "Préparer l’activité", "جهّز النشاط"],
    noun: ["tasks", "tâches", "مهام"],
    shape: "lab",
  },
  tools: {
    icon: "SlidersHorizontal",
    accent: "#1b67c9",
    glow: "#70c3ff",
    primary: ["Use the tool", "Utiliser l’outil", "استخدم الأداة"],
    index: [
      "Inputs & references",
      "Données et références",
      "المدخلات والمراجع",
    ],
    tools: ["Compare scenarios", "Comparer les scénarios", "قارن السيناريوهات"],
    noun: ["inputs", "entrées", "مدخلات"],
    shape: "tool",
  },
  planners: {
    icon: "CalendarDays",
    accent: "#d33f82",
    glow: "#ffaccb",
    primary: ["Your planner", "Votre planning", "مخططك"],
    index: ["Planning sections", "Rubriques du planning", "أقسام التخطيط"],
    tools: ["Organize your plan", "Organiser votre plan", "نظّم خطتك"],
    noun: ["items", "éléments", "عناصر"],
    shape: "planner",
  },
  forms: {
    icon: "ListChecks",
    accent: "#6650c8",
    glow: "#b0a0fa",
    primary: ["Private questionnaire", "Questionnaire privé", "استبيان خاص"],
    index: ["Your questions", "Vos questions", "أسئلتك"],
    tools: ["Personal reflection", "Réflexion personnelle", "تأمل شخصي"],
    noun: ["fields", "champs", "حقول"],
    shape: "form",
  },
  community: {
    icon: "Users",
    accent: "#087f9b",
    glow: "#74d2c7",
    primary: ["Explore the archive", "Explorer les archives", "استكشف الأرشيف"],
    index: ["Archive directory", "Répertoire des archives", "فهرس الأرشيف"],
    tools: ["Sources & context", "Sources et contexte", "المصادر والسياق"],
    noun: ["entries", "entrées", "إدخالات"],
    shape: "archive",
  },
  commerce: {
    icon: "Package",
    accent: "#ce5e16",
    glow: "#ffd36f",
    primary: ["Explore the resource", "Explorer la ressource", "استكشف المورد"],
    index: ["Included content", "Contenus inclus", "المحتوى المضمّن"],
    tools: ["Compare extensions", "Comparer les extensions", "قارن الامتدادات"],
    noun: ["offers", "offres", "عروض"],
    shape: "offer",
  },
  bundles: {
    icon: "Route",
    accent: "#4a55cc",
    glow: "#8cc2fc",
    primary: ["Your pathway", "Votre parcours", "مسارك"],
    index: ["Connected resources", "Ressources reliées", "الموارد المترابطة"],
    tools: ["Prepare your pathway", "Préparer votre parcours", "جهّز مسارك"],
    noun: ["steps", "étapes", "خطوات"],
    shape: "pathway",
  },
};
export type Entry = {
  id: string;
  label: string;
  text: string;
  image: string;
  current: boolean;
  locked: boolean;
  patch?: Row;
  anchor?: string;
};
function ordered(all: Row[], ids: unknown): Row[] {
  return Array.isArray(ids) &&
    ids.length === all.length &&
    new Set(ids).size === all.length &&
    ids.every((id) => all.some((u) => u.id === id))
    ? ids.map((id) => all.find((u) => u.id === id)!)
    : all;
}
/** The external index follows the native player order, subset and locks. It never completes a unit. */
export function workspaceEntries(p: PlayerProps): Entry[] {
  const { m, d, state, engine, locale } = p,
    f = m.family;
  let source: Row[] = [],
    navigable = false;
  if (
    [
      "documents",
      "printables",
      "stories",
      "video",
      "audio",
      "learning",
    ].includes(f) ||
    (f === "planners" && engine === "print")
  ) {
    source = rows(d.units);
    navigable = true;
  } else if (f === "presentations") {
    source = rows(d.frames);
    navigable = d.navigationAllowed !== false || engine !== "autoplay";
  } else if (f === "visual-cards") {
    const selected = Array.isArray(state.studyIds) ? state.studyIds : null;
    source = ordered(
      rows(d.cards).filter(
        (c) =>
          (selected === null || selected.includes(c.id)) &&
          (!state.reviewOnly ||
            !Array.isArray(state.known) ||
            !state.known.includes(c.id)),
      ),
      state.cardOrder,
    );
    navigable = true;
  } else if (f === "assessments") {
    source = ordered(rows(d.questions), state.questionOrder);
    navigable =
      state.started === true && typeof obj(state.grade).percent !== "number";
  } else if (f === "activities") {
    source = rows(d.tasks);
    navigable =
      ["stepper", "simulation"].includes(engine) && d.engine !== "bridge";
  } else if (f === "planners")
    source = ordered(rows(d.items), state.plannerOrder);
  else if (f === "forms")
    source = rows(d.fields).filter(
      (r) => !["file", "email", "tel"].includes(r.type),
    );
  else if (f === "tools") source = rows(d.inputs);
  else if (f === "community") source = rows(d.rules);
  else if (f === "commerce")
    source =
      m.audience === "child"
        ? []
        : rows(d.offers).filter((o) =>
            str(obj(obj(m.bindings).offers?.[o.nativeId]).url),
          );
  else if (f === "bundles") source = rows(d.steps);
  const current =
    ["documents", "printables", "stories"].includes(f) &&
    source.some((u) => u.id === state.readerUnitId)
      ? source.findIndex((u) => u.id === state.readerUnitId)
      : clampIndex(state.index, source.length);
  const allowed =
    f === "learning"
      ? new Set(
          availableNodes(source as any, {
            ...blankContinuity(),
            completed: Array.isArray(state.completed) ? state.completed : [],
          }).map((u) => u.id),
        )
      : null;
  return source.map((u, i) => {
    const a = asset(m, u.posterAssetId || u.assetId, "image/");
    const locked = !!allowed && !allowed.has(u.id);
    const patch =
      navigable && !locked
        ? {
            index: i,
            ...(["documents", "printables", "stories"].includes(f) ||
            (f === "planners" && engine === "print")
              ? { readerUnitId: u.id }
              : {}),
            ...(["video", "audio"].includes(f) ? { mediaContinue: false } : {}),
          }
        : undefined;
    return {
      id: str(u.id) || String(i),
      label:
        local(u, "title", locale) ||
        local(u, "label", locale) ||
        local(u, "prompt", locale) ||
        local(u, "question", locale) ||
        String(i + 1),
      text:
        local(u, "text", locale) ||
        local(u, "description", locale) ||
        local(u, "prompt", locale),
      image: a?.url || "",
      current: navigable && i === current,
      locked,
      patch,
      anchor:
        f === "planners"
          ? "r5-item-planners-" + u.id
          : f === "tools"
            ? "r5-item-tools-" + u.id
            : f === "community"
              ? "r5-item-community-" + u.id
              : undefined,
    };
  });
}
export function workspaceTags(d: Row): string[] {
  return [
    ...new Set(
      [str(d.subject), ...str(d.skillTags).split(/\r?\n/)].filter(Boolean),
    ),
  ].slice(0, 8);
}
