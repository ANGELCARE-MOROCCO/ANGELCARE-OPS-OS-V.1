"use client";
import {
  lazy,
  Suspense,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { familyByKey } from "../registry";
import { validateRecord } from "../model";
import {
  dossierCapabilityIndex,
  GUIDED_STEPS,
  localizedCells,
  translatedPatch,
  SECTION_LABELS,
} from "../production-model";
import {
  array,
  object,
  text,
  tr,
  type Data,
  type DceRecord,
  type Locale,
  type Tri,
} from "../types";
import { Button, Badge, State, T, useQuery, useUI } from "./ui";
import p from "./production.module.css";
const RuntimePreview = lazy(() =>
  import("./Preview").then((m) => ({ default: m.RuntimePreview })),
);
const words = (en: string, fr: string, ar: string): Tri => [en, fr, ar];
export function DossierStudio({
  record,
  language,
  dirty,
  readOnly,
  busy,
  tabs,
  active,
  onNavigate,
  onLocate,
  onSave,
  onChange,
  children,
}: {
  record: Partial<DceRecord>;
  language: Locale;
  dirty: boolean;
  readOnly: boolean;
  busy: boolean;
  tabs: readonly (readonly [string, Tri])[];
  active: string;
  onNavigate: (key: string) => void;
  onLocate: (path: string) => void;
  onSave: () => Promise<DceRecord | undefined>;
  onChange: (patch: Data) => void;
  children: ReactNode;
}) {
  const { locale, preview, boot } = useUI(),
    id = useId();
  const [guided, setGuided] = useState(true),
    [inspector, setInspector] = useState("readiness"),
    [expanded, setExpanded] = useState(true),
    [search, setSearch] = useState(""),
    [legacy, setLegacy] = useState(false),
    [sourceLanguage, setSourceLanguage] = useState<Locale>("en"),
    [device, setDevice] = useState("desktop"),
    [languageSearch, setLanguageSearch] = useState(""),
    [languagePage, setLanguagePage] = useState(0);
  const family = familyByKey(
      record.family || (record.kind === "bundle" ? "bundles" : ""),
    ),
    data = object(record.data);
  const catalog = useMemo(
    () => dossierCapabilityIndex(record),
    [family?.key, record.kind],
  );
  const readiness = useQuery<any>(
    record.id &&
      ["experience", "content", "template", "bundle"].includes(
        record.kind || "",
      )
      ? {
          op: "master_readiness",
          id: record.id,
          locale: language,
          revision: record.revision,
        }
      : { op: "reference", type: "record" },
    { validation: null, bindings: {} },
  );
  const deferredRecord = useDeferredValue(record);
  const localValidation = useMemo(
    () => validateRecord(deferredRecord as DceRecord),
    [deferredRecord],
  );
  const validation =
    dirty || !record.id ? localValidation : readiness.value.validation;
  const issues = [
    ...(validation?.errors || []),
    ...(validation?.warnings || []),
  ];
  const visible = catalog.filter(
    (c) =>
      (legacy || c.status !== "legacy") &&
      (!search ||
        [c.path, ...c.label, c.group, c.kind]
          .join(" ")
          .toLocaleLowerCase()
          .includes(search.toLocaleLowerCase())),
  );
  const cells = useMemo(
      () => (inspector === "languages" ? localizedCells(record, family) : []),
      [record, family?.key, inspector],
    ),
    filteredCells = cells.filter(
      (c) =>
        !languageSearch ||
        [c.path, ...c.label, ...Object.values(c.values)]
          .join(" ")
          .toLowerCase()
          .includes(languageSearch.toLowerCase()),
    ),
    stage = GUIDED_STEPS.indexOf(active),
    canPreview = !!record.id && !dirty;
  const sectionOrder = [
    "overview",
    "content",
    "media",
    "experience",
    "design",
    "journey",
    "access",
    "delivery",
    "validation",
    "connections",
    "team",
    "history",
  ];
  const orderedTabs = [...tabs].sort(
    (a, b) => sectionOrder.indexOf(a[0]) - sectionOrder.indexOf(b[0]),
  );
  function navigate(key: string) {
    onNavigate(key);
  }
  useEffect(() => {
    if (!tabs.some(([key]) => key === active) && tabs[0])
      onNavigate(tabs[0][0]);
  }, [active, tabs.map((t) => t[0]).join("|")]);
  return (
    <div className={p.studio} data-inspector={expanded}>
      <div className={p.identity}>
        <div>
          <span className={p.eyebrow}>
            {tr(
              words(
                "CONTENT 360 · PRODUCTION STUDIO",
                "CONTENT 360 · STUDIO DE PRODUCTION",
                "CONTENT 360 · استوديو الإنتاج",
              ),
              locale,
            )}
          </span>
          <h2>
            {record.title ||
              tr(
                words(
                  "Your next experience",
                  "Votre prochaine expérience",
                  "تجربتك التالية",
                ),
                locale,
              )}
          </h2>
          <p>
            {family ? tr(family.name, locale) : record.kind} <span>·</span>{" "}
            {language.toUpperCase()} <span>·</span> r{record.revision || 0}
          </p>
        </div>
        <div className={p.identityActions}>
          <Badge tone={dirty ? "orange" : "green"}>
            {tr(
              dirty
                ? words(
                    "Unsaved changes",
                    "Modifications non enregistrées",
                    "تغييرات غير محفوظة",
                  )
                : words(
                    "Server revision saved",
                    "Version serveur enregistrée",
                    "نسخة الخادم محفوظة",
                  ),
              locale,
            )}
          </Badge>
          <Button disabled={busy || readOnly} kind="primary" onClick={onSave}>
            <T v={["Save draft", "Enregistrer", "حفظ المسودة"]} />
          </Button>
          <Button onClick={() => setExpanded((v) => !v)}>
            <T
              v={
                expanded
                  ? ["Focus editor", "Concentrer l’éditeur", "تركيز المحرر"]
                  : ["Show inspector", "Afficher l’inspecteur", "إظهار المفتش"]
              }
            />
          </Button>
        </div>
      </div>
      <div className={p.modebar}>
        <div className={p.segment}>
          <button
            type="button"
            aria-pressed={guided}
            onClick={() => setGuided(true)}
          >
            <T
              v={["Guided production", "Production guidée", "الإنتاج الموجه"]}
            />
          </button>
          <button
            type="button"
            aria-pressed={!guided}
            onClick={() => setGuided(false)}
          >
            <T v={["Complete workspace", "Espace complet", "مساحة كاملة"]} />
          </button>
        </div>
        <span>
          {tr(
            words(
              "One dossier. One saved revision. Native publishing.",
              "Un dossier. Une version enregistrée. Publication native.",
              "ملف واحد ونسخة محفوظة ونشر أصلي.",
            ),
            locale,
          )}
        </span>
      </div>
      {guided && (
        <nav
          className={p.steps}
          aria-label={tr(
            words("Production steps", "Étapes de production", "خطوات الإنتاج"),
            locale,
          )}
        >
          {GUIDED_STEPS.filter((key) => tabs.some(([k]) => k === key)).map(
            (key, i) => (
              <button
                key={key}
                type="button"
                aria-current={active === key ? "step" : undefined}
                onClick={() => navigate(key)}
              >
                <b>{i + 1}</b>
                <span>{tr(SECTION_LABELS[key], locale)}</span>
              </button>
            ),
          )}
        </nav>
      )}
      <div className={p.workgrid}>
        <nav
          className={p.sidebar}
          aria-label={tr(
            words("Dossier sections", "Sections du dossier", "أقسام الملف"),
            locale,
          )}
        >
          <span className={p.eyebrow}>
            <T v={["WORKSPACE", "ESPACE DE TRAVAIL", "مساحة العمل"]} />
          </span>
          <div
            role="tablist"
            aria-orientation="vertical"
            aria-label={tr(
              words(
                "All dossier sections",
                "Toutes les sections",
                "كل الأقسام",
              ),
              locale,
            )}
            onKeyDown={(event) => {
              if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key))
                return;
              const nodes = Array.from(
                event.currentTarget.querySelectorAll<HTMLButtonElement>(
                  "[role=tab]",
                ),
              );
              const index = nodes.indexOf(event.target as HTMLButtonElement);
              if (index < 0) return;
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? nodes.length - 1
                    : (index +
                        (event.key === "ArrowDown" ? 1 : -1) +
                        nodes.length) %
                      nodes.length;
              nodes[next]?.focus();
              nodes[next]?.click();
            }}
          >
            {orderedTabs.map(([key, label]) => (
              <button
                key={key}
                id={id + "-" + key}
                type="button"
                role="tab"
                aria-selected={active === key}
                aria-controls={id + "-editor"}
                tabIndex={active === key ? 0 : -1}
                onClick={() => navigate(key)}
              >
                {tr(SECTION_LABELS[key] || label, locale)}
                {key === "delivery" && issues.length > 0 && (
                  <small>{issues.length}</small>
                )}
              </button>
            ))}
          </div>
          <div className={p.sideNote}>
            <strong>
              {record.key ||
                tr(
                  words(
                    "Stable identity after save",
                    "Identité stable après enregistrement",
                    "هوية ثابتة بعد الحفظ",
                  ),
                  locale,
                )}
            </strong>
            {record.id && (
              <Button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(record.id!);
                  } catch {
                    setInspector("identity");
                    setExpanded(true);
                  }
                }}
              >
                <T
                  v={[
                    "Copy dossier ID",
                    "Copier l’identifiant",
                    "نسخ معرف الملف",
                  ]}
                />
              </Button>
            )}
            <p>
              <T
                v={[
                  "Sections stay available in either mode. Readiness is checked against the selected language.",
                  "Les sections restent accessibles dans les deux modes. La préparation suit la langue sélectionnée.",
                  "تبقى الأقسام متاحة في الوضعين ويتم التحقق وفق اللغة المحددة.",
                ]}
              />
            </p>
          </div>
        </nav>
        <section
          id={id + "-editor"}
          className={p.editor}
          role="tabpanel"
          aria-labelledby={id + "-" + active}
          tabIndex={-1}
        >
          {children}
          {guided && stage >= 0 && (
            <div className={p.nextStep}>
              <Button
                disabled={stage === 0}
                onClick={() => navigate(GUIDED_STEPS[Math.max(0, stage - 1)])}
              >
                <T
                  v={["Previous step", "Étape précédente", "الخطوة السابقة"]}
                />
              </Button>
              {stage < GUIDED_STEPS.length - 1 && (
                <Button
                  kind="primary"
                  disabled={busy || (readOnly && dirty)}
                  onClick={async () => {
                    if (dirty && !(await onSave())) return;
                    navigate(GUIDED_STEPS[stage + 1]);
                  }}
                >
                  <T
                    v={
                      dirty
                        ? [
                            "Save & continue",
                            "Enregistrer et continuer",
                            "حفظ ومتابعة",
                          ]
                        : [
                            "Continue preparation",
                            "Continuer la préparation",
                            "متابعة التحضير",
                          ]
                    }
                  />
                </Button>
              )}
            </div>
          )}
        </section>
        {expanded && (
          <aside
            className={p.inspector}
            aria-label={tr(
              words("Dossier inspector", "Inspecteur du dossier", "مفتش الملف"),
              locale,
            )}
          >
            <div className={p.inspectorTabs}>
              {[
                ["readiness", words("Readiness", "Préparation", "الجاهزية")],
                [
                  "capabilities",
                  words(
                    "Find a control",
                    "Trouver un réglage",
                    "البحث عن إعداد",
                  ),
                ],
                ["languages", words("Languages", "Langues", "اللغات")],
                ["preview", words("Preview", "Aperçu", "معاينة")],
              ].map(([key, label]) => (
                <button
                  key={key as string}
                  type="button"
                  aria-pressed={inspector === key}
                  onClick={() => setInspector(key as string)}
                >
                  {tr(label as Tri, locale)}
                </button>
              ))}
            </div>
            {inspector === "identity" && <code>{record.id}</code>}
            {inspector === "readiness" && (
              <>
                <h3>
                  <T
                    v={[
                      "What needs attention?",
                      "Que reste-t-il à préparer ?",
                      "ما الذي يحتاج إلى اهتمام؟",
                    ]}
                  />
                </h3>
                <p className={p.muted}>
                  {tr(
                    dirty || !record.id
                      ? words(
                          "Working-draft checks. Save to verify current file rights, references and edition readiness.",
                          "Contrôles du brouillon. Enregistrez pour vérifier les droits des fichiers, références et éditions.",
                          "فحوص المسودة. احفظ للتحقق من حقوق الملفات والمراجع وجاهزية النسخة.",
                        )
                      : words(
                          "Authoritative checks of the saved revision and selected language.",
                          "Contrôles natifs de la version enregistrée et de la langue sélectionnée.",
                          "فحوص أصلية للنسخة المحفوظة واللغة المحددة.",
                        ),
                    locale,
                  )}
                </p>
                {!dirty && record.id && (
                  <State {...readiness} retry={readiness.reload}>
                    <Button onClick={readiness.reload}>
                      <T
                        v={[
                          "Refresh checks",
                          "Actualiser les contrôles",
                          "تحديث الفحوص",
                        ]}
                      />
                    </Button>
                  </State>
                )}
                <div className={p.statusGrid}>
                  <div>
                    <strong>{validation?.errors.length ?? "—"}</strong>
                    <span>
                      <T v={["Blockers", "Blocages", "عوائق"]} />
                    </span>
                  </div>
                  <div>
                    <strong>{validation?.warnings.length ?? "—"}</strong>
                    <span>
                      <T v={["Warnings", "Avertissements", "تنبيهات"]} />
                    </span>
                  </div>
                </div>
                {issues.map((issue, i) => (
                  <button
                    className={p.issue}
                    key={issue.path + issue.code + i}
                    type="button"
                    onClick={() => onLocate(issue.path)}
                  >
                    <Badge
                      tone={issue.severity === "error" ? "pink" : "orange"}
                    >
                      {issue.code}
                    </Badge>
                    <strong>{tr(issue.message, locale)}</strong>
                    <code>{issue.path}</code>
                    <span>
                      <T
                        v={[
                          "Go to correction →",
                          "Aller à la correction →",
                          "الانتقال إلى التصحيح ←",
                        ]}
                      />
                    </span>
                  </button>
                ))}
                {validation && issues.length === 0 && (
                  <p className={p.success}>
                    <T
                      v={[
                        "No issue returned by these checks. Publication still follows the native review and edition controls.",
                        "Aucun problème retourné. La publication suit les contrôles natifs de revue et d’édition.",
                        "لم تظهر مشاكل في هذه الفحوص. يبقى النشر خاضعاً للمراجعة وأدوات النسخ الأصلية.",
                      ]}
                    />
                  </p>
                )}
                <Button
                  onClick={() =>
                    navigate(
                      tabs.some(([key]) => key === "delivery")
                        ? "delivery"
                        : "validation",
                    )
                  }
                >
                  <T
                    v={[
                      "Open review & publication",
                      "Ouvrir revue et publication",
                      "فتح المراجعة والنشر",
                    ]}
                  />
                </Button>
              </>
            )}
            {inspector === "capabilities" && (
              <>
                <h3>
                  <T
                    v={[
                      "Every supported control",
                      "Tous les réglages supportés",
                      "كل الإعدادات المدعومة",
                    ]}
                  />
                </h3>
                <input
                  type="search"
                  aria-label={tr(
                    words(
                      "Search capability",
                      "Rechercher un réglage",
                      "البحث عن إعداد",
                    ),
                    locale,
                  )}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={tr(
                    words(
                      "Search label, field or collection…",
                      "Libellé, champ ou collection…",
                      "العنوان أو الحقل أو المجموعة…",
                    ),
                    locale,
                  )}
                />
                <label className={p.check}>
                  <input
                    type="checkbox"
                    checked={legacy}
                    onChange={(e) => setLegacy(e.target.checked)}
                  />
                  <T
                    v={[
                      "Include legacy / unavailable definitions",
                      "Inclure les définitions anciennes / indisponibles",
                      "تضمين التعريفات القديمة أو غير المتاحة",
                    ]}
                  />
                </label>
                <p className={p.muted}>
                  {visible.length}{" "}
                  <T
                    v={[
                      "configuration entries, including shared definitions",
                      "entrées de configuration, définitions partagées incluses",
                      "إدخال إعداد بما فيها التعريفات المشتركة",
                    ]}
                  />
                </p>
                <div className={p.capabilities}>
                  {visible.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      disabled={entry.status === "legacy"}
                      onClick={() => onLocate(entry.path)}
                    >
                      <strong>{tr(entry.label, locale)}</strong>
                      <code>{entry.path}</code>
                      <small>
                        {entry.status === "legacy"
                          ? tr(
                              words(
                                "Legacy definition; not an active visitor feature",
                                "Définition ancienne ; fonction visiteur inactive",
                                "تعريف قديم وليس ميزة زائر فعالة",
                              ),
                              locale,
                            )
                          : tr(SECTION_LABELS[entry.section], locale)}{" "}
                        {entry.definition?.classification === "private" &&
                          " · 🔒"}
                      </small>
                    </button>
                  ))}
                </div>
              </>
            )}
            {inspector === "languages" && (
              <>
                <h3>
                  <T
                    v={[
                      "Compare authored languages",
                      "Comparer les langues rédigées",
                      "مقارنة اللغات المؤلفة",
                    ]}
                  />
                </h3>
                <p className={p.muted}>
                  <T
                    v={[
                      "Blank means not authored here. Copying text does not approve a translation.",
                      "Vide signifie non rédigé ici. Copier un texte ne valide pas sa traduction.",
                      "الفراغ يعني أنه لم يؤلف هنا. نسخ النص لا يعتمد الترجمة.",
                    ]}
                  />
                </p>
                <label>
                  <T v={["Source language", "Langue source", "اللغة المصدر"]} />
                  <select
                    value={sourceLanguage}
                    onChange={(e) =>
                      setSourceLanguage(e.target.value as Locale)
                    }
                  >
                    {["en", "fr", "ar"].map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </label>
                <input
                  aria-label={tr(
                    words(
                      "Find translated field",
                      "Trouver un champ traduit",
                      "البحث عن حقل مترجم",
                    ),
                    locale,
                  )}
                  value={languageSearch}
                  onChange={(e) => {
                    setLanguageSearch(e.target.value);
                    setLanguagePage(0);
                  }}
                  placeholder={tr(
                    words(
                      "Search text or content unit…",
                      "Chercher un texte ou une unité…",
                      "البحث عن نص أو وحدة محتوى…",
                    ),
                    locale,
                  )}
                />
                <p className={p.muted}>
                  {filteredCells.length}{" "}
                  <T
                    v={[
                      "translated field positions",
                      "emplacements de champs traduits",
                      "مواضع حقول مترجمة",
                    ]}
                  />
                </p>
                {filteredCells
                  .slice(languagePage * 20, languagePage * 20 + 20)
                  .map((cell) => (
                    <div className={p.languageRow} key={cell.path}>
                      <strong>{tr(cell.label, locale)}</strong>
                      <div dir={sourceLanguage === "ar" ? "rtl" : "ltr"}>
                        <small>{sourceLanguage.toUpperCase()}</small>
                        <p>{cell.values[sourceLanguage] || "—"}</p>
                      </div>
                      <div dir={language === "ar" ? "rtl" : "ltr"}>
                        <small>{language.toUpperCase()}</small>
                        <p>{cell.values[language] || "—"}</p>
                      </div>
                      <div className={p.inlineActions}>
                        <Button
                          onClick={() =>
                            onLocate("locales." + language + "." + cell.path)
                          }
                        >
                          <T v={["Edit", "Modifier", "تحرير"]} />
                        </Button>
                        <Button
                          disabled={
                            readOnly ||
                            busy ||
                            sourceLanguage === language ||
                            !cell.values[sourceLanguage]
                          }
                          onClick={() => {
                            if (
                              cell.values[language] &&
                              !confirm(
                                tr(
                                  words(
                                    "Replace this authored translation with source text?",
                                    "Remplacer cette traduction par le texte source ?",
                                    "استبدال هذه الترجمة بالنص المصدر؟",
                                  ),
                                  locale,
                                ),
                              )
                            )
                              return;
                            onChange(
                              translatedPatch(
                                data,
                                cell.path,
                                language,
                                cell.values[sourceLanguage],
                              ),
                            );
                          }}
                        >
                          <T
                            v={[
                              "Copy source",
                              "Copier la source",
                              "نسخ المصدر",
                            ]}
                          />
                        </Button>
                      </div>
                    </div>
                  ))}
                <div className={p.profileBar}>
                  <Button
                    disabled={languagePage === 0}
                    onClick={() => setLanguagePage((v) => v - 1)}
                  >
                    <T v={["Previous", "Précédent", "السابق"]} />
                  </Button>
                  <Button
                    disabled={(languagePage + 1) * 20 >= filteredCells.length}
                    onClick={() => setLanguagePage((v) => v + 1)}
                  >
                    <T v={["Next", "Suivant", "التالي"]} />
                  </Button>
                </div>
              </>
            )}
            {inspector === "preview" && (
              <>
                <h3>
                  <T
                    v={[
                      "Actual visitor components",
                      "Composants visiteurs réels",
                      "مكونات الزائر الفعلية",
                    ]}
                  />
                </h3>
                <p className={p.muted}>
                  <T
                    v={[
                      "Draft simulation. Only the protected saved preview resolves current native media and edition state.",
                      "Simulation du brouillon. L’aperçu enregistré résout les médias et l’édition actuels.",
                      "محاكاة المسودة. المعاينة المحفوظة فقط تحل الوسائط وحالة النسخة الحالية.",
                    ]}
                  />
                </p>
                <Button
                  disabled={!canPreview}
                  onClick={() => preview(record.id!, undefined, language)}
                >
                  <T
                    v={[
                      "Open protected saved preview",
                      "Ouvrir l’aperçu enregistré protégé",
                      "فتح المعاينة المحفوظة المحمية",
                    ]}
                  />
                </Button>
                <select
                  aria-label="Preview viewport"
                  value={device}
                  onChange={(e) => setDevice(e.target.value)}
                >
                  <option value="desktop">Desktop</option>
                  <option value="mobile">Mobile</option>
                </select>
                <div className={p.previewFrame} data-device={device}>
                  <Suspense fallback={<p>…</p>}>
                    <RuntimePreview
                      key={(record.id || "new") + language}
                      record={record as DceRecord}
                      locale={language}
                      device={device}
                      bindings={{}}
                    />
                  </Suspense>
                </div>
              </>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
