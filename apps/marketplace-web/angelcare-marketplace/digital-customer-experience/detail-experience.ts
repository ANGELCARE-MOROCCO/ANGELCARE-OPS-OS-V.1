import {
  array,
  object,
  text,
  type Collection,
  type Data,
  type Family,
  type Field,
  type Issue,
  type Tri,
} from "./types";
const f = (
  key: string,
  label: Tri,
  type: Field["type"] = "text",
  extra: Partial<Field> = {},
): Field => ({
  key,
  label,
  type,
  classification: "public",
  localized: ["title", "text", "help", "alt"].includes(key),
  ...extra,
});
const id = f(
  "id",
  ["Stable identity", "Identité stable", "هوية ثابتة"],
  "text",
  { required: true, localized: false },
);
const title = f("title", ["Title", "Titre", "العنوان"], "text", {
  required: true,
});
const body = f("text", ["Description", "Description", "الوصف"], "textarea");
const image = f(
  "assetId",
  ["Illustration", "Illustration", "صورة"],
  "reference",
  { reference: "media", mime: ["image/"] },
);
const collection = (
  key: string,
  label: Tri,
  fields: Field[],
  max: number,
): Collection => ({ key, label, fields: [id, ...fields], min: 0, max });
export function enrichDetailExperience(family: Family): Family {
  const next = {
    ...family,
    fields: [...family.fields],
    collections: family.collections.map((c) => ({
      ...c,
      fields: [...c.fields],
    })),
  };
  next.collections.push(
    collection(
      "detailSections",
      [
        "Detail experience chapters",
        "Chapitres de la page détaillée",
        "فصول صفحة التجربة",
      ],
      [
        title,
        f("kind", ["Purpose", "Fonction", "الغرض"], "select", {
          options: [
            "overview",
            "method",
            "preparation",
            "application",
            "adaptation",
            "discussion",
            "extension",
            "provenance",
          ],
          defaultValue: "method",
        }),
        body,
        image,
        f("alt", ["Image description", "Description de l’image", "وصف الصورة"]),
        f(
          "contentId",
          ["Published reading", "Lecture publiée", "قراءة منشورة"],
          "reference",
          { reference: "content" },
        ),
        f(
          "experienceId",
          ["Continue with", "Poursuivre avec", "تابع مع"],
          "reference",
          { reference: "experience" },
        ),
      ],
      40,
    ),
  );
  if (family.key === "visual-cards") {
    next.fields.push(
      f(
        "sortingEnabled",
        [
          "Enable classification studio",
          "Activer l’atelier de classement",
          "تفعيل ورشة التصنيف",
        ],
        "toggle",
        { defaultValue: false },
      ),
    );
    next.collections.push(
      collection(
        "sortRules",
        ["Classification rules", "Règles de classement", "قواعد التصنيف"],
        [title, body],
        12,
      ),
      collection(
        "sortGroups",
        ["Classification groups", "Groupes de classement", "مجموعات التصنيف"],
        [
          title,
          body,
          f(
            "ruleId",
            ["Rule identity", "Identité de règle", "هوية القاعدة"],
            "text",
            { required: true },
          ),
        ],
        48,
      ),
    );
    next.collections
      .find((c) => c.key === "cards")
      ?.fields.push(
        f(
          "answer",
          [
            "Accepted groups by rule",
            "Groupes acceptés par règle",
            "المجموعات المقبولة لكل قاعدة",
          ],
          "textarea",
          { classification: "private", localized: false },
        ),
      );
  }
  if (family.key === "audio") {
    next.collections.push(
      collection(
        "cues",
        [
          "Timed listening transcript",
          "Transcription d’écoute synchronisée",
          "نص الاستماع المتزامن",
        ],
        [
          f(
            "unitId",
            ["Recording identity", "Identité d’enregistrement", "هوية التسجيل"],
            "text",
            { required: true },
          ),
          f(
            "text",
            ["Spoken passage", "Passage prononcé", "المقطع المنطوق"],
            "textarea",
            { localized: true, required: true },
          ),
          f(
            "startSeconds",
            ["Start · seconds", "Début · secondes", "البداية · ثوان"],
            "number",
            { min: 0, max: 86400, required: true },
          ),
          f(
            "endSeconds",
            ["End · seconds", "Fin · secondes", "النهاية · ثوان"],
            "number",
            { min: 0, max: 86400, required: true },
          ),
        ],
        500,
      ),
    );
    next.fields.push(
      f(
        "soundMatchingEnabled",
        [
          "Enable listening investigation",
          "Activer l’enquête sonore",
          "تفعيل استكشاف الأصوات",
        ],
        "toggle",
        { defaultValue: false },
      ),
    );
    next.collections.push(
      collection(
        "soundItems",
        ["Listening pairs", "Associations sonores", "أزواج الاستماع"],
        [
          title,
          f("kind", ["Item type", "Type d’élément", "نوع العنصر"], "select", {
            options: ["audio", "image"],
            defaultValue: "audio",
          }),
          f(
            "assetId",
            ["Sound file", "Fichier sonore", "ملف صوتي"],
            "reference",
            { reference: "media", mime: ["audio/"] },
          ),
          f(
            "coverAssetId",
            ["Image choice", "Choix visuel", "خيار مصور"],
            "reference",
            { reference: "media", mime: ["image/"] },
          ),
          f(
            "answer",
            [
              "Private matching key",
              "Clé privée d’association",
              "مفتاح المطابقة الخاص",
            ],
            "text",
            { classification: "private", localized: false, required: true },
          ),
        ],
        40,
      ),
    );
  }
  if (family.key === "bundles") {
    next.fields.push(
      f(
        "printAllowed",
        [
          "Allow eligible pathway print packs",
          "Autoriser les dossiers imprimables du parcours",
          "السماح بحزم طباعة المسار المصرح بها",
        ],
        "toggle",
        { defaultValue: false },
      ),
    );
    next.collections
      .find((c) => c.key === "steps")
      ?.fields.push(
        f(
          "completion",
          [
            "Step completion authority",
            "Autorité de complétion de l’étape",
            "جهة إكمال الخطوة",
          ],
          "select",
          { options: ["child_state", "manual"], defaultValue: "child_state" },
        ),
      );
  }
  if (family.key === "activities") {
    next.fields = next.fields.map((x) =>
      x.key === "engine"
        ? { ...x, options: [...(x.options || []), "bridge"] }
        : x,
    );
    next.collections = next.collections.map((c) =>
      c.key === "tasks" ? { ...c, min: 0 } : c,
    );
    const n = (
      key: string,
      label: Tri,
      min: number,
      max: number,
      defaultValue: number,
    ) => f(key, label, "number", { min, max, defaultValue, required: true });
    next.collections.push(
      collection(
        "bridgeChallenges",
        [
          "Bridge challenges · classroom model",
          "Défis de pont · modèle pédagogique",
          "تحديات الجسور · نموذج تعليمي",
        ],
        [
          title,
          body,
          n(
            "span",
            ["Span in bays", "Portée en travées", "الامتداد بوحدات"],
            2,
            6,
            4,
          ),
          n(
            "strength",
            ["Member capacity", "Capacité d’une barre", "قدرة العضو"],
            1,
            500,
            30,
          ),
          n(
            "targetLoad",
            ["Target load", "Charge cible", "الحمل المستهدف"],
            1,
            2000,
            40,
          ),
          n(
            "edgeBudget",
            ["Member budget", "Budget de barres", "عدد الأعضاء المتاح"],
            2,
            40,
            16,
          ),
        ],
        12,
      ),
    );
    next.modesContract = next.modesContract?.map((m) => ({
      ...m,
      allowedEngines: [...(m.allowedEngines || []), "bridge"],
    }));
  }
  return next;
}
export function classificationAnswer(value: unknown): Record<string, string[]> {
  try {
    const x = object(JSON.parse(text(value)));
    return Object.fromEntries(
      Object.entries(x)
        .filter(
          ([k, v]) =>
            k.length <= 120 &&
            Array.isArray(v) &&
            v.every((a) => typeof a === "string" && a.length <= 120),
        )
        .map(([k, v]) => [k, v as string[]]),
    );
  } catch {
    return {};
  }
}
export function detailExperienceIssues(family: Family, d: Data): Issue[] {
  const issues: Issue[] = [];
  const add = (path: string, en: string, fr: string, ar: string) =>
    issues.push({
      path,
      code: "DETAIL_EXPERIENCE",
      message: [en, fr, ar],
      severity: "error",
    });
  if (family.key === "visual-cards" && d.sortingEnabled === true) {
    const rules = array(d.sortRules),
      groups = array(d.sortGroups),
      cards = array(d.cards);
    if (!rules.length || cards.length < 2)
      add(
        "sortRules",
        "Classification needs a rule and at least two cards.",
        "Le classement exige une règle et au moins deux cartes.",
        "يتطلب التصنيف قاعدة وبطاقتين على الأقل.",
      );
    for (const r of rules) {
      const allowed = groups
        .filter((g) => g.ruleId === r.id)
        .map((g) => text(g.id));
      if (allowed.length < 2)
        add(
          "sortGroups",
          "Each rule needs two groups.",
          "Chaque règle exige deux groupes.",
          "تحتاج كل قاعدة مجموعتين.",
        );
      for (const c of cards) {
        const a = classificationAnswer(c.answer)[text(r.id)] || [];
        if (!a.length || a.some((id) => !allowed.includes(id)))
          add(
            "cards." + text(c.id) + ".answer",
            "Choose accepted groups for every rule.",
            "Choisissez les groupes acceptés pour chaque règle.",
            "اختر المجموعات المقبولة لكل قاعدة.",
          );
      }
    }
    for (const g of groups)
      if (!rules.some((r) => r.id === g.ruleId))
        add(
          "sortGroups",
          "A group points to a missing rule.",
          "Un groupe référence une règle absente.",
          "مجموعة مرتبطة بقاعدة مفقودة.",
        );
  }
  if (family.key === "audio")
    for (const cue of array(d.cues)) {
      const unit = array(d.units).find((u) => u.id === cue.unitId),
        end = Math.min(
          Number(unit?.duration) || Infinity,
          Number(unit?.endSeconds) || Infinity,
        );
      if (
        !array(d.units).some((u) => u.id === cue.unitId) ||
        !Number.isFinite(cue.startSeconds) ||
        !Number.isFinite(cue.endSeconds) ||
        Number(cue.endSeconds) <= Number(cue.startSeconds) ||
        Number(cue.endSeconds) > end ||
        Number(cue.startSeconds) < Number(unit?.startSeconds || 0)
      )
        add(
          "cues",
          "Bind each passage to a recording and a valid increasing time range.",
          "Liez chaque passage à un enregistrement et à une plage temporelle croissante.",
          "اربط كل مقطع بتسجيل ونطاق زمني متزايد صالح.",
        );
    }
  if (family.key === "audio" && d.soundMatchingEnabled === true) {
    const items = array(d.soundItems),
      keys = [...new Set(items.map((i) => text(i.answer)))];
    if (keys.length < 2)
      add(
        "soundItems",
        "Publish at least two sound/image pairs.",
        "Publiez au moins deux paires son/image.",
        "انشر زوجين صوت وصورة على الأقل.",
      );
    for (const key of keys) {
      const pair = items.filter((i) => i.answer === key);
      if (
        !key ||
        pair.length !== 2 ||
        pair.filter((i) => i.kind === "audio" && text(i.assetId)).length !==
          1 ||
        pair.filter((i) => i.kind === "image" && text(i.coverAssetId))
          .length !== 1
      )
        add(
          "soundItems",
          "Each private key needs one sound and one image.",
          "Chaque clé privée exige un son et une image.",
          "كل مفتاح خاص يحتاج صوتاً وصورة.",
        );
    }
  }
  if (family.key === "activities") {
    if (d.engine === "bridge") {
      if (!array(d.bridgeChallenges).length)
        add(
          "bridgeChallenges",
          "Add a bridge challenge.",
          "Ajoutez un défi de pont.",
          "أضف تحدي جسر.",
        );
      for (const c of array(d.bridgeChallenges))
        if (
          !Number.isInteger(c.span) ||
          !Number.isInteger(c.edgeBudget) ||
          Number(c.edgeBudget) < Number(c.span)
        )
          add(
            "bridgeChallenges",
            "Span and budget must be whole numbers; budget must cover the span.",
            "La portée et le budget sont entiers ; le budget doit couvrir la portée.",
            "يجب أن يكون الامتداد والعدد صحيحين وأن يكفي العدد للامتداد.",
          );
    } else if (!array(d.tasks).length)
      add(
        "tasks",
        "Add activity tasks.",
        "Ajoutez les tâches de l’activité.",
        "أضف مهام النشاط.",
      );
  }
  return issues;
}
