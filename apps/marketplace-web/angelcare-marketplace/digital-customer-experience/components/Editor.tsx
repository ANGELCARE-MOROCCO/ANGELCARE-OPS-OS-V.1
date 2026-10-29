"use client";
import { ROOT_FIELDS } from "../dossier-fields";
import { useRouter } from "next/navigation";
import p from "./production.module.css";
import { BASE } from "../types";
import { DossierStudio } from "./DossierStudio";
import { issueDestination } from "../production-model";
import { useServerDraft } from "./useServerDraft";
import { ExperienceStudio } from "./ExperienceStudio";
import { DEPTH_COLLECTIONS } from "../experience-depth";
import { DossierTeam } from "./ProfessionalTeam";
import { DossierConnections } from "./DossierConnections";
import {
  authoringFamilies,
  authoringLocales,
  worldTimeZone,
  zonedDateInput,
} from "../management";
import { WORLD_FIELDS } from "../administration";
import { useEffect, useId, useRef, useState } from "react";
import { FAMILIES, familyByKey, AD_FORMATS } from "../registry";
import { blankRecord, validateRecord, references } from "../model";
import {
  array,
  object,
  text,
  number,
  tr,
  type Data,
  type DceRecord,
  type Field as Definition,
  type Kind,
  type Locale,
  type Validation,
} from "../types";
import {
  Badge,
  Button,
  handleTablistKeyDown,
  Dialog,
  Empty,
  Field,
  Icon,
  mutate,
  query,
  Pager,
  State,
  Switch,
  T,
  useUI,
  useQuery,
} from "./ui";
import { reconcileDraft } from "../reconciliation";
import {
  compatibleDefinition,
  definitionDefaults,
  CONTENT_WORKBENCH,
  MEDIA_WORKBENCH,
} from "../capabilities";
import { JourneyCanvas, CompositionCanvas } from "./Construction";
import { DeliveryStudio } from "./DeliveryStudio";
import { HtmlActivityEditor } from "./HtmlActivity";
import { FamilyWorkbench } from "./FamilyWorkbench";
import { RuntimePreview } from "./Preview";
import s from "./workspace.module.css";
const message = (en: string, fr: string, ar: string) => [en, fr, ar] as const;
export function Picker({
  type,
  onSelect,
  onClose,
  kind,
  mime,
  family,
}: {
  type: "media" | "offers" | "record" | "staff" | "customers";
  kind?: string;
  mime?: string[];
  family?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const { locale } = useUI(),
    [page, setPage] = useState(1),
    [search, setSearch] = useState("");
  const q = useQuery<any>(
    {
      op: type === "record" ? "list" : "native",
      type,
      kind: kind || undefined,
      family: family || undefined,
      page,
      pageSize: 30,
      q: search,
      mime: mime?.join(","),
    },
    { rows: [], total: 0 },
  );
  return (
    <Dialog
      wide
      onClose={onClose}
      title={
        <T
          v={[
            "Choose a governed reference",
            "Choisir une référence native",
            "اختر مرجعاً معتمداً",
          ]}
        />
      }
    >
      <div className={s.root}>
        <div className={s.toolbar}>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={tr(
              message(
                "Search this inventory",
                "Rechercher dans le registre",
                "البحث في المخزون",
              ),
              locale,
            )}
          />
          <Badge>{type}</Badge>
        </div>
        <State {...q} retry={q.reload}>
          <div className={s.mediaGrid}>
            {q.value.rows.map((r: any) => (
              <button
                className={s.choice}
                data-reference-id={r.id}
                onClick={() => {
                  onSelect(r.id);
                  onClose();
                }}
                key={r.id}
              >
                {r.url && String(r.mime).startsWith("image/") ? (
                  <div className={s.cover}>
                    <img src={r.url} alt="" />
                  </div>
                ) : (
                  <Icon
                    name={
                      type === "media"
                        ? "FileImage"
                        : type === "offers"
                          ? "ShoppingBag"
                          : "Layers"
                    }
                  />
                )}
                <strong>{r.title || r.key}</strong>
                {r.key && <small>{r.key}</small>}
                <p>{r.kind || r.mime || r.status}</p>
                <small>{r.lifecycle || r.status || r.mime}</small>
              </button>
            ))}
          </div>
          {!q.value.rows.length && (
            <Empty
              title={
                <T
                  v={[
                    "No eligible records",
                    "Aucun dossier éligible",
                    "لا توجد سجلات مؤهلة",
                  ]}
                />
              }
              detail={
                <T
                  v={[
                    "Upload or create it first in the native registry.",
                    "Ajoutez-le d’abord au registre natif.",
                    "أضفه أولاً إلى السجل الأصلي.",
                  ]}
                />
              }
            />
          )}
          <div className={s.pager}>
            <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              ←
            </Button>
            <span>
              {page} / {Math.max(1, Math.ceil(q.value.total / 30))}
            </span>
            <Button
              disabled={page * 30 >= q.value.total}
              onClick={() => setPage((p) => p + 1)}
            >
              →
            </Button>
          </div>
        </State>
      </div>
    </Dialog>
  );
}
export function NewExperience({
  onChoose,
  onClose,
}: {
  onChoose: (family: string) => void;
  onClose: () => void;
}) {
  const { locale, boot, create, notify } = useUI(),
    router = useRouter();
  const [method, setMethod] = useState("manual"),
    [templateFamily, setTemplateFamily] = useState(""),
    [templateBusy, setTemplateBusy] = useState(false),
    [language, setLanguage] = useState<Locale>(
      authoringLocales(boot.settings).includes(locale)
        ? locale
        : authoringLocales(boot.settings)[0],
    );
  return (
    <Dialog
      wide
      onClose={onClose}
      title={
        <T
          v={[
            "Create your next experience",
            "Créer votre prochaine expérience",
            "إنشاء تجربتك التالية",
          ]}
        />
      }
    >
      <div className={s.root}>
        <section className={p.importStudio}>
          <span className={p.eyebrow}>CONTENT 360 · PRODUCTION STUDIO</span>
          <h3>
            <T
              v={[
                "Choose how you want to start",
                "Choisissez votre point de départ",
                "اختر طريقة البدء",
              ]}
            />
          </h3>
          <div className={p.segment}>
            {[
              [
                "manual",
                ["Create manually", "Créer manuellement", "إنشاء يدوياً"],
              ],
              [
                "template",
                [
                  "Use a published template",
                  "Utiliser un modèle publié",
                  "استخدام نموذج منشور",
                ],
              ],
              [
                "import",
                [
                  "Import structured content",
                  "Importer un contenu structuré",
                  "استيراد محتوى منظم",
                ],
              ],
            ].map(([key, label]) => (
              <button
                key={key as string}
                type="button"
                aria-pressed={method === key}
                onClick={() => setMethod(key as string)}
              >
                {tr(
                  label as unknown as readonly [string, string, string],
                  locale,
                )}
              </button>
            ))}
          </div>
          <p className={p.muted}>
            {tr(
              method === "manual"
                ? [
                    "Select a category to open its dedicated editor. Required fields and source files are checked before publication.",
                    "Choisissez une catégorie pour ouvrir son éditeur dédié. Les champs et fichiers requis sont vérifiés avant publication.",
                    "اختر فئة لفتح محررها المخصص. يتم التحقق من الحقول والملفات المطلوبة قبل النشر.",
                  ]
                : method === "template"
                  ? [
                      "A template must have an active published edition in the selected language. It prepares a new draft, never a publication.",
                      "Le modèle doit avoir une édition publiée active dans la langue sélectionnée. Il prépare un brouillon, jamais une publication.",
                      "يجب أن يكون للنموذج إصدار منشور نشط باللغة المختارة. يحضر مسودة جديدة وليس نشراً.",
                    ]
                  : [
                      "Prepare CSV columns, map fields, correct rows and follow a resumable native batch. Importing drafts does not upload missing files or publish resources.",
                      "Préparez les colonnes CSV, associez les champs, corrigez et suivez un lot natif reprenable. L’import ne téléverse pas les fichiers manquants et ne publie pas les ressources.",
                      "حضّر أعمدة CSV واربط الحقول وصحح الصفوف وتابع دفعة أصلية قابلة للاستئناف. لا يرفع استيراد المسودات الملفات المفقودة ولا ينشر الموارد.",
                    ],
              locale,
            )}
          </p>
          {method === "template" && (
            <label>
              <T
                v={[
                  "Template edition language",
                  "Langue de l’édition modèle",
                  "لغة إصدار النموذج",
                ]}
              />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Locale)}
              >
                {authoringLocales(boot.settings).map((l) => (
                  <option key={l} value={l}>
                    {l.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
          )}
        </section>
        <div className={s.choiceGrid}>
          {authoringFamilies(boot.settings).map((f) => (
            <button
              type="button"
              key={f.key}
              className={s.choice}
              disabled={templateBusy}
              onClick={() => {
                if (method === "manual") onChoose(f.key);
                else if (method === "template") setTemplateFamily(f.key);
                else {
                  router.push(
                    BASE +
                      "/imports?family=" +
                      encodeURIComponent(f.key) +
                      "&task=create",
                  );
                  onClose();
                }
              }}
            >
              <span
                className={s.familyDot}
                style={{ color: f.color, background: f.color + "15" }}
              >
                <Icon name={f.icon} size={24} />
              </span>
              <strong>{tr(f.name, locale)}</strong>
              <p>{tr(f.description, locale)}</p>
              <small>
                {tr(
                  method === "manual"
                    ? [
                        "Open category editor →",
                        "Ouvrir l’éditeur dédié →",
                        "فتح محرر الفئة ←",
                      ]
                    : method === "template"
                      ? [
                          "Choose a source template →",
                          "Choisir un modèle source →",
                          "اختيار نموذج مصدر ←",
                        ]
                      : [
                          "Prepare this category’s import →",
                          "Préparer l’import de cette catégorie →",
                          "تحضير استيراد هذه الفئة ←",
                        ],
                  locale,
                )}
              </small>
            </button>
          ))}
        </div>
        {templateFamily && (
          <Picker
            type="record"
            kind="template"
            family={templateFamily}
            onClose={() => setTemplateFamily("")}
            onSelect={async (id) => {
              setTemplateBusy(true);
              try {
                const r = await query<any>({
                  op: "operator_template",
                  id,
                  family: templateFamily,
                  locale: language,
                });
                create("experience", templateFamily, r.prepared);
                onClose();
              } catch (e) {
                notify((e as Error).message, true);
              } finally {
                setTemplateBusy(false);
              }
            }}
          />
        )}
      </div>
    </Dialog>
  );
}
const localizedFields = new Set([
  "title",
  "text",
  "label",
  "prompt",
  "front",
  "back",
  "choices",
  "answer",
  "explanation",
  "notes",
  "transcript",
  "description",
  "options",
  "body",
  "source",
  "accessibleText",
  "consentLabel",
  "methodology",
  "outputUnit",
]);
export function Editor({
  id,
  kind = "experience",
  family = "documents",
  onClose,
  onSaved,
  prepared,
  onPrepared,
  initialTab = "overview",
  language,
}: {
  initialTab?: string;
  language?: Locale;
  id?: string;
  kind?: Kind;
  family?: string;
  onClose: () => void;
  onSaved?: (r: DceRecord) => void;
  prepared?: Partial<DceRecord>;
  onPrepared?: (r: Partial<DceRecord>) => Promise<void>;
}) {
  const { locale, boot, notify, refresh, preview, open: openDossier, create: openCreation } = useUI();
  const [draft, setDraft] = useState<Partial<DceRecord>>(() => {
      const base = blankRecord(kind, family, locale, boot.settings);
      return prepared
        ? {
            ...base,
            ...structuredClone(prepared),
            data: {
              ...object(base.data),
              ...object(structuredClone(prepared).data),
            },
          }
        : base;
    }),
    [loading, setLoading] = useState(Boolean(id)),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(!id),
    [tab, setTab] = useState(initialTab),
    [lang, setLang] = useState<Locale>(language || locale),
    [picker, setPicker] = useState<{
      type: "record" | "media" | "offers" | "staff";
      kind?: string;
      mime?: string[];
      set: (id: string) => void;
    } | null>(null),
    [validation, setValidation] = useState<Validation | null>(null),
    [focusPath, setFocusPath] = useState(""),
    [focusToken, setFocusToken] = useState(0),
    [binding, setBinding] = useState<Data>({}),
    [schedule, setSchedule] = useState(""),
    [restoreDraft, setRestoreDraft] = useState<Partial<DceRecord> | null>(null),
    [remote, setRemote] = useState<DceRecord | null>(null),
    [choices, setChoices] = useState<Record<string, "mine" | "latest">>({});
  const editorTabsId = useId(),
    editorSurface = useRef<HTMLDivElement>(null);
  const baseline = useRef<Partial<DceRecord>>(draft),
    saveReceipt = useRef<{ payload: string; id: string } | null>(null),
    recoveryBaseline = useRef<Partial<DceRecord>>({});
  const readOnly = !(draft.kind &&
  ["ad_policy", "ad_unit", "ad_connection"].includes(draft.kind)
    ? boot.actor.rights.monetize
    : draft.kind && ["case", "contribution"].includes(draft.kind)
      ? boot.actor.rights.moderate
      : boot.actor.rights.manage);
  const storageKey =
    "angelcare.dce.draft.r6." +
    boot.actor.id +
    "." +
    String(boot.health.scopeKey || "global") +
    "." +
    (id || kind + "." + family);
  const d = object(draft.data),
    f = familyByKey(draft.family || ""),
    collections =
      draft.kind === "bundle"
        ? familyByKey("bundles")?.collections || []
        : f?.collections || [];
  const serverDraft = useServerDraft(
    storageKey,
    boot.actor.rights.manage &&
      object(boot.health.features).operatorDrafts === true &&
      ["experience", "content", "template", "bundle"].includes(
        draft.kind || "",
      ),
    dirty,
    draft,
    baseline,
  );
  useEffect(() => {
    if (serverDraft.candidate?.record) {
      setRestoreDraft(serverDraft.candidate.record as Partial<DceRecord>);
      recoveryBaseline.current =
        (serverDraft.candidate.baseline as Partial<DceRecord>) || {};
    }
  }, [serverDraft.candidate]);
  useEffect(() => {
    let active = true;
    if (id)
      query<DceRecord>({ op: "record", id })
        .then((r) => {
          if (active) {
            const loaded = {
              ...r,
              data: compatibleDefinition(r.family, r.data).data,
            };
            setDraft(loaded);
            baseline.current = structuredClone(loaded);
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    try {
      const recovery = JSON.parse(sessionStorage.getItem(storageKey) || "null");
      if (recovery && recovery.record) {
        setRestoreDraft(recovery.record);
        recoveryBaseline.current = recovery.baseline || {};
      }
    } catch {}
    return () => {
      active = false;
    };
  }, [id, storageKey]);
  useEffect(() => {
    if (
      !dirty ||
      readOnly ||
      ["case", "contribution", "grant", "run"].includes(draft.kind || "")
    )
      return;
    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            version: 2,
            record: draft,
            baseline: baseline.current,
            savedAt: new Date().toISOString(),
          }),
        );
      } catch {
        notify(
          tr(
            [
              "Local draft recovery is unavailable. Save before leaving this tab.",
              "La reprise locale est indisponible. Enregistrez avant de quitter cet onglet.",
              "استعادة المسودة محلياً غير متاحة. احفظ قبل مغادرة هذه النافذة.",
            ],
            locale,
          ),
          true,
        );
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [draft, dirty, readOnly, storageKey]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function retainDraft() {
    if (
      !dirty ||
      readOnly ||
      ["case", "contribution", "grant", "run"].includes(draft.kind || "")
    )
      return;
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          version: 2,
          record: draft,
          baseline: baseline.current,
          savedAt: new Date().toISOString(),
        }),
      );
    } catch {}
  }
  function requestClose() {
    retainDraft();
    if (
      dirty &&
      !confirm(
        tr(
          message(
            "Close and keep your local recovery draft?",
            "Fermer en conservant le brouillon de reprise ?",
            "إغلاق مع حفظ مسودة الاستعادة؟",
          ),
          locale,
        ),
      )
    )
      return;
    onClose();
  }
  function recoverEdits() {
    if (!restoreDraft) return;
    const current = draft;
    baseline.current = structuredClone(recoveryBaseline.current);
    setDraft({ ...restoreDraft, id: current.id });
    setDirty(true);
    setRestoreDraft(null);
    if (current.id && restoreDraft.revision !== current.revision) {
      setRemote(current as DceRecord);
      setChoices({});
    }
  }
  function patch(p: Partial<DceRecord>) {
    setDraft((old) => ({ ...old, ...p }));
    setDirty(true);
    setValidation(null);
  }
  function dataPatch(p: Data) {
    setDraft((old) => ({ ...old, data: { ...old.data, ...p } }));
    setDirty(true);
    setValidation(null);
  }
  function localePatch(field: string, value: string) {
    const locales = object(d.locales);
    dataPatch({
      locales: {
        ...locales,
        [lang]: { ...object(locales[lang]), [field]: value },
      },
    });
    if (field === "title" && !draft.title) patch({ title: value });
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      const r = {
        ...draft,
        title: text(draft.title) || text(object(object(d.locales)[lang]).title),
      };
      if (onPrepared) {
        await onPrepared(r);
        onClose();
        return;
      }
      const payload = JSON.stringify(r);
      if (saveReceipt.current?.payload !== payload)
        saveReceipt.current = { payload, id: crypto.randomUUID() };
      const result = await mutate({
        action: "save",
        id: draft.id,
        revision: draft.revision || 0,
        record: r,
        requestId: saveReceipt.current.id,
      });
      setDraft(result.record);
      baseline.current = structuredClone(result.record);
      saveReceipt.current = null;
      setDirty(false);
      sessionStorage.removeItem(storageKey);
      void serverDraft.discard();
      setRestoreDraft(null);
      notify(
        tr(
          message(
            "Saved with revision receipt.",
            "Enregistré avec reçu de version.",
            "تم الحفظ مع إيصال النسخة.",
          ),
          locale,
        ),
      );
      onSaved?.(result.record);
      await refresh();
      return result.record as DceRecord;
    } catch (e) {
      setError((e as Error).message);
      if (
        draft.id &&
        ((e as { code?: string }).code === "CONFLICT" ||
          /record changed|revision|conflict/i.test((e as Error).message))
      )
        try {
          setRemote(await query<DceRecord>({ op: "record", id: draft.id }));
          setChoices({});
        } catch {}
    } finally {
      setBusy(false);
    }
  }
  async function act(action: string, extra: Data = {}) {
    if (dirty) {
      setError(
        tr(
          message(
            "Save your current changes first.",
            "Enregistrez les modifications avant cette action.",
            "احفظ التغييرات أولاً.",
          ),
          locale,
        ),
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await mutate({
        action,
        id: draft.id,
        revision: draft.revision,
        ...extra,
      });
      if (result.record) {
        setDraft(result.record);
        baseline.current = structuredClone(result.record);
      }
      if (result.validation) {
        setValidation(result.validation);
        setBinding(result.bindings);
        setTab("validation");
      }
      if (action === "duplicate" && result.record) {
        openDossier(result.record.id);
        return;
      }
      if (action === "delete") {
        onClose();
        return;
      }
      if (["release", "schedule"].includes(action))
        notify(
          tr(
            message(
              "Immutable release saved. Public distribution is not active.",
              "Release immuable enregistrée. Distribution publique inactive.",
              "تم حفظ الإصدار الثابت. التوزيع العام غير مفعل.",
            ),
            locale,
          ),
        );
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function field(
    def: Definition,
    value: unknown,
    onChange: (v: Data[string]) => void,
    path?: string,
  ) {
    if (
      def.key === "targetId" &&
      ["ad_policy", "access_policy"].includes(draft.kind || "")
    ) {
      const scope = text(d.scope);
      if (scope === "world" || scope === "direct")
        return (
          <small>
            <T
              v={[
                "No target is required at this scope.",
                "Aucune cible nécessaire à ce périmètre.",
                "لا يلزم هدف في هذا النطاق.",
              ]}
            />
          </small>
        );
      if (scope === "family")
        def = {
          ...def,
          type: "select",
          options: FAMILIES.map((f) => f.key),
          optionLabels: Object.fromEntries(
            FAMILIES.map((f) => [f.key, f.name]),
          ),
        };
      else if (["topic", "template", "experience"].includes(scope))
        def = { ...def, type: "reference" };
      else if (scope === "zone")
        def = {
          ...def,
          type: "select",
          options: [...new Set(AD_FORMATS.flatMap((f) => [...f.zones]))],
        };
    }
    const label = tr(def.label, locale);
    if (def.type === "textarea" && (def.key.startsWith("document") || def.key.startsWith("storefront")) && def.options?.length) {
      const selected = text(value).split(/\r?\n/).filter(Boolean);
      return <Field path={path || def.key} label={label} hint={def.hint && tr(def.hint,locale)}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:8}}>{def.options.map(option=><label key={option} style={{display:"flex",alignItems:"center",gap:7,fontSize:13,padding:8,border:"1px solid #dce6f2",borderRadius:7}}><input type="checkbox" disabled={readOnly} checked={selected.includes(option)} onChange={e=>onChange((e.target.checked?[...selected,option]:selected.filter(v=>v!==option)).join('\n'))}/>{def.optionLabels?.[option]?tr(def.optionLabels[option],locale):option}</label>)}</div></Field>;
    }
    if (def.type === "toggle")
      return (
        <div data-dce-path={path || def.key}>
          <Switch
            label={label}
            value={value === true}
            onChange={onChange}
            disabled={readOnly}
          />
        </div>
      );
    if (def.type === "reference") {
      const type =
        def.reference === "staff"
          ? "staff"
          : def.reference === "media"
            ? "media"
            : def.reference === "offers"
              ? "offers"
              : ["nativeId"].includes(def.key)
                ? "offers"
                : [
                      "assetId",
                      "nativeAssetId",
                      "backAssetId",
                      "narrationAssetId",
                      "captionAssetId",
                      "coverAssetId",
                      "posterAssetId",
                    ].includes(def.key)
                  ? "media"
                  : "record";
      return (
        <Field path={path || def.key} label={label}>
          <div className={s.actions}>
            <ReferenceName type={type} id={text(value)} />
            <Button
              disabled={readOnly}
              icon="Search"
              onClick={() =>
                setPicker({
                  type,
                  mime: def.mime,
                  kind:
                    def.key === "targetId" &&
                    ["topic", "template", "experience"].includes(text(d.scope))
                      ? text(d.scope)
                      : ["parentId", "topic"].includes(def.key)
                        ? "topic"
                        : def.key === "privateReceiverId"
                          ? "setting"
                          : def.key === "accessPolicyId"
                            ? "access_policy"
                            : def.key === "contentId"
                              ? "content"
                              : def.key === "templateId"
                                ? "template"
                                : ["experienceId", "assessmentId"].includes(
                                      def.key,
                                    )
                                  ? "experience"
                                  : undefined,
                  set: onChange,
                })
              }
            >
              <T v={["Choose", "Choisir", "اختر"]} />
            </Button>
            <Button
              disabled={readOnly || !value}
              onClick={() => onChange(null)}
              icon="X"
            >
              <T v={["Clear", "Effacer", "مسح"]} />
            </Button>
          </div>
        </Field>
      );
    }
    return (
      <Field
        path={path || def.key}
        label={label}
        hint={def.hint && tr(def.hint, locale)}
      >
        {def.type === "select" ? (
          <select
            disabled={readOnly}
            value={text(value)}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">—</option>
            {def.options?.map((v) => (
              <option key={v} value={v}>
                {def.optionLabels?.[v] ? tr(def.optionLabels[v], locale) : v}
              </option>
            ))}
          </select>
        ) : def.type === "textarea" ? (
          <textarea
            disabled={readOnly}
            value={text(value)}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <input
            disabled={readOnly}
            type={def.type === "number" ? "number" : "text"}
            min={def.min}
            max={def.max}
            value={
              def.type === "number"
                ? typeof value === "number"
                  ? value
                  : ""
                : text(value)
            }
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
        )}
      </Field>
    );
  }
  function locateControl(path: string) {
    const target = issueDestination(path, f, d, draft.kind);
    if (target.language) setLang(target.language);
    setFocusPath(target.path);
    setFocusToken((value) => value + 1);
    setTab(target.section);
  }
  useEffect(() => {
    const root = editorSurface.current;
    if (!root || !focusPath) return;
    const focus = () => {
      const node = Array.from(
        root.querySelectorAll<HTMLElement>("[data-dce-path]"),
      ).find((n) => n.dataset.dcePath === focusPath);
      if (!node || !node.getClientRects().length) return false;
      const control = node.matches("input,textarea,select,button")
        ? node
        : node.querySelector<HTMLElement>("input,textarea,select,button");
      node.scrollIntoView({ block: "center" });
      control?.focus();
      return Boolean(control);
    };
    const observer = new MutationObserver(() => {
      if (focus()) observer.disconnect();
    });
    const frame = requestAnimationFrame(() => {
      if (!focus())
        observer.observe(root, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["hidden", "class"],
        });
    });
    const timeout = setTimeout(() => observer.disconnect(), 2500);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [focusPath, focusToken, tab, lang]);
  const allTabs = [
    [
      "experience",
      message("Experience designer", "Concepteur d’expérience", "مصمم التجربة"),
    ],
    [
      "delivery",
      message(
        "Editions, actions & outputs",
        "Éditions, actions et sorties",
        "النسخ والإجراءات والمخرجات",
      ),
    ],
    ["overview", message("Dossier", "Dossier", "الملف")],
    ["content", message("Authoring", "Édition", "التحرير")],
    ["media", message("Media", "Médias", "الوسائط")],
    ["design", message("Composition", "Composition", "التصميم")],
    ["journey", message("Journey", "Parcours", "المسار")],
    [
      "access",
      message("Rights & actions", "Droits & actions", "الحقوق والإجراءات"),
    ],
    [
      "validation",
      message("Preview & release", "Aperçu & release", "المعاينة والإصدار"),
    ],
    [
      "connections",
      message("Connected dossier", "Dossier connecté", "الملف المتصل"),
    ],
    [
      "team",
      message(
        "Team & shared text",
        "Équipe et texte partagé",
        "الفريق والنص المشترك",
      ),
    ],
    ["history", message("Versions", "Versions", "النسخ")],
  ] as const;
  const allowedTabs: Record<string, string[]> = {
    experience: ["experience", "template", "bundle"],
    delivery: ["experience", "content", "template", "bundle"],
    team: ["experience", "content", "template", "bundle"],
    connections: ["*"],
    overview: ["*"],
    content: ["*"],
    history: ["*"],
    media: ["experience", "template", "bundle", "content", "asset"],
    design: ["experience", "template"],
    journey: ["experience", "template", "bundle"],
    access: [
      "experience",
      "template",
      "bundle",
      "access_policy",
      "ad_policy",
      "ad_connection",
      "asset",
      "offer_link",
    ],
    validation: ["ad_policy", "access_policy"],
  };
  const tabs = allTabs.filter(
    ([key]) =>
      allowedTabs[key]?.includes("*") ||
      allowedTabs[key]?.includes(draft.kind || "experience"),
  );
  return (
    <Dialog
      workspace
      title={
        <span>
          {draft.title ||
            tr(
              message("New dossier", "Nouveau dossier", "ملف جديد"),
              locale,
            )}{" "}
          {draft.id && <Badge>r{draft.revision}</Badge>}
        </span>
      }
      onClose={requestClose}
      footer={
        <>
          {["experience","bundle"].includes(draft.kind||"") && <Button
            disabled={busy||loading}
            icon="Layers"
            onClick={async()=>{
              if(dirty){const saved=await save();if(!saved)return;onClose();openCreation(saved.kind,saved.family||"bundles",saved);}
              else {onClose();openCreation(draft.kind,draft.family||"bundles",draft);}
            }}
          ><T v={["Guided workspace","Atelier simplifié","الورشة المبسطة"]}/></Button>}
          {draft.id && (
            <Button
              disabled={
                busy ||
                readOnly ||
                ["case", "contribution", "run", "grant"].includes(
                  draft.kind || "",
                )
              }
              onClick={() => act("duplicate")}
              icon="Copy"
            >
              <T v={["Duplicate", "Dupliquer", "نسخ"]} />
            </Button>
          )}
          <small style={{ marginInlineEnd: "auto", color: "#7187a7" }}>
            {dirty
              ? tr(
                  message(
                    "Unsaved draft retained in this staff session",
                    "Brouillon conservé dans cette session",
                    "المسودة محفوظة في الجلسة",
                  ),
                  locale,
                )
              : tr(
                  message(
                    "Current server revision",
                    "Version serveur courante",
                    "نسخة الخادم الحالية",
                  ),
                  locale,
                )}
          </small>
          <Button disabled={busy} onClick={requestClose}>
            <T v={["Close", "Fermer", "إغلاق"]} />
          </Button>
          <Button
            kind="primary"
            icon={busy ? "LoaderCircle" : "Save"}
            disabled={readOnly || busy || loading}
            onClick={save}
          >
            {onPrepared ? (
              <T
                v={[
                  "Save correction",
                  "Enregistrer la correction",
                  "حفظ التصحيح",
                ]}
              />
            ) : (
              <T
                v={["Save draft", "Enregistrer le brouillon", "حفظ المسودة"]}
              />
            )}
          </Button>
        </>
      }
    >
      <div
        ref={editorSurface}
        className={s.root}
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
        {error && (
          <div className={`${s.notice} ${s.alertError}`} role="alert">
            {error}
          </div>
        )}
        {readOnly && (
          <div className={s.notice}>
            <T
              v={[
                "Read-only role. Your native permissions govern every action.",
                "Rôle lecture seule. Vos permissions natives gouvernent les actions.",
                "دور للقراءة فقط. تتحكم الصلاحيات الأصلية في الإجراءات.",
              ]}
            />
          </div>
        )}
        {restoreDraft && (
          <div className={s.notice}>
            <div>
              <T
                v={[
                  "A local recovery draft is available. It will still need server revision reconciliation.",
                  "Un brouillon local existe. La version serveur sera vérifiée.",
                  "تتوفر مسودة محلية. يجب مطابقة نسخة الخادم.",
                ]}
              />
              <div className={s.actions}>
                <Button onClick={recoverEdits}>
                  <T
                    v={[
                      "Recover edits",
                      "Récupérer les saisies",
                      "استعادة التعديلات",
                    ]}
                  />
                </Button>
                <Button
                  onClick={() => {
                    sessionStorage.removeItem(storageKey);
                    setRestoreDraft(null);
                  }}
                >
                  <T
                    v={[
                      "Discard local copy",
                      "Effacer la copie locale",
                      "حذف النسخة المحلية",
                    ]}
                  />
                </Button>
              </div>
            </div>
          </div>
        )}
        <State loading={loading} error="" retry={() => {}}>
          <DossierStudio
            record={draft}
            language={lang}
            dirty={dirty}
            readOnly={readOnly}
            busy={busy}
            tabs={tabs}
            active={tab}
            onNavigate={setTab}
            onLocate={locateControl}
            onSave={save}
            onChange={dataPatch}
          >
            <div className={s.splitTabs}>
              <Badge tone={draft.lifecycle === "approved" ? "green" : "blue"}>
                {draft.lifecycle || "draft"} · {draft.kind}
              </Badge>
              <select
                aria-label="Content language"
                value={lang}
                onChange={(e) => setLang(e.target.value as Locale)}
              >
                {(["fr", "en", "ar"] as Locale[])
                  .filter(
                    (l) =>
                      Boolean(draft.id) ||
                      authoringLocales(boot.settings).includes(l),
                  )
                  .map((l) => (
                    <option value={l} key={l}>
                      {l.toUpperCase()}
                    </option>
                  ))}
              </select>
            </div>
            <div id={`${editorTabsId}-panel`}>
              {tab === "connections" && draft.id && (
                <DossierConnections
                  id={draft.id}
                  beforeNavigate={() => {
                    if (dirty) retainDraft();
                    return (
                      !dirty ||
                      confirm(
                        tr(
                          message(
                            "Your draft is retained. Leave this editor?",
                            "Votre brouillon est conservé. Quitter cet éditeur ?",
                            "المسودة محفوظة. مغادرة المحرر؟",
                          ),
                          locale,
                        ),
                      )
                    );
                  }}
                />
              )}
              {serverDraft.status && serverDraft.status !== "✓" && (
                <p role="status">{serverDraft.status}</p>
              )}
              {tab === "experience" && f && (
                <ExperienceStudio
                  record={draft}
                  family={f}
                  data={d}
                  language={lang}
                  readOnly={readOnly}
                  onChange={dataPatch}
                  renderField={field}
                  focusPath={focusPath}
                />
              )}
              {tab === "delivery" && (
                <DeliveryStudio
                  record={draft}
                  language={lang}
                  onLanguage={setLang}
                  dirty={dirty}
                  readOnly={readOnly}
                  onChange={dataPatch}
                  focusPath={focusPath}
                  onLocate={locateControl}
                />
              )}
              {tab === "overview" && (
                <>
                  <div className={s.formGrid}>
                    <Field
                      path="key"
                      label={
                        <T v={["Stable key", "Clé stable", "المعرّف الثابت"]} />
                      }
                      hint={
                        <T
                          v={[
                            "Immutable after first save",
                            "Immuable après sauvegarde",
                            "لا يتغير بعد الحفظ",
                          ]}
                        />
                      }
                    >
                      <input
                        value={draft.key || ""}
                        disabled={readOnly || Boolean(draft.id)}
                        onChange={(e) => patch({ key: e.target.value })}
                      />
                    </Field>
                    <Field
                      path="staffTitle"
                      label={
                        <T
                          v={[
                            "Staff dossier title",
                            "Titre opérateur",
                            "عنوان الملف الداخلي",
                          ]}
                        />
                      }
                    >
                      <input
                        value={draft.title || ""}
                        disabled={readOnly}
                        onChange={(e) => patch({ title: e.target.value })}
                      />
                    </Field>
                    <Field
                      label={
                        <T
                          v={[
                            "Localized title",
                            "Titre traduit",
                            "العنوان المترجم",
                          ]}
                        />
                      }
                    >
                      <input
                        data-dce-path="title"
                        value={text(object(object(d.locales)[lang]).title)}
                        disabled={readOnly}
                        onChange={(e) => localePatch("title", e.target.value)}
                      />
                    </Field>
                    <Field
                      path="audience"
                      label={<T v={["Audience", "Public", "الجمهور"]} />}
                    >
                      <select
                        value={draft.audience || "parent"}
                        disabled={readOnly}
                        onChange={(e) => patch({ audience: e.target.value })}
                      >
                        {[
                          "child",
                          "parent",
                          "educator",
                          "professional",
                          "school",
                        ].map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </Field>
                    <Field
                      path="summary"
                      label={<T v={["Summary", "Résumé", "الملخص"]} />}
                    >
                      <textarea
                        value={text(object(object(d.locales)[lang]).summary)}
                        disabled={readOnly}
                        onChange={(e) => localePatch("summary", e.target.value)}
                      />
                    </Field>
                    <Field
                      path="instructions"
                      label={
                        <T
                          v={[
                            "Instructions / accessibility",
                            "Instructions / accessibilité",
                            "التعليمات / الوصول",
                          ]}
                        />
                      }
                    >
                      <textarea
                        value={text(
                          object(object(d.locales)[lang]).instructions,
                        )}
                        disabled={readOnly}
                        onChange={(e) =>
                          localePatch("instructions", e.target.value)
                        }
                      />
                    </Field>
                    <Field
                      path="body"
                      label={
                        <T
                          v={[
                            "Main editorial text",
                            "Texte éditorial principal",
                            "النص التحريري الرئيسي",
                          ]}
                        />
                      }
                    >
                      <textarea
                        rows={6}
                        disabled={readOnly}
                        value={text(object(object(d.locales)[lang]).body)}
                        onChange={(e) => localePatch("body", e.target.value)}
                      />
                    </Field>
                    {["experience", "template"].includes(draft.kind || "") && (
                      <Field
                        label={
                          <T
                            v={["Viewer mode", "Mode de lecture", "وضع العرض"]}
                          />
                        }
                      >
                        <select
                          data-dce-path="mode"
                          disabled={readOnly}
                          value={text(d.mode)}
                          onChange={(e) =>
                            dataPatch({
                              mode: e.target.value,
                              ...(f?.key === "learning" &&
                              e.target.value ===
                                "Assessment-linked learning path"
                                ? { completion: "assessment_pass" }
                                : {}),
                            })
                          }
                        >
                          {f?.modes.map((m) => (
                            <option key={m}>{m}</option>
                          ))}
                        </select>
                      </Field>
                    )}
                    {field(
                      {
                        key: "topic",
                        label: message(
                          "Child/family topic",
                          "Thème enfant/famille",
                          "موضوع الأطفال والأسرة",
                        ),
                        type: "reference",
                      },
                      draft.topic,
                      (v) => patch({ topic: text(v) || null }),
                    )}
                    {field(
                      {
                        key: "ageMin",
                        label: message(
                          "Minimum age",
                          "Âge minimal",
                          "العمر الأدنى",
                        ),
                        type: "number",
                        min: 0,
                        max: 25,
                      },
                      d.ageMin,
                      (v) => dataPatch({ ageMin: v }),
                    )}
                    {field(
                      {
                        key: "ageMax",
                        label: message(
                          "Maximum age",
                          "Âge maximal",
                          "العمر الأعلى",
                        ),
                        type: "number",
                        min: 0,
                        max: 25,
                      },
                      d.ageMax,
                      (v) => dataPatch({ ageMax: v }),
                    )}
                  </div>
                  <div className={s.sectionTitle}>
                    <h3>
                      <T
                        v={[
                          "Authored languages · each releases independently",
                          "Langues rédigées · publication indépendante",
                          "لغات مؤلفة · نشر مستقل",
                        ]}
                      />
                    </h3>
                  </div>
                  <div className={s.checkOptions}>
                    {(["fr", "en", "ar"] as Locale[]).map((l) => (
                      <label key={l}>
                        <input
                          type="checkbox"
                          disabled={readOnly}
                          checked={
                            Array.isArray(d.requiredLocales) &&
                            d.requiredLocales.includes(l)
                          }
                          onChange={(e) =>
                            dataPatch({
                              requiredLocales: e.target.checked
                                ? [
                                    ...((d.requiredLocales as string[]) || []),
                                    l,
                                  ]
                                : (
                                    (d.requiredLocales as string[]) || []
                                  ).filter((x) => x !== l),
                            })
                          }
                        />
                        {l.toUpperCase()}{" "}
                        <Badge
                          tone={
                            text(object(object(d.locales)[l]).title)
                              ? "green"
                              : "orange"
                          }
                        >
                          {text(object(object(d.locales)[l]).title) ? "✓" : "—"}
                        </Badge>
                      </label>
                    ))}
                  </div>
                  <div className={s.notice} style={{ marginTop: 15 }}>
                    <Icon name="ShieldCheck" />
                    <T
                      v={[
                        "Private fields stay in staff records. Media, native offers and customer identities keep their existing authorities.",
                        "Les champs privés restent internes. Médias, offres et identités conservent leurs autorités natives.",
                        "تبقى الحقول الخاصة داخلية. تحتفظ الوسائط والعروض والهويات بمرجعيتها الأصلية.",
                      ]}
                    />
                  </div>
                </>
              )}
              {tab === "content" && (
                <>
                  {draft.family === "activities" && (
                    <HtmlActivityEditor
                      data={d}
                      language={lang}
                      onChange={dataPatch}
                      disabled={readOnly}
                    />
                  )}{" "}
                  {draft.kind === "setting" &&
                    draft.key === "world-defaults" && (
                      <>
                        <div className={s.checkOptions}>
                          {FAMILIES.map((f) => (
                            <label key={f.key}>
                              <input
                                type="checkbox"
                                disabled={readOnly}
                                checked={authoringFamilies(d).some(
                                  (v) => v.key === f.key,
                                )}
                                onChange={(e) =>
                                  dataPatch({
                                    familySelectionConfigured: true,
                                    enabledFamilies: e.target.checked
                                      ? [
                                          ...authoringFamilies(d).map(
                                            (v) => v.key,
                                          ),
                                          f.key,
                                        ]
                                      : authoringFamilies(d)
                                          .filter((v) => v.key !== f.key)
                                          .map((v) => v.key),
                                  })
                                }
                              />
                              {tr(f.name, locale)}
                            </label>
                          ))}
                        </div>
                        <div className={s.sectionTitle}>
                          <h3>
                            <T
                              v={[
                                "Enabled authoring languages",
                                "Langues de création actives",
                                "لغات التأليف المفعلة",
                              ]}
                            />
                          </h3>
                        </div>
                        <div className={s.checkOptions}>
                          {["fr", "en", "ar"].map((value) => (
                            <label key={value}>
                              <input
                                disabled={readOnly}
                                type="checkbox"
                                checked={
                                  !Array.isArray(d.enabledLocales) ||
                                  d.enabledLocales.includes(value)
                                }
                                onChange={(e) =>
                                  dataPatch({
                                    enabledLocales: e.target.checked
                                      ? [
                                          ...((d.enabledLocales as string[]) || [
                                            "fr",
                                            "en",
                                            "ar",
                                          ]),
                                          value,
                                        ]
                                      : (
                                          (d.enabledLocales as string[]) || [
                                            "fr",
                                            "en",
                                            "ar",
                                          ]
                                        ).filter((l) => l !== value),
                                  })
                                }
                              />
                              {value.toUpperCase()}
                            </label>
                          ))}
                        </div>
                        <p className={s.subtitle}>
                          <T
                            v={[
                              "The official AngelCare logo is fixed. These defaults govern new definitions; existing authored settings retain their values. Retention declares policy and never purges data automatically.",
                              "Le logo officiel reste fixe. Ces valeurs s’appliquent aux nouvelles définitions ; les dossiers existants gardent leurs réglages. La rétention ne supprime jamais les données automatiquement.",
                              "الشعار الرسمي ثابت. تطبق القيم على التعريفات الجديدة مع احتفاظ السجلات الحالية بإعداداتها. لا يحذف الاحتفاظ البيانات تلقائياً.",
                            ]}
                          />
                        </p>
                      </>
                    )}
                  {draft.kind === "setting" &&
                  draft.key === "dce-protected-receiver" ? (
                    <>
                      <Switch
                        disabled={readOnly}
                        label={
                          <T
                            v={[
                              "Protected receiver enabled",
                              "Réception protégée activée",
                              "الاستقبال المحمي مفعل",
                            ]}
                          />
                        }
                        value={d.enabled === true}
                        onChange={(v) => dataPatch({ enabled: v })}
                      />
                      <p>dce_private_v1 · PDF/JPEG/PNG/WebP · 20 MiB · S:</p>
                    </>
                  ) : f ||
                    ["bundle", "content", "asset"].includes(
                      draft.kind || "",
                    ) ? (
                    <FamilyWorkbench
                      family={
                        f ||
                        (draft.kind === "content"
                          ? CONTENT_WORKBENCH
                          : draft.kind === "asset"
                            ? MEDIA_WORKBENCH
                            : familyByKey("bundles")!)
                      }
                      data={d}
                      language={lang}
                      readOnly={readOnly}
                      onChange={dataPatch}
                      renderField={field}
                      focusPath={focusPath}
                    />
                  ) : (
                    <div className={s.formGrid}>
                      {(ROOT_FIELDS[draft.kind || "experience"] || []).map(
                        (def) => (
                          <div key={def.key} data-dce-path={def.key}>
                            {field(
                              def,
                              localizedFields.has(def.key)
                                ? (object(object(d.locales)[lang])[def.key] ??
                                    d[def.key])
                                : d[def.key],
                              (v) => {
                                if (
                                  localizedFields.has(def.key) &&
                                  typeof v === "string"
                                )
                                  localePatch(def.key, v);
                                else dataPatch({ [def.key]: v });
                              },
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </>
              )}

              {tab === "media" && (
                <>
                  <div className={s.formGrid}>
                    {field(
                      {
                        key: "coverAssetId",
                        label: message(
                          "Editorial cover from the native vault",
                          "Couverture éditoriale du coffre natif",
                          "غلاف تحريري من الخزنة الأصلية",
                        ),
                        type: "reference",
                      },
                      d.coverAssetId,
                      (v) => dataPatch({ coverAssetId: v }),
                    )}
                    {field(
                      {
                        key: "accessibleText",
                        label: message(
                          "Accessible description",
                          "Description accessible",
                          "وصف يمكن الوصول إليه",
                        ),
                        type: "textarea",
                      },
                      object(object(d.locales)[lang]).accessibleText,
                      (v) => localePatch("accessibleText", text(v)),
                    )}
                  </div>
                  <div className={s.notice}>
                    <T
                      v={[
                        "Bind source files in the authoring units. The Media Library uploads through the existing S: vault. Private form attachments must use a private receiving authority.",
                        "Liez les sources dans les unités. La bibliothèque utilise le coffre S: existant. Les pièces privées restent dans leur réception protégée.",
                        "اربط الملفات في الوحدات. تستخدم المكتبة خزنة S: الحالية. المرفقات الخاصة تتطلب استقبالاً محمياً.",
                      ]}
                    />
                  </div>
                  <div className={s.rowCard}>
                    {draft.kind === "asset" && draft.id && (
                      <Button
                        icon="ScanLine"
                        disabled={busy || dirty || !boot.actor.rights.media}
                        onClick={() => act("process_media")}
                      >
                        <T
                          v={[
                            "Process source metadata",
                            "Traiter les métadonnées source",
                            "معالجة بيانات المصدر",
                          ]}
                        />
                      </Button>
                    )}
                    {draft.kind === "asset" && (
                      <div className={s.rowCard}>
                        <Badge
                          tone={
                            d.processingState === "ready"
                              ? "green"
                              : d.processingState === "failed"
                                ? "pink"
                                : "orange"
                          }
                        >
                          {text(d.processingState) || "not_inspected"}
                        </Badge>
                        <pre className={s.mono}>
                          {JSON.stringify(d.processingMetadata || {}, null, 2)}
                        </pre>
                        {d.processingError && (
                          <p role="alert">{text(d.processingError)}</p>
                        )}
                      </div>
                    )}
                    <h3>
                      <T
                        v={[
                          "Current bindings",
                          "Liens actuels",
                          "الروابط الحالية",
                        ]}
                      />
                    </h3>
                    {references(d).media.map((id) => (
                      <p key={id} className={s.mono}>
                        {id}
                      </p>
                    ))}
                  </div>
                </>
              )}
              {tab === "design" && (
                <CompositionCanvas
                  data={d}
                  family={{
                    ...f!,
                    collections: f!.collections.filter(
                      (c) => c.key !== "outputs",
                    ),
                  }}
                  readOnly={readOnly}
                  onChange={dataPatch}
                  renderField={field}
                />
              )}
              {tab === "journey" && (
                <JourneyCanvas
                  data={d}
                  onChange={dataPatch}
                  readOnly={readOnly}
                  renderField={field}
                  onAuthor={() => setTab("content")}
                />
              )}

              {tab === "access" && (
                <>
                  <div className={s.formGrid}>
                    {field(
                      {
                        key: "accessPolicyId",
                        label: message(
                          "Access policy",
                          "Politique d’accès",
                          "سياسة الوصول",
                        ),
                        type: "reference",
                      },
                      d.accessPolicyId,
                      (v) => dataPatch({ accessPolicyId: v }),
                    )}
                    {field(
                      {
                        key: "visibility",
                        label: message(
                          "Access classification",
                          "Classification d’accès",
                          "تصنيف الوصول",
                        ),
                        type: "select",
                        options: ["free"],
                      },
                      d.visibility,
                      (v) => dataPatch({ visibility: v }),
                    )}
                    {field(
                      {
                        key: "downloadAllowed",
                        label: message(
                          "Download allowed",
                          "Téléchargement autorisé",
                          "التنزيل مسموح",
                        ),
                        type: "toggle",
                      },
                      d.downloadAllowed,
                      (v) => dataPatch({ downloadAllowed: v }),
                    )}
                    {field(
                      {
                        key: "printAllowed",
                        label: message(
                          "Print allowed",
                          "Impression autorisée",
                          "الطباعة مسموحة",
                        ),
                        type: "toggle",
                      },
                      d.printAllowed,
                      (v) => dataPatch({ printAllowed: v }),
                    )}
                  </div>
                  <div className={s.sectionTitle}>
                    <h3>
                      <T
                        v={[
                          "Family capabilities",
                          "Capacités de la famille",
                          "قدرات العائلة",
                        ]}
                      />
                    </h3>
                  </div>
                  <div className={s.checkOptions}>
                    {f?.actions
                      .filter(
                        (action) =>
                          !(
                            ["forms", "community"].includes(
                              draft.family || "",
                            ) &&
                            [
                              "upload",
                              "submit",
                              "confirm",
                              "track_status",
                              "comment",
                              "review",
                              "rate",
                              "like",
                              "report",
                            ].includes(action)
                          ),
                      )
                      .map((action) => (
                        <label key={action}>
                          <input
                            type="checkbox"
                            disabled={readOnly}
                            checked={
                              Array.isArray(d.actions) &&
                              d.actions.includes(action)
                            }
                            onChange={(e) =>
                              dataPatch({
                                actions: e.target.checked
                                  ? [...((d.actions as string[]) || []), action]
                                  : ((d.actions as string[]) || []).filter(
                                      (x) => x !== action,
                                    ),
                              })
                            }
                          />
                          {f.capabilities?.find((c) => c.id === action)
                            ? tr(
                                f.capabilities.find((c) => c.id === action)!
                                  .label,
                                locale,
                              )
                            : action}
                        </label>
                      ))}
                  </div>
                  {draft.kind === "access_policy" && (
                    <div className={s.checkOptions}>
                      {[
                        "child",
                        "parent",
                        "educator",
                        "professional",
                        "school",
                      ].map((a) => (
                        <label key={a}>
                          <input
                            type="checkbox"
                            disabled={readOnly}
                            checked={
                              Array.isArray(d.audiences) &&
                              d.audiences.includes(a)
                            }
                            onChange={(e) =>
                              dataPatch({
                                audiences: e.target.checked
                                  ? [...((d.audiences as string[]) || []), a]
                                  : ((d.audiences as string[]) || []).filter(
                                      (v) => v !== a,
                                    ),
                              })
                            }
                          />
                          {a}
                        </label>
                      ))}
                    </div>
                  )}
                  {draft.kind === "ad_policy" && (
                    <>
                      <div className={s.sectionTitle}>
                        <h3>
                          <T
                            v={[
                              "Eligible audiences, languages and devices",
                              "Publics, langues et appareils éligibles",
                              "الجماهير واللغات والأجهزة المؤهلة",
                            ]}
                          />
                        </h3>
                      </div>
                      {[
                        [
                          "audiences",
                          [
                            "child",
                            "parent",
                            "educator",
                            "professional",
                            "school",
                          ],
                        ],
                        ["allowedLocales", ["fr", "en", "ar"]],
                        ["devices", ["desktop", "mobile"]],
                        ["regions", ["MA", "FR", "US", "CA", "GB", "AE", "SA"]],
                      ].map(([key, options]) => (
                        <div className={s.checkOptions} key={key as string}>
                          {(options as string[]).map((v) => (
                            <label key={v}>
                              <input
                                type="checkbox"
                                checked={
                                  Array.isArray(d[key as string]) &&
                                  (d[key as string] as string[]).includes(v)
                                }
                                disabled={readOnly}
                                onChange={(e) =>
                                  dataPatch({
                                    [key as string]: e.target.checked
                                      ? [
                                          ...((d[key as string] as string[]) ||
                                            []),
                                          v,
                                        ]
                                      : (
                                          (d[key as string] as string[]) || []
                                        ).filter((x) => x !== v),
                                  })
                                }
                              />
                              {v}
                            </label>
                          ))}
                        </div>
                      ))}
                    </>
                  )}
                  {draft.kind === "ad_connection" && (
                    <div className={s.checkOptions}>
                      {["adsense", "offerwall", "afs", "h5", "video_stack"].map(
                        (v) => (
                          <label key={v}>
                            <input
                              type="checkbox"
                              checked={
                                Array.isArray(d.programs) &&
                                d.programs.includes(v)
                              }
                              disabled={readOnly}
                              onChange={(e) =>
                                dataPatch({
                                  programs: e.target.checked
                                    ? [...((d.programs as string[]) || []), v]
                                    : ((d.programs as string[]) || []).filter(
                                        (x) => x !== v,
                                      ),
                                })
                              }
                            />
                            {v}
                          </label>
                        ),
                      )}
                    </div>
                  )}
                  <div className={s.notice} style={{ marginTop: 18 }}>
                    <T
                      v={[
                        "Recognized customer grants and payment outcomes are read from native issuers. No policy creates a purchase or reward by itself.",
                        "Les droits reconnus et paiements viennent des autorités natives. Une politique ne crée pas d’achat ni de récompense.",
                        "تأتي الأهلية والمدفوعات من الجهات الأصلية. السياسة لا تنشئ شراءً أو مكافأة.",
                      ]}
                    />
                  </div>
                </>
              )}
              {tab === "validation" &&
                (["experience", "content", "template", "bundle"].includes(
                  draft.kind || "",
                ) ? (
                  <DeliveryStudio
                    record={draft}
                    language={lang}
                    onLanguage={setLang}
                    dirty={dirty}
                    readOnly={readOnly}
                    onChange={dataPatch}
                  />
                ) : (
                  <>
                    <div className={s.toolbar}>
                      <Button
                        icon="ScanLine"
                        onClick={() => act("validate")}
                        disabled={busy || !draft.id || dirty}
                      >
                        <T
                          v={[
                            "Validate saved revision",
                            "Valider la version enregistrée",
                            "تحقق من النسخة المحفوظة",
                          ]}
                        />
                      </Button>
                      <Button
                        icon="Eye"
                        onClick={() =>
                          draft.id && preview(draft.id, undefined, lang)
                        }
                        disabled={!draft.id || dirty}
                      >
                        <T
                          v={[
                            "Open protected preview",
                            "Ouvrir l’aperçu protégé",
                            "افتح المعاينة المحمية",
                          ]}
                        />
                      </Button>
                      <Badge tone={validation?.valid ? "green" : "orange"}>
                        {validation
                          ? validation.valid
                            ? "READY"
                            : "BLOCKED"
                          : "NOT_CHECKED"}
                      </Badge>
                    </div>
                    {validation && (
                      <>
                        {[...validation.errors, ...validation.warnings].map(
                          (issue, i) => (
                            <button
                              className={s.rowCard}
                              style={{ width: "100%", textAlign: "start" }}
                              key={i}
                              onClick={() => locateControl(issue.path)}
                            >
                              <Badge
                                tone={
                                  issue.severity === "error" ? "pink" : "orange"
                                }
                              >
                                {issue.code}
                              </Badge>{" "}
                              <strong>{issue.path}</strong>
                              <p>{tr(issue.message, locale)}</p>
                            </button>
                          ),
                        )}
                        {validation.valid && (
                          <div className={s.result}>
                            <T
                              v={[
                                "Saved definition passes current dependencies.",
                                "La définition enregistrée valide ses dépendances.",
                                "نجحت النسخة المحفوظة في فحص الاعتماديات.",
                              ]}
                            />
                          </div>
                        )}
                      </>
                    )}
                    <div className={s.sectionTitle}>
                      <h3>
                        <T
                          v={[
                            "Approval and immutable release",
                            "Approbation et release immuable",
                            "الموافقة والإصدار الثابت",
                          ]}
                        />
                      </h3>
                    </div>
                    <div className={s.actions}>
                      <Button
                        disabled={busy || dirty || !draft.id || readOnly}
                        onClick={() => act("review")}
                        icon="Send"
                      >
                        <T
                          v={[
                            "Send for review",
                            "Soumettre en revue",
                            "إرسال للمراجعة",
                          ]}
                        />
                      </Button>
                      <Button
                        disabled={
                          busy ||
                          dirty ||
                          draft.lifecycle !== "review" ||
                          !boot.actor.rights.publish
                        }
                        onClick={() => act("approve")}
                        icon="BadgeCheck"
                      >
                        <T v={["Approve", "Approuver", "اعتماد"]} />
                      </Button>
                      <Button
                        disabled={
                          busy ||
                          dirty ||
                          draft.lifecycle !== "approved" ||
                          !boot.actor.rights.publish
                        }
                        onClick={() => act("release")}
                        kind="primary"
                        icon="Rocket"
                      >
                        <T
                          v={[
                            "Release revision",
                            "Publier la version",
                            "نشر النسخة",
                          ]}
                        />
                      </Button>
                    </div>
                    <div className={s.formGrid} style={{ marginTop: 14 }}>
                      <Field
                        label={
                          <T
                            v={[
                              "Schedule · world timezone",
                              "Planifier · fuseau du monde",
                              "الجدولة · المنطقة الزمنية للعالم",
                            ]}
                          />
                        }
                      >
                        <input
                          type="datetime-local"
                          title={worldTimeZone(boot.settings)}
                          value={schedule}
                          onChange={(e) => setSchedule(e.target.value)}
                        />
                      </Field>
                      <Button
                        disabled={
                          busy ||
                          dirty ||
                          !schedule ||
                          draft.lifecycle !== "approved" ||
                          !boot.actor.rights.publish
                        }
                        onClick={() => {
                          try {
                            void act("schedule", {
                              scheduledAt: zonedDateInput(
                                schedule,
                                worldTimeZone(boot.settings),
                              ),
                            });
                          } catch (e) {
                            setError((e as Error).message);
                          }
                        }}
                        icon="CalendarClock"
                      >
                        <T
                          v={[
                            "Schedule approved revision",
                            "Planifier la version approuvée",
                            "جدولة النسخة المعتمدة",
                          ]}
                        />
                      </Button>
                    </div>
                    <div className={s.notice} style={{ marginTop: 15 }}>
                      <T
                        v={[
                          "Publishing saves a DCE release manifest. Public viewers are a separate Chapter 2 activation. Draft edits never overwrite an active release.",
                          "La publication crée un manifeste DCE. Les pages publiques sont activées au chapitre 2. Un brouillon n’écrase pas une release active.",
                          "يحفظ النشر بيان إصدار DCE. تفعيل العرض العام في الفصل الثاني. لا تكتب المسودة فوق الإصدار الفعال.",
                        ]}
                      />
                    </div>
                  </>
                ))}
              {tab === "team" && draft.id && !dirty && (
                <DossierTeam
                  id={draft.id}
                  onCommitted={(r) => {
                    setDraft(r);
                    baseline.current = structuredClone(r);
                    setDirty(false);
                  }}
                />
              )}
              {tab === "team" && dirty && (
                <p className={s.notice}>
                  <T
                    v={[
                      "Save your local changes before opening shared editing.",
                      "Enregistrez les modifications locales avant l’édition partagée.",
                      "احفظ التغييرات المحلية قبل فتح التحرير المشترك.",
                    ]}
                  />
                </p>
              )}
              {tab === "history" && draft.id && (
                <>
                  <div className={s.actions}>
                    <Button
                      disabled={
                        busy || readOnly || Boolean(draft.published_release_id)
                      }
                      onClick={() => {
                        if (
                          confirm(
                            tr(
                              message(
                                "Archive this dossier? Active dependencies remain protected.",
                                "Archiver ce dossier ? Les dépendances restent protégées.",
                                "أرشفة الملف؟ الاعتماديات تبقى محمية.",
                              ),
                              locale,
                            ),
                          )
                        )
                          act("archive");
                      }}
                      icon="Archive"
                    >
                      <T v={["Archive", "Archiver", "أرشفة"]} />
                    </Button>
                    <Button
                      disabled={
                        busy ||
                        !boot.actor.rights.purge ||
                        !["archived", "closed", "rejected"].includes(
                          draft.lifecycle || "",
                        )
                      }
                      kind="danger"
                      onClick={() => {
                        if (
                          confirm(
                            tr(
                              message(
                                "Permanently delete this eligible dossier? The server blocks live releases and dependencies.",
                                "Supprimer définitivement ce dossier éligible ? Les liens et releases bloquent la suppression.",
                                "حذف هذا الملف المؤهل نهائياً؟ يمنع الخادم حذف الملفات المرتبطة.",
                              ),
                              locale,
                            ),
                          )
                        )
                          act("delete");
                      }}
                      icon="Trash2"
                    >
                      <T
                        v={[
                          "Delete permanently",
                          "Supprimer définitivement",
                          "حذف نهائي",
                        ]}
                      />
                    </Button>
                  </div>
                  <History
                    id={draft.id}
                    onRestore={(r) => {
                      setDraft((old) => ({
                        ...r,
                        id: old.id,
                        revision: old.revision,
                        lifecycle: old.lifecycle,
                        published_release_id: old.published_release_id,
                      }));
                      setDirty(true);
                      setTab("overview");
                    }}
                  />
                </>
              )}
            </div>
          </DossierStudio>
        </State>
      </div>
      {remote &&
        (() => {
          const result = reconcileDraft(
            baseline.current,
            draft,
            remote,
            choices,
          );
          return (
            <Dialog
              wide
              title={
                <T
                  v={[
                    "Reconcile retained edits",
                    "Réconcilier les modifications conservées",
                    "تسوية التعديلات المحفوظة",
                  ]}
                />
              }
              onClose={() => setRemote(null)}
            >
              <p>
                <T
                  v={[
                    "Remote changes are preserved. Choose the source for each overlapping change before saving a new revision.",
                    "Les changements distants sont conservés. Choisissez la source de chaque conflit avant une nouvelle version.",
                    "يتم الحفاظ على التغييرات البعيدة. اختر مصدر كل تعارض قبل حفظ نسخة جديدة.",
                  ]}
                />
              </p>
              {result.conflicts.map((conflict) => (
                <div key={conflict.path} className={s.rowCard}>
                  <strong>{conflict.path}</strong>
                  <div className={s.scenarioGrid}>
                    {(["mine", "latest"] as const).map((choice) => (
                      <label key={choice}>
                        <input
                          type="radio"
                          name={conflict.path}
                          checked={choices[conflict.path] === choice}
                          onChange={() =>
                            setChoices((old) => ({
                              ...old,
                              [conflict.path]: choice,
                            }))
                          }
                        />
                        {choice}
                        <pre className={s.mono}>
                          {JSON.stringify(conflict[choice], null, 2)}
                        </pre>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <Button
                kind="primary"
                disabled={result.unresolved.length > 0}
                onClick={() => {
                  setDraft(result.record);
                  baseline.current = structuredClone(remote);
                  setRemote(null);
                  setDirty(true);
                  setError("");
                  saveReceipt.current = null;
                }}
              >
                <T
                  v={[
                    "Use reconciled draft",
                    "Utiliser le brouillon réconcilié",
                    "استخدام المسودة بعد التسوية",
                  ]}
                />
              </Button>
            </Dialog>
          );
        })()}
      {picker && (
        <Picker
          type={picker.type}
          kind={picker.kind}
          mime={picker.mime}
          onSelect={picker.set}
          onClose={() => setPicker(null)}
        />
      )}
    </Dialog>
  );
}
function History({
  id,
  onRestore,
}: {
  id: string;
  onRestore: (r: DceRecord) => void;
}) {
  const { locale, boot, notify, refresh, open } = useUI();
  const [page, setPage] = useState(1),
    [releasePage, setReleasePage] = useState(1);
  const q = useQuery<any>(
    { op: "history", id, page, releasePage },
    { versions: [], releases: [], usage: [], versionTotal: 0, releaseTotal: 0 },
  );
  async function act(action: string, z: any) {
    try {
      await mutate({ action, id: z.id });
      q.reload();
      await refresh();
      notify(
        tr(
          message(
            "Release state recorded.",
            "État de release enregistré.",
            "تم تسجيل حالة الإصدار.",
          ),
          locale,
        ),
      );
    } catch (e) {
      notify((e as Error).message, true);
    }
  }
  return (
    <State {...q} retry={q.reload}>
      <h3>
        <T
          v={["Release history", "Historique des releases", "سجل الإصدارات"]}
        />
      </h3>
      {q.value.releases.map((z: any) => (
        <div key={z.id} className={s.rowCard}>
          <Badge tone={z.state === "published" ? "green" : "orange"}>
            {z.state}
          </Badge>{" "}
          r{z.revision}
          <small>
            {new Date(z.scheduled_at || z.created_at).toLocaleString(locale)}
          </small>
          <div className={s.actions}>
            {z.state === "scheduled" && (
              <Button
                disabled={!boot.actor.rights.publish}
                onClick={() => act("cancel_release", z)}
              >
                <T v={["Cancel", "Annuler", "إلغاء"]} />
              </Button>
            )}
            {z.state === "published" && (
              <Button
                disabled={!boot.actor.rights.publish}
                onClick={() => act("withdraw_release", z)}
              >
                <T v={["Withdraw", "Retirer", "سحب"]} />
              </Button>
            )}
            {z.state === "withdrawn" && (
              <Button
                disabled={!boot.actor.rights.publish}
                onClick={() => act("restore_release", z)}
              >
                <T
                  v={[
                    "Restore release",
                    "Restaurer la release",
                    "استعادة الإصدار",
                  ]}
                />
              </Button>
            )}
          </div>
        </div>
      ))}
      <Pager
        page={releasePage}
        size={30}
        total={q.value.releaseTotal}
        onPage={setReleasePage}
      />
      <h3>
        <T v={["Draft versions", "Versions du dossier", "نسخ المسودة"]} />
      </h3>
      <div className={s.timeline}>
        {q.value.versions.map((v: any) => (
          <div key={v.id}>
            <strong>
              r{v.revision} · {v.actor_id}
            </strong>
            <small>{new Date(v.created_at).toLocaleString(locale)}</small>
            <Button
              disabled={!boot.actor.rights.manage}
              onClick={() => onRestore(v.snapshot)}
            >
              <T
                v={[
                  "Use as new draft",
                  "Utiliser comme nouveau brouillon",
                  "استخدم كمسودة جديدة",
                ]}
              />
            </Button>
          </div>
        ))}
      </div>
      <Pager
        page={page}
        size={50}
        total={q.value.versionTotal}
        onPage={setPage}
      />
      <h3 style={{ marginTop: 20 }}>
        <T v={["Referenced by", "Référencé par", "مشار إليه بواسطة"]} />
      </h3>
      {q.value.usage.map((u: any) => (
        <p key={u.record_id}>
          <Button onClick={() => open(u.record_id)}>
            {u.title || u.record_id}
          </Button>{" "}
          · {u.kind} · {u.target_type}
        </p>
      ))}
    </State>
  );
}

function ReferenceName({ type, id }: { type: string; id: string }) {
  const q = useQuery<{ title?: string }>({ op: "reference", type, id }, {});
  return (
    <div style={{ flex: 1, minWidth: 120 }}>
      <input
        readOnly
        aria-label="Selected reference"
        value={id ? q.value.title || "Unresolved reference" : "—"}
        style={{ width: "100%" }}
      />
      {id && (
        <details className={s.advanced}>
          <summary>
            <T
              v={["Reference details", "Détails de référence", "تفاصيل المرجع"]}
            />
          </summary>
          <code>{id}</code>
          {q.error && <p role="alert">{q.error}</p>}
        </details>
      )}
    </div>
  );
}
