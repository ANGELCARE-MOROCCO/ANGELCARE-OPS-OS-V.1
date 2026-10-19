"use client";
import { useState } from "react";
import { calculate } from "../../digital-customer-experience/model";
import {
  visibleFormFields,
  formValueErrors,
} from "../../digital-customer-experience/capabilities";
import { clampIndex, num, obj, rows, str, type Row } from "./model";
import {
  Button,
  Empty,
  ErrorNote,
  Progress,
  Source,
  type PlayerProps,
} from "./shared";
import { Reading } from "./Reading";
import { local, t } from "./copy";
import s from "./detail.module.css";
export function Tools({ d, locale, engine, state, update }: PlayerProps) {
  const inputs = rows(d.inputs),
    values = obj(state.values),
    result = obj(state.calculation),
    [error, setError] = useState(false),
    scenarios = Array.isArray(state.scenarios) ? state.scenarios : [];
  if (!inputs.length) return <Empty locale={locale} />;
  function run() {
    try {
      const numbers = Object.fromEntries(
          inputs.map((i) => [i.id, Number(values[i.id] ?? i.value)]),
        ),
        v = calculate(d, numbers);
      update({ calculation: v, toolResult: v.value, complete: true });
      setError(false);
    } catch {
      setError(true);
    }
  }
  return (
    <div className={s.toolLayout}>
      <section className={s.toolInputs}>
        <h2>{t("calculate", locale)}</h2>
        {inputs.map((i) => (
          <label key={i.id}>
            <span>
              {local(i, "label", locale)}{" "}
              {local(i, "unit", locale) ? (
                <small>· {local(i, "unit", locale)}</small>
              ) : null}
            </span>
            <input
              type="number"
              step={i.type === "integer" ? 1 : "any"}
              min={i.min}
              max={i.max}
              value={values[i.id] ?? i.value ?? ""}
              onChange={(e) => {
                update({
                  values: { ...values, [i.id]: e.target.value },
                  calculation: null,
                  toolResult: null,
                  complete: false,
                });
                setError(false);
              }}
            />
            <small>
              {i.min !== undefined ? i.min : ""}
              {i.max !== undefined ? " – " + i.max : ""}
            </small>
          </label>
        ))}
        <div className={s.controls}>
          <Button primary onClick={run}>
            {t("calculate", locale)}
          </Button>
          <Button
            onClick={() => {
              update({
                values: {},
                calculation: null,
                toolResult: null,
                complete: false,
                scenarios: [],
              });
              setError(false);
            }}
          >
            {t("reset", locale)}
          </Button>
        </div>
        {error ? <ErrorNote locale={locale} /> : null}
      </section>
      <section className={s.toolResult}>
        {typeof result.value === "number" ? (
          <>
            <span className={s.kicker}>{t("result", locale)}</span>
            <strong>
              {result.value.toLocaleString(locale)}
              <small>{local(d, "outputUnit", locale)}</small>
            </strong>
            {local(d, "methodology", locale) ? (
              <p>{local(d, "methodology", locale)}</p>
            ) : null}
            {local(d, "assumptions", locale) ? (
              <p>{local(d, "assumptions", locale)}</p>
            ) : null}
            {engine === "comparison" || engine === "interactive" ? (
              <Button
                disabled={scenarios.length >= 3}
                onClick={() =>
                  update({
                    scenarios: [
                      ...scenarios,
                      { values: { ...values }, value: result.value },
                    ],
                  })
                }
              >
                {t("compare", locale)} ({scenarios.length}/3)
              </Button>
            ) : null}
          </>
        ) : (
          <span className={s.resultPlaceholder}>{t("look", locale)}</span>
        )}
      </section>
      {scenarios.length ? (
        <div className={s.scenarios}>
          {scenarios.map((c: Record<string, any>, i: number) => (
            <article key={i}>
              <strong>
                {i + 1} · {c.value} {local(d, "outputUnit", locale)}
              </strong>
              {inputs.map((input) => (
                <p key={input.id}>
                  {local(input, "label", locale)}:{" "}
                  {c.values[input.id] ?? input.value}
                </p>
              ))}
              <Button
                onClick={() =>
                  update({
                    scenarios: scenarios.filter((_: any, n: number) => n !== i),
                  })
                }
              >
                {t("remove", locale)}
              </Button>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
export function Planners(props: PlayerProps) {
  const { m, d, locale, engine, state, update } = props,
    items = rows(d.items),
    values = obj(state.values);
  if (engine === "print" && rows(d.units).length) return <Reading {...props} />;
  if (!items.length) return <Empty locale={locale} />;
  const checkable = items.filter((i) => i.type === "checkbox"),
    checked = checkable.filter((i) => values[i.id] === true).length,
    editable =
      d.editable !== false &&
      engine !== "print" &&
      engine !== "template_gallery";
  return (
    <div className={s.planner}>
      <div className={s.plannerHeading}>
        <span className={s.kicker}>{t("private", locale)}</span>
        <h2>{m.title}</h2>
        {checkable.length ? (
          <Progress
            value={(checked / checkable.length) * 100}
            label={checked + " / " + checkable.length}
          />
        ) : null}
      </div>
      <div
        className={
          engine === "template_gallery" ? s.templateGrid : s.plannerGrid
        }
      >
        {items.map((item) => (
          <article
            key={item.id}
            className={`${s.plannerItem} ${values[item.id] === true ? s.checked : ""}`}
          >
            {item.assetId ? (
              <Source
                m={m}
                id={item.assetId}
                alt={local(item, "label", locale)}
              />
            ) : null}
            {item.type === "checkbox" ? (
              <label className={s.checkLabel}>
                <input
                  type="checkbox"
                  disabled={!editable && engine !== "checklist"}
                  checked={values[item.id] === true}
                  onChange={(e) =>
                    update({
                      values: { ...values, [item.id]: e.target.checked },
                      complete:
                        checkable.filter((i) =>
                          i.id === item.id
                            ? e.target.checked
                            : values[i.id] === true,
                        ).length === checkable.length,
                    })
                  }
                />
                <span>{local(item, "label", locale)}</span>
              </label>
            ) : (
              <label>
                <span>{local(item, "label", locale)}</span>
                {editable && item.type !== "fixed" ? (
                  item.type === "textarea" ? (
                    <textarea
                      value={values[item.id] ?? ""}
                      maxLength={4000}
                      onChange={(e) =>
                        update({
                          values: { ...values, [item.id]: e.target.value },
                        })
                      }
                    />
                  ) : item.type === "select" ? (
                    <select
                      value={values[item.id] ?? ""}
                      onChange={(e) =>
                        update({
                          values: { ...values, [item.id]: e.target.value },
                        })
                      }
                    >
                      <option value="">—</option>
                      {local(item, "options", locale)
                        .split("\n")
                        .filter(Boolean)
                        .map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                    </select>
                  ) : (
                    <input
                      type={
                        ["number", "date"].includes(item.type)
                          ? item.type
                          : "text"
                      }
                      value={values[item.id] ?? ""}
                      maxLength={4000}
                      onChange={(e) =>
                        update({
                          values: { ...values, [item.id]: e.target.value },
                        })
                      }
                    />
                  )
                ) : (
                  <p>
                    {local(item, "text", locale) ||
                      local(item, "value", locale) ||
                      str(values[item.id])}
                  </p>
                )}
              </label>
            )}
            {local(item, "help", locale) ? (
              <small>{local(item, "help", locale)}</small>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
export function Questionnaire({
  d,
  locale,
  engine,
  state,
  update,
}: PlayerProps) {
  const fields = rows(d.fields).filter(
      (f) => !["file", "email", "tel"].includes(f.type),
    ),
    values = obj(state.values),
    steps = [...new Set(fields.map((f) => num(f.step, 1)))].sort(
      (a, b) => a - b,
    ),
    index = clampIndex(state.index, steps.length),
    visible: Row[] = visibleFormFields(
      fields,
      values,
      engine === "multistep" ? steps[index] : undefined,
    ),
    [errors, setErrors] = useState<string[]>([]),
    [summary, setSummary] = useState(state.complete === true);
  if (!fields.length) return <Empty locale={locale} />;
  function valid(all = false) {
    const issues = formValueErrors(all ? fields : visible, values);
    setErrors(issues.map((e) => e.path));
    return !issues.length;
  }
  return (
    <div className={s.questionnaire}>
      <p className={s.callout}>{t("private", locale)}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valid(true)) {
            setSummary(true);
            update({ complete: true });
          }
        }}
      >
        {engine === "multistep" ? (
          <Progress
            value={((index + 1) / steps.length) * 100}
            label={index + 1 + " / " + steps.length}
          />
        ) : null}
        {visible.map((f) => (
          <label key={f.id} className={s.personalField}>
            <span>
              {local(f, "label", locale)}
              {f.required ? " *" : ""}
            </span>
            {f.type === "checkbox" ? (
              <input
                type="checkbox"
                checked={values[f.id] === true}
                onChange={(e) => {
                  setSummary(false);
                  update({
                    values: { ...values, [f.id]: e.target.checked },
                    complete: false,
                  });
                }}
              />
            ) : f.type === "select" ? (
              <select
                value={values[f.id] ?? ""}
                onChange={(e) => {
                  setSummary(false);
                  update({
                    values: { ...values, [f.id]: e.target.value },
                    complete: false,
                  });
                }}
              >
                <option value="">—</option>
                {local(f, "options", locale)
                  .split("\n")
                  .filter(Boolean)
                  .map((v) => (
                    <option key={v}>{v}</option>
                  ))}
              </select>
            ) : f.type === "textarea" ? (
              <textarea
                maxLength={num(f.max, 4000)}
                value={values[f.id] ?? ""}
                onChange={(e) => {
                  setSummary(false);
                  update({
                    values: { ...values, [f.id]: e.target.value },
                    complete: false,
                  });
                }}
              />
            ) : (
              <input
                type={["number", "date"].includes(f.type) ? f.type : "text"}
                min={f.min}
                max={f.max}
                maxLength={num(f.max, 4000)}
                value={values[f.id] ?? ""}
                onChange={(e) => {
                  setSummary(false);
                  update({
                    values: { ...values, [f.id]: e.target.value },
                    complete: false,
                  });
                }}
              />
            )}
            {local(f, "help", locale) ? (
              <small>{local(f, "help", locale)}</small>
            ) : null}
            {errors.includes("fields." + f.id) ? (
              <small className={s.error} role="alert">
                {t("required", locale)}
              </small>
            ) : null}
          </label>
        ))}
        <div className={s.controls}>
          {engine === "multistep" && index > 0 ? (
            <Button onClick={() => update({ index: index - 1 })}>
              {t("previous", locale)}
            </Button>
          ) : null}
          {engine === "multistep" && index < steps.length - 1 ? (
            <Button
              primary
              onClick={() => {
                if (valid()) update({ index: index + 1 });
              }}
            >
              {t("next", locale)}
            </Button>
          ) : (
            <Button primary type="submit">
              {t("getResult", locale)}
            </Button>
          )}
        </div>
      </form>
      {summary ? (
        <div className={s.summary} role="status">
          <h2>{t("summary", locale)}</h2>
          <dl>
            {rows(visibleFormFields(fields, values))
              .filter((f) => values[f.id] !== undefined)
              .map((f) => (
                <div key={f.id}>
                  <dt>{local(f, "label", locale)}</dt>
                  <dd>
                    {typeof values[f.id] === "boolean"
                      ? t(values[f.id] ? "yes" : "no", locale)
                      : String(values[f.id])}
                  </dd>
                </div>
              ))}
          </dl>
        </div>
      ) : null}
    </div>
  );
}
