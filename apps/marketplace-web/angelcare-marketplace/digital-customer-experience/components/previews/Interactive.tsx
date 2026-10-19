"use client";
import { choiceOptions, shuffled } from "../../experience-depth";
import { useEffect, useRef, useState, useMemo } from "react";
import { calculate, scoreQuestions } from "../../model";
import { array, localized, number, object, text, type Data } from "../../types";
import { Badge, Button, Empty, Field, Switch, T, download } from "../ui";
import { Nav, Source, type StageProps, unitText } from "./shared";
import s from "../workspace.module.css";
import { HtmlActivityPreview } from "../HtmlActivity";

export function AssessmentStage({
  data: d,
  locale,
  engine,
  onOutcome,
  onGrade,
  onPersonal,
  bindings,
  initialPersonal = {},
}: StageProps) {
  const questionKey = JSON.stringify(d.questions);
  const questions = useMemo(
      () =>
        d.shuffle === true ? shuffled(array(d.questions)) : array(d.questions),
      [questionKey, d.shuffle],
    ),
    [answers, setAnswers] = useState<Record<string, string>>(
      object(initialPersonal.answers) as Record<string, string>,
    ),
    [index, setIndex] = useState(number(initialPersonal.index)),
    [started, setStarted] = useState(false),
    [seconds, setSeconds] = useState(number(d.minutes, 10) * 60),
    [attempts, setAttempts] = useState(number(initialPersonal.attempts)),
    [result, setResult] = useState<ReturnType<typeof scoreQuestions> | null>(
      null,
    );
  const [grading, setGrading] = useState(false),
    [gradeError, setGradeError] = useState("");
  const timed = engine === "timed",
    practice = engine === "practice",
    limit = number(d.attemptLimit),
    canRetry =
      d.retryPolicy !== "disabled" &&
      (!limit || attempts < limit) &&
      (d.retryPolicy !== "until_pass" ||
        !result ||
        result.percent < number(d.passingScore, 70)),
    q = questions[index];
  useEffect(
    () => onPersonal?.({ answers, index, complete: false, score: null }),
    [answers, index, onPersonal],
  );
  async function submit() {
    if (grading) return;
    setGrading(true);
    setStarted(false);
    setGradeError("");
    try {
      const outcome = onGrade
        ? await onGrade(answers)
        : scoreQuestions(
            questions.map((q) => ({
              ...q,
              answer: unitText(q, "answer", locale),
              explanation: unitText(q, "explanation", locale),
            })),
            answers,
          );
      setResult(outcome);
      onOutcome?.(outcome.percent);
      onPersonal?.({
        score: outcome.percent,
        passed: outcome.percent >= number(d.passingScore, 70),
        skills: outcome.skills || {},
        attempts: attempts + 1,
        complete: true,
      });
      setAttempts((n) => n + 1);
    } catch (e) {
      setGradeError((e as Error).message);
      setStarted(true);
    } finally {
      setGrading(false);
    }
  }
  useEffect(() => {
    if (!timed || !started || result) return;
    const timer = setInterval(
      () => setSeconds((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [timed, started, result]);
  useEffect(() => {
    if (timed && started && seconds === 0) submit();
  }, [seconds, timed, started]);
  const answered = questions.filter((q) => answers[text(q.id)]?.length).length;
  function question(item: Data) {
    const id = text(item.id),
      type = text(item.type),
      choices =
        type === "true_false"
          ? [
              { label: "true", key: "true" },
              { label: "false", key: "false" },
            ]
          : choiceOptions(item, locale);
    return (
      <fieldset className={s.rowCard} key={id}>
        <legend>{unitText(item, "prompt", locale)}</legend>
        {item.assetId && (
          <Source
            id={item.assetId}
            bindings={bindings}
            alt={unitText(item, "prompt", locale)}
          />
        )}{" "}
        {["choice", "multi", "true_false"].includes(type) ? (
          choices.map((choice, i) => {
            const value = choice.key,
              multi = type === "multi",
              selected = multi
                ? (answers[id] || "").split(",").includes(value)
                : answers[id] === value;
            return (
              <label key={i} className={s.quizOption}>
                <input
                  type={multi ? "checkbox" : "radio"}
                  disabled={Boolean(result)}
                  name={id}
                  checked={selected}
                  onChange={() =>
                    setAnswers((old) => ({
                      ...old,
                      [id]: multi
                        ? (selected
                            ? (old[id] || "")
                                .split(",")
                                .filter((v) => v !== value)
                            : [
                                ...(old[id] || "").split(",").filter(Boolean),
                                value,
                              ]
                          ).join(",")
                        : value,
                    }))
                  }
                />
                {choice.label}
              </label>
            );
          })
        ) : (
          <input
            aria-label={unitText(item, "prompt", locale)}
            disabled={Boolean(result)}
            type={type === "number" ? "number" : "text"}
            value={answers[id] || ""}
            onChange={(e) =>
              setAnswers((old) => ({ ...old, [id]: e.target.value }))
            }
          />
        )}{" "}
        {practice && d.feedbackPolicy === "immediate" && answers[id] && (
          <details>
            <summary>
              <T
                v={[
                  "Inspect practice feedback",
                  "Voir le retour de pratique",
                  "فحص ملاحظات التدريب",
                ]}
              />
            </summary>
            <p>{unitText(item, "explanation", locale)}</p>
          </details>
        )}
      </fieldset>
    );
  }
  return (
    <div data-engine={engine}>
      <div className={s.previewActions}>
        <Badge>
          {answered}/{questions.length}
        </Badge>
        <Badge>
          <T v={["Attempts", "Tentatives", "المحاولات"]} />: {attempts}
          {limit ? "/" + limit : ""}
        </Badge>
        {timed && (
          <Badge tone={seconds < 30 ? "orange" : "blue"}>
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
          </Badge>
        )}
      </div>
      {!questions.length ? (
        <Empty
          title={
            <T
              v={[
                "Author assessment questions",
                "Rédigez les questions",
                "حرر أسئلة التقييم",
              ]}
            />
          }
        />
      ) : !started && !result ? (
        <Button
          kind="primary"
          disabled={Boolean(limit && attempts >= limit)}
          onClick={() => {
            setStarted(true);
            setSeconds(number(d.minutes, 10) * 60);
          }}
          icon="Play"
        >
          <T
            v={[
              "Start preview attempt",
              "Démarrer une tentative d’aperçu",
              "بدء محاولة معاينة",
            ]}
          />
        </Button>
      ) : null}
      {started && (
        <>
          {engine === "quiz" || timed
            ? q && question(q)
            : questions.map(question)}
          {(engine === "quiz" || timed) && (
            <Nav index={index} count={questions.length} onIndex={setIndex} />
          )}
          <Button
            kind="primary"
            onClick={() => void submit()}
            disabled={!answered || grading}
          >
            <T v={["Get my result", "Voir mon résultat", "عرض نتيجتي"]} />
          </Button>
        </>
      )}
      {grading && (
        <p role="status">
          <T
            v={[
              "Checking result…",
              "Calcul du résultat…",
              "جارٍ حساب النتيجة…",
            ]}
          />
        </p>
      )}
      {gradeError && <p role="alert">{gradeError}</p>}
      {result && (
        <div className={s.previewResult}>
          <strong>{result.percent}%</strong>
          <p>
            {result.earned}/{result.total} ·{" "}
            {result.percent >= number(d.passingScore, 70)
              ? "PASS"
              : "RETRY / REVIEW"}
          </p>
          {result.percent >= number(d.passingScore, 70) && (
            <p>{text(d.successText)}</p>
          )}
          {d.feedbackPolicy !== "score_only" &&
            result.results.map((r) => (
              <div className={s.rowCard} key={r.id}>
                <strong>
                  {r.correct ? "✓" : "—"}{" "}
                  {unitText(
                    questions.find((q) => q.id === r.id) || {},
                    "prompt",
                    locale,
                  )}
                </strong>
                <p>{r.explanation}</p>
                <Badge>{r.points}</Badge>
              </div>
            ))}
          <div className={s.previewActions}>
            <Button
              disabled={!canRetry}
              onClick={() => {
                setAnswers({});
                setIndex(0);
                setResult(null);
                setStarted(false);
                onPersonal?.({ score: null, complete: false });
              }}
              icon="RotateCcw"
            >
              <T
                v={[
                  "Retry within policy",
                  "Réessayer selon la politique",
                  "إعادة المحاولة حسب السياسة",
                ]}
              />
            </Button>
            <Button
              icon="Download"
              onClick={() =>
                download(
                  "assessment-preview-result.json",
                  JSON.stringify(
                    { preview: true, attempt: attempts, ...result },
                    null,
                    2,
                  ),
                  "application/json",
                )
              }
            >
              <T
                v={[
                  "Save preview result",
                  "Enregistrer le résultat d’aperçu",
                  "حفظ نتيجة المعاينة",
                ]}
              />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
export function ActivityStage({
  data: d,
  bindings,
  locale,
  engine,
  onActivity,
  onPersonal,
  initialPersonal = {},
}: StageProps) {
  const tasks = array(d.tasks),
    activityEngine = text(d.engine),
    pairEngine = ["matching", "memory"].includes(activityEngine),
    [selected, setSelected] = useState<string[]>([]),
    [matched, setMatched] = useState<string[]>([]),
    [values, setValues] = useState<Record<string, string>>(
      object(initialPersonal.values) as Record<string, string>,
    ),
    [attempts, setAttempts] = useState(number(initialPersonal.attempts)),
    [step, setStep] = useState(0),
    [message, setMessage] = useState(""),
    [complete, setComplete] = useState(false),
    [running, setRunning] = useState(false),
    [seconds, setSeconds] = useState(number(d.challengeSeconds, 120)),
    [pending, setPending] = useState(false),
    generation = useRef(0),
    inFlight = useRef(false),
    limit = number(d.attemptLimit),
    locked =
      Boolean(limit && attempts >= limit) ||
      (engine === "challenge" && seconds === 0),
    current = tasks[step],
    visible =
      engine === "stepper" || engine === "simulation"
        ? current
          ? [current]
          : []
        : tasks;
  useEffect(
    () => onPersonal?.({ values, complete, attempts, matched, selected }),
    [values, complete, attempts, matched, selected, onPersonal],
  );
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  useEffect(() => {
    if (engine !== "challenge" || !running || complete || locked) return;
    const t = setInterval(() => setSeconds((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [engine, running, complete, locked]);
  async function pair(ids: string[]) {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    const g = generation.current;
    try {
      const correct = onActivity
        ? (await onActivity({ pair: ids })).correct
        : text(tasks.find((t) => t.id === ids[0])?.answer) ===
          text(tasks.find((t) => t.id === ids[1])?.answer);
      if (g !== generation.current) return;
      setAttempts((v) => v + 1);
      if (correct) {
        const all = [...new Set([...matched, ...ids])];
        setMatched(all);
        setComplete(all.length === tasks.length);
        setSelected([]);
        setMessage("✓");
      } else {
        setSelected([]);
        setMessage(
          "Try another pair / Essayez une autre paire / جرّب زوجاً آخر",
        );
      }
    } catch (e) {
      if (g === generation.current) setMessage((e as Error).message);
    } finally {
      if (g === generation.current) {
        setPending(false);
        inFlight.current = false;
      }
    }
  }
  function pick(id: string) {
    if (
      locked ||
      pending ||
      inFlight.current ||
      matched.includes(id) ||
      complete
    )
      return;
    setRunning(true);
    if (pairEngine) {
      const next = selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id].slice(-2);
      setSelected(next);
      if (next.length === 2) void pair(next);
    } else if (activityEngine === "sequence")
      setSelected((old) =>
        old.includes(id) ? old.filter((x) => x !== id) : [...old, id],
      );
  }
  async function check() {
    if (locked || pending || inFlight.current || complete) return;
    inFlight.current = true;
    setPending(true);
    setRunning(true);
    const g = generation.current;
    try {
      const scope =
          engine === "stepper" || engine === "simulation" ? visible : tasks,
        correct = onActivity
          ? (
              await onActivity({
                values,
                selected,
                targetIds: scope.map((t) => text(t.id)),
              })
            ).correct
          : activityEngine === "sequence"
            ? selected.length === tasks.length &&
              selected.every(
                (id, i) =>
                  text(tasks.find((t) => t.id === id)?.answer) ===
                  String(i + 1),
              )
            : scope.length > 0 &&
              scope.every((t) => values[text(t.id)] === text(t.answer));
      if (g !== generation.current) return;
      setAttempts((v) => v + 1);
      if (correct) {
        if (
          (engine === "stepper" || engine === "simulation") &&
          step < tasks.length - 1
        ) {
          setStep((v) => v + 1);
          setMessage("✓ " + unitText(current, "feedback", locale));
        } else {
          setComplete(true);
          setMessage("✓ " + text(d.goal));
        }
      } else
        setMessage(
          "Review the authored rules / Vérifiez les règles / راجع القواعد",
        );
    } catch (e) {
      if (g === generation.current) setMessage((e as Error).message);
    } finally {
      if (g === generation.current) {
        setPending(false);
        inFlight.current = false;
      }
    }
  }
  return (
    <div data-engine={engine}>
      {object(d.htmlActivity).enabled === true &&
        activityEngine === "choice" && (
          <HtmlActivityPreview
            data={d}
            bindings={bindings}
            locale={locale}
            onChoice={(id, value) => {
              setValues((old) => ({ ...old, [id]: value }));
              setRunning(true);
            }}
          />
        )}
      <p className={s.previewText}>
        {localized(d, "goal", locale) || text(d.goal)}
      </p>
      <div className={s.previewActions}>
        <Badge>{activityEngine}</Badge>
        <Badge>
          {attempts}
          {limit ? "/" + limit : ""}
        </Badge>
        {engine === "challenge" && <Badge>{seconds}s</Badge>}
        {(engine === "stepper" || engine === "simulation") && (
          <Badge>
            {step + 1}/{tasks.length}
          </Badge>
        )}
      </div>
      {pairEngine ? (
        <div className={s.activityGrid}>
          {tasks.map((t) => (
            <button
              key={text(t.id)}
              disabled={
                locked || pending || complete || matched.includes(text(t.id))
              }
              aria-pressed={selected.includes(text(t.id))}
              onClick={() => pick(text(t.id))}
            >
              {activityEngine === "memory" &&
              !selected.includes(text(t.id)) &&
              !matched.includes(text(t.id))
                ? "?"
                : unitText(t, "prompt", locale)}
              {matched.includes(text(t.id)) ? " ✓" : ""}
            </button>
          ))}
        </div>
      ) : (
        visible.map((t) => (
          <div className={s.rowCard} key={text(t.id)}>
            <h3>{unitText(t, "prompt", locale)}</h3>
            {activityEngine === "sequence" ? (
              <Button
                disabled={locked || pending || complete}
                onClick={() => pick(text(t.id))}
              >
                {selected.includes(text(t.id))
                  ? selected.indexOf(text(t.id)) + 1
                  : "+"}
              </Button>
            ) : (
              <Field
                label={
                  <T
                    v={[
                      "Choose an answer",
                      "Choisir une réponse",
                      "اختر إجابة",
                    ]}
                  />
                }
              >
                <select
                  disabled={locked || pending || complete}
                  value={values[text(t.id)] || ""}
                  onChange={(e) => {
                    setValues((old) => ({
                      ...old,
                      [text(t.id)]: e.target.value,
                    }));
                    setRunning(true);
                  }}
                >
                  <option value="">—</option>
                  {unitText(t, "choices", locale)
                    .split("\n")
                    .filter(Boolean)
                    .map((choice, i) => (
                      <option
                        key={i}
                        value={activityEngine === "choice" ? String(i) : choice}
                      >
                        {choice}
                      </option>
                    ))}
                </select>
              </Field>
            )}
            {d.hintsEnabled !== false && t.hint && (
              <details>
                <summary>
                  <T v={["Hint", "Indice", "تلميح"]} />
                </summary>
                {unitText(t, "hint", locale)}
              </details>
            )}
          </div>
        ))
      )}
      <div className={s.previewActions}>
        {!pairEngine && (
          <Button
            disabled={locked || pending || complete}
            kind="primary"
            onClick={() => void check()}
          >
            <T v={["Check my result", "Voir mon résultat", "عرض نتيجتي"]} />
          </Button>
        )}
        {pairEngine && selected.length === 2 && (
          <Button
            disabled={locked || pending}
            onClick={() => void pair(selected)}
          >
            <T
              v={[
                "Retry checking this pair",
                "Réessayer cette paire",
                "إعادة فحص الزوج",
              ]}
            />
          </Button>
        )}
        <Button
          icon="RotateCcw"
          disabled={pending || Boolean(limit && attempts >= limit)}
          onClick={() => {
            generation.current++;
            setSelected([]);
            setMatched([]);
            setValues({});
            setStep(0);
            setMessage("");
            setComplete(false);
            setRunning(false);
            setSeconds(number(d.challengeSeconds, 120));
          }}
        >
          <T
            v={[
              "Restart within policy",
              "Recommencer selon la politique",
              "إعادة البدء حسب السياسة",
            ]}
          />
        </Button>
      </div>
      {pending && (
        <p role="status">
          <T v={["Checking…", "Vérification…", "جارٍ التحقق…"]} />
        </p>
      )}
      {message && (
        <p className={s.notice} role="status">
          {message}
        </p>
      )}
      {complete && (
        <Badge tone="green">
          <T
            v={[
              "Activity goal completed in preview",
              "Objectif terminé dans l’aperçu",
              "اكتمل هدف النشاط في المعاينة",
            ]}
          />
        </Badge>
      )}
      <details className={s.advanced}>
        <summary>
          <T
            v={[
              "Accessible alternative",
              "Alternative accessible",
              "البديل الميسر",
            ]}
          />
        </summary>
        <p>
          {localized(d, "accessibleText", locale) || text(d.accessibleText)}
        </p>
      </details>
    </div>
  );
}
export function ToolStage({
  data: d,
  locale,
  engine,
  onPersonal,
  initialPersonal = {},
}: StageProps) {
  const localizedModel = {
    ...d,
    methodology: localized(d, "methodology", locale) || text(d.methodology),
    assumptions: localized(d, "assumptions", locale) || text(d.assumptions),
    outputUnit: localized(d, "outputUnit", locale) || text(d.outputUnit),
  };
  const defaults = () =>
      Object.fromEntries(
        array(d.inputs).map((i) => [text(i.id), number(i.value)]),
      ),
    [values, setValues] = useState<Record<string, number>>(() =>
      Object.keys(object(initialPersonal.values)).length
        ? (object(initialPersonal.values) as Record<string, number>)
        : defaults(),
    ),
    [other, setOther] = useState<Record<string, number>>(defaults),
    [result, setResult] = useState<Data | null>(null),
    [second, setSecond] = useState<Data | null>(null),
    [error, setError] = useState("");
  useEffect(
    () =>
      onPersonal?.({
        values,
        toolResult: result?.value ?? null,
        complete: Boolean(result),
      }),
    [values, result, onPersonal],
  );
  function run(left = values, right = other) {
    try {
      setResult(calculate(localizedModel, left));
      if (engine === "comparison") setSecond(calculate(localizedModel, right));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function inputs(
    value: Record<string, number>,
    set: (value: Record<string, number>) => void,
  ) {
    return array(d.inputs).map((input) => (
      <Field
        key={text(input.id)}
        label={unitText(input, "label", locale)}
        hint={
          text(input.unit) + " · " + number(input.min) + "…" + number(input.max)
        }
      >
        <input
          type={input.type === "range" ? "range" : "number"}
          min={number(input.min)}
          max={number(input.max, 100000)}
          step={input.type === "integer" ? 1 : number(input.step, 1)}
          value={value[text(input.id)] ?? ""}
          onChange={(e) => {
            const next = { ...value, [text(input.id)]: Number(e.target.value) };
            set(next);
            if (engine === "interactive") run(next);
          }}
        />
        {input.type === "range" && <output>{value[text(input.id)]}</output>}
      </Field>
    ));
  }
  return (
    <div data-engine={engine}>
      <Badge>
        {text(d.model) || "custom_arithmetic"} · v{number(d.modelVersion, 1)}
      </Badge>
      <p>{localized(d, "methodology", locale) || text(d.methodology)}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <div className={engine === "comparison" ? s.scenarioGrid : s.formGrid}>
          <section
            className={engine === "comparison" ? s.scenarioCard : undefined}
          >
            {engine === "comparison" && (
              <h3>
                <T v={["Scenario A", "Scénario A", "السيناريو أ"]} />
              </h3>
            )}
            {inputs(values, setValues)}
          </section>
          {engine === "comparison" && (
            <section className={s.scenarioCard}>
              <h3>
                <T v={["Scenario B", "Scénario B", "السيناريو ب"]} />
              </h3>
              {inputs(other, setOther)}
            </section>
          )}
        </div>
        <div className={s.previewActions}>
          <Button type="submit" kind="primary">
            <T
              v={
                engine === "form_result"
                  ? [
                      "Show explained result",
                      "Afficher le résultat expliqué",
                      "عرض النتيجة المفسرة",
                    ]
                  : engine === "comparison"
                    ? [
                        "Compare scenarios",
                        "Comparer les scénarios",
                        "مقارنة السيناريوهات",
                      ]
                    : ["Calculate", "Calculer", "احسب"]
              }
            />
          </Button>
          <Button
            onClick={() => {
              setValues(defaults());
              setOther(defaults());
              setResult(null);
              setSecond(null);
              setError("");
            }}
          >
            <T v={["Reset values", "Réinitialiser", "إعادة ضبط القيم"]} />
          </Button>
        </div>
      </form>
      {error && (
        <div className={s.notice} role="alert">
          {error}
        </div>
      )}
      {result && (
        <div className={s.previewResult}>
          <strong>
            {number(result.value).toLocaleString(locale)} {text(result.unit)}
          </strong>
          {second && (
            <p>
              B: {number(second.value).toLocaleString(locale)}{" "}
              {text(second.unit)} · Δ{" "}
              {number(result.value) - number(second.value)}
            </p>
          )}
          <p>{text(result.methodology)}</p>
          <p>{text(result.assumptions)}</p>
          {d.exportAllowed !== false && (
            <Button
              icon="Download"
              onClick={() =>
                download(
                  "tool-preview-result.json",
                  JSON.stringify(
                    {
                      preview: true,
                      inputs: values,
                      result,
                      comparison: second,
                    },
                    null,
                    2,
                  ),
                  "application/json",
                )
              }
            >
              <T
                v={[
                  "Export explained result",
                  "Exporter le résultat expliqué",
                  "تصدير النتيجة المفسرة",
                ]}
              />
            </Button>
          )}
        </div>
      )}
      <details className={s.advanced}>
        <summary>
          <T
            v={[
              "Model assumptions and bounds",
              "Hypothèses et limites du modèle",
              "افتراضات النموذج وحدوده",
            ]}
          />
        </summary>
        <p>{localized(d, "assumptions", locale) || text(d.assumptions)}</p>
        <p>
          {text(d.operation)} · {number(d.precision, 2)} decimal places
        </p>
      </details>
    </div>
  );
}
export function PlannerStage({
  data: d,
  record,
  locale,
  engine,
  onPersonal,
  initialPersonal = {},
}: StageProps) {
  const items = array(d.items),
    [checks, setChecks] = useState<Record<string, boolean>>(
      object(initialPersonal.checks) as Record<string, boolean>,
    ),
    [values, setValues] = useState<Record<string, string>>(
      object(initialPersonal.values) as Record<string, string>,
    ),
    [copy, setCopy] = useState(false),
    [saved, setSaved] = useState<Data | null>(null),
    editable = engine === "editable" || engine === "checklist" || copy;
  useEffect(
    () => onPersonal?.({ values: { ...values, ...checks }, checks }),
    [values, checks, onPersonal],
  );
  return (
    <div data-engine={engine}>
      {engine === "template_gallery" && !copy ? (
        <div className={s.definitionBoard}>
          {items.map((item) => (
            <button key={text(item.id)} onClick={() => setCopy(true)}>
              <IconForType type={text(item.type)} />
              <div>
                <strong>{unitText(item, "label", locale)}</strong>
                <small>{unitText(item, "value", locale)}</small>
              </div>
            </button>
          ))}
        </div>
      ) : (
        items.map((item) => {
          const id = text(item.id),
            type = text(item.type),
            label = unitText(item, "label", locale),
            value = values[id] ?? unitText(item, "value", locale);
          return (
            <div className={s.rowCard} key={id}>
              {type === "checkbox" ? (
                <Switch
                  label={label}
                  disabled={!editable}
                  value={Boolean(checks[id])}
                  onChange={(v) => setChecks((old) => ({ ...old, [id]: v }))}
                />
              ) : (
                <Field label={label + (item.required ? " *" : "")}>
                  {!editable || type === "fixed" ? (
                    <p className={s.previewText}>{value || "—"}</p>
                  ) : type === "textarea" ? (
                    <textarea
                      value={value}
                      onChange={(e) =>
                        setValues((old) => ({ ...old, [id]: e.target.value }))
                      }
                    />
                  ) : type === "select" ? (
                    <select
                      value={value}
                      onChange={(e) =>
                        setValues((old) => ({ ...old, [id]: e.target.value }))
                      }
                    >
                      <option value="">—</option>
                      {unitText(item, "options", locale)
                        .split("\n")
                        .filter(Boolean)
                        .map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                    </select>
                  ) : (
                    <input
                      type={["date", "number"].includes(type) ? type : "text"}
                      min={number(item.min)}
                      max={number(item.max, 100)}
                      value={value}
                      onChange={(e) =>
                        setValues((old) => ({ ...old, [id]: e.target.value }))
                      }
                    />
                  )}
                </Field>
              )}
              <small>{unitText(item, "due", locale)}</small>
            </div>
          );
        })
      )}
      {engine === "checklist" && (
        <Badge>
          {
            items.filter((i) => i.type === "checkbox" && checks[text(i.id)])
              .length
          }
          /{items.filter((i) => i.type === "checkbox").length}
        </Badge>
      )}
      <div className={s.previewActions}>
        <Button
          onClick={() => {
            setCopy(true);
            setChecks({});
            setValues({});
          }}
          icon="Copy"
        >
          <T
            v={[
              "Create personal preview copy",
              "Créer une copie personnelle d’aperçu",
              "إنشاء نسخة معاينة شخصية",
            ]}
          />
        </Button>
        {editable && d.savingPolicy !== "export_only" && (
          <Button icon="Save" onClick={() => setSaved({ checks, values })}>
            <T
              v={[
                "Save preview copy",
                "Enregistrer la copie d’aperçu",
                "حفظ نسخة المعاينة",
              ]}
            />
          </Button>
        )}
        {saved && (
          <Button
            onClick={() => {
              setChecks(object(saved.checks) as Record<string, boolean>);
              setValues(object(saved.values) as Record<string, string>);
            }}
          >
            <T
              v={[
                "Restore saved preview copy",
                "Restaurer la copie d’aperçu",
                "استعادة نسخة المعاينة المحفوظة",
              ]}
            />
          </Button>
        )}
        {d.exportAllowed !== false && (
          <Button
            icon="Download"
            onClick={() =>
              download(
                record.key + "-preview-copy.json",
                JSON.stringify(
                  {
                    preview: true,
                    definitionId: record.id,
                    revision: record.revision,
                    checks,
                    values,
                  },
                  null,
                  2,
                ),
                "application/json",
              )
            }
          >
            <T
              v={[
                "Export personal copy",
                "Exporter la copie personnelle",
                "تصدير النسخة الشخصية",
              ]}
            />
          </Button>
        )}
      </div>
      {saved && (
        <Badge tone="green">
          <T
            v={[
              "Copy held in this staff preview",
              "Copie conservée dans cet aperçu interne",
              "النسخة محفوظة في هذه المعاينة الداخلية",
            ]}
          />
        </Badge>
      )}
    </div>
  );
}
function IconForType({ type }: { type: string }) {
  return (
    <span className={s.stepNumber}>
      {type === "checkbox" ? "✓" : type === "date" ? "◷" : "T"}
    </span>
  );
}
