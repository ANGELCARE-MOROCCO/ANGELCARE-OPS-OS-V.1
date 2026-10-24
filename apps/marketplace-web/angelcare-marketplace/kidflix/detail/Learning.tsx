"use client";
import { useEffect, useRef, useState } from "react";
import {
  availableNodes,
  blankContinuity,
} from "../../digital-customer-experience/continuity";
import { asset, clampIndex, num, obj, rows, str, type Row } from "./model";
import {
  action,
  Button,
  Editorial,
  Empty,
  ErrorNote,
  Modal,
  Progress,
  Source,
  type PlayerProps,
} from "./shared";
import { MediaPlayer } from "./Media";
import { Assessment } from "./Interactive";
import { local, t } from "./copy";
import s from "./detail.module.css";
export function Learning(props: PlayerProps) {
  const { m, d, locale, state, update } = props,
    units = rows(d.units),
    index = clampIndex(state.index, units.length),
    unit = units[index],
    completed = Array.isArray(state.completed)
      ? state.completed.filter((id: string) => units.some((u) => u.id === id))
      : [],
    ready = new Set(
      availableNodes(units as any, { ...blankContinuity(), completed }).map(
        (u) => u.id,
      ),
    ),
    required = units.filter(
      (u) => d.completion === "all_steps" || u.required !== false,
    ),
    done =
      required.length > 0 &&
      required.every((u) => completed.includes(u.id)) &&
      (d.completion !== "assessment_pass" ||
        num(obj(state.assessment).score, -1) >= num(d.passingScore, 70)),
    [certificate, setCertificate] = useState(false),
    assessment = obj(
      m.bindings.records?.[
        d.certificatePolicy?.assessmentId || unit?.assessmentId
      ],
    ),
    hasAssessment = assessment.family === "assessments";
  useEffect(() => {
    if (state.complete !== done) update({ complete: done });
  }, [done, state.complete]);
  function mark() {
    if (unit && ready.has(unit.id))
      update({ completed: [...new Set([...completed, unit.id])] });
  }
  if (!unit) return <Empty locale={locale} />;
  const a = asset(m, unit.assetId),
    timed = a && (a.mime.startsWith("video/") || a.mime.startsWith("audio/")),
    percent = required.length
      ? (required.filter((u) => completed.includes(u.id)).length /
          required.length) *
        100
      : 0;
  return (
    <div className={s.learning}>
      <Progress
        value={percent}
        label={
          t("progress", locale) +
          " · " +
          completed.length +
          " / " +
          units.length
        }
      />
      <div className={s.learningLayout}>
        <section className={s.lesson}>
          <span className={s.kicker}>
            {local(unit, "module", locale) ||
              t("step", locale) + " " + (index + 1)}
          </span>
          <h2>{local(unit, "title", locale)}</h2>
          {timed ? (
            <MediaPlayer
              key={unit.id}
              {...props}
              d={{
                ...d,
                completionPolicy: unit.lessonCompletion || "explicit",
                completionPercent: unit.completionPercent,
              }}
              unit={unit}
              video={a.mime.startsWith("video/")}
              onComplete={mark}
            />
          ) : a ? (
            <Source
              m={m}
              id={unit.assetId}
              alt={local(unit, "title", locale)}
              pdf={a.mime === "application/pdf"}
            />
          ) : null}
          {unit.contentId && m.bindings.records?.[unit.contentId] ? (
            <Editorial
              m={m.bindings.records[unit.contentId]}
              data={obj(m.bindings.records[unit.contentId].definition)}
              locale={locale}
            />
          ) : local(unit, "text", locale) ? (
            <p className={s.prose}>{local(unit, "text", locale)}</p>
          ) : null}
          <div className={s.controls}>
            {!timed ||
            !unit.lessonCompletion ||
            unit.lessonCompletion === "explicit" ? (
              <Button
                primary
                disabled={!ready.has(unit.id) || completed.includes(unit.id)}
                onClick={mark}
              >
                {t(
                  completed.includes(unit.id) ? "completed" : "complete",
                  locale,
                )}
              </Button>
            ) : null}
            <Button
              disabled={
                index + 1 >= units.length || !ready.has(units[index + 1]?.id)
              }
              onClick={() => update({ index: index + 1 })}
            >
              {t("next", locale)}
            </Button>
          </div>
          {str(unit.resourceIds) ? (
            <div className={s.chapterPills}>
              {str(unit.resourceIds)
                .split(",")
                .map((id) => units.find((u) => u.id === id.trim()))
                .filter(Boolean)
                .map((resource) => (
                  <Button
                    key={resource!.id}
                    onClick={() => update({ index: units.indexOf(resource!) })}
                  >
                    {local(resource!, "title", locale)}
                  </Button>
                ))}
            </div>
          ) : null}
        </section>
        <aside className={s.curriculum}>
          <h2>{t("chapters", locale)}</h2>
          {units.map((u, i) => (
            <button
              key={u.id}
              aria-current={i === index ? "step" : undefined}
              disabled={!ready.has(u.id)}
              onClick={() => update({ index: i })}
            >
              <span className={s.stepNumber}>
                {completed.includes(u.id)
                  ? "✓"
                  : String(i + 1).padStart(2, "0")}
              </span>
              <span>
                <small>{local(u, "module", locale)}</small>
                <strong>{local(u, "title", locale)}</strong>
                <small>
                  {u.required === false
                    ? t("optional", locale)
                    : t("required", locale)}
                  {!ready.has(u.id) ? " · " + t("locked", locale) : ""}
                </small>
              </span>
            </button>
          ))}
        </aside>
      </div>
      {hasAssessment ? (
        <section className={s.linkedAssessment}>
          <h2>{assessment.title}</h2>
          <Assessment
            m={assessment}
            d={obj(assessment.definition)}
            locale={locale}
            engine="quiz"
            state={obj(state.assessment)}
            update={(patch) =>
              update({ assessment: { ...obj(state.assessment), ...patch } })
            }
          />
        </section>
      ) : props.engine === "assessment_path" && rows(d.questions).length ? (
        <Assessment
          {...props}
          engine="quiz"
          state={obj(state.assessment)}
          update={(patch) =>
            update({ assessment: { ...obj(state.assessment), ...patch } })
          }
        />
      ) : null}
      {done ? (
        <div className={s.success}>
          <h2>{t("completed", locale)}</h2>
        </div>
      ) : null}
      {!props.preview &&
      obj(d.certificatePolicy).enabled === true &&
      (!Array.isArray(d.certificatePolicy.locales) ||
        d.certificatePolicy.locales.includes(locale)) ? (
        <div className={s.certificate}>
          <div>
            <h2>{t("certificate", locale)}</h2>
            <p>{t("certificateHelp", locale)}</p>
          </div>
          <Button
            primary
            disabled={d.certificatePolicy.requiresCompletion !== false && !done}
            onClick={() => setCertificate(true)}
          >
            {t("certificate", locale)}
          </Button>
        </div>
      ) : null}
      {certificate ? (
        <Modal
          title={t("certificate", locale)}
          locale={locale}
          onClose={() => setCertificate(false)}
        >
          <Certificate {...props} />
        </Modal>
      ) : null}
    </div>
  );
}
function Certificate({ m, d, locale, state }: PlayerProps) {
  const [details, setDetails] = useState<Row>({
      learnerName: "",
      requesterName: "",
      email: "",
      phone: "",
      contactLocale: locale,
      consent: false,
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    [receipt, setReceipt] = useState(""),
    attempt = useRef(""),
    ids = useRef({
      evidence: crypto.randomUUID(),
      request: crypto.randomUUID(),
      hash: "",
    }),
    controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(false);
    controller.current = new AbortController();
    try {
      const hash = JSON.stringify(details);
      if (hash !== ids.current.hash) {
        ids.current.request = crypto.randomUUID();
        ids.current.hash = hash;
      }
      if (!attempt.current) {
        const v = await action(
          m.key,
          locale,
          m.releaseId,
          "certificate_attempt",
          {
            requestId: ids.current.evidence,
            completedUnits: state.completed || [],
            answers: obj(state.assessment?.answers),
          },
          controller.current.signal,
        );
        if (!str(v.attemptId)) throw Error("MISSING_RECEIPT");
        attempt.current = v.attemptId;
      }
      const v = await action(
        m.key,
        locale,
        m.releaseId,
        "certificate_request",
        { requestId: ids.current.request, attemptId: attempt.current, details },
        controller.current.signal,
      );
      const ref = str(v.reference) || str(v.request?.reference) || str(v.id);
      if (!ref) throw Error("MISSING_RECEIPT");
      setReceipt(ref);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError(true);
    } finally {
      setBusy(false);
    }
  }
  return receipt ? (
    <div className={s.success} role="status">
      <h2>{t("received", locale)}</h2>
      <p>
        {t("reference", locale)}: <strong>{receipt}</strong>
      </p>
    </div>
  ) : (
    <form className={s.certificateForm} onSubmit={send}>
      <p>{t("certificateHelp", locale)}</p>
      {(["learnerName", "requesterName", "email", "phone"] as const).map(
        (key, i) => (
          <label key={key}>
            <span>
              {t(
                (["learner", "requester", "email", "phone"] as const)[i],
                locale,
              )}
            </span>
            <input
              type={
                key === "email" ? "email" : key === "phone" ? "tel" : "text"
              }
              required={key !== "phone"}
              maxLength={key === "email" ? 254 : 160}
              autoComplete={
                key === "email" ? "email" : key === "phone" ? "tel" : "name"
              }
              value={details[key]}
              onChange={(e) =>
                setDetails((v) => ({ ...v, [key]: e.target.value }))
              }
            />
          </label>
        ),
      )}
      <label className={s.checkLabel}>
        <input
          type="checkbox"
          required
          checked={details.consent}
          onChange={(e) =>
            setDetails((v) => ({ ...v, consent: e.target.checked }))
          }
        />
        {t("consent", locale)}
      </label>
      <Button type="submit" primary disabled={busy}>
        {busy ? t("loading", locale) : t("send", locale)}
      </Button>
      {error ? <ErrorNote locale={locale} /> : null}
    </form>
  );
}
