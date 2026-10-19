"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { FAMILIES } from "../registry";
import {
  array,
  object,
  text,
  tr,
  BASE,
  type Data,
  type DceRecord,
  type Locale,
} from "../types";
import { Picker } from "./Editor";
import {
  Badge,
  Button,
  Field,
  Panel,
  Pager,
  State,
  T,
  useUI,
  useQuery,
  useReceiptMutation,
  useWorkingState,
} from "./ui";
import s from "./workspace.module.css";
export function FeatureReadiness() {
  const { boot } = useUI(),
    features = object(boot.health.features);
  return (
    <Panel
      title={
        <T
          v={["Feature readiness", "Activation par fonction", "جاهزية الوظائف"]}
        />
      }
    >
      <div className={s.formGrid}>
        {[
          ["core", "Core library · 01/04/06"],
          ["production", "Production/reviews · 08"],
          ["editions", "Language editions · 11"],
          ["certificates", "Certificate reception · 11"],
          ["operatorBatches", "Operator strengthening · 13"],
        ].map(([key, label]) => (
          <div className={s.rowCard} key={key}>
            <strong>{label}</strong>
            <Badge tone={features[key] === true ? "green" : "orange"}>
              {features[key] === true
                ? "SQL available"
                : "SQL activation pending"}
            </Badge>
          </div>
        ))}
      </div>
      <p className={s.subtitle}>
        <T
          v={[
            "SQL availability does not assert configured processors, provider approval, live serving or deployment. Apply activation files separately; this screen never runs SQL.",
            "La présence SQL ne prouve ni processeur configuré, ni approbation fournisseur, ni diffusion. Activation séparée ; cet écran ne lance aucun SQL.",
            "وجود SQL لا يثبت إعداد المعالجة أو موافقة المزوّد أو النشر. التفعيل منفصل ولا ينفذ هذا العرض SQL.",
          ]}
        />
      </p>
    </Panel>
  );
}
export function BatchProgress({
  id,
  onJob,
}: {
  id: string;
  onJob: (id: string) => void;
}) {
  const { boot, notify, locale } = useUI(),
    [page, setPage] = useState(1),
    q = useQuery<any>(
      { op: "operator_batch", id, page },
      { batch: null, rows: [], total: 0 },
    ),
    [busy, setBusy] = useState(false),
    mutate = useReceiptMutation(),
    [running, setRunning] = useState(false),
    runRef = useRef(false);
  const b = q.value.batch;
  useEffect(
    () => () => {
      runRef.current = false;
    },
    [id],
  );
  async function run() {
    if (runRef.current) return;
    runRef.current = true;
    setRunning(true);
    try {
      while (runRef.current) {
        const r = await mutate({ action: "depth_run_batch", id });
        q.reload();
        if (!["preparing", "applying"].includes(text(object(r.batch).state)))
          break;
      }
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      runRef.current = false;
      setRunning(false);
    }
  }
  async function act(operation: string) {
    if (!b) return;
    setBusy(true);
    try {
      await mutate({
        action: "operator_batch",
        id,
        revision: b.revision,
        operation,
      });
      q.reload();
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Panel
      title={
        <T
          v={[
            "Saved preparation and execution",
            "Préparation et exécution enregistrées",
            "التحضير والتنفيذ المحفوظان",
          ]}
        />
      }
      actions={
        <Button onClick={q.reload} icon="RefreshCw">
          <T v={["Refresh", "Actualiser", "تحديث"]} />
        </Button>
      }
    >
      <State {...q} retry={q.reload}>
        {b && (
          <>
            <div className={s.rowCard}>
              <strong>{b.source_name}</strong>
              <Badge>{b.state}</Badge>
              <span>
                {b.cursor}/{b.total}{" "}
                <T
                  v={[
                    "resources prepared",
                    "ressources préparées",
                    "موارد محضّرة",
                  ]}
                />
              </span>
            </div>
            <div className={s.progress}>
              <i
                style={{ width: (100 * b.cursor) / Math.max(1, b.total) + "%" }}
              />
            </div>
            <p className={s.subtitle}>
              <T
                v={[
                  "Continue handles one bounded checkpoint. Run advances saved checkpoints while this page is open; Stop or leaving pauses further requests, and reopening restores the saved cursor. Drafts only; edition review and publication remain separate.",
                  "Continuer traite un point borné. Exécuter avance les points enregistrés tant que la page reste ouverte ; quitter arrête les prochaines requêtes. La reprise garde le curseur enregistré. Brouillons uniquement ; revue et publication séparées.",
                  "تعالج المتابعة نقطة حفظ محدودة. يواصل التشغيل النقاط المحفوظة أثناء فتح الصفحة؛ المغادرة توقف الطلبات التالية مع حفظ موضع الاستئناف. مسودات فقط والمراجعة والنشر منفصلان.",
                ]}
              />
            </p>
            <div className={s.actions}>
              {["preparing", "applying"].includes(b.state) && (
                <>
                  <Button
                    disabled={busy || running || !boot.actor.rights.manage}
                    onClick={() => void run()}
                  >
                    <T
                      v={[
                        "Run saved batch",
                        "Exécuter le lot enregistré",
                        "تشغيل الدفعة المحفوظة",
                      ]}
                    />
                  </Button>
                  {running && (
                    <Button
                      onClick={() => {
                        runRef.current = false;
                        setRunning(false);
                      }}
                    >
                      <T
                        v={[
                          "Stop after current checkpoint",
                          "Arrêter après le point courant",
                          "توقف بعد نقطة الحفظ الحالية",
                        ]}
                      />
                    </Button>
                  )}
                  <Button
                    kind="primary"
                    disabled={busy || running || !boot.actor.rights.manage}
                    onClick={() => act("continue")}
                  >
                    <T
                      v={[
                        "Continue next checkpoint",
                        "Continuer le prochain lot",
                        "متابعة نقطة الحفظ التالية",
                      ]}
                    />
                  </Button>
                  <Button disabled={busy} onClick={() => act("pause")}>
                    <T v={["Pause", "Suspendre", "إيقاف مؤقت"]} />
                  </Button>
                </>
              )}
              {b.state === "paused" && (
                <Button disabled={busy} onClick={() => act("resume")}>
                  <T v={["Resume", "Reprendre", "استئناف"]} />
                </Button>
              )}
              {["prepared", "complete"].includes(b.state) && (
                <Button
                  disabled={busy || !boot.actor.rights.manage}
                  onClick={() => {
                    if (
                      confirm(
                        tr(
                          [
                            "Apply reviewed ready drafts? Invalid/conflicting rows remain for correction.",
                            "Appliquer les brouillons prêts revus ? Les erreurs restent à corriger.",
                            "تطبيق المسودات الجاهزة بعد المراجعة؟ تبقى الأخطاء للتصحيح.",
                          ],
                          locale,
                        ),
                      )
                    )
                      act("apply");
                  }}
                >
                  <T
                    v={[
                      "Start draft application",
                      "Démarrer l’application des brouillons",
                      "بدء تطبيق المسودات",
                    ]}
                  />
                </Button>
              )}
            </div>
            <div className={s.modePills}>
              {Object.entries(q.value.counts || {}).map(([state, count]) => (
                <Badge key={state}>
                  {state}: {Number(count)}
                </Badge>
              ))}
            </div>
            {b.state === "complete" && (
              <p className={s.notice}>
                <T
                  v={[
                    "Ready drafts processed. Invalid or conflicting lines remain available for correction; completion does not assert publication.",
                    "Les brouillons prêts sont traités. Les lignes invalides ou en conflit restent à corriger ; cet état ne signifie pas publication.",
                    "تمت معالجة المسودات الجاهزة. تبقى الصفوف غير الصالحة والمتعارضة للتصحيح ولا يعني الاكتمال النشر.",
                  ]}
                />
              </p>
            )}
            {b.error && <p role="alert">{b.error}</p>}
            <div className={s.helpList}>
              {q.value.rows.map((j: any) => (
                <div key={j.id}>
                  <strong>{j.source_name}</strong>
                  <Badge>{j.state}</Badge>
                  <Button onClick={() => onJob(j.id)}>
                    <T
                      v={[
                        "Review rows, dependencies and receipts",
                        "Revoir lignes, dépendances et reçus",
                        "مراجعة الصفوف والاعتماديات والإيصالات",
                      ]}
                    />
                  </Button>
                </div>
              ))}
            </div>
            <Pager
              page={page}
              total={q.value.total}
              size={30}
              onPage={setPage}
            />
          </>
        )}
      </State>
    </Panel>
  );
}
export function CoverageCockpit() {
  const { boot, locale, create } = useUI(),
    [family, setFamily] = useWorkingState("coverage.family", "documents"),
    [audience, setAudience] = useWorkingState("coverage.audience", ""),
    [topic, setTopic] = useWorkingState("coverage.topic", ""),
    [age, setAge] = useWorkingState("coverage.age", ""),
    q = useQuery<any>(
      { op: "operator_coverage", family, audience, topic, age },
      { rows: [] },
    );
  return (
    <Panel
      title={
        <T
          v={[
            "Editorial population coverage",
            "Couverture de population éditoriale",
            "تغطية المحتوى التحريري",
          ]}
        />
      }
      subtitle={
        <T
          v={[
            "Topic × family × audience/age × independent language. Counts show supplied inventory, not invented demand.",
            "Thème × famille × public/âge × langue indépendante. Comptes de l’inventaire réel, sans demande inventée.",
            "موضوع × عائلة × جمهور/عمر × لغة مستقلة. أعداد المخزون الفعلي وليست طلباً مفترضاً.",
          ]}
        />
      }
    >
      <div className={s.toolbar}>
        <Field label={<T v={["Family", "Famille", "العائلة"]} />}>
          <select value={family} onChange={(e) => setFamily(e.target.value)}>
            {FAMILIES.map((f) => (
              <option key={f.key} value={f.key}>
                {tr(f.name, locale)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={<T v={["Topic", "Thème", "الموضوع"]} />}>
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="">All</option>
            {boot.topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label={<T v={["Audience", "Public", "الجمهور"]} />}>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
          >
            <option value="">All</option>
            {["child", "parent", "educator", "professional", "school"].map(
              (a) => (
                <option key={a}>{a}</option>
              ),
            )}
          </select>
        </Field>
        <Field
          label={
            <T v={["Age · optional", "Âge · facultatif", "العمر · اختياري"]} />
          }
        >
          <input
            type="number"
            min="0"
            max="120"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </Field>
      </div>
      <State {...q} retry={q.reload}>
        <div className={s.tableScroll}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Topic / audience</th>
                <th>Edition</th>
                <th>Working dossiers</th>
                <th>Enabled</th>
                <th>Approved snapshot*</th>
                <th>Live</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {["ar", "fr", "en"].flatMap((l) => {
                const rows = q.value.rows.filter((r: any) => r.locale === l);
                return (
                  rows.length
                    ? rows
                    : [
                        {
                          locale: l,
                          topicTitle: "No matching resources",
                          authored: 0,
                          enabled: 0,
                          approved: 0,
                          live: 0,
                        },
                      ]
                ).map((r: any, i: number) => (
                  <tr key={l + i}>
                    <td>
                      {r.topicTitle}
                      <small>{r.audience || audience}</small>
                    </td>
                    <td>{l.toUpperCase()}</td>
                    <td>{r.authored}</td>
                    <td>{r.enabled}</td>
                    <td>{r.approved}</td>
                    <td>
                      <Badge tone={r.live ? "green" : "orange"}>{r.live}</Badge>
                    </td>
                    <td>
                      <Button
                        disabled={!boot.actor.rights.manage}
                        onClick={() =>
                          create("experience", family, {
                            topic: topic || r.topic || null,
                            audience: audience || r.audience || "parent",
                            data: {
                              enabledLocales: [l],
                              defaultLocale: l,
                              ...(age
                                ? { ageMin: Number(age), ageMax: Number(age) }
                                : {}),
                            },
                          })
                        }
                      >
                        <T v={["Create here", "Créer ici", "إنشاء هنا"]} />
                      </Button>
                      <a
                        href={
                          BASE +
                          "/imports?family=" +
                          family +
                          (topic ? "&topic=" + topic : "") +
                          "&locale=" +
                          l
                        }
                      >
                        CSV
                      </a>
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
        <p className={s.subtitle}>
          *{" "}
          <T
            v={[
              "Approval counts describe saved review snapshots. Open an edition to check whether its current working content still matches. Draft/live totals are independent, not additive.",
              "Les comptes d’approbation décrivent les instantanés revus. Ouvrez l’édition pour vérifier sa correspondance avec le contenu actuel. Brouillons et publications ne sont pas additionnables.",
              "تمثل أعداد الموافقات النسخ المراجعة المحفوظة. افتح الإصدار للتحقق من مطابقته للمحتوى الحالي. أعداد المسودات والمنشور مستقلة.",
            ]}
          />
        </p>
      </State>
    </Panel>
  );
}
const mediaKeys = [
  "assetId",
  "coverAssetId",
  "posterAssetId",
  "backAssetId",
  "narrationAssetId",
  "captionAssetId",
];
export function EditionMedia({
  record,
  language,
  onChange,
  readOnly,
}: {
  record: Partial<DceRecord>;
  language: Locale;
  onChange: (p: Data) => void;
  readOnly: boolean;
}) {
  const [choice, setChoice] = useState<{
      part: string;
      id: string;
      field: string;
    } | null>(null),
    { locale } = useUI(),
    d = object(record.data),
    f = FAMILIES.find((f) => f.key === record.family),
    rows = [
      {
        part: "root",
        unit: d,
        fields: ["coverAssetId", "posterAssetId", "narrationAssetId"],
      },
      ...(f?.collections || [])
        .filter((c) => c.key !== "outputs")
        .flatMap((c) =>
          array(d[c.key]).map((unit) => ({
            part: c.key,
            unit,
            fields: c.fields
              .filter((x) => mediaKeys.includes(x.key))
              .map((x) => x.key),
          })),
        ),
    ];
  function update(
    part: string,
    id: string,
    field: string,
    value: string | null,
  ) {
    const patch = (u: Data) => {
      const locales = { ...object(u.locales) },
        selected = { ...object(locales[language]) };
      if (value === null) delete selected[field];
      else selected[field] = value;
      locales[language] = selected;
      return { ...u, locales };
    };
    onChange(
      part === "root"
        ? { locales: patch(d).locales }
        : { [part]: array(d[part]).map((u) => (u.id === id ? patch(u) : u)) },
    );
  }
  return (
    <Panel
      title={
        <T
          v={[
            "Files for this language edition",
            "Fichiers de cette édition linguistique",
            "ملفات هذا الإصدار اللغوي",
          ]}
        />
      }
      subtitle={`${language.toUpperCase()} · ${tr(["Shared defaults remain unchanged. Explicit language files affect only this edition. Output files are controlled under Actions & outputs.", "Les fichiers partagés restent inchangés. Les variantes ne modifient que cette langue. Les téléchargements se règlent dans Actions et sorties.", "تبقى الملفات المشتركة دون تغيير. تؤثر النسخ الخاصة على هذه اللغة فقط. ملفات التنزيل في الإجراءات والمخرجات."], locale)}`}
    >
      <div className={s.helpList}>
        {rows.map(({ part, unit, fields }) =>
          fields.length ? (
            <div key={part + text(unit.id)}>
              <strong>
                {part === "root"
                  ? record.title
                  : text(unit.title) ||
                    text(unit.prompt) ||
                    text(unit.front) ||
                    text(unit.id)}
              </strong>
              {fields.map((field) => {
                const explicit = object(object(unit.locales)[language])[field];
                return (
                  <div className={s.rowCard} key={field}>
                    <span>
                      {tr(
                        (
                          {
                            assetId: [
                              "Main file",
                              "Fichier principal",
                              "الملف الرئيسي",
                            ],
                            coverAssetId: [
                              "Cover illustration",
                              "Image de couverture",
                              "صورة الغلاف",
                            ],
                            posterAssetId: [
                              "Video poster",
                              "Affiche vidéo",
                              "صورة الفيديو",
                            ],
                            backAssetId: [
                              "Reverse illustration",
                              "Image du verso",
                              "صورة الخلف",
                            ],
                            narrationAssetId: [
                              "Narration",
                              "Narration",
                              "التعليق الصوتي",
                            ],
                            captionAssetId: [
                              "Caption file",
                              "Fichier de sous-titres",
                              "ملف الترجمة",
                            ],
                          } as Record<string, any>
                        )[field] || [field, field, field],
                        locale,
                      )}
                    </span>
                    <Badge tone={explicit ? "green" : "blue"}>
                      {explicit ? language.toUpperCase() : "Shared fallback"}
                    </Badge>
                    <FileName id={text(explicit || unit[field])} />
                    <Button
                      disabled={readOnly}
                      onClick={() =>
                        setChoice({ part, id: text(unit.id), field })
                      }
                    >
                      <T
                        v={[
                          "Choose language file",
                          "Choisir le fichier de langue",
                          "اختيار ملف اللغة",
                        ]}
                      />
                    </Button>
                    {explicit && (
                      <Button
                        disabled={readOnly}
                        onClick={() => update(part, text(unit.id), field, null)}
                      >
                        <T
                          v={[
                            "Use shared default",
                            "Utiliser le fichier partagé",
                            "استخدام الملف المشترك",
                          ]}
                        />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null,
        )}
      </div>
      {choice && (
        <Picker
          type="media"
          mime={
            choice.field.includes("narration")
              ? ["audio/"]
              : choice.field.includes("caption")
                ? ["text/vtt"]
                : choice.field.includes("cover") ||
                    choice.field.includes("poster") ||
                    choice.field.includes("back")
                  ? ["image/"]
                  : undefined
          }
          onClose={() => setChoice(null)}
          onSelect={(id) => {
            update(choice.part, choice.id, choice.field, id);
            setChoice(null);
          }}
        />
      )}
    </Panel>
  );
}
function FileName({ id }: { id: string }) {
  const q = useQuery<any>(
    { op: "reference", type: "media", id: id || undefined },
    {},
  );
  return (
    <span>
      {id
        ? q.loading
          ? "…"
          : q.error
            ? "File unavailable"
            : q.value.title || q.value.file_name || id
        : "—"}
    </span>
  );
}
export function CertificateRetention({
  id,
  revision,
}: {
  id: string;
  revision: number;
}) {
  const { boot, notify } = useUI(),
    q = useQuery<any>({ op: "operator_retention", id }, { plan: null }),
    [days, setDays] = useState(365),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    mutate = useReceiptMutation();
  if (!boot.actor.rights.purge) return null;
  async function act(operation: string) {
    setBusy(true);
    try {
      await mutate({
        action:
          operation === "release_hold"
            ? "depth_release_hold"
            : "operator_retention",
        id,
        revision: operation === "plan" ? revision : q.value.plan.revision,
        operation,
        reason,
        data: { days, reason },
      });
      q.reload();
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Panel
      title={
        <T
          v={[
            "Governed certificate retention",
            "Conservation gouvernée du certificat",
            "الاحتفاظ المنظم بالشهادة",
          ]}
        />
      }
    >
      <State {...q} retry={q.reload}>
        <p>
          <T
            v={[
              "Closed/rejected/cancelled requests only. Seven-day review grace; holds, changed requests and linked private files block anonymisation. Course and issuance evidence is retained.",
              "Demandes clôturées/refusées/annulées uniquement. Délai de revue de sept jours ; blocage si gel, modification ou fichier privé lié. Les preuves de cours et délivrance restent conservées.",
              "الطلبات المغلقة أو المرفوضة أو الملغاة فقط. مهلة مراجعة سبعة أيام؛ تمنع الحجوزات والتعديلات والملفات الخاصة إخفاء الهوية. تبقى أدلة الدورة والإصدار.",
            ]}
          />
        </p>
        <div className={s.formGrid}>
          <Field label="Retention days · 30–3650">
            <input
              type="number"
              min="30"
              max="3650"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </Field>
          <Field
            label={
              <T
                v={[
                  "Reason · required",
                  "Motif · obligatoire",
                  "السبب · مطلوب",
                ]}
              />
            }
          >
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
        </div>
        {q.value.plan && (
          <div className={s.rowCard}>
            <Badge>{q.value.plan.state}</Badge>
            <span>{q.value.plan.execute_after}</span>
            <strong>{q.value.plan.hold_reason}</strong>
          </div>
        )}
        <div className={s.actions}>
          <Button
            disabled={busy || reason.trim().length < 10}
            onClick={() => act("plan")}
          >
            <T
              v={[
                "Prepare anonymisation plan",
                "Préparer le plan d’anonymisation",
                "تجهيز خطة إخفاء الهوية",
              ]}
            />
          </Button>
          {q.value.plan && (
            <>
              {q.value.plan.hold_reason && (
                <Button
                  disabled={busy || reason.trim().length < 10}
                  onClick={() => act("release_hold")}
                >
                  <T
                    v={[
                      "Release hold with reason",
                      "Lever le gel avec motif",
                      "رفع التجميد مع ذكر السبب",
                    ]}
                  />
                </Button>
              )}
              <Button
                disabled={busy || reason.trim().length < 10}
                onClick={() => act("hold")}
              >
                <T v={["Place hold", "Geler", "تجميد"]} />
              </Button>
              <Button disabled={busy} onClick={() => act("cancel")}>
                <T v={["Cancel plan", "Annuler le plan", "إلغاء الخطة"]} />
              </Button>
              <Button
                disabled={
                  busy ||
                  q.value.plan.state !== "planned" ||
                  !!q.value.plan.hold_reason ||
                  Date.parse(q.value.plan.execute_after) > Date.now()
                }
                onClick={() => {
                  if (
                    confirm(
                      "Anonymise eligible certificate contact data permanently?",
                    )
                  )
                    act("execute");
                }}
              >
                <T
                  v={[
                    "Execute eligible plan",
                    "Exécuter le plan éligible",
                    "تنفيذ الخطة المؤهلة",
                  ]}
                />
              </Button>
            </>
          )}
        </div>
      </State>
    </Panel>
  );
}
export function EditionAdvertising({
  record,
  language,
}: {
  record: Partial<DceRecord>;
  language: Locale;
}) {
  const { boot } = useUI();
  if (!boot.actor.rights.monetize) return null;
  return (
    <Panel
      title={
        <T
          v={[
            "Advertising around this edition",
            "Publicité autour de cette édition",
            "الإعلانات حول هذا الإصدار",
          ]}
        />
      }
      subtitle={
        <T
          v={[
            "Draft eligibility map. Downloads/results stay autonomous; an unavailable ad never blocks the resource.",
            "Carte d’éligibilité du brouillon. Les téléchargements et résultats restent autonomes ; une publicité indisponible ne bloque jamais le contenu.",
            "خريطة أهلية المسودة. تبقى التنزيلات والنتائج مستقلة ولا يمنع غياب الإعلان المورد.",
          ]}
        />
      }
    >
      <div className={s.formGrid}>
        {[
          [
            "after_intro",
            "After introduction",
            "Après introduction",
            "بعد المقدمة",
          ],
          [
            "after_section",
            "Between content sections",
            "Entre les sections",
            "بين الأقسام",
          ],
          [
            "after_completion",
            "After result / before leaving for a download",
            "Après résultat / avant de quitter pour un fichier",
            "بعد النتيجة وقبل الانتقال لملف",
          ],
          [
            "sidebar",
            "Adjacent to the experience",
            "À côté de l’expérience",
            "بجانب التجربة",
          ],
        ].map(([zone, en, fr, ar]) => (
          <EditionZone
            key={zone}
            record={record}
            language={language}
            zone={zone}
            label={[en, fr, ar]}
          />
        ))}
      </div>
      <p className={s.subtitle}>
        <T
          v={[
            "Local policy → observed provider eligibility → approved edition placement → observed serving. This admin preview performs only the first two checks. Public serving is Chapter 2; no impressions or revenue are fabricated.",
            "Règle locale → éligibilité fournisseur observée → placement d’édition approuvé → diffusion observée. Cet aperçu contrôle uniquement les deux premières étapes. La diffusion appartient au chapitre 2 ; aucune impression ni recette inventée.",
            "قاعدة محلية ثم أهلية المزوّد المرصودة ثم موضع إصدار معتمد ثم عرض مرصود. تفحص المعاينة أول مرحلتين فقط. العرض العام في الفصل الثاني ولا تُختلق مشاهدات أو عائدات.",
          ]}
        />
      </p>
    </Panel>
  );
}
function EditionZone({
  record,
  language,
  zone,
  label,
}: {
  record: Partial<DceRecord>;
  language: Locale;
  zone: string;
  label: [string, string, string];
}) {
  const { locale, open } = useUI(),
    q = useQuery<any>(
      {
        op: "ad_inspect",
        family: record.family,
        experienceId: record.id,
        topic: record.topic,
        templateId: object(record.data).templateId,
        locale: language,
        zone,
        audience: record.audience,
        device: "desktop",
        region: "MA",
        consent: "limited",
      },
      { decision: null, rules: [] },
    );
  return (
    <section className={s.rowCard}>
      <strong>{tr(label, locale)}</strong>
      <State {...q} retry={q.reload}>
        {q.value.decision && (
          <>
            <Badge tone={q.value.decision.eligible ? "green" : "orange"}>
              {q.value.decision.eligible
                ? "Eligible draft placement"
                : "Suppressed / dependency pending"}
            </Badge>
            <p>{q.value.decision.reason}</p>
            {q.value.rules
              .filter((r: any) => r.matched)
              .map((r: any) => (
                <Button key={r.id} onClick={() => open(r.id)}>
                  {r.title} · {r.data.scope}
                </Button>
              ))}
          </>
        )}
      </State>
    </section>
  );
}
export function ProductionTrace({ id }: { id: string }) {
  const q = useQuery<any>(
      { op: "operator_production_trace", id },
      { job: null, outputs: [], records: [] },
    ),
    { open } = useUI(),
    j = q.value.job;
  return (
    <Panel
      title={
        <T
          v={[
            "Source-to-experience production trail",
            "Parcours source → expérience",
            "مسار المصدر إلى التجربة",
          ]}
        />
      }
    >
      <State {...q} retry={q.reload}>
        {j && (
          <>
            <div className={s.timeline}>
              {[
                {
                  label: "Source",
                  value:
                    object(j.data.source).name ||
                    object(j.data.source).id ||
                    "Private source receipt",
                },
                { label: "Recipe", value: object(j.data.recipe).recipe },
                { label: "Processing / human review", value: j.status },
                {
                  label: "Native promotion",
                  value:
                    q.value.outputs.filter((o: any) => o.state === "promoted")
                      .length +
                    "/" +
                    q.value.outputs.length,
                },
                { label: "Bound experiences", value: q.value.records.length },
              ].map((step) => (
                <div key={step.label}>
                  <strong>{step.label}</strong>
                  <p>{String(step.value ?? "—")}</p>
                </div>
              ))}
            </div>
            {q.value.records.map((r: any) => (
              <Button key={r.id} onClick={() => open(r.id, "delivery")}>
                {r.title}
              </Button>
            ))}
            <p>
              <T
                v={[
                  "Use the review controls below to promote verified outputs, then create or open the native experience. Original source bytes remain unchanged.",
                  "Utilisez les contrôles de revue ci-dessous pour promouvoir les résultats vérifiés, puis créer ou ouvrir l’expérience native. Le fichier original reste intact.",
                  "استخدم أدوات المراجعة أدناه لاعتماد المخرجات المتحققة ثم إنشاء التجربة الأصلية أو فتحها. يبقى المصدر الأصلي دون تغيير.",
                ]}
              />
            </p>
          </>
        )}
      </State>
    </Panel>
  );
}
export function ExpiredAttemptCleanup() {
  const { boot, notify } = useUI(),
    [busy, setBusy] = useState(false),
    mutate = useReceiptMutation();
  if (!boot.actor.rights.purge) return null;
  return (
    <Panel
      title={
        <T
          v={[
            "Expired unrequested course evidence",
            "Preuves de cours expirées sans demande",
            "أدلة الدورات المنتهية دون طلب",
          ]}
        />
      }
    >
      <p>
        <T
          v={[
            "Remove at most 100 expired attempts per command. Attempts linked to certificate requests remain protected and follow the certificate retention plan.",
            "Supprimer au plus 100 tentatives expirées par commande. Les tentatives liées à une demande de certificat restent protégées par son plan de conservation.",
            "حذف مئة محاولة منتهية كحد أقصى لكل أمر. تبقى المحاولات المرتبطة بطلب شهادة محمية بخطة الاحتفاظ الخاصة به.",
          ]}
        />
      </p>
      <Button
        disabled={busy}
        onClick={async () => {
          if (!confirm("Remove only expired, unrequested assessment attempts?"))
            return;
          setBusy(true);
          try {
            const r = await mutate({ action: "operator_expire_attempts" });
            notify(String(r.removed) + " expired attempts removed.");
          } catch (e) {
            notify((e as Error).message, true);
          } finally {
            setBusy(false);
          }
        }}
      >
        <T
          v={[
            "Clean eligible expired attempts",
            "Nettoyer les tentatives expirées éligibles",
            "تنظيف المحاولات المنتهية المؤهلة",
          ]}
        />
      </Button>
    </Panel>
  );
}
