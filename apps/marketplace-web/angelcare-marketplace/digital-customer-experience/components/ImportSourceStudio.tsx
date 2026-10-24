"use client";
import { useEffect, useMemo, useState } from "react";
import {
  automaticMapping,
  inspectSource,
  mappedRows,
  MAPPING_VERSION,
  serializeMapping,
  validateProfile,
  type Mapping,
} from "../import-mapping";
import { csv, type ImportTask } from "../imports";
import { operatorTemplate } from "../operator-sheets";
import { tr, type Tri } from "../types";
import {
  Button,
  Badge,
  T,
  useQuery,
  useReceiptMutation,
  useUI,
  download,
} from "./ui";
import p from "./production.module.css";
export const TASK_LABELS: Record<string, Tri> = {
  create: ["Create dossiers", "Créer des dossiers", "إنشاء الملفات"],
  content: [
    "Add or update content",
    "Ajouter ou modifier le contenu",
    "إضافة المحتوى أو تحديثه",
  ],
  translations: [
    "Translate stable units",
    "Traduire les unités stables",
    "ترجمة الوحدات الثابتة",
  ],
  media: [
    "Associate existing media",
    "Associer les médias existants",
    "ربط الوسائط الموجودة",
  ],
  taxonomy: ["Classify resources", "Classer les ressources", "تصنيف الموارد"],
  journeys: [
    "Build learning pathways",
    "Construire les parcours",
    "بناء مسارات التعلم",
  ],
  access: ["Configure access", "Configurer les accès", "إعداد الوصول"],
  advertising: [
    "Configure advertising",
    "Configurer la publicité",
    "إعداد الإعلانات",
  ],
};
export function ImportSourceStudio({
  source,
  onSource,
  family,
  task,
  collection,
  busy,
  onReady,
}: {
  source: string;
  onSource: (value: string) => void;
  family: string;
  task: ImportTask;
  collection: string;
  busy: boolean;
  onReady: (value: string) => void;
}) {
  const { locale, boot } = useUI(),
    mutate = useReceiptMutation();
  const template = useMemo(
    () => operatorTemplate(family, task, collection),
    [family, task, collection],
  );
  const parsed = useMemo(() => {
    try {
      return { ...inspectSource(source), error: "" };
    } catch (e) {
      return {
        headers: [] as string[],
        rows: [] as string[][],
        error: (e as Error).message,
      };
    }
  }, [source]);
  const [mapping, setMapping] = useState<Mapping>({
      columns: {},
      constants: {},
    }),
    [page, setPage] = useState(0),
    [profileId, setProfileId] = useState(""),
    [profileRevision, setProfileRevision] = useState(0),
    [profileName, setProfileName] = useState(""),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false),
    [notice, setNotice] = useState(""),
    [prepared, setPrepared] = useState(false),
    [columnFilter, setColumnFilter] = useState("");
  const profiles = useQuery<any>(
    boot.actor.rights.manage
      ? { op: "operator_mapping_profiles", family, task, collection }
      : { op: "reference", type: "record" },
    { rows: [], total: 0 },
  );
  useEffect(() => {
    setMapping(automaticMapping(parsed.headers, template.guide.columns));
    setPage(0);
    setProfileId("");
    setPrepared(false);
    setError("");
    setNotice("");
  }, [family, task, collection, JSON.stringify(parsed.headers)]);
  useEffect(() => setPrepared(false), [source, mapping]);
  const canonical = useMemo(
    () =>
      mappedRows(parsed.headers, parsed.rows, template.guide.columns, mapping),
    [parsed, mapping, template],
  );
  const missingKeys = canonical.filter(
    (row) => !row[template.guide.columns.indexOf("key")]?.trim(),
  ).length;
  const selectedProfile = profiles.value.rows.find(
    (r: any) => r.id === profileId,
  );
  const mappedCount = template.guide.columns.filter(
    (c) => mapping.columns[c] || mapping.constants[c],
  ).length;
  function loadProfile(id: string) {
    setError("");
    try {
      const row = profiles.value.rows.find((r: any) => r.id === id);
      if (!row) return;
      const profile = validateProfile(row.profile);
      if (
        profile.headers.length !== parsed.headers.length ||
        profile.headers.some((h) => !parsed.headers.includes(h))
      )
        throw Error(
          tr(
            [
              "This profile uses different source columns.",
              "Ce profil utilise d’autres colonnes source.",
              "يستخدم هذا الملف أعمدة مصدر مختلفة.",
            ],
            locale,
          ),
        );
      setProfileId(id);
      setProfileRevision(row.revision);
      setProfileName(profile.title);
      setMapping(profile.mapping);
      setNotice(
        tr(
          [
            "Saved mapping loaded. Review before using it.",
            "Correspondance chargée. Vérifiez avant utilisation.",
            "تم تحميل الربط المحفوظ. راجعه قبل الاستخدام.",
          ],
          locale,
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function saveProfile() {
    setSaving(true);
    setError("");
    try {
      const profile = validateProfile({
        version: MAPPING_VERSION,
        title: profileName,
        family,
        task,
        collection,
        headers: parsed.headers,
        mapping,
      });
      const saved = await mutate<any>({
        action: "operator_mapping_save",
        ...(profileId
          ? {
              id: profileId,
              revision: profileRevision || selectedProfile?.revision,
            }
          : {}),
        profile,
      });
      if (saved.record?.id) {
        setProfileId(saved.record.id);
        setProfileRevision(saved.record.revision);
      }
      profiles.reload();
      setNotice(
        tr(
          [
            "Mapping saved to your scoped staff account.",
            "Correspondance enregistrée dans votre compte professionnel et périmètre.",
            "تم حفظ الربط في حساب الموظف ونطاقه.",
          ],
          locale,
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <section
      className={p.importStudio}
      aria-label={tr(
        [
          "Import source preparation",
          "Préparation de la source",
          "تحضير مصدر الاستيراد",
        ],
        locale,
      )}
    >
      <span className={p.eyebrow}>IMPORT STUDIO</span>
      <h3>{tr(TASK_LABELS[task], locale)}</h3>
      <p className={p.muted}>
        <T
          v={[
            "Inspect the source, map its columns, correct cells and prepare canonical CSV. Native server planning verifies references and revisions before a draft can be applied.",
            "Inspectez la source, associez les colonnes et corrigez les cellules. La planification serveur vérifie les références et versions avant application du brouillon.",
            "افحص المصدر واربط الأعمدة وصحح الخلايا. يتحقق تخطيط الخادم من المراجع والمراجعات قبل تطبيق المسودة.",
          ]}
        />
      </p>
      <div className={p.pipeline}>
        {[
          ["Source", "Source", "المصدر"],
          ["Inspect & map", "Inspecter et associer", "الفحص والربط"],
          ["Correct", "Corriger", "التصحيح"],
          ["Prepare", "Préparer", "التحضير"],
          ["Native validation", "Validation native", "التحقق الأصلي"],
          ["Apply drafts", "Appliquer les brouillons", "تطبيق المسودات"],
        ].map((label, i) => (
          <span key={i}>
            {i + 1} · {tr(label as unknown as Tri, locale)}
          </span>
        ))}
      </div>
      <details>
        <summary>
          <T
            v={[
              "Paste or inspect source CSV",
              "Coller ou inspecter le CSV source",
              "لصق ملف CSV أو فحصه",
            ]}
          />
        </summary>
        <textarea
          aria-label="Source CSV text"
          rows={7}
          style={{ width: "100%" }}
          value={source}
          disabled={busy}
          onChange={(e) => onSource(e.target.value)}
        />
      </details>
      <details>
        <summary>
          <T
            v={[
              "Template, example and column guide",
              "Modèle, exemple et guide des colonnes",
              "النموذج والمثال ودليل الأعمدة",
            ]}
          />
        </summary>
        <p className={p.muted}>
          <T
            v={[
              "Stable keys identify resources and content units. Updates require the exact saved revision.",
              "Les clés stables identifient ressources et unités. Les mises à jour exigent la version enregistrée exacte.",
              "تحدد المفاتيح الثابتة الموارد ووحدات المحتوى. تتطلب التحديثات المراجعة المحفوظة الدقيقة.",
            ]}
          />
        </p>
        <p className={p.muted}>
          <T
            v={[
              "Blank update cells preserve existing data. __CLEAR__ explicitly clears an eligible optional value.",
              "Les cellules vides conservent les données. __CLEAR__ efface explicitement une valeur facultative autorisée.",
              "تحافظ خلايا التحديث الفارغة على البيانات. تمسح __CLEAR__ قيمة اختيارية مسموحة صراحة.",
            ]}
          />
        </p>
        <p className={p.muted}>
          <T
            v={[
              "Upload files first. Use a native UUID, exact unique filename or sha256 checksum. Ambiguous matches remain blocked.",
              "Téléversez d’abord les fichiers. Utilisez un UUID natif, un nom exact unique ou un checksum sha256. Les correspondances ambiguës restent bloquées.",
              "ارفع الملفات أولاً. استخدم معرف UUID أصلياً أو اسم ملف فريداً مطابقاً أو بصمة sha256. تبقى المطابقات الغامضة محظورة.",
            ]}
          />
        </p>
        <div className={p.profileBar}>
          <Button
            onClick={() =>
              download(
                template.fileName,
                template.csv,
                "text/csv;charset=utf-8",
              )
            }
          >
            <T
              v={[
                "Download template",
                "Télécharger le modèle",
                "تنزيل النموذج",
              ]}
            />
          </Button>
          <Button
            onClick={() =>
              download(
                template.fileName.replace(".csv", "-EXAMPLE.csv"),
                template.exampleCsv,
                "text/csv;charset=utf-8",
              )
            }
          >
            <T
              v={["Download example", "Télécharger l’exemple", "تنزيل المثال"]}
            />
          </Button>
          <Button
            onClick={() =>
              download(
                template.fileName.replace(".csv", "-GUIDE.md"),
                template.guideMarkdown,
                "text/markdown;charset=utf-8",
              )
            }
          >
            <T v={["Download guide", "Télécharger le guide", "تنزيل الدليل"]} />
          </Button>
        </div>
        <div className={p.tableScroll}>
          <table className={p.dataTable}>
            <thead>
              <tr>
                <th>
                  <T v={["Field", "Champ", "الحقل"]} />
                </th>
                <th>
                  <T v={["Meaning", "Signification", "المعنى"]} />
                </th>
                <th>
                  <T v={["Rules", "Règles", "القواعد"]} />
                </th>
              </tr>
            </thead>
            <tbody>
              {template.guide.fields.map((f) => (
                <tr key={f.key}>
                  <td>{f.key}</td>
                  <td>{tr(f.label, locale)}</td>
                  <td>
                    {f.type} ·{" "}
                    {f.required
                      ? tr(["Required", "Obligatoire", "مطلوب"], locale)
                      : tr(["Optional", "Facultatif", "اختياري"], locale)}{" "}
                    · {f.options?.join(", ")} {f.mime?.join(", ")} {f.reference}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      {source && parsed.error && <p role="alert">{parsed.error}</p>}
      {!!parsed.headers.length && (
        <>
          <div className={p.statusGrid}>
            <div>
              <strong>{parsed.rows.length}</strong>
              <span>
                <T v={["Source rows", "Lignes source", "صفوف المصدر"]} />
              </span>
            </div>
            <div>
              <strong>
                {mappedCount}/{template.guide.columns.length}
              </strong>
              <span>
                <T
                  v={["Mapped targets", "Cibles associées", "الوجهات المرتبطة"]}
                />
              </span>
            </div>
          </div>
          <div className={p.profileBar}>
            <select
              aria-label={tr(
                [
                  "Saved mapping profile",
                  "Profil de correspondance",
                  "ملف الربط المحفوظ",
                ],
                locale,
              )}
              value={profileId}
              onChange={(e) => loadProfile(e.target.value)}
              disabled={busy || saving}
            >
              <option value="">
                <T
                  v={[
                    "Choose a saved mapping",
                    "Choisir une correspondance",
                    "اختيار ربط محفوظ",
                  ]}
                />
              </option>
              {profiles.value.rows.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
            <input
              aria-label={tr(
                ["Mapping profile name", "Nom du profil", "اسم ملف الربط"],
                locale,
              )}
              value={profileName}
              maxLength={100}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder={tr(
                [
                  "Name this reusable mapping",
                  "Nommer cette correspondance",
                  "تسمية هذا الربط",
                ],
                locale,
              )}
            />
            <Button
              disabled={
                !profileName.trim() ||
                busy ||
                saving ||
                !boot.actor.rights.manage
              }
              onClick={saveProfile}
            >
              <T
                v={[
                  "Save mapping",
                  "Enregistrer la correspondance",
                  "حفظ الربط",
                ]}
              />
            </Button>
            {profileId && (
              <Button
                onClick={() => {
                  setProfileId("");
                  setProfileName("");
                }}
              >
                <T v={["New profile", "Nouveau profil", "ملف جديد"]} />
              </Button>
            )}
          </div>
          {profiles.error && <p role="alert">{profiles.error}</p>}
          <label>
            <T
              v={[
                "Find a target column",
                "Trouver une colonne cible",
                "البحث عن عمود هدف",
              ]}
            />
            <input
              value={columnFilter}
              onChange={(e) => setColumnFilter(e.target.value)}
            />
          </label>
          <div className={p.mappingGrid}>
            {template.guide.columns
              .filter(
                (c) =>
                  !columnFilter ||
                  c.toLowerCase().includes(columnFilter.toLowerCase()),
              )
              .map((target) => (
                <div className={p.mappingRow} key={target}>
                  <div>
                    <code>{target}</code>
                    {target === "key" && (
                      <Badge>
                        <T
                          v={[
                            "Required identity",
                            "Identité requise",
                            "هوية مطلوبة",
                          ]}
                        />
                      </Badge>
                    )}
                  </div>
                  <select
                    aria-label={target + " source column"}
                    disabled={busy}
                    value={mapping.columns[target] || ""}
                    onChange={(e) =>
                      setMapping((m) => ({
                        ...m,
                        columns: { ...m.columns, [target]: e.target.value },
                      }))
                    }
                  >
                    <option value="">
                      <T
                        v={[
                          "Unmapped / constant",
                          "Non associé / constante",
                          "غير مرتبط / ثابت",
                        ]}
                      />
                    </option>
                    {parsed.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <input
                    disabled={busy || !!mapping.columns[target]}
                    aria-label={target + " constant"}
                    placeholder={tr(
                      [
                        "Optional constant",
                        "Constante facultative",
                        "قيمة ثابتة اختيارية",
                      ],
                      locale,
                    )}
                    value={mapping.constants[target] || ""}
                    onChange={(e) =>
                      setMapping((m) => ({
                        ...m,
                        constants: { ...m.constants, [target]: e.target.value },
                      }))
                    }
                  />
                </div>
              ))}
          </div>
          <h4>
            <T
              v={[
                "Correct source cells",
                "Corriger les cellules source",
                "تصحيح خلايا المصدر",
              ]}
            />
          </h4>
          <p className={p.muted}>
            <T
              v={[
                "Changes remain in this preparation until you save a native batch. Unmapped source columns will not be imported.",
                "Les modifications restent dans cette préparation jusqu’à l’enregistrement d’un lot natif. Les colonnes non associées ne sont pas importées.",
                "تبقى التغييرات في هذا التحضير حتى حفظ دفعة أصلية. لن تستورد الأعمدة غير المرتبطة.",
              ]}
            />
          </p>
          <div className={p.tableScroll}>
            <table className={p.dataTable}>
              <thead>
                <tr>
                  <th>#</th>
                  {parsed.headers.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.rows
                  .slice(page * 10, page * 10 + 10)
                  .map((row, index) => (
                    <tr key={page * 10 + index}>
                      <td>{page * 10 + index + 2}</td>
                      {parsed.headers.map((h, column) => (
                        <td key={h}>
                          <input
                            aria-label={h + " row " + (page * 10 + index + 2)}
                            value={row[column] || ""}
                            disabled={busy}
                            onChange={(e) => {
                              const rows = parsed.rows.map((r) => [...r]);
                              rows[page * 10 + index][column] = e.target.value;
                              onSource(csv([parsed.headers, ...rows]));
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className={p.profileBar}>
            <Button disabled={page === 0} onClick={() => setPage((v) => v - 1)}>
              <T
                v={["Previous rows", "Lignes précédentes", "الصفوف السابقة"]}
              />
            </Button>
            <span>
              {Math.min(page * 10 + 1, parsed.rows.length)}–
              {Math.min((page + 1) * 10, parsed.rows.length)} /{" "}
              {parsed.rows.length}
            </span>
            <Button
              disabled={(page + 1) * 10 >= parsed.rows.length}
              onClick={() => setPage((v) => v + 1)}
            >
              <T v={["Next rows", "Lignes suivantes", "الصفوف التالية"]} />
            </Button>
          </div>
          <details>
            <summary>
              <T
                v={[
                  "Preview mapped output",
                  "Aperçu des données associées",
                  "معاينة المخرجات المرتبطة",
                ]}
              />
            </summary>
            <div className={p.tableScroll}>
              <table className={p.dataTable}>
                <thead>
                  <tr>
                    {template.guide.columns.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {canonical.slice(page * 10, page * 10 + 10).map((r, i) => (
                    <tr key={i}>
                      {r.map((cell, j) => (
                        <td key={j}>{cell || "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          {!!missingKeys && (
            <p role="status">
              {missingKeys}{" "}
              <T
                v={[
                  "rows still need a mapped stable key.",
                  "lignes nécessitent encore une clé stable associée.",
                  "صفوف لا تزال تحتاج إلى مفتاح ثابت مرتبط.",
                ]}
              />
            </p>
          )}
          <Button
            kind="primary"
            disabled={busy || !parsed.rows.length || missingKeys > 0}
            onClick={() => {
              try {
                const value = serializeMapping(
                  source,
                  family,
                  task,
                  collection,
                  mapping,
                );
                setError("");
                setPrepared(true);
                onReady(value);
                setNotice(
                  tr(
                    [
                      "Canonical source prepared. Save a resumable batch below for native validation.",
                      "Source canonique préparée. Enregistrez le lot reprenable ci-dessous pour la validation native.",
                      "تم تحضير المصدر الأصلي. احفظ دفعة قابلة للاستئناف أدناه للتحقق الأصلي.",
                    ],
                    locale,
                  ),
                );
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <T
              v={[
                "Use mapped source",
                "Utiliser la source associée",
                "استخدام المصدر المرتبط",
              ]}
            />
          </Button>
          {prepared && (
            <Badge tone="green">
              <T
                v={[
                  "Mapped source prepared",
                  "Source associée préparée",
                  "تم تحضير المصدر المرتبط",
                ]}
              />
            </Badge>
          )}
        </>
      )}
      {error && <p role="alert">{error}</p>}
      {notice && (
        <p role="status" className={p.success}>
          {notice}
        </p>
      )}
    </section>
  );
}
