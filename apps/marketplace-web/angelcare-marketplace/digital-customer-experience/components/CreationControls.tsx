"use client";
import { useState } from "react";
import {
  text,
  tr,
  type Data,
  type Field as Definition,
  type Locale,
  type Tri,
} from "../types";
import {
  creationId,
  fieldIsLocalized,
  localizedWrite,
  setQuestionChoices,
} from "../creation-model";
import { Button, Icon, State, useQuery, useUI } from "./ui";
import s from "./creation.module.css";
const words = (en: string, fr: string, ar: string): Tri => [en, fr, ar];
const optionNames: Record<string, Tri> = {
  allowed: words("Allowed", "Autorisées", "مسموح"),
  until_pass: words("Until successful", "Jusqu’à réussite", "حتى النجاح"),
  disabled: words("Disabled", "Désactivé", "معطل"),
  article: words("Written content", "Contenu rédigé", "محتوى مكتوب"),
  pdf: words("PDF file", "Fichier PDF", "ملف PDF"),
  image: words("Image", "Image", "صورة"),
  video: words("Video", "Vidéo", "فيديو"),
  audio: words("Audio", "Audio", "صوت"),
  text: words("Short text", "Texte court", "نص قصير"),
  textarea: words("Long text", "Texte long", "نص طويل"),
  number: words("Number", "Nombre", "رقم"),
  date: words("Date", "Date", "تاريخ"),
  checkbox: words("Checkbox", "Case à cocher", "خانة اختيار"),
  select: words("Dropdown", "Liste de choix", "قائمة اختيار"),
  fixed: words("Information", "Information fixe", "معلومات ثابتة"),
  immediate: words("After each answer", "Après chaque réponse", "بعد كل إجابة"),
  after_submit: words("At the end", "À la fin", "في النهاية"),
  score_only: words("Score only", "Score uniquement", "النتيجة فقط"),
  sum: words("Sum", "Somme", "مجموع"),
  average: words("Average", "Moyenne", "متوسط"),
  ratio: words("Ratio", "Rapport", "نسبة"),
  groups: words("Groups", "Groupes", "مجموعات"),
  duration: words("Duration", "Durée", "مدة"),
  unit_conversion: words(
    "Unit conversion",
    "Conversion d’unités",
    "تحويل الوحدات",
  ),
  recipe_scaling: words(
    "Recipe quantities",
    "Quantités d’une recette",
    "كميات الوصفة",
  ),
  shape_area: words("Shape area", "Aire d’une forme", "مساحة شكل"),
  classroom_groups: words(
    "Classroom groups",
    "Groupes de classe",
    "مجموعات الفصل",
  ),
  reading_duration: words("Reading time", "Temps de lecture", "وقت القراءة"),
  eco_comparison: words(
    "Environmental comparison",
    "Comparaison environnementale",
    "مقارنة بيئية",
  ),
};
export type ReferenceRequest = {
  type: "media" | "offers" | "record";
  kind?: string;
  mime?: string[];
  family?: string;
  label: string;
  choose: (value: any) => void;
};
export function referenceFor(
  def: Definition,
  choose: (value: any) => void,
  locale: Locale,
): ReferenceRequest {
  const media = def.reference === "media" || /assetId$/i.test(def.key);
  return {
    type: media
      ? "media"
      : def.reference === "offers" || def.key === "nativeId"
        ? "offers"
        : "record",
    kind:
      def.key === "contentId"
        ? "content"
        : ["experienceId", "assessmentId"].includes(def.key)
          ? "experience"
          : undefined,
    mime: def.mime,
    label: tr(def.label, locale),
    choose,
  };
}
export function CreationReferencePicker({
  request,
  onClose,
}: {
  request: ReferenceRequest;
  onClose: () => void;
}) {
  const { locale } = useUI(),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1);
  const q = useQuery<any>(
    {
      op: request.type === "record" ? "list" : "native",
      type: request.type,
      kind: request.kind,
      family: request.family,
      mime: request.mime?.join(","),
      q: search,
      page,
      pageSize: 24,
    },
    { rows: [], total: 0 },
  );
  return (
    <section className={s.referencePicker}>
      <div className={s.sectionHeading}>
        <div>
          <span className={s.eyebrow}>
            {tr(
              words(
                "YOUR EXISTING LIBRARY",
                "VOTRE BIBLIOTHÈQUE",
                "مكتبتك الحالية",
              ),
              locale,
            )}
          </span>
          <h3>{request.label}</h3>
        </div>
        <button
          className={s.iconButton}
          onClick={onClose}
          aria-label={tr(words("Close", "Fermer", "إغلاق"), locale)}
        >
          <Icon name="X" />
        </button>
      </div>
      <label className={s.search}>
        <Icon name="Search" />
        <input
          autoFocus
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={tr(
            words(
              "Search by title or filename",
              "Rechercher un titre ou un fichier",
              "البحث بالعنوان أو اسم الملف",
            ),
            locale,
          )}
        />
      </label>
      <State {...q} retry={q.reload}>
        <div className={s.referenceGrid}>
          {q.value.rows.map((r: any) => (
            <button
              key={r.id}
              className={s.referenceCard}
              onClick={() => {
                request.choose(r);
                onClose();
              }}
            >
              {r.url && text(r.mime).startsWith("image/") ? (
                <img src={r.url} alt="" />
              ) : (
                <Icon
                  name={
                    request.type === "offers"
                      ? "ShoppingBag"
                      : request.type === "media"
                        ? "FileText"
                        : "BookOpen"
                  }
                  size={27}
                />
              )}
              <strong>{r.title || r.file_name || r.fileName || r.key}</strong>
              <small>{r.mime || r.lifecycle || r.status}</small>
            </button>
          ))}
        </div>
        {!q.value.rows.length && (
          <div className={s.smallEmpty}>
            {tr(
              words(
                "No matching items. Change the search, or upload a file from the resource editor.",
                "Aucun résultat. Modifiez la recherche ou ajoutez un fichier depuis l’éditeur de la ressource.",
                "لا توجد نتائج. غيّر البحث أو ارفع ملفاً من محرر المورد.",
              ),
              locale,
            )}
          </div>
        )}
      </State>
      <div className={s.pager}>
        <Button disabled={page === 1} onClick={() => setPage((v) => v - 1)}>
          <Icon name="ChevronLeft" />
        </Button>
        <span>
          {page} / {Math.max(1, Math.ceil(q.value.total / 24))}
        </span>
        <Button
          disabled={page * 24 >= q.value.total}
          onClick={() => setPage((v) => v + 1)}
        >
          <Icon name="ChevronRight" />
        </Button>
      </div>
    </section>
  );
}
export function CreationField({
  def,
  value,
  onChange,
  onBrowse,
  onUpload,
  referenceName,
  disabled = false,
  path,
}: {
  def: Definition;
  value: Data[string] | undefined;
  onChange: (v: Data[string]) => void;
  onBrowse: (r: ReferenceRequest) => void;
  onUpload?: (def: Definition) => void;
  referenceName?: string;
  disabled?: boolean;
  path?: string;
}) {
  const { locale } = useUI(),
    label = tr(def.label, locale),
    ref = def.type === "reference";
  if (def.type === "textarea" && def.options?.length) {
    const selected = text(value).split(/\r?\n/).filter(Boolean),
      known = new Set(def.options);
    return (
      <div className={s.field} data-creation-path={path || def.key}>
        <details className={s.multiSelect}>
          <summary>
            {label}
            <span>{selected.length}</span>
          </summary>
          <div>
            {def.options.map((option) => (
              <label key={option}>
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={selected.includes(option)}
                  onChange={(e) =>
                    onChange(
                      (e.target.checked
                        ? [...selected, option]
                        : selected.filter((v) => v !== option)
                      ).join("\n"),
                    )
                  }
                />
                <span>
                  {def.optionLabels?.[option]
                    ? tr(def.optionLabels[option], locale)
                    : option}
                </span>
              </label>
            ))}
            {selected
              .filter((option) => !known.has(option))
              .map((option) => (
                <label key={option}>
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked
                    onChange={() =>
                      onChange(selected.filter((v) => v !== option).join("\n"))
                    }
                  />
                  <span>{option}</span>
                </label>
              ))}
          </div>
        </details>
      </div>
    );
  }

  return (
    <div
      className={`${s.field} ${def.type === "toggle" ? s.switchField : ""}`}
      data-creation-path={path || def.key}
    >
      {def.type === "toggle" ? (
        <label>
          <input
            type="checkbox"
            checked={value === true}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span>{label}</span>
        </label>
      ) : (
        <>
          <label>
            {label}
            {def.required && <span className={s.required}> *</span>}
            {!ref &&
              (def.type === "select" ? (
                <select
                  value={text(value)}
                  disabled={disabled}
                  onChange={(e) => onChange(e.target.value)}
                >
                  <option value="">—</option>
                  {def.options?.map((o) => (
                    <option key={o} value={o}>
                      {def.optionLabels?.[o]
                        ? tr(def.optionLabels[o], locale)
                        : optionNames[o]
                          ? tr(optionNames[o], locale)
                          : o}
                    </option>
                  ))}
                </select>
              ) : def.type === "textarea" ? (
                <textarea
                  dir="auto"
                  rows={3}
                  value={text(value)}
                  disabled={disabled}
                  onChange={(e) => onChange(e.target.value)}
                />
              ) : (
                <input
                  dir="auto"
                  type={def.type === "number" ? "number" : "text"}
                  value={typeof value === "number" ? value : text(value)}
                  min={def.min}
                  max={def.max}
                  disabled={disabled}
                  onChange={(e) =>
                    onChange(
                      def.type === "number"
                        ? e.target.value === ""
                          ? null
                          : Number(e.target.value)
                        : e.target.value,
                    )
                  }
                />
              ))}
          </label>
          {ref && (
            <div className={s.referenceField}>
              <span className={value ? s.referenceSelected : s.muted}>
                <Icon
                  name={
                    def.reference === "offers"
                      ? "ShoppingBag"
                      : def.reference === "media" || /assetId$/i.test(def.key)
                        ? "FileText"
                        : "BookOpen"
                  }
                  size={16}
                />
                {value
                  ? referenceName ||
                    tr(words("Selected", "Sélectionné", "محدد"), locale)
                  : tr(
                      words(
                        "Choose an item",
                        "Choisir un élément",
                        "اختيار عنصر",
                      ),
                      locale,
                    )}
              </span>
              <div className={s.inlineActions}>
                <Button
                  disabled={disabled}
                  onClick={() =>
                    onBrowse(referenceFor(def, (r) => onChange(r.id), locale))
                  }
                  icon="Search"
                >
                  {tr(words("Choose", "Choisir", "اختيار"), locale)}
                </Button>
                {onUpload &&
                  (def.reference === "media" || /assetId$/i.test(def.key)) && (
                    <Button
                      disabled={disabled}
                      onClick={() => onUpload(def)}
                      icon="CloudUpload"
                    >
                      {tr(words("Upload", "Ajouter", "رفع"), locale)}
                    </Button>
                  )}
                {value && (
                  <button
                    type="button"
                    disabled={disabled}
                    className={s.iconButton}
                    onClick={() => onChange(null)}
                    aria-label={tr(
                      words(
                        "Clear selection",
                        "Retirer la sélection",
                        "إزالة الاختيار",
                      ),
                      locale,
                    )}
                  >
                    <Icon name="X" size={15} />
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
      {def.hint && <small className={s.muted}>{tr(def.hint, locale)}</small>}
    </div>
  );
}
export function QuestionEditor({
  row,
  language,
  disabled,
  onChange,
}: {
  row: Data;
  language: Locale;
  disabled: boolean;
  onChange: (patch: Data) => void;
}) {
  const { locale } = useUI(),
    type = text(row.type) || "choice",
    choices = text(row.choices).split("\n"),
    options = choices.length < 2 ? [...choices, ""] : choices;
  const write = (key: string, value: Data[string]) =>
    onChange(
      localizedWrite(
        row,
        key,
        value,
        language,
        [
          "prompt",
          "choices",
          "explanation",
          "acceptedAnswers",
          "answer",
        ].includes(key),
      ),
    );
  const types: [string, Tri][] = [
    ["choice", words("Single answer", "Une bonne réponse", "إجابة واحدة")],
    [
      "multi",
      words("Multiple answers", "Plusieurs bonnes réponses", "إجابات متعددة"),
    ],
    ["true_false", words("True / false", "Vrai / faux", "صحيح / خطأ")],
    ["short_answer", words("Written answer", "Réponse écrite", "إجابة مكتوبة")],
    ["number", words("Numeric answer", "Réponse numérique", "إجابة رقمية")],
  ];
  const changeOptions = (next: string[], keys?: string[]) => {
    let updated = setQuestionChoices(row, next);
    if (keys) {
      updated.choiceKeys = keys.join("\n");
      updated.correctKeys = text(row.correctKeys)
        .split(",")
        .filter((k) => keys.includes(k))
        .join(",");
    }
    onChange(localizedWrite(updated, "choices", next.join("\n"), language));
  };
  return (
    <div className={s.questionEditor}>
      <div className={s.questionMeta}>
        <label>
          {tr(words("Question type", "Type de question", "نوع السؤال"), locale)}
          <select
            disabled={disabled}
            value={type}
            onChange={(e) =>
              onChange({
                type: e.target.value,
                answer: "",
                correctKeys: "",
                acceptedAnswers: "",
              })
            }
          >
            {types.map(([key, l]) => (
              <option key={key} value={key}>
                {tr(l, locale)}
              </option>
            ))}
          </select>
        </label>
        <label className={s.points}>
          {tr(words("Points", "Points", "النقاط"), locale)}
          <input
            type="number"
            min={1}
            max={100}
            disabled={disabled}
            value={Number(row.points || 1)}
            onChange={(e) => onChange({ points: Number(e.target.value) })}
          />
        </label>
      </div>
      <label className={s.field}>
        {tr(words("Question", "Question", "السؤال"), locale)}
        <textarea
          dir="auto"
          rows={3}
          disabled={disabled}
          value={text(row.prompt)}
          onChange={(e) => write("prompt", e.target.value)}
          placeholder={tr(
            words(
              "Write the actual question…",
              "Rédigez votre question…",
              "اكتب السؤال…",
            ),
            locale,
          )}
        />
      </label>
      {["choice", "multi"].includes(type) && (
        <div className={s.optionList}>
          <small className={s.muted}>
            {tr(
              words(
                "Select the correct answer beside its text.",
                "Cochez la bonne réponse à côté de son texte.",
                "حدد الإجابة الصحيحة بجانب نصها.",
              ),
              locale,
            )}
          </small>
          {options.map((value, index) => {
            const keys = text(row.choiceKeys).split("\n"),
              key = keys[index] || "",
              selected = key && text(row.correctKeys).split(",").includes(key);
            return (
              <div
                key={index}
                className={`${s.answerOption} ${selected ? s.correctOption : ""}`}
              >
                <input
                  type={type === "multi" ? "checkbox" : "radio"}
                  name={"correct-" + row.id}
                  disabled={disabled || !value.trim()}
                  checked={!!selected}
                  aria-label={
                    tr(
                      words("Correct answer", "Bonne réponse", "إجابة صحيحة"),
                      locale,
                    ) +
                    " " +
                    (index + 1)
                  }
                  onChange={() => {
                    const updated = setQuestionChoices(row, options),
                      stable = text(updated.choiceKeys).split("\n"),
                      k = stable[index],
                      old = text(updated.correctKeys)
                        .split(",")
                        .filter(Boolean);
                    onChange({
                      ...updated,
                      correctKeys:
                        type === "multi"
                          ? (old.includes(k)
                              ? old.filter((v) => v !== k)
                              : [...old, k]
                            ).join(",")
                          : k,
                    });
                  }}
                />
                <span>{String.fromCharCode(65 + index)}</span>
                <input
                  dir="auto"
                  disabled={disabled}
                  value={value}
                  placeholder={tr(
                    words("Answer choice", "Choix de réponse", "خيار الإجابة"),
                    locale,
                  )}
                  onChange={(e) =>
                    changeOptions(
                      options.map((v, i) => (i === index ? e.target.value : v)),
                    )
                  }
                />
                {options.length > 2 && (
                  <button
                    className={s.iconButton}
                    disabled={disabled}
                    aria-label={tr(
                      words("Remove choice", "Retirer le choix", "حذف الخيار"),
                      locale,
                    )}
                    onClick={() =>
                      changeOptions(
                        options.filter((_, i) => i !== index),
                        keys.filter((_, i) => i !== index),
                      )
                    }
                  >
                    <Icon name="X" size={14} />
                  </button>
                )}
              </div>
            );
          })}
          <Button
            disabled={disabled || options.length >= 20}
            icon="Plus"
            onClick={() => changeOptions([...options, ""])}
          >
            {tr(
              words("Add a choice", "Ajouter un choix", "إضافة خيار"),
              locale,
            )}
          </Button>
        </div>
      )}
      {type === "true_false" && (
        <div className={s.segment}>
          {[
            ["true", words("True", "Vrai", "صحيح")],
            ["false", words("False", "Faux", "خطأ")],
          ].map(([key, l]) => (
            <button
              key={key as string}
              disabled={disabled}
              aria-pressed={row.answer === key}
              onClick={() => write("answer", key as string)}
            >
              {tr(l as Tri, locale)}
            </button>
          ))}
        </div>
      )}
      {type === "short_answer" && (
        <label className={s.field}>
          {tr(
            words(
              "Accepted answers · one per line",
              "Réponses acceptées · une par ligne",
              "الإجابات المقبولة · واحدة في كل سطر",
            ),
            locale,
          )}
          <textarea
            dir="auto"
            rows={3}
            disabled={disabled}
            value={text(row.acceptedAnswers || row.answer)}
            onChange={(e) => write("acceptedAnswers", e.target.value)}
          />
        </label>
      )}
      {type === "number" && (
        <label className={s.field}>
          {tr(
            words("Correct number", "Nombre attendu", "الرقم الصحيح"),
            locale,
          )}
          <input
            type="number"
            disabled={disabled}
            value={text(row.answer)}
            onChange={(e) => write("answer", e.target.value)}
          />
        </label>
      )}
      <details className={s.optional}>
        <summary>
          {tr(
            words(
              "Explanation and feedback",
              "Explication et retour pédagogique",
              "الشرح والتغذية الراجعة",
            ),
            locale,
          )}
        </summary>
        <textarea
          dir="auto"
          rows={3}
          disabled={disabled}
          value={text(row.explanation)}
          onChange={(e) => write("explanation", e.target.value)}
        />
      </details>
    </div>
  );
}
export function ActivityAnswer({
  row,
  engine,
  disabled,
  onChange,
  partners = [],
  onPair,
}: {
  row: Data;
  engine: string;
  disabled: boolean;
  onChange: (patch: Data) => void;
  partners?: Data[];
  onPair?: (id: string) => void;
}) {
  const { locale } = useUI();
  if (["matching", "memory"].includes(engine) && onPair)
    return (
      <label className={s.field}>
        {tr(words("Match with", "Associer avec", "مطابقة مع"), locale)}
        <select
          disabled={disabled}
          value={text(
            partners.find((p) => p.id !== row.id && p.answer === row.answer)
              ?.id,
          )}
          onChange={(e) => onPair(e.target.value)}
        >
          <option value="">
            {tr(
              words(
                "Choose the matching item",
                "Choisir l’élément associé",
                "اختيار العنصر المطابق",
              ),
              locale,
            )}
          </option>
          {partners
            .filter((p) => p.id !== row.id)
            .map((p, index) => (
              <option key={text(p.id)} value={text(p.id)}>
                {text(p.prompt) ||
                  tr(words("Item", "Élément", "عنصر"), locale) +
                    " " +
                    (index + 1)}
              </option>
            ))}
        </select>
      </label>
    );
  if (["matching", "memory", "sequence"].includes(engine))
    return (
      <small className={s.muted}>
        <Icon name="Link" size={13} />
        {tr(
          engine === "sequence"
            ? words(
                "The displayed order defines the correct sequence.",
                "L’ordre affiché définit la bonne séquence.",
                "الترتيب المعروض يحدد التسلسل الصحيح.",
              )
            : words(
                "The pair is connected automatically.",
                "La paire est reliée automatiquement.",
                "ترتبط عناصر الزوج تلقائياً.",
              ),
          locale,
        )}
      </small>
    );
  const choices = text(row.choices).split(/\r?\n/).filter(Boolean);
  return (
    <label className={s.field}>
      {tr(
        words("Correct response", "Réponse attendue", "الإجابة الصحيحة"),
        locale,
      )}
      <select
        disabled={disabled}
        value={text(row.answer)}
        onChange={(e) => onChange({ answer: e.target.value })}
      >
        <option value="">
          {tr(
            words("Choose the answer", "Choisir la réponse", "اختر الإجابة"),
            locale,
          )}
        </option>
        {choices.map((choice, index) => (
          <option
            key={index}
            value={engine === "choice" ? String(index) : choice}
          >
            {choice}
          </option>
        ))}
      </select>
    </label>
  );
}
