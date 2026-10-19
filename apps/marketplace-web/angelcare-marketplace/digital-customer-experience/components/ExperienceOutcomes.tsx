"use client";
import { useEffect, useRef, useState } from "react";
import {
  contextualRecommendations,
  DEPTH_CONTRACT,
  restorePersonalState,
  selectResult,
} from "../experience-depth";
import {
  array,
  object,
  text,
  tr,
  type Data,
  type DceRecord,
  type Locale,
} from "../types";
import { Badge, Button, Field, T, useUI, query } from "./ui";
import s from "./workspace.module.css";
const local = (row: Data, key: string, l: Locale) =>
  text(object(object(row.locales)[l])[key]) || text(row[key]);
export function ExperienceOutcomes({
  record,
  data,
  locale,
  state,
  onRestore,
  onReset,
  bindings = {},
}: {
  record: DceRecord;
  data: Data;
  locale: Locale;
  state: Data;
  bindings?: Data;
  onRestore: (state: Data) => void;
  onReset: (retry?: boolean) => void;
}) {
  const { boot, preview } = useUI(),
    score = typeof state.score === "number" ? state.score : undefined,
    complete = state.complete === true,
    result =
      data.resultsEnabled === true
        ? selectResult(data, score, complete, state.timeout === true)
        : undefined,
    recommendations = contextualRecommendations(data, score, complete),
    [busy, setBusy] = useState(""),
    [notice, setNotice] = useState(""),
    [recovery, setRecovery] =
      useState<ReturnType<typeof restorePersonalState>>(null),
    controller = useRef<AbortController | null>(null),
    [adEvent, setAdEvent] = useState(""),
    [adResult, setAdResult] = useState<Data | null>(null);
  const key = [
      "angelcare.dce.personal.r7",
      boot.actor.id,
      record.tenant_id || "~",
      record.territory_id || "~",
      record.id,
      locale,
    ].join("."),
    storage =
      data.continuityPolicy === "device" ? "localStorage" : "sessionStorage";
  useEffect(() => {
    controller.current?.abort();
    setNotice("");
    setRecovery(null);
    if (data.continuityPolicy === "none") return;
    try {
      setRecovery(
        restorePersonalState(
          JSON.parse(window[storage].getItem(key) || "null"),
          record.id,
          locale,
          record.revision,
          data,
        ),
      );
    } catch {
      setNotice(
        tr(
          [
            "Personal recovery is unavailable in this browser.",
            "La reprise personnelle est indisponible dans ce navigateur.",
            "استعادة التقدم غير متاحة في هذا المتصفح.",
          ],
          locale,
        ),
      );
    }
    return () => controller.current?.abort();
  }, [key, storage, record.revision, data.continuityPolicy]);
  function save() {
    try {
      window[storage].setItem(
        key,
        JSON.stringify({
          contract: DEPTH_CONTRACT,
          recordId: record.id,
          locale,
          revision: record.revision,
          savedAt: Date.now(),
          state,
        }),
      );
      setNotice(
        tr(
          [
            "Personal preview progress saved on this device.",
            "Progression personnelle de l’aperçu enregistrée sur cet appareil.",
            "تم حفظ تقدم المعاينة الشخصي على هذا الجهاز.",
          ],
          locale,
        ),
      );
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  function clear() {
    controller.current?.abort();
    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    } catch {}
    setRecovery(null);
    setNotice("");
    onReset();
  }
  async function output(layout: Data) {
    if (busy) return;
    controller.current = new AbortController();
    setBusy(text(layout.id));
    setNotice("");
    try {
      const { generatePersonalOutput } = await import("../personal-output"),
        outcome = await generatePersonalOutput(
          data,
          layout,
          {
            ...state,
            ...(result
              ? {
                  resultTitle: local(result, "title", locale),
                  guidance: local(result, "guidance", locale),
                }
              : {}),
          },
          locale,
          controller.current.signal,
          bindings,
        );
      const url = URL.createObjectURL(outcome.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = outcome.name;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setNotice(
        tr(
          [
            "Your personal file is ready.",
            "Votre fichier personnel est prêt.",
            "ملفك الشخصي جاهز.",
          ],
          locale,
        ),
      );
    } catch (e) {
      setNotice(
        (e as Error).name === "AbortError"
          ? tr(
              [
                "Generation cancelled.",
                "Génération annulée.",
                "تم إلغاء الإنشاء.",
              ],
              locale,
            )
          : (e as Error).message,
      );
    } finally {
      setBusy("");
    }
  }
  return (
    <section>
      {result && (score !== undefined || complete) && (
        <div className={s.previewResult} role="status">
          {local(result, "badgeLabel", locale) && (
            <Badge tone="green">{local(result, "badgeLabel", locale)}</Badge>
          )}
          <h3>{local(result, "title", locale)}</h3>
          <p>{local(result, "text", locale)}</p>
          <p>{local(result, "guidance", locale)}</p>
          <div className={s.actions}>
            {["retry", "review", "download"].includes(text(result.action)) && (
              <Button
                disabled={result.action==='retry'&&(data.retryPolicy==='disabled'||data.retryPolicy==='until_pass'&&typeof state.score==='number'&&state.score>=Number(data.passingScore||70)||Number(data.attemptLimit||0)>0&&Number(state.attempts||0)>=Number(data.attemptLimit))}
                onClick={() => {
                  if (result.action === "retry") onReset(true);
                  else
                    document
                      .getElementById(
                        result.action === "download"
                          ? "dce-generated-outputs"
                          : "dce-experience-stage",
                      )
                      ?.scrollIntoView({
                        behavior:
                          data.reducedMotion === true ? "instant" : "smooth",
                        block: "start",
                      });
                }}
              >
                {tr(
                  result.action === "retry"
                    ? ["Try again", "Réessayer", "حاول مجدداً"]
                    : result.action === "review"
                      ? ["Review", "Revoir", "مراجعة"]
                      : ["My downloads", "Mes téléchargements", "تنزيلاتي"],
                  locale,
                )}
              </Button>
            )}
            {result.experienceId && (
              <Button
                onClick={() =>
                  preview(text(result.experienceId), undefined, locale)
                }
              >
                <T
                  v={[
                    "Continue to the next experience",
                    "Continuer vers l’expérience suivante",
                    "متابعة إلى التجربة التالية",
                  ]}
                />
              </Button>
            )}
          </div>
        </div>
      )}
      {recommendations.length > 0 && (
        <div className={s.definitionBoard}>
          {recommendations.map((r) => (
            <article className={s.rowCard} key={text(r.id)}>
              <Badge>{text(r.role)}</Badge>
              <h3>{local(r, "label", locale)}</h3>
              <Button
                onClick={() => preview(text(r.experienceId), undefined, locale)}
              >
                <T
                  v={[
                    "Explore experience",
                    "Explorer l’expérience",
                    "استكشف التجربة",
                  ]}
                />
              </Button>
            </article>
          ))}
        </div>
      )}
      {array(data.exportLayouts).some((l) => l.enabled === true) && (
        <div id="dce-generated-outputs" className={s.rowCard}>
          <h3>
            <T
              v={[
                "My personal outputs",
                "Mes sorties personnelles",
                "مخرجاتي الشخصية",
              ]}
            />
          </h3>
          {data.downloadAllowed === true ? (
            <div className={s.actions}>
              {array(data.exportLayouts)
                .filter((l) => l.enabled === true)
                .map((l) => (
                  <Button
                    key={text(l.id)}
                    disabled={Boolean(busy)}
                    icon="Download"
                    onClick={() => void output(l)}
                  >
                    {local(l, "title", locale) || text(l.purpose)} ·{" "}
                    {l.mime === "image/png" ? "PNG" : "PDF"}
                  </Button>
                ))}
              {busy && (
                <Button onClick={() => controller.current?.abort()}>
                  <T v={["Cancel", "Annuler", "إلغاء"]} />
                </Button>
              )}
            </div>
          ) : (
            <p>
              <T
                v={[
                  "Enable download permission in Actions & outputs to use these layouts.",
                  "Activez le téléchargement dans Actions et sorties pour utiliser ces mises en page.",
                  "فعل إذن التنزيل من الإجراءات والمخرجات لاستخدام هذه التخطيطات.",
                ]}
              />
            </p>
          )}
          <p>
            <T
              v={[
                "Personal files are generated locally. No account or operator submission is created.",
                "Les fichiers personnels sont générés localement. Aucun compte ni envoi à un opérateur.",
                "تولد الملفات الشخصية محلياً دون إنشاء حساب أو إرسال للإدارة.",
              ]}
            />
          </p>
        </div>
      )}
      {data.continuityPolicy && data.continuityPolicy !== "none" && (
        <div className={s.rowCard}>
          <h3>
            <T
              v={[
                "Personal continuity",
                "Continuité personnelle",
                "استمرارية شخصية",
              ]}
            />
          </h3>
          <div className={s.actions}>
            <Button onClick={save}>
              <T
                v={[
                  "Save my progress",
                  "Sauvegarder ma progression",
                  "حفظ تقدمي",
                ]}
              />
            </Button>
            {recovery && (
              <Button
                onClick={() => {
                  onRestore(recovery.state);
                  setRecovery(null);
                }}
              >
                {tr(
                  recovery.needsDecision
                    ? [
                        "Edition changed · restore my saved copy",
                        "Édition modifiée · restaurer ma copie",
                        "تغيرت النسخة · استعادة نسختي",
                      ]
                    : ["Resume my copy", "Reprendre ma copie", "استئناف نسختي"],
                  locale,
                )}
              </Button>
            )}
            <Button onClick={clear}>
              <T
                v={[
                  "Clear personal progress",
                  "Effacer la progression personnelle",
                  "مسح التقدم الشخصي",
                ]}
              />
            </Button>
          </div>
        </div>
      )}
      {array(data.adBreaks).length > 0 && boot.actor.rights.monetize && (
        <details className={s.advanced}>
          <summary>
            <T
              v={[
                "Inspect advertising opportunities",
                "Inspecter les occasions publicitaires",
                "فحص فرص الإعلان",
              ]}
            />
          </summary>
          <Field
            label={
              <T v={["Authored event", "Événement défini", "الحدث المحدد"]} />
            }
          >
            <select
              value={adEvent}
              onChange={(e) => {
                setAdEvent(e.target.value);
                setAdResult(null);
              }}
            >
              <option value="">—</option>
              {array(data.adBreaks)
                .filter((a) => a.enabled === true)
                .map((a) => (
                  <option key={text(a.id)} value={text(a.id)}>
                    {text(a.event)} · {local(a, "label", locale)}
                  </option>
                ))}
            </select>
          </Field>
          <Button
            disabled={!adEvent || Boolean(busy)}
            onClick={async () => {
              const a = array(data.adBreaks).find((a) => a.id === adEvent);
              if (!a) return;
              setBusy("ad");
              setNotice("");
              try {
                setAdResult(
                  await query({
                    op: "ad_inspect",
                    policyId:a.adPolicyId,
                    locale,
                    experienceId: record.id,
                    family: record.family,
                    zone: a.event,
                    audience: record.audience,
                  }),
                );
              } catch (e) {
                setNotice((e as Error).message);
              } finally {
                setBusy("");
              }
            }}
          >
            <T
              v={[
                "Inspect native eligibility",
                "Inspecter l’éligibilité native",
                "فحص الأهلية الأصلية",
              ]}
            />
          </Button>
          {adResult && <pre>{JSON.stringify(adResult, null, 2)}</pre>}
          <p>
            <T
              v={[
                "No advertising request or impression. Free actions remain available when advertising is unavailable.",
                "Aucune requête ni impression publicitaire. Les actions gratuites restent accessibles sans publicité.",
                "لا توجد طلبات أو مشاهدات إعلانية. تبقى الإجراءات المجانية متاحة عند غياب الإعلان.",
              ]}
            />
          </p>
        </details>
      )}
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}
