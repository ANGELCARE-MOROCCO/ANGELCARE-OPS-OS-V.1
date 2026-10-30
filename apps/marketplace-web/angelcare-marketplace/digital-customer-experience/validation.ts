import {FOCUS,classificationChoices} from "../kidflix/storefront-reference/taxonomy";
import { detailExperienceIssues } from "./detail-experience";
import { depthIssues } from "./experience-depth";
import { activeField, translationCoverage } from "./localisation";
import {
  compatibleDefinition,
  DEFINITION_VERSION,
  modeContract,
} from "./capabilities";
import {
  array,
  number,
  object,
  text,
  type Data,
  type DceRecord,
  type Family,
  type Issue,
  type Locale,
} from "./types";

export function capabilityIssues(
  record: DceRecord,
  family: Family | undefined,
): Issue[] {
  const issues: Issue[] = [],
    adapted = compatibleDefinition(record.family, record.data),
    d = adapted.data;
  const add = (path: string, code: string, en: string) =>
    issues.push({
      path,
      code,
      message: [en, "À corriger : " + en, "يلزم التصحيح: " + en],
      severity: "error",
    });
  if(record.family&&FOCUS[record.family])for(const key of ["storefrontFocus","storefrontThemes","storefrontNeeds","storefrontQuick"]){const v=d[key],allowed=classificationChoices(record.family,key).map(c=>c.key);if(v!==undefined&&(typeof v!=="string"||v.length>8000||v.split(/\r?\n/).filter(Boolean).some(s=>!allowed.includes(s))))add(key,"STOREFRONT_CLASSIFICATION","Choose only the available verified storefront classifications.");}
  if(record.family === "documents") {
    for(const key of ["documentUses","documentGrades","documentThemes","documentNeeds"]) {
      const definition=family?.fields.find(f=>f.key===key),value=d[key];
      if(value!==undefined&&typeof value!=="string") add(key,"DOCUMENT_CLASSIFICATION","Document classifications must use the native selections.");
      else if(typeof value==="string"&&value.split(/\r?\n/).filter(Boolean).some(v=>!definition?.options?.includes(v))) add(key,"DOCUMENT_CLASSIFICATION","Choose only the available document classifications.");
    }
  }
  if (number(d.definitionVersion, 1) > DEFINITION_VERSION)
    add(
      "definitionVersion",
      "VERSION",
      "This definition requires a newer authoring contract. Preserve it and upgrade before editing.",
    );
  for (const n of adapted.notices.filter((x) => x.conflict))
    add(n.path, "LEGACY_CONFLICT", n.message);
  if (!family || !["experience", "template", "bundle"].includes(record.kind))
    return issues;
  if (["experience", "bundle"].includes(record.kind) && !text(object(object(d.locales)[text(d.defaultLocale)]).coverAssetId || d.coverAssetId))
    issues.push({ path: "coverAssetId", code: "PUBLIC_COVER_REQUIRED", severity: "error", message: ["Choose the image for this resource’s storefront card.", "Choisissez l’image de la carte publique de cette ressource.", "اختر صورة بطاقة هذا المورد في الواجهة العامة."] });
  issues.push(...depthIssues(d, family));
  if (record.kind !== "template")
    issues.push(...detailExperienceIssues(family, d));
  const draftTemplate = record.kind === "template",
    mode = modeContract(family, d),
    requiredLocales = (
      Array.isArray(d.requiredLocales)
        ? d.requiredLocales
        : [d.defaultLocale || "en"]
    ).map(String);
  for (const f of family.fields) {
    if (!activeField(f, mode?.engine || "")) continue;
    const v = d[f.key];
    if (
      f.required &&
      !draftTemplate &&
      (v == null || (typeof v === "string" && !v.trim()))
    )
      add(f.key, "REQUIRED", "Complete " + f.label[0] + ".");
    if (
      f.type === "number" &&
      v != null &&
      (typeof v !== "number" ||
        !Number.isFinite(v) ||
        (f.min != null && v < f.min) ||
        (f.max != null && v > f.max))
    )
      add(f.key, "NUMBER", "Use a number within the declared limits.");
    if (f.type === "select" && v && f.options && !f.options.includes(text(v)))
      add(f.key, "ENUM", "Choose a declared option.");
  }
  for (const c of family.collections) {
    const rows = array(d[c.key]);
    if (c.max && rows.length > c.max)
      add(c.key, "COLLECTION_LIMIT", "Split this collection before release.");
  }
  if (!draftTemplate)
    for (const locale of requiredLocales)
      for (const path of translationCoverage(record, locale).missing)
        add(
          "locales." + locale + "." + path,
          "TRANSLATION_REQUIRED",
          "Complete " + path + " for " + locale + ".",
        );
  const units = array(d.units);
  if (record.family === "documents" && !draftTemplate) {
    if (
      mode?.engine === "pdf" &&
      !units.some((u) => u.kind === "pdf" && u.assetId)
    )
      add("units", "MODE_CONTENT", "PDF Reader needs a PDF source.");
    if (
      mode?.engine === "rich" &&
      !array(d.blocks).length &&
      !units.some((u) => u.text || u.contentId)
    )
      add(
        "blocks",
        "MODE_CONTENT",
        "Compose editorial blocks or an article unit.",
      );
  }
  if (record.family === "learning" && !draftTemplate) {
    if (
      mode?.engine === "video_course" &&
      !units.some((u) => u.kind === "video")
    )
      add(
        "units",
        "MODE_CONTENT",
        "This learning mode needs a real video lesson.",
      );
    if (mode?.engine === "video_course" && units.some((u) => !text(u.module)))
      add(
        "units",
        "CURRICULUM",
        "Assign a curriculum section to each video lesson.",
      );
    if (
      mode?.engine === "mixed_path" &&
      new Set(units.map((u) => u.kind)).size < 2
    )
      add(
        "units",
        "MIXED_CONTENT",
        "Add at least two supported media types to this mixed-media path.",
      );
    if (
      mode?.engine === "assessment_path" &&
      !array(d.questions).length &&
      !units.some((u) => u.assessmentId)
    )
      add(
        "questions",
        "ASSESSMENT",
        "Author an assessment or connect a released assessment experience.",
      );
    if (
      mode?.engine === "assessment_path" &&
      d.completion !== "assessment_pass"
    )
      add(
        "completion",
        "ASSESSMENT_COMPLETION",
        "Use assessment-pass completion for this mode.",
      );
  }
  if (record.family === "printables" && !draftTemplate)
    for (const u of units)
      if (!u.assetId || !["pdf", "image"].includes(text(u.kind)))
        add(
          "units." + text(u.id) + ".assetId",
          "PRINT_SOURCE",
          "Choose a print-ready PDF or image for every sheet.",
        );
  if (record.family === "stories") {
    const cues = array(d.cues);
    for (const cue of cues) {
      const unit = units.find((u) => u.id === cue.unitId);
      if (!unit)
        add(
          "cues." + text(cue.id) + ".unitId",
          "MISSING",
          "Choose a page in this edition.",
        );
      if (number(cue.endSeconds) <= number(cue.startSeconds))
        add(
          "cues." + text(cue.id) + ".endSeconds",
          "TIMING",
          "A cue must end after it starts.",
        );
      if (
        unit &&
        number(unit.endSeconds) > 0 &&
        number(cue.endSeconds) > number(unit.endSeconds)
      )
        add(
          "cues." + text(cue.id),
          "TIMING",
          "Cue exceeds page narration duration.",
        );
    }
    if (mode?.engine === "read_aloud" && !draftTemplate)
      for (const u of units) {
        if (
          !u.narrationAssetId &&
          !object(object(u.locales)[text(d.defaultLocale)]).narrationAssetId &&
          !d.narrationAssetId
        )
          add(
            "units." + text(u.id) + ".narrationAssetId",
            "NARRATION",
            "Bind narration for every read-aloud page.",
          );
        if (!cues.some((c) => c.unitId === u.id))
          add("cues", "CUE", "Add timed text cues for " + text(u.title) + ".");
      }
  }
  if (["video", "audio"].includes(record.family || "")) {
    for (const u of units) {
      if (!draftTemplate && u.kind !== record.family)
        add(
          "units." + text(u.id) + ".kind",
          "MEDIA_TYPE",
          "Use " + record.family + " units for this family.",
        );
      if (!draftTemplate && number(u.duration) <= 0)
        add(
          "units." + text(u.id) + ".duration",
          "DURATION",
          "Declare the real source duration.",
        );
      if (
        number(u.endSeconds) > 0 &&
        number(u.endSeconds) <= number(u.startSeconds)
      )
        add(
          "units." + text(u.id) + ".endSeconds",
          "TIMING",
          "End must follow the start.",
        );
    }
    for (const chapter of array(d.chapters)) {
      const u = units.find((x) => x.id === chapter.unitId);
      if (!u)
        add(
          "chapters." + text(chapter.id) + ".unitId",
          "MISSING",
          "Choose a source unit.",
        );
      else if (number(chapter.startSeconds) >= number(u.duration))
        add(
          "chapters." + text(chapter.id) + ".startSeconds",
          "TIMING",
          "Chapter timestamp exceeds source duration.",
        );
    }
    if (
      ["chapters", "podcast"].includes(mode?.engine || "") &&
      !draftTemplate &&
      !array(d.chapters).length
    )
      add("chapters", "MODE_CONTENT", "This mode needs timed chapters.");
    for (const caption of array(d.captions))
      if (
        !caption.captionAssetId &&
        (!text(caption.text) ||
          number(caption.endSeconds) <= number(caption.startSeconds))
      )
        add(
          "captions." + text(caption.id),
          "CAPTION",
          "Bind a WebVTT source or author text with a valid cue interval.",
        );
    if (mode?.engine === "course_link" && !d.experienceId && !draftTemplate)
      add(
        "experienceId",
        "COURSE",
        "Choose the associated learning experience.",
      );
  }
  if (record.family === "activities") {
    const tasks = array(d.tasks),
      engine = text(d.engine);
    if (mode?.allowedEngines && !mode.allowedEngines.includes(engine))
      add(
        "engine",
        "MODE_ENGINE",
        "Choose an activity engine supported by this mode.",
      );
    if (["matching", "memory"].includes(engine)) {
      const groups = new Map<string, number>();
      for (const t of tasks)
        groups.set(text(t.answer), (groups.get(text(t.answer)) || 0) + 1);
      if (!draftTemplate && [...groups.values()].some((n) => n !== 2))
        add(
          "tasks",
          "PAIRS",
          "Each protected pair key must occur exactly twice.",
        );
    }
    if (
      (engine === "sequence" &&
        tasks.some((t) => !/^\d+$/.test(text(t.answer)))) ||
      (engine === "sequence" &&
        new Set(tasks.map((t) => text(t.answer))).size !== tasks.length)
    )
      add(
        "tasks",
        "SEQUENCE",
        "Sequence answers must be unique positions from 1 to the task count.",
      );
    if (
      engine === "sequence" &&
      tasks.some((t) => number(t.answer) < 1 || number(t.answer) > tasks.length)
    )
      add("tasks", "SEQUENCE", "Position is outside the task sequence.");
    if (engine === "sorting")
      for (const t of tasks)
        if (
          !text(t.answer) ||
          !text(t.choices)
            .split("\n")
            .map((x) => x.trim())
            .includes(text(t.answer))
        )
          add(
            "tasks." + text(t.id) + ".answer",
            "SORT",
            "Answer must be a declared sorting category.",
          );
    if (engine === "choice")
      for (const t of tasks) {
        const options = text(t.choices).split("\n").filter(Boolean);
        if (
          options.length < 2 ||
          !/^\d+$/.test(text(t.answer)) ||
          number(t.answer) >= options.length
        )
          add(
            "tasks." + text(t.id) + ".answer",
            "ANSWER",
            "Choice engine uses a zero-based answer index into declared choices.",
          );
      }
  }
  if (
    record.family === "assessments" &&
    mode?.engine === "timed" &&
    !draftTemplate &&
    number(d.minutes) <= 0
  )
    add("minutes", "TIMING", "Timed assessment needs a positive time limit.");
  if (record.family === "tools") {
    const count = array(d.inputs).length,
      model = text(d.model);
    if (
      !draftTemplate &&
      ["unit_conversion", "recipe_scaling"].includes(model) &&
      count !== 1
    )
      add(
        "inputs",
        "MODEL_INPUTS",
        "This model needs exactly one source quantity.",
      );
    if (
      !draftTemplate &&
      [
        "classroom_groups",
        "reading_duration",
        "shape_area",
        "eco_comparison",
      ].includes(model) &&
      count !== 2
    )
      add(
        "inputs",
        "MODEL_INPUTS",
        "This model needs exactly two typed quantities.",
      );
  }
  if (record.family === "tools")
    for (const input of array(d.inputs)) {
      if (number(input.max) < number(input.min))
        add(
          "inputs." + text(input.id) + ".max",
          "BOUNDS",
          "Maximum must be at least the minimum.",
        );
      if (
        input.value != null &&
        (number(input.value) < number(input.min) ||
          number(input.value) > number(input.max))
      )
        add(
          "inputs." + text(input.id) + ".value",
          "BOUNDS",
          "Initial value must be within the declared bounds.",
        );
    }
  if (record.family === "planners")
    for (const item of array(d.items)) {
      if (item.type === "select" && !text(item.options))
        add(
          "items." + text(item.id) + ".options",
          "OPTIONS",
          "Add at least one selectable option.",
        );
      if (item.type === "number" && number(item.max) < number(item.min))
        add(
          "items." + text(item.id) + ".max",
          "BOUNDS",
          "Correct the numeric bounds.",
        );
    }
  if (record.family === "forms") {
    const fields = array(d.fields),
      ids = new Set(fields.map((f) => text(f.id)));
    for (const f of fields) {
      if (
        f.condition === "answer_equals" &&
        (!ids.has(text(f.conditionTarget)) || f.conditionTarget === f.id)
      )
        add(
          "fields." + text(f.id) + ".conditionTarget",
          "CONDITION",
          "Choose another field as the condition target.",
        );
      if (number(f.max, 4000) < number(f.min))
        add(
          "fields." + text(f.id) + ".max",
          "BOUNDS",
          "Maximum must be at least the minimum.",
        );
      if (f.type === "select" && !text(f.options))
        add(
          "fields." + text(f.id) + ".options",
          "OPTIONS",
          "Declare the selection options.",
        );
    }
    const conditionEdges = new Map(
      fields.map((f) => [
        text(f.id),
        f.condition === "answer_equals" ? text(f.conditionTarget) : "",
      ]),
    );
    for (const f of fields) {
      const visited = new Set<string>();
      let id = text(f.id);
      while (id) {
        if (visited.has(id)) {
          add(
            "fields." + text(f.id) + ".conditionTarget",
            "CYCLE",
            "Conditional fields cannot depend on a cycle.",
          );
          break;
        }
        visited.add(id);
        id = conditionEdges.get(id) || "";
      }
    }
    if (
      mode?.engine === "multistep" &&
      !draftTemplate &&
      new Set(fields.map((f) => number(f.step, 1))).size < 2
    )
      add(
        "fields",
        "STEPS",
        "Define fields on at least two application steps.",
      );
    if (
      mode?.engine === "upload" &&
      !draftTemplate &&
      !fields.some((f) => f.type === "file")
    )
      add("fields", "UPLOAD", "Add a protected attachment field.");
    if (
      fields.some((f) => f.type === "file") &&
      (!text(d.privateReceiverId) || !text(d.attachmentTypes))
    )
      add(
        "privateReceiverId",
        "PRIVATE_RECEIVER",
        "Configure a protected receiver and permitted file types.",
      );
    if (
      mode?.engine === "booking_request" &&
      !["hotline", "academy", "b2b"].includes(text(d.destination))
    )
      add(
        "destination",
        "BOOKING_RECEIVER",
        "Booking requests continue to an existing native receiving authority.",
      );
  }
  return issues;
}

export function mediaSlots(
  family: Family | undefined,
  data: Data,
): { path: string; id: string; mime: string[] }[] {
  const slots: { path: string; id: string; mime: string[] }[] = [];
  if (!family) return slots;
  const add = (path: string, value: unknown, mime?: string[]) => {
    if (typeof value === "string" && value && mime?.length)
      slots.push({ path, id: value, mime });
  };
  add("coverAssetId", data.coverAssetId, ["image/"]);
  for (const f of family.fields) if (f.key !== "coverAssetId") add(f.key, data[f.key], f.mime);
  for (const c of family.collections)
    for (const row of array(data[c.key]).filter(row => c.key !== "outputs" || row.enabled !== false))
      for (const f of c.fields) {
        add(c.key + "." + text(row.id) + "." + f.key, row[f.key], f.mime);
        for (const [locale, localized] of Object.entries(object(row.locales)))
          add(
            c.key + "." + text(row.id) + ".locales." + locale + "." + f.key,
            object(localized)[f.key],
            f.mime,
          );
      }
  return slots;
}
