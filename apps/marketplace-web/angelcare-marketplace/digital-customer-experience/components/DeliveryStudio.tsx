"use client";
import p from "./production.module.css";
import { PublicReachability } from "./PublicReachability";
import { explainIssue } from "../operator-guidance";
import { EditionMedia, EditionAdvertising } from "./OperatorDesk";

import { useEffect, useState } from "react";
import {
  certificatePolicy,
  OUTCOMES,
  outcomePlan,
} from "../experience-contract";
import {
  array,
  object,
  text,
  tr,
  type Data,
  type DceRecord,
  type Locale,
} from "../types";
import { worldTimeZone, zonedDateInput } from "../management";
import { Picker } from "./Editor";
import {
  Badge,
  Button,
  Empty,
  Field,
  Panel,
  State,
  Switch,
  T,
  useUI,
  useQuery,
  useReceiptMutation,
} from "./ui";
import s from "./workspace.module.css";
export function DeliveryStudio({
  record,
  language,
  onLanguage,
  dirty,
  readOnly,
  onChange,
  focusPath,
  onLocate,
}: {
  record: Partial<DceRecord>;
  language: Locale;
  onLanguage: (l: Locale) => void;
  dirty: boolean;
  readOnly: boolean;
  onChange: (patch: Data) => void;
  focusPath?: string;
  onLocate?: (path: string) => void;
}) {
  const { locale, boot, refresh, notify, preview, open } = useUI(),
    [tab, setTab] = useState("editions"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [date, setDate] = useState(""),
    [picker, setPicker] = useState<{
      type: "media" | "record";
      id?: string;
    } | null>(null),
    mutate = useReceiptMutation(),
    d = object(record.data),
    policy = certificatePolicy(d);
  useEffect(() => {
    if (focusPath?.startsWith("outputs")) setTab("actions");
    else if (focusPath?.startsWith("certificatePolicy")) setTab("certificate");
  }, [focusPath]);
  const q = useQuery<any>(
      record.id
        ? { op: "master_editions", id: record.id, revision: record.revision }
        : { op: "reference", type: "record" },
      { rows: [] },
    ),
    ready = useQuery<any>(
      record.id
        ? {
            op: "master_readiness",
            id: record.id,
            locale: language,
            revision: record.revision,
          }
        : { op: "reference", type: "record" },
      { validation: null },
    ),
    selected = q.value.rows?.find((r: any) => r.locale === language);
  async function act(action: string, extra: Data = {}) {
    setBusy(true);
    setError("");
    try {
      await mutate({
        action: "master_edition_" + action,
        id: record.id,
        revision: record.revision,
        locale: language,
        ...extra,
      });
      q.reload();
      ready.reload();
      await refresh();
      notify(
        tr(
          [
            "Edition operation recorded.",
            "Opération de l’édition enregistrée.",
            "تم تسجيل عملية النسخة.",
          ],
          locale,
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const update = (id: string, p: Data) =>
      onChange({
        outputs: array(d.outputs).map((o) =>
          o.id === id ? { ...o, ...p } : o,
        ),
      }),
    patchPolicy = (p: Data) =>
      onChange({ certificatePolicy: { ...policy, ...p } });
  return (
    <div className={s.helpList}>
      {record.id && record.key && ["experience", "bundle"].includes(record.kind || "") ? <PublicReachability resourceKey={record.key} language={language} revision={record.revision} /> : null}
      <div className={s.notice}>
        <T
          v={[
            "Visitors use resources independently. Normal actions create no admin request or customer account. Only enabled course certificates offer an explicit request.",
            "Les visiteurs agissent en autonomie. Les actions ordinaires ne créent ni demande admin ni compte client. Seul un certificat de cours activé propose une demande explicite.",
            "يستخدم الزوار الموارد باستقلالية. لا تنشئ الإجراءات العادية طلباً إدارياً أو حساب عميل. تتيح شهادات الدورات المفعلة طلباً صريحاً فقط.",
          ]}
        />
      </div>
      <div className={s.tabs} role="tablist">
        {[
          [
            "editions",
            ["Language editions", "Éditions linguistiques", "النسخ اللغوية"],
          ],
          [
            "actions",
            ["Actions & outputs", "Actions et sorties", "الإجراءات والمخرجات"],
          ],
          ...(record.family === "learning"
            ? [
                [
                  "certificate",
                  [
                    "Certificate policy",
                    "Politique de certificat",
                    "سياسة الشهادة",
                  ],
                ],
              ]
            : []),
        ].map(([key, label]) => (
          <button
            className={s.tab}
            role="tab"
            key={key as string}
            aria-selected={tab === key}
            onClick={() => setTab(key as string)}
          >
            {tr(label as any, locale)}
          </button>
        ))}
      </div>
      {record.id && (
        <Button
          icon="Eye"
          disabled={dirty || busy}
          onClick={() => preview(record.id!, undefined, language)}
        >
          <T
            v={[
              "Open protected saved preview",
              "Ouvrir l’aperçu protégé enregistré",
              "فتح المعاينة المحمية المحفوظة",
            ]}
          />
        </Button>
      )}
      {tab === "editions" &&
        (!record.id ? (
          <Empty
            title={
              <T
                v={[
                  "Save the dossier first",
                  "Enregistrez le dossier",
                  "احفظ الملف أولاً",
                ]}
              />
            }
          />
        ) : (
          <State {...q} retry={q.reload}>
            {q.value.legacyRelease && (
              <div className={s.notice}>
                <T
                  v={[
                    "The previous global release stays in Publication history. Use these controls to publish independent editions.",
                    "La publication globale antérieure reste dans l’historique. Utilisez ces contrôles pour les éditions indépendantes.",
                    "يبقى الإصدار العام السابق في سجل النشر. استخدم هذه الأدوات لنشر نسخ مستقلة.",
                  ]}
                />
              </div>
            )}
            <div className={p.bulkReceipt}>
              <strong>
                <T
                  v={[
                    "Selected-language production path",
                    "Parcours de production de la langue sélectionnée",
                    "مسار إنتاج اللغة المحددة",
                  ]}
                />
              </strong>
              <div className={p.pipeline}>
                {[
                  [
                    Boolean(record.id) && !dirty,
                    ["Saved revision", "Version enregistrée", "نسخة محفوظة"],
                  ],
                  [
                    !dirty && ready.value.validation?.valid,
                    ["Native checks", "Contrôles natifs", "الفحوص الأصلية"],
                  ],
                  [
                    !dirty &&
                      ["review", "approved", "published"].includes(
                        selected?.state,
                      ),
                    ["Review", "Revue", "المراجعة"],
                  ],
                  [
                    !dirty &&
                      (selected?.approvalCurrent ||
                        selected?.state === "published"),
                    ["Approval", "Approbation", "الاعتماد"],
                  ],
                ].map(([done, label], i) => (
                  <span key={i}>
                    {done ? "✓" : "○"} {tr(label as any, locale)}
                  </span>
                ))}
              </div>
              <p>
                {selected?.activeReleaseId
                  ? tr(
                      [
                        "A published edition exists. Working-draft changes follow a new review; they do not replace the live release automatically.",
                        "Une édition publiée existe. Les modifications du brouillon nécessitent une nouvelle revue ; elles ne remplacent pas automatiquement la version publique.",
                        "توجد نسخة منشورة. تتطلب تغييرات المسودة مراجعة جديدة ولا تستبدل الإصدار العام تلقائياً.",
                      ],
                      locale,
                    )
                  : tr(
                      [
                        "No active language release is reported. A prepared or approved draft is not a public publication.",
                        "Aucune édition active n’est signalée. Un brouillon préparé ou approuvé n’est pas une publication publique.",
                        "لم يبلغ عن إصدار لغوي نشط. المسودة المحضرة أو المعتمدة ليست نشراً عاماً.",
                      ],
                      locale,
                    )}
              </p>
              {!boot.actor.rights.publish && (
                <p>
                  <T
                    v={[
                      "Your role can prepare the dossier. Approval, release and scheduling require the native publishing permission.",
                      "Votre rôle permet la préparation. L’approbation, la publication et la planification nécessitent la permission native de publication.",
                      "يمكن لدورك تحضير الملف. يتطلب الاعتماد والنشر والجدولة إذن النشر الأصلي.",
                    ]}
                  />
                </p>
              )}
            </div>
            <EditionChangeReview
              record={record}
              language={language}
              dirty={dirty}
              onLocate={onLocate}
            />
            <div className={s.scenarioGrid}>
              {q.value.rows.map((e: any) => (
                <button
                  className={s.rowCard}
                  key={e.locale}
                  aria-pressed={language === e.locale}
                  onClick={() => onLanguage(e.locale)}
                >
                  <strong>{e.locale.toUpperCase()}</strong>
                  <Badge
                    tone={
                      e.activeReleaseId
                        ? "green"
                        : e.present
                          ? "blue"
                          : "orange"
                    }
                  >
                    {e.activeReleaseId
                      ? tr(["Live", "Publiée", "منشورة"], locale)
                      : e.present
                        ? tr(["Draft", "Brouillon", "مسودة"], locale)
                        : tr(
                            ["Not authored", "Non rédigée", "غير مؤلفة"],
                            locale,
                          )}
                  </Badge>
                  <small>
                    {e.coverage.filled}/{e.coverage.total} · {e.state}
                  </small>
                </button>
              ))}
            </div>
            <Panel
              title={
                language.toUpperCase() +
                " · " +
                tr(
                  [
                    "Selected edition",
                    "Édition sélectionnée",
                    "النسخة المختارة",
                  ],
                  locale,
                )
              }
            >
              <p>
                <T
                  v={[
                    "Other languages may remain draft or absent. Review, approval and publication affect this edition only.",
                    "Les autres langues peuvent rester en brouillon ou absentes. Revue, approbation et publication concernent cette édition uniquement.",
                    "يمكن أن تبقى اللغات الأخرى مسودات أو غائبة. تقتصر المراجعة والاعتماد والنشر على هذه النسخة.",
                  ]}
                />
              </p>
              <State {...ready} retry={ready.reload}>
                {ready.value.validation && (
                  <>
                    <Badge
                      tone={ready.value.validation.valid ? "green" : "orange"}
                    >
                      {ready.value.validation.valid
                        ? tr(
                            [
                              "Ready for review",
                              "Prête pour revue",
                              "جاهزة للمراجعة",
                            ],
                            locale,
                          )
                        : tr(
                            [
                              "Corrections required",
                              "Corrections nécessaires",
                              "تصحيحات مطلوبة",
                            ],
                            locale,
                          )}
                    </Badge>
                    {ready.value.validation.errors.map((e: any, i: number) => (
                      <p key={i}>
                        <strong>{explainIssue(record, e, locale).label}</strong>{" "}
                        · {explainIssue(record, e, locale).message}{" "}
                        <Button
                          onClick={() =>
                            onLocate
                              ? onLocate(e.path)
                              : record.id &&
                                open(
                                  record.id,
                                  explainIssue(record, e, locale).tab,
                                  language,
                                )
                          }
                        >
                          <T
                            v={[
                              "Open correction area",
                              "Ouvrir la correction",
                              "فتح التصحيح",
                            ]}
                          />
                        </Button>
                      </p>
                    ))}
                  </>
                )}
              </State>
              {dirty && (
                <p className={s.notice}>
                  <T
                    v={[
                      "Save local changes before review or publication.",
                      "Enregistrez les modifications avant revue ou publication.",
                      "احفظ التعديلات قبل المراجعة أو النشر.",
                    ]}
                  />
                </p>
              )}
              <div className={s.actions}>
                <Button
                  icon="ClipboardCheck"
                  disabled={
                    dirty || busy || readOnly || !ready.value.validation?.valid
                  }
                  onClick={() => void act("review")}
                >
                  <T
                    v={[
                      "Submit edition for review",
                      "Mettre l’édition en revue",
                      "إحالة النسخة للمراجعة",
                    ]}
                  />
                </Button>
                <Button
                  icon="BadgeCheck"
                  disabled={
                    dirty ||
                    busy ||
                    !boot.actor.rights.publish ||
                    selected?.state !== "review"
                  }
                  onClick={() => void act("approve")}
                >
                  <T
                    v={[
                      "Approve edition",
                      "Approuver l’édition",
                      "اعتماد النسخة",
                    ]}
                  />
                </Button>
                <Button
                  icon="Rocket"
                  kind="primary"
                  disabled={
                    dirty ||
                    busy ||
                    !boot.actor.rights.publish ||
                    !selected?.approvalCurrent
                  }
                  onClick={() => void act("release")}
                >
                  <T
                    v={[
                      "Publish this edition",
                      "Publier cette édition",
                      "نشر هذه النسخة",
                    ]}
                  />
                </Button>
              </div>
              <div className={s.toolbar}>
                <Field
                  label={
                    tr(["Schedule · ", "Planifier · ", "الجدولة · "], locale) +
                    worldTimeZone(boot.settings)
                  }
                >
                  <input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </Field>
                <Button
                  icon="CalendarClock"
                  disabled={
                    dirty ||
                    busy ||
                    !date ||
                    !boot.actor.rights.publish ||
                    !selected?.approvalCurrent
                  }
                  onClick={() => {
                    try {
                      void act("schedule", {
                        scheduledAt: zonedDateInput(
                          date,
                          worldTimeZone(boot.settings),
                        ),
                      });
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  <T
                    v={[
                      "Schedule edition",
                      "Planifier l’édition",
                      "جدولة النسخة",
                    ]}
                  />
                </Button>
                {selected?.activeReleaseId && (
                  <Button
                    disabled={dirty || busy || !boot.actor.rights.publish}
                    onClick={() => {
                      if (
                        confirm(
                          tr(
                            [
                              "Withdraw this edition only?",
                              "Retirer uniquement cette édition ?",
                              "سحب هذه النسخة فقط؟",
                            ],
                            locale,
                          ),
                        )
                      )
                        void act("withdraw", {
                          releaseId: selected.activeReleaseId,
                        });
                    }}
                  >
                    <T
                      v={[
                        "Withdraw edition",
                        "Retirer l’édition",
                        "سحب النسخة",
                      ]}
                    />
                  </Button>
                )}
              </div>
            </Panel>
          </State>
        ))}
      {tab === "editions" && (
        <>
          <EditionMedia
            record={record}
            language={language}
            onChange={onChange}
            readOnly={readOnly}
          />
          <EditionAdvertising record={record} language={language} />
        </>
      )}
      {tab === "actions" && (
        <>
          <Panel
            title={
              <T
                v={[
                  "Actions appropriate to this resource",
                  "Actions adaptées à cette ressource",
                  "إجراءات مناسبة لهذا المورد",
                ]}
              />
            }
          >
            <p>
              {tr(
                (OUTCOMES[record.family || "documents"] || OUTCOMES.documents)
                  .description,
                locale,
              )}
            </p>
            <div className={s.modePills}>
              {outcomePlan(record).actions.map((a) => (
                <Badge key={a}>{a}</Badge>
              ))}
            </div>
            <Switch
              path={"downloadAllowed"}
              disabled={readOnly}
              value={d.downloadAllowed === true}
              onChange={(downloadAllowed) => onChange({ downloadAllowed })}
              label={
                <T
                  v={[
                    "Allow configured downloads",
                    "Autoriser les téléchargements configurés",
                    "السماح بالتنزيلات المهيأة",
                  ]}
                />
              }
            />
          </Panel>
          <Panel
            title={
              <T
                v={[
                  "Published PDF and PNG outputs",
                  "Sorties PDF et PNG publiées",
                  "مخرجات PDF وPNG المنشورة",
                ]}
              />
            }
            actions={
              <Button
                path="outputs"
                disabled={readOnly}
                icon="Plus"
                onClick={() =>
                  onChange({
                    downloadAllowed: true,
                    outputs: [
                      ...array(d.outputs),
                      {
                        id: crypto.randomUUID(),
                        label: "",
                        mime: "application/pdf",
                        scope: "whole",
                        enabled: true,
                      },
                    ],
                  })
                }
              >
                <T v={["Add output", "Ajouter une sortie", "إضافة مخرج"]} />
              </Button>
            }
          >
            {array(d.outputs).map((o) => (
              <section
                className={s.rowCard}
                key={text(o.id)}
                data-dce-path={"outputs." + text(o.id)}
              >
                <div className={s.formGrid}>
                  <Field
                    path={"outputs." + text(o.id) + ".label"}
                    label={
                      <T
                        v={["Public label", "Libellé public", "التسمية العامة"]}
                      />
                    }
                  >
                    <input
                      disabled={readOnly}
                      value={
                        text(object(object(o.locales)[language]).label) ||
                        (language === (d.defaultLocale || "en")
                          ? text(o.label)
                          : "")
                      }
                      onChange={(e) =>
                        update(text(o.id), {
                          locales: {
                            ...object(o.locales),
                            [language]: {
                              ...object(object(o.locales)[language]),
                              label: e.target.value,
                            },
                          },
                          ...(language === (d.defaultLocale || "en")
                            ? { label: e.target.value }
                            : {}),
                        })
                      }
                    />
                  </Field>
                  <Field
                    path={"outputs." + text(o.id) + ".mime"}
                    label="Format"
                  >
                    <select
                      disabled={readOnly}
                      value={text(o.mime)}
                      onChange={(e) =>
                        update(text(o.id), { mime: e.target.value })
                      }
                    >
                      <option value="application/pdf">PDF</option>
                      <option value="image/png">PNG</option>
                    </select>
                  </Field>
                  <Field
                    path={"outputs." + text(o.id) + ".scope"}
                    label={
                      <T
                        v={[
                          "Delivery scope",
                          "Portée du fichier",
                          "نطاق الملف",
                        ]}
                      />
                    }
                  >
                    <select
                      disabled={readOnly}
                      value={text(o.scope) || "whole"}
                      onChange={(e) =>
                        update(text(o.id), { scope: e.target.value })
                      }
                    >
                      {["whole", "page", "set"].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </Field>
                  <OutputName
                    id={text(
                      object(object(o.locales)[language]).assetId || o.assetId,
                    )}
                  />
                </div>
                <div className={s.actions}>
                  <Button
                    path={"outputs." + text(o.id) + ".assetId"}
                    disabled={readOnly}
                    icon="Folder"
                    onClick={() => setPicker({ type: "media", id: text(o.id) })}
                  >
                    <T
                      v={[
                        "Choose real delivery file",
                        "Choisir le fichier réel",
                        "اختر ملف التسليم الفعلي",
                      ]}
                    />
                  </Button>
                  <Switch
                    path={"outputs." + text(o.id) + ".enabled"}
                    disabled={readOnly}
                    value={
                      object(object(o.locales)[language]).enabled !== undefined
                        ? object(object(o.locales)[language]).enabled === true
                        : o.enabled !== false
                    }
                    label={
                      <T
                        v={[
                          "Enabled for this language",
                          "Activée pour cette langue",
                          "مفعل لهذه اللغة",
                        ]}
                      />
                    }
                    onChange={(enabled) =>
                      update(text(o.id), {
                        locales: {
                          ...object(o.locales),
                          [language]: {
                            ...object(object(o.locales)[language]),
                            enabled,
                          },
                        },
                      })
                    }
                  />
                  <Button
                    disabled={readOnly}
                    icon="Trash"
                    onClick={() =>
                      onChange({
                        outputs: array(d.outputs).filter((x) => x.id !== o.id),
                      })
                    }
                  >
                    <T
                      v={[
                        "Remove binding",
                        "Retirer la liaison",
                        "إزالة الربط",
                      ]}
                    />
                  </Button>
                </div>
              </section>
            ))}
            {!array(d.outputs).length && (
              <Empty
                icon="FileDown"
                title={
                  <T
                    v={[
                      "No output bound; reading remains available",
                      "Aucune sortie liée ; la lecture reste disponible",
                      "لا مخرج مرتبط؛ تبقى القراءة متاحة",
                    ]}
                  />
                }
              />
            )}
          </Panel>
        </>
      )}
      {tab === "certificate" && (
        <Panel
          title={
            <T
              v={[
                "Optional course-certificate requests",
                "Demandes facultatives de certificat",
                "طلبات شهادة الدورة الاختيارية",
              ]}
            />
          }
        >
          <Switch
            path={"certificatePolicy.enabled"}
            disabled={readOnly}
            value={policy.enabled === true}
            onChange={(enabled) => patchPolicy({ enabled })}
            label={
              <T
                v={[
                  "Offer an explicit certificate-request CTA",
                  "Proposer une demande explicite de certificat",
                  "إتاحة طلب صريح للشهادة",
                ]}
              />
            }
          />
          <p>
            <T
              v={[
                "Learning and results remain independent. Only an explicit request enters Certificate Requests.",
                "Apprentissage et résultats restent indépendants. Seule une demande explicite arrive dans l’espace Certificats.",
                "يبقى التعلم والنتائج مستقلين. تصل الطلبات الصريحة فقط إلى مساحة الشهادات.",
              ]}
            />
          </p>
          <div className={s.formGrid}>
            <Field
              path={"certificatePolicy.evidence"}
              label={
                <T
                  v={["Evidence required", "Preuve demandée", "الدليل المطلوب"]}
                />
              }
            >
              <select
                disabled={readOnly}
                value={text(policy.evidence)}
                onChange={(e) => patchPolicy({ evidence: e.target.value })}
              >
                <option value="manual_review">
                  Manual review / Revue manuelle / مراجعة يدوية
                </option>
                <option value="server_assessment">
                  Server assessment / Évaluation serveur / تقييم الخادم
                </option>
              </select>
            </Field>
            <Field
              path={"certificatePolicy.minimumScore"}
              label={
                <T
                  v={[
                    "Minimum score · %",
                    "Score minimum · %",
                    "النتيجة الدنيا · %",
                  ]}
                />
              }
            >
              <input
                disabled={readOnly}
                type="number"
                min={0}
                max={100}
                value={Number(policy.minimumScore)}
                onChange={(e) =>
                  patchPolicy({ minimumScore: Number(e.target.value) })
                }
              />
            </Field>
            <Field
              path={"certificatePolicy.issuer"}
              label={<T v={["Issuer", "Émetteur", "الجهة المصدرة"]} />}
            >
              <input
                disabled={readOnly}
                value={text(policy.issuer)}
                onChange={(e) => patchPolicy({ issuer: e.target.value })}
              />
            </Field>
            <Field
              path={"certificatePolicy.followUpDays"}
              label={
                <T
                  v={[
                    "Follow-up within · days",
                    "Suivi sous · jours",
                    "المتابعة خلال · أيام",
                  ]}
                />
              }
            >
              <input
                disabled={readOnly}
                type="number"
                min={1}
                max={365}
                value={Number(policy.followUpDays)}
                onChange={(e) =>
                  patchPolicy({ followUpDays: Number(e.target.value) })
                }
              />
            </Field>
          </div>
          <Switch
            path={"certificatePolicy.requiresCompletion"}
            disabled={readOnly}
            value={policy.requiresCompletion === true}
            onChange={(requiresCompletion) =>
              patchPolicy({ requiresCompletion })
            }
            label={
              <T
                v={[
                  "Require completion evidence",
                  "Exiger une preuve de fin",
                  "اشتراط دليل الإكمال",
                ]}
              />
            }
          />
          <div className={s.checkOptions}>
            {(["fr", "en", "ar"] as Locale[]).map((l) => (
              <label key={l}>
                <input
                  disabled={readOnly}
                  type="checkbox"
                  checked={(policy.locales as string[]).includes(l)}
                  onChange={(e) =>
                    patchPolicy({
                      locales: e.target.checked
                        ? [...new Set([...(policy.locales as string[]), l])]
                        : (policy.locales as string[]).filter((x) => x !== l),
                    })
                  }
                />
                {l.toUpperCase()}
              </label>
            ))}
          </div>
          {policy.evidence === "server_assessment" && (
            <>
              <OutputName id={text(policy.assessmentId)} type="record" />
              <Button
                path={"certificatePolicy.assessmentId"}
                icon="Search"
                disabled={readOnly}
                onClick={() => setPicker({ type: "record" })}
              >
                <T
                  v={[
                    "Choose published assessment",
                    "Choisir l’évaluation publiée",
                    "اختيار التقييم المنشور",
                  ]}
                />
              </Button>
            </>
          )}
        </Panel>
      )}
      {error && (
        <div className={`${s.notice} ${s.alertError}`} role="alert">
          {error}
        </div>
      )}
      {picker && (
        <Picker
          type={picker.type}
          kind={picker.type === "record" ? "experience" : undefined}
          mime={
            picker.type === "media"
              ? [
                  text(
                    array(d.outputs).find((o) => o.id === picker.id)?.mime,
                  ) || "application/pdf",
                ]
              : undefined
          }
          onSelect={(id) =>
            picker.type === "media"
              ? update(picker.id!, {
                  locales: {
                    ...object(
                      array(d.outputs).find((o) => o.id === picker.id)?.locales,
                    ),
                    [language]: {
                      ...object(
                        object(
                          array(d.outputs).find((o) => o.id === picker.id)
                            ?.locales,
                        )[language],
                      ),
                      assetId: id,
                    },
                  },
                })
              : patchPolicy({ assessmentId: id })
          }
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
function OutputName({
  id,
  type = "media",
}: {
  id: string;
  type?: "media" | "record";
}) {
  const q = useQuery<any>({ op: "reference", type, id }, {});
  return (
    <div>
      <strong>{q.value.title || (id ? "…" : "—")}</strong>
      {q.value.mime && <Badge>{q.value.mime}</Badge>}
      {q.error && <p role="alert">{q.error}</p>}
    </div>
  );
}

function EditionChangeReview({
  record,
  language,
  dirty,
  onLocate,
}: {
  record: Partial<DceRecord>;
  language: Locale;
  dirty: boolean;
  onLocate?: (path: string) => void;
}) {
  const { locale } = useUI(),
    [expanded, setExpanded] = useState(false),
    [page, setPage] = useState(0);
  const q = useQuery<any>(
    expanded && record.id
      ? {
          op: "master_edition_comparison",
          id: record.id,
          locale: language,
          revision: record.revision,
        }
      : { op: "reference", type: "record" },
    { changes: [], activeRelease: null },
  );
  useEffect(() => setPage(0), [language, record.revision]);
  return (
    <details onToggle={(e) => setExpanded(e.currentTarget.open)}>
      <summary>
        <T
          v={[
            "Compare saved draft with the active language release",
            "Comparer le brouillon enregistré avec l’édition publiée",
            "مقارنة المسودة المحفوظة بالإصدار اللغوي النشط",
          ]}
        />
      </summary>
      {expanded && (
        <State {...q} retry={q.reload}>
          {dirty && (
            <p>
              <T
                v={[
                  "Save your local changes to include them in this comparison.",
                  "Enregistrez les modifications locales pour les inclure dans cette comparaison.",
                  "احفظ التغييرات المحلية لتضمينها في هذه المقارنة.",
                ]}
              />
            </p>
          )}
          {q.value.activeRelease ? (
            <>
              <p>
                r{q.value.activeRelease.revision} → r{q.value.workingRevision} ·{" "}
                {q.value.changes.length}
                {q.value.truncated ? "+" : ""}{" "}
                <T
                  v={[
                    "changed positions; private values are not displayed",
                    "emplacements modifiés ; les valeurs privées ne sont pas affichées",
                    "مواضع تغيرت؛ لا تعرض القيم الخاصة",
                  ]}
                />
              </p>
              {q.value.changes
                .slice(page * 30, page * 30 + 30)
                .map((change: any) => (
                  <p key={change.path}>
                    <code>{change.path}</code> · {change.change}{" "}
                    {onLocate && change.change !== "removed" && (
                      <Button onClick={() => onLocate(change.path)}>
                        <T v={["Inspect", "Inspecter", "فحص"]} />
                      </Button>
                    )}
                  </p>
                ))}
              <div className={s.actions}>
                <Button
                  disabled={page === 0}
                  onClick={() => setPage((v) => v - 1)}
                >
                  <T v={["Previous", "Précédent", "السابق"]} />
                </Button>
                <Button
                  disabled={(page + 1) * 30 >= q.value.changes.length}
                  onClick={() => setPage((v) => v + 1)}
                >
                  <T v={["Next", "Suivant", "التالي"]} />
                </Button>
              </div>
            </>
          ) : (
            <p>
              <T
                v={[
                  "There is no active language release to compare.",
                  "Aucune édition linguistique active à comparer.",
                  "لا يوجد إصدار لغوي نشط للمقارنة.",
                ]}
              />
            </p>
          )}
        </State>
      )}
    </details>
  );
}
