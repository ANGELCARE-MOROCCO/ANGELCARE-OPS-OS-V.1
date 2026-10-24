"use client";
import { useState, type ReactNode } from "react";
import {
  DEPTH_COLLECTIONS,
  DEPTH_FIELDS,
  depthIssues,
  selectResult,
} from "../experience-depth";
import {
  array,
  object,
  text,
  tr,
  type Data,
  type DceRecord,
  type Family,
  type Field as Definition,
  type Json,
  type Locale,
} from "../types";
import { Badge, Button, Field, T, useUI, useQuery, query } from "./ui";
import { FamilyWorkbench } from "./FamilyWorkbench";
import s from "./workspace.module.css";
type RenderField = (
  definition: Definition,
  value: unknown,
  onChange: (value: Json) => void,
  path?: string,
) => ReactNode;
const groups = [
  [
    "detail",
    ["Detail experience", "Expérience détaillée", "التجربة التفصيلية"],
  ],
  ["brief", ["Educational brief", "Dossier pédagogique", "الملف التربوي"]],
  [
    "kidflix",
    [
      "KidFlix visitor tools",
      "Outils visiteurs KidFlix",
      "أدوات زوار كيدفليكس",
    ],
  ],
  [
    "results",
    [
      "Results & recommendations",
      "Résultats et recommandations",
      "النتائج والتوصيات",
    ],
  ],
  ["exports", ["Personal outputs", "Sorties personnelles", "المخرجات الشخصية"]],
  ["discovery", ["Discovery", "Découverte", "الاكتشاف"]],
  ["ads", ["Advertising map", "Carte publicitaire", "خريطة الإعلانات"]],
  ["continuity", ["Continuity", "Continuité", "الاستمرارية"]],
  ["languages", ["Language structure", "Structure des langues", "بنية اللغات"]],
  ["bank", ["Question bank", "Banque de questions", "بنك الأسئلة"]],
] as const;
export function ExperienceStudio({
  record,
  family,
  data,
  language,
  readOnly,
  onChange,
  renderField,
}: {
  record: Partial<DceRecord>;
  family: Family;
  data: Data;
  language: Locale;
  readOnly: boolean;
  onChange: (patch: Data) => void;
  renderField: RenderField;
}) {
  const { locale } = useUI(),
    [tab, setTab] = useState("brief"),
    [score, setScore] = useState(70),
    [complete, setComplete] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const keys: Record<string, string[]> = {
    detail: [
      "detailSections",
      "sortRules",
      "sortGroups",
      "soundItems",
      "bridgeChallenges",
    ],
    results: ["resultBands", "recommendations"],
    exports: ["exportLayouts"],
    discovery: ["discoveryPlacements"],
    ads: ["adBreaks"],
    languages: [
      "editionOrder",
      ...(family.key === "stories" ? ["storyChoices"] : []),
    ],
  };
  const fields = DEPTH_FIELDS.filter((f) =>
    tab === "kidflix"
      ? f.key.startsWith("kidflix")
      : tab === "continuity"
        ? [
            "continuityPolicy",
            "progressTtlDays",
            "releaseChangePolicy",
            "reducedMotion",
          ].includes(f.key)
        : tab === "discovery"
          ? ["discoveryTitle", "seoDescription", "slug"].includes(f.key)
          : tab === "results"
            ? f.key === "resultsEnabled"
            : tab === "brief"
              ? !f.key.startsWith("kidflix") &&
                ![
                  "continuityPolicy",
                  "progressTtlDays",
                  "releaseChangePolicy",
                  "reducedMotion",
                  "discoveryTitle",
                  "seoDescription",
                  "slug",
                  "resultsEnabled",
                ].includes(f.key)
              : false,
  );
  const issue = depthIssues(data, family),
    result = selectResult(data, score, complete);
  function set(def: Definition, value: Json) {
    if (def.localized) {
      onChange({
        locales: {
          ...object(data.locales),
          [language]: {
            ...object(object(data.locales)[language]),
            [def.key]: value,
          },
        },
        ...(language === (data.defaultLocale || "en")
          ? { [def.key]: value }
          : {}),
      });
    } else onChange({ [def.key]: value });
  }
  return (
    <section>
      <div className={s.tabs}>
        {groups
          .filter(
            ([key]) =>
              key !== "bank" ||
              ["learning", "assessments"].includes(family.key),
          )
          .map(([key, label]) => (
            <button
              key={key}
              className={s.tab}
              aria-pressed={tab === key}
              onClick={() => setTab(key)}
            >
              {tr(label, locale)}
            </button>
          ))}
      </div>
      <div className={s.notice}>
        <T
          v={[
            "Design the experience here; save the dossier, then validate and release each language in Editions, actions & outputs. Normal visitor actions never create admin submissions.",
            "Concevez ici ; enregistrez le dossier, puis validez et publiez chaque langue dans Éditions, actions et sorties. Les actions ordinaires ne créent aucune demande administrative.",
            "صمم التجربة هنا؛ احفظ الملف ثم تحقق من كل لغة وانشرها من النسخ والإجراءات والمخرجات. الإجراءات العادية لا تنشئ طلبات إدارية.",
          ]}
        />
      </div>
      {tab === "kidflix" ? (
        <div className={s.notice}>
          <p>
            <T
              v={[
                "Published family limits apply first. Resource settings then narrow the available tools; media, rights and output readiness determine what is usable.",
                "Les limites publiées de l’univers s’appliquent d’abord. Le dossier précise les outils ; médias, droits et sorties disponibles déterminent les possibilités.",
                "تطبق حدود العالم المنشورة أولاً ثم إعدادات المورد. تحدد الوسائط والحقوق وجاهزية المخرجات الأدوات المتاحة.",
              ]}
            />
          </p>
          <Button
            disabled={readOnly}
            onClick={() =>
              onChange(
                Object.fromEntries(
                  DEPTH_FIELDS.filter(
                    (f) => f.key.startsWith("kidflix") && f.type === "toggle",
                  ).map((f) => [f.key, f.defaultValue ?? false]),
                ),
              )
            }
          >
            <T
              v={[
                "Reset visitor tools to defaults",
                "Rétablir les outils par défaut",
                "استعادة أدوات الزائر الافتراضية",
              ]}
            />
          </Button>
        </div>
      ) : null}
      <div className={s.formGrid}>
        {fields.map((def) => (
          <div key={def.key}>
            {renderField(
              def,
              def.localized
                ? (object(object(data.locales)[language])[def.key] ??
                    (language === (data.defaultLocale || "en")
                      ? data[def.key]
                      : ""))
                : data[def.key],
              (value) => set(def, value),
              def.key,
            )}
          </div>
        ))}
      </div>
      {keys[tab]?.length > 0 && (
        <FamilyWorkbench
          key={tab}
          family={{
            ...family,
            fields: [],
            collections: family.collections.filter((c) =>
              keys[tab].includes(c.key),
            ),
          }}
          data={data}
          language={language}
          readOnly={readOnly}
          onChange={onChange}
          renderField={renderField}
        />
      )}
      {tab === "results" && (
        <div className={s.rowCard}>
          <h3>
            <T
              v={[
                "Test result selection",
                "Tester la sélection du résultat",
                "اختبار اختيار النتيجة",
              ]}
            />
          </h3>
          <Field label={<T v={["Score %", "Score %", "النتيجة %"]} />}>
            <input
              type="range"
              min="0"
              max="100"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
            />
          </Field>
          <label>
            <input
              type="checkbox"
              checked={complete}
              onChange={(e) => setComplete(e.target.checked)}
            />
            <T v={["Completed", "Terminé", "مكتمل"]} />
          </label>
          <p role="status">
            {score}% ·{" "}
            {result
              ? text(object(object(result.locales)[language]).title) ||
                text(result.title)
              : tr(
                  [
                    "No authored result matches this scenario.",
                    "Aucun résultat ne correspond à ce scénario.",
                    "لا توجد نتيجة مؤلفة تطابق هذا السيناريو.",
                  ],
                  locale,
                )}
          </p>
          <p>
            <T
              v={[
                "Higher priority wins when ranges overlap. Unmatched scenarios do not invent a badge or guidance.",
                "La priorité la plus haute prévaut si les plages se chevauchent. Un scénario sans résultat ne crée ni badge ni conseil.",
                "تفوز الأولوية الأعلى عند تداخل النطاقات. لا تُختلق شارة أو إرشادات عند غياب نتيجة مطابقة.",
              ]}
            />
          </p>
        </div>
      )}
      {tab === "exports" && (
        <p>
          <T
            v={[
              "Source-file downloads remain in Actions & outputs. These layouts generate a visitor’s own result, planner, questionnaire or authored pages in the protected preview. An ad cannot be required to obtain the free output.",
              "Les fichiers sources restent dans Actions et sorties. Ces mises en page génèrent le résultat personnel, le planning, le questionnaire ou les pages de l’aperçu protégé. Une publicité ne peut conditionner une sortie gratuite.",
              "تظل تنزيلات الملفات الأصلية في الإجراءات والمخرجات. تولد هذه التخطيطات النتيجة الشخصية أو المخطط أو الاستبيان أو الصفحات في المعاينة المحمية. لا يُشترط إعلان للحصول على المخرج المجاني.",
            ]}
          />
        </p>
      )}
      {tab === "ads" && (
        <p>
          <T
            v={[
              "Map natural breaks to native advertising policies. The protected preview inspects eligibility and limits without loading Google advertising. Delivery remains a separate public-runtime integration.",
              "Associez les pauses naturelles aux politiques natives. L’aperçu inspecte l’éligibilité et les limites sans charger Google. La diffusion relève du runtime public.",
              "اربط الفواصل الطبيعية بسياسات الإعلان الأصلية. تفحص المعاينة الأهلية والحدود دون تحميل إعلانات Google. العرض الفعلي جزء من الواجهة العامة.",
            ]}
          />
        </p>
      )}
      {tab === "languages" && (
        <p>
          <T
            v={[
              "Use stable unit IDs from the authoring tab. Ordering and exclusions apply only to the chosen language; a French edit cannot withdraw an Arabic release.",
              "Utilisez les IDs stables de l’onglet Édition. Ordre et exclusions ne concernent que la langue choisie ; une modification française ne retire pas la version arabe.",
              "استخدم معرفات الوحدات الثابتة من تبويب التحرير. يطبق الترتيب والاستبعاد على اللغة المختارة وحدها؛ تعديل الفرنسية لا يسحب النسخة العربية.",
            ]}
          />
        </p>
      )}
      {tab === "bank" && (
        <QuestionBank
          family={family}
          data={data}
          readOnly={readOnly}
          onChange={onChange}
        />
      )}
      {!!issue.length && (
        <details className={s.advanced}>
          <summary>
            <Badge tone="orange">{issue.length}</Badge>{" "}
            <T
              v={[
                "Authoring corrections",
                "Corrections de conception",
                "تصحيحات التصميم",
              ]}
            />
          </summary>
          {issue.map((i, n) => (
            <p key={n}>
              {i.path} · {tr(i.message, locale)}
            </p>
          ))}
        </details>
      )}
    </section>
  );
}
function QuestionBank({
  family,
  data,
  readOnly,
  onChange,
}: {
  family: Family;
  data: Data;
  readOnly: boolean;
  onChange: (p: Data) => void;
}) {
  const { locale } = useUI(),
    [source, setSource] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    q = useQuery<any>(
      {
        op: "list",
        kind: "template",
        family: family.key,
        pageSize: 30,
        page: 1,
      },
      { rows: [], total: 0 },
    );
  async function copy() {
    setBusy(true);
    setError("");
    try {
      const r = await query<DceRecord>({ op: "record", id: source }),
        questions = array(r.data.questions).map((u) => ({
          ...u,
          id: "q-" + crypto.randomUUID().slice(0, 12),
        }));
      if (!questions.length)
        throw Error(
          tr(
            [
              "The selected template has no questions.",
              "Le modèle choisi ne contient aucune question.",
              "القالب المختار لا يحتوي على أسئلة.",
            ],
            locale,
          ),
        );
      onChange({ questions: [...array(data.questions), ...questions] });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={s.rowCard}>
      <h3>
        <T
          v={[
            "Reuse questions from a governed template",
            "Réutiliser les questions d’un modèle",
            "إعادة استخدام أسئلة قالب محكوم",
          ]}
        />
      </h3>
      <p>
        <T
          v={[
            "Copies are independent and receive fresh identities. The original template is preserved. Review scoring and translations before release.",
            "Les copies sont indépendantes avec de nouveaux identifiants. Le modèle original est conservé. Vérifiez notation et traductions avant publication.",
            "النسخ مستقلة وتحصل على معرفات جديدة مع حفظ القالب الأصلي. راجع التقييم والترجمات قبل النشر.",
          ]}
        />
      </p>
      <Field
        label={<T v={["Source template", "Modèle source", "القالب المصدر"]} />}
      >
        <select
          value={source}
          disabled={readOnly || busy}
          onChange={(e) => setSource(e.target.value)}
        >
          <option value="">—</option>
          {q.value.rows.map((r: DceRecord) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
      </Field>
      <Button
        disabled={readOnly || busy || !source}
        onClick={() => void copy()}
      >
        <T
          v={[
            "Append copied questions",
            "Ajouter les questions copiées",
            "إضافة الأسئلة المنسوخة",
          ]}
        />
      </Button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
