"use client";
import { useSearchParams } from "next/navigation";

import { useState } from "react";
import { FAMILIES } from "../registry";
import { array, object, text, tr, type Data } from "../types";
import {
  Badge,
  Button,
  Empty,
  Field,
  Panel,
  State,
  T,
  useUI,
  useWorkingState,
  useQuery,
  mutate,
  download,
  useReceiptMutation,
} from "./ui";
import s from "./workspace.module.css";
const FUNNELS: Record<string, string[]> = {
  discovery: ["discover", "start", "checkpoint", "complete"],
  reader: ["discover", "start", "bookmark", "return"],
  resource: ["discover", "start", "download"],
  results: ["discover", "start", "result_view"],
  downloads: ["discover", "start", "download_pdf"],
  commercial: ["discover", "start", "native_conversion"],
};
export function StrategyDesk({ audience = false }: { audience?: boolean }) {
  const transact = useReceiptMutation();
  const { boot, locale, notify } = useUI(),
    [since, setSince] = useState(() =>
      new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    ),
    [until, setUntil] = useState(() => new Date().toISOString().slice(0, 10)),
    [family, setFamily] = useWorkingState("strategy.family", ""),
    [language, setLanguage] = useWorkingState("strategy.language", ""),
    [environment, setEnvironment] = useWorkingState(
      "strategy.environment",
      "production",
    ),
    [funnel, setFunnel] = useWorkingState("strategy.funnel", "discovery"),
    [viewName, setViewName] = useState(""),
    [saving, setSaving] = useState(false),
    [asOf, setAsOf] = useState(() => Date.now());
  const end = Math.min(
      Number.isFinite(Date.parse(until + "T23:59:59.999Z"))
        ? Date.parse(until + "T23:59:59.999Z")
        : asOf,
      asOf,
    ),
    params = {
      recordId: useSearchParams()?.get("context") || undefined,
      since: since + "T00:00:00Z",
      until: new Date(end).toISOString(),
      family,
      locale: language,
      environment,
      steps: JSON.stringify(FUNNELS[funnel]),
    },
    q = useQuery<any>(
      { op: "pro_strategy", ...params },
      { events: 0, subjects: 0, funnel: [], retention: [], actions: {} },
    ),
    views = useQuery<any>(
      { op: "pro_work", kind: "saved_report", page: 1 },
      { rows: [] },
    );
  async function save() {
    setSaving(true);
    try {
      await transact({
        action: "pro_save",
        input: {
          kind: "saved_report",
          title: viewName,
          status: "active",
          data: {
            ...params,
            funnel,
            visibility: "team",
            sinceDate: since,
            untilDate: until,
          },
        },
      });
      views.reload();
      setViewName("");
      notify(
        tr(
          [
            "Analytical view saved.",
            "Vue analytique enregistrée.",
            "تم حفظ العرض التحليلي.",
          ],
          locale,
        ),
      );
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <Panel
        title={
          <T
            v={[
              "Strategic activity observatory",
              "Observatoire stratégique des usages",
              "مرصد الاستخدام الاستراتيجي",
            ]}
          />
        }
        subtitle={
          <T
            v={[
              "Ordered funnels, eligible retention windows and separate preview evidence.",
              "Entonnoirs ordonnés, fenêtres de rétention éligibles et preuves de prévisualisation séparées.",
              "مسارات مرتبة ونوافذ احتفاظ مؤهلة وأدلة معاينة منفصلة.",
            ]}
          />
        }
        actions={
          <>
            <Button icon="RefreshCw" onClick={() => setAsOf(Date.now())}>
              <T
                v={["Refresh period", "Actualiser la période", "تحديث الفترة"]}
              />
            </Button>
            <Button
              disabled={!boot.actor.rights.export || q.loading || !!q.error}
              icon="Download"
              onClick={() =>
                download(
                  "angelcare-dce-strategy.json",
                  JSON.stringify({ ...q.value, filters: params }, null, 2),
                  "application/json",
                )
              }
            >
              <T
                v={[
                  "Export this analysis",
                  "Exporter cette analyse",
                  "تصدير هذا التحليل",
                ]}
              />
            </Button>
          </>
        }
      >
        <div className={s.formGrid}>
          <Field label={<T v={["From · UTC", "Du · UTC", "من · UTC"]} />}>
            <input
              type="date"
              value={since}
              onChange={(e) => setSince(e.target.value)}
            />
          </Field>
          <Field label={<T v={["Through · UTC", "Au · UTC", "إلى · UTC"]} />}>
            <input
              type="date"
              value={until}
              onChange={(e) => setUntil(e.target.value)}
            />
          </Field>
          <Field
            label={
              <T
                v={[
                  "Experience family",
                  "Famille d’expérience",
                  "عائلة التجربة",
                ]}
              />
            }
          >
            <select value={family} onChange={(e) => setFamily(e.target.value)}>
              <option value="">
                {tr(
                  ["All families", "Toutes les familles", "كل العائلات"],
                  locale,
                )}
              </option>
              {FAMILIES.map((f) => (
                <option key={f.key} value={f.key}>
                  {tr(f.name, locale)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={<T v={["Language", "Langue", "اللغة"]} />}>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="">—</option>
              {["fr", "en", "ar"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field
            label={
              <T
                v={[
                  "Evidence environment",
                  "Environnement des preuves",
                  "بيئة الأدلة",
                ]}
              />
            }
          >
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
            >
              {["production", "preview", "fixture"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field
            label={
              <T
                v={["Decision journey", "Parcours analysé", "المسار المحلل"]}
              />
            }
          >
            <select value={funnel} onChange={(e) => setFunnel(e.target.value)}>
              {Object.keys(FUNNELS).map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
        </div>
        {environment !== "production" && (
          <div className={s.notice}>
            <T
              v={[
                "Preview or verification activity; these are not customer performance results.",
                "Activité de prévisualisation ou de vérification ; ces chiffres ne sont pas des résultats clients.",
                "نشاط معاينة أو تحقق؛ هذه ليست نتائج أداء العملاء.",
              ]}
            />
          </div>
        )}
        <State {...q} retry={q.reload}>
          <div className={s.metricGrid}>
            <Panel>
              <Badge>
                <T
                  v={["Recorded events", "Événements reçus", "الأحداث المسجلة"]}
                />
              </Badge>
              <strong>{q.value.events}</strong>
            </Panel>
            <Panel>
              <Badge>
                <T
                  v={[
                    "Pseudonymous participants",
                    "Participants pseudonymisés",
                    "مشاركون بأسماء مستعارة",
                  ]}
                />
              </Badge>
              <strong>{q.value.subjects}</strong>
            </Panel>
            <Panel>
              <Badge>
                <T
                  v={[
                    "Commercial receipt events",
                    "Événements avec reçu commercial",
                    "أحداث بإيصال تجاري",
                  ]}
                />
              </Badge>
              <strong>{q.value.actions.native_conversion || 0}</strong>
            </Panel>
          </div>
          <div className={s.twoColumns}>
            <Panel
              title={
                <T
                  v={[
                    "Ordered journey funnel",
                    "Entonnoir du parcours ordonné",
                    "مسار التقدم المرتب",
                  ]}
                />
              }
            >
              <div className={s.helpList}>
                {q.value.funnel.map((row: any, i: number) => {
                  const max = Math.max(
                    1,
                    Number(q.value.funnel[0]?.reached) || 0,
                  );
                  return (
                    <div key={row.step}>
                      <div className={s.sectionTitle}>
                        <strong>
                          {i + 1} · {row.action}
                        </strong>
                        <Badge>
                          {row.reached} ·{" "}
                          {Math.round((row.reached / max) * 100)}%
                        </Badge>
                      </div>
                      <div className={s.progress}>
                        <i style={{ width: (row.reached / max) * 100 + "%" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className={s.chartCaption}>
                <T
                  v={[
                    "Unit: one participant and one experience. Each step must follow the previous step within the selected interval.",
                    "Unité : un participant et une expérience. Chaque étape suit la précédente dans l’intervalle choisi.",
                    "الوحدة: مشارك وتجربة واحدة. يجب أن تتبع كل خطوة سابقتها ضمن الفترة المحددة.",
                  ]}
                />
              </p>
            </Panel>
            <Panel
              title={
                <T
                  v={[
                    "Return and retention",
                    "Retour et rétention",
                    "العودة والاحتفاظ",
                  ]}
                />
              }
            >
              <div className={s.tableScroll}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>
                        <T v={["Day", "Jour", "اليوم"]} />
                      </th>
                      <th>
                        <T v={["Eligible", "Éligibles", "المؤهلون"]} />
                      </th>
                      <th>
                        <T v={["Returned", "Revenus", "العائدون"]} />
                      </th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {q.value.retention.map((r: any) => (
                      <tr key={r.day}>
                        <td>D{r.day}</td>
                        <td>
                          {r.eligible} / {r.cohort}
                        </td>
                        <td>{r.retained}</td>
                        <td>
                          {r.rate === null ? (
                            <Badge tone="orange">
                              <T
                                v={[
                                  "Not yet observable",
                                  "Pas encore observable",
                                  "غير قابل للرصد بعد",
                                ]}
                              />
                            </Badge>
                          ) : (
                            Number(r.rate * 100).toFixed(1) + "%"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className={s.chartCaption}>
                <T
                  v={[
                    "Only fully elapsed day windows enter the denominator. A future window is never reported as zero retention.",
                    "Seules les fenêtres complètement écoulées entrent au dénominateur. Une fenêtre future ne vaut jamais zéro rétention.",
                    "تدخل النوافذ المنقضية بالكامل فقط في المقام. لا تعني النافذة المستقبلية احتفاظاً صفرياً.",
                  ]}
                />
              </p>
            </Panel>
          </div>
          {!q.value.events && (
            <Empty
              icon="ChartSpline"
              title={
                <T
                  v={[
                    "No received activity for these filters",
                    "Aucune activité reçue pour ces filtres",
                    "لا يوجد نشاط مسجل لهذه المرشحات",
                  ]}
                />
              }
              detail={
                <T
                  v={[
                    "Chapter 2 will emit customer activity through the server event contract. Staff previews remain separate.",
                    "Le chapitre 2 émettra les usages clients via le contrat serveur. Les aperçus restent distincts.",
                    "سيرسل الفصل الثاني نشاط العملاء عبر عقد الخادم. تبقى المعاينات منفصلة.",
                  ]}
                />
              }
            />
          )}
          <details className={s.advanced}>
            <summary>
              <T
                v={[
                  "Metric definitions and provenance",
                  "Définitions des indicateurs et provenance",
                  "تعريف المؤشرات ومصدرها",
                ]}
              />
            </summary>
            <p>
              <T
                v={[
                  "Completion, downloads and bookmarks are independent events. No raw answers or contact fields enter this report. Earlier event logs remain accessible in the original investigation view.",
                  "Complétions, téléchargements et favoris sont indépendants. Aucune réponse brute ni donnée de contact dans ce rapport. Les anciens événements restent dans la vue d’investigation.",
                  "الإكمال والتنزيل والحفظ أحداث مستقلة. لا تدخل الإجابات الخام أو بيانات الاتصال هذا التقرير. تبقى السجلات السابقة في عرض الفحص.",
                ]}
              />
            </p>
            <pre className={s.mono}>
              {JSON.stringify(q.value.definitions, null, 2)}
            </pre>
            <small>{q.value.generatedAt}</small>
          </details>
        </State>
      </Panel>
      <Panel
        title={
          <T
            v={[
              "Reusable analytical views",
              "Vues analytiques réutilisables",
              "عروض تحليلية قابلة لإعادة الاستخدام",
            ]}
          />
        }
      >
        <div className={s.toolbar}>
          <input
            aria-label="Analytical view name"
            placeholder={tr(
              ["Name this view", "Nommer cette vue", "اسم هذا العرض"],
              locale,
            )}
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
          />
          <Button
            disabled={saving || !viewName.trim() || !boot.actor.rights.manage}
            icon="Save"
            onClick={save}
          >
            <T
              v={[
                "Save team view",
                "Enregistrer la vue d’équipe",
                "حفظ عرض الفريق",
              ]}
            />
          </Button>
        </div>
        <State {...views} retry={views.reload}>
          <div className={s.choiceGrid}>
            {views.value.rows.map((w: any) => (
              <button
                className={s.choice}
                key={w.id}
                onClick={() => {
                  setSince(w.data.sinceDate || since);
                  setUntil(w.data.untilDate || until);
                  setFamily(w.data.family || "");
                  setLanguage(w.data.locale || "");
                  setEnvironment(w.data.environment || "production");
                  setFunnel(w.data.funnel || "discovery");
                }}
              >
                <strong>{w.title}</strong>
                <small>
                  {w.data.environment} · {w.data.family || "All"}
                </small>
              </button>
            ))}
          </div>
        </State>
      </Panel>
    </>
  );
}
