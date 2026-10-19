"use client";
import { useState, useEffect } from "react";
import { formValueErrors, visibleFormFields } from "../../capabilities";
import {
  availableNodes,
  blankContinuity,
  completedJourney,
  journeyProgress,
} from "../../continuity";
import { safeHref } from "../../model";
import { array, localized, number, object, text, type Data } from "../../types";
import {
  Badge,
  Button,
  Empty,
  Field,
  Icon,
  Switch,
  T,
  download,
  useUI,
} from "../ui";
import { RuntimePreview } from "../Preview";
import { StageProps, unitText } from "./shared";
import s from "../workspace.module.css";

export function FormStage({
  data: d,
  locale,
  engine,
  onPersonal,
  initialPersonal = {},
}: StageProps) {
  const fields = array(d.fields).filter(
      (f) => !["file", "email", "tel"].includes(text(f.type)),
    ),
    steps = [...new Set(fields.map((f) => number(f.step, 1)))].sort(
      (a, b) => a - b,
    ),
    [index, setIndex] = useState(0),
    [values, setValues] = useState<Data>(object(initialPersonal.values)),
    [errors, setErrors] = useState<ReturnType<typeof formValueErrors>>([]),
    [result, setResult] = useState(false),
    visible = visibleFormFields(
      fields,
      values,
      engine === "multistep" ? steps[index] : undefined,
    );
  useEffect(
    () => onPersonal?.({ values, complete: result }),
    [values, result, onPersonal],
  );
  function valid(all = false) {
    const v = formValueErrors(all ? fields : visible, values);
    setErrors(v);
    return !v.length;
  }
  return (
    <div data-engine={engine}>
      <div className={s.notice}>
        <Icon name="ShieldCheck" />
        <T
          v={[
            "Private questionnaire · no operator submission",
            "Questionnaire privé · aucun envoi à un opérateur",
            "استبيان خاص · دون إرسال لموظف",
          ]}
        />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valid(true)) setResult(true);
        }}
      >
        {visible.map((f) => {
          const id = text(f.id);
          return (
            <div key={id}>
              <Field
                label={unitText(f, "label", locale) + (f.required ? " *" : "")}
                hint={unitText(f, "help", locale)}
              >
                {f.type === "textarea" ? (
                  <textarea
                    value={text(values[id])}
                    onChange={(e) =>
                      setValues((old) => ({ ...old, [id]: e.target.value }))
                    }
                  />
                ) : f.type === "select" ? (
                  <select
                    value={text(values[id])}
                    onChange={(e) =>
                      setValues((old) => ({ ...old, [id]: e.target.value }))
                    }
                  >
                    <option value="">—</option>
                    {unitText(f, "options", locale)
                      .split("\n")
                      .filter(Boolean)
                      .map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                  </select>
                ) : f.type === "checkbox" ? (
                  <input
                    type="checkbox"
                    checked={values[id] === true}
                    onChange={(e) =>
                      setValues((old) => ({ ...old, [id]: e.target.checked }))
                    }
                  />
                ) : (
                  <input
                    type={
                      ["number", "date"].includes(text(f.type))
                        ? text(f.type)
                        : "text"
                    }
                    value={text(values[id])}
                    onChange={(e) =>
                      setValues((old) => ({ ...old, [id]: e.target.value }))
                    }
                  />
                )}
              </Field>
              {errors
                .filter((x) => x.path === "fields." + id)
                .map((x, i) => (
                  <p role="alert" key={i}>
                    {x.message}
                  </p>
                ))}
            </div>
          );
        })}
        <div className={s.previewActions}>
          {engine === "multistep" && index < steps.length - 1 ? (
            <Button
              kind="primary"
              onClick={() => {
                if (valid()) setIndex((n) => n + 1);
              }}
            >
              <T v={["Continue", "Continuer", "متابعة"]} />
            </Button>
          ) : (
            <Button type="submit" kind="primary">
              <T v={["Get my result", "Voir mon résultat", "عرض نتيجتي"]} />
            </Button>
          )}
          <Button
            onClick={() => {
              setValues({});
              setResult(false);
              setErrors([]);
              setIndex(0);
            }}
          >
            <T v={["Start again", "Recommencer", "ابدأ مجدداً"]} />
          </Button>
        </div>
      </form>
      {result && (
        <div className={s.previewResult} role="status">
          <h3>
            <T
              v={["Your private summary", "Votre résumé privé", "ملخصك الخاص"]}
            />
          </h3>
          {fields
            .filter((f) => values[text(f.id)] !== undefined)
            .map((f) => (
              <p key={text(f.id)}>
                <strong>{unitText(f, "label", locale)}</strong>:{" "}
                {String(values[text(f.id)])}
              </p>
            ))}
          <T
            v={[
              "No request, account or message created.",
              "Aucune demande, aucun compte ni message créé.",
              "لم يتم إنشاء طلب أو حساب أو رسالة.",
            ]}
          />
        </div>
      )}
    </div>
  );
}
export function CommunityStage({ data: d, locale, engine }: StageProps) {
  return (
    <div data-engine={engine}>
      <div className={s.notice}>
        <Icon name="BookOpen" />
        <T
          v={[
            "Read-only collection. Public posting is inactive; existing history stays retained.",
            "Collection en lecture seule. Publication publique désactivée ; historique conservé.",
            "مجموعة للقراءة فقط. النشر العام غير مفعل؛ السجل محفوظ.",
          ]}
        />
      </div>
      {array(d.rules).map((r) => (
        <article className={s.rowCard} key={text(r.id)}>
          <h3>{unitText(r, "title", locale)}</h3>
          <p className={s.previewText}>{unitText(r, "text", locale)}</p>
        </article>
      ))}
    </div>
  );
}
export function CommerceStage({
  data: d,
  bindings,
  locale,
  engine,
}: StageProps) {
  const [selected, setSelected] = useState(""),
    records = object(bindings.records),
    content = object(records[text(d.contentId)]),
    offers = object(bindings.offers);
  return (
    <div data-engine={engine}>
      {(engine === "shoppable" || engine === "course_product") && (
        <article className={s.readingPage}>
          <h3>{text(content.key)}</h3>
          <p>{text(object(content.definition).body) || text(content.body)}</p>
          {engine === "course_product" && (
            <p>
              <T v={["Linked course", "Cours lié", "الدورة المرتبطة"]} />:{" "}
              {text(object(records[text(d.experienceId)]).key)}
            </p>
          )}
        </article>
      )}
      {array(d.offers).map((o) => {
        const offer = object(offers[text(o.nativeId)]),
          nativeAction =
            text(o.action) || text(offer.continuation) || "details";
        return (
          <div key={text(o.id)} className={s.rowCard}>
            <Badge>{text(offer.kind) || "unresolved"}</Badge>
            <h3>{text(offer.title) || unitText(o, "label", locale)}</h3>
            <p>
              {offer.price == null
                ? "Price evidence unavailable"
                : number(offer.price).toLocaleString(locale) +
                  " " +
                  text(offer.currency)}{" "}
              · {text(offer.availability)}
            </p>
            <small>
              {text(o.role)} · {text(d.deliveryAuthority)}
            </small>
            <div className={s.previewActions}>
              <Button
                disabled={!offer.id}
                onClick={() => setSelected(text(o.id))}
              >
                <T
                  v={[
                    "Inspect native continuation",
                    "Inspecter la suite native",
                    "فحص المتابعة الأصلية",
                  ]}
                />
              </Button>
              {safeHref(offer.url) && (
                <a
                  className={s.button}
                  href={text(offer.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <T
                    v={[
                      "Open canonical offer",
                      "Ouvrir l’offre canonique",
                      "فتح العرض الأصلي",
                    ]}
                  />
                </a>
              )}
            </div>
            {selected === o.id && (
              <div className={s.notice}>
                <Icon name="ArrowUpRight" />
                <div>
                  <strong>{nativeAction}</strong>
                  <p>{text(offer.url)}</p>
                  <p>
                    <T
                      v={[
                        "The native authority owns availability, access, payment and delivery. Inspection creates no commercial outcome.",
                        "L’autorité native gère disponibilité, accès, paiement et livraison. L’inspection ne crée aucun résultat commercial.",
                        "تملك الجهة الأصلية التوفر والوصول والدفع والتسليم. لا ينشئ الفحص نتيجة تجارية.",
                      ]}
                    />
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {engine === "delivery" && (
        <div className={s.notice}>
          <Icon name="LockKeyhole" />
          <div>
            <strong>{text(d.deliveryAuthority)}</strong>
            <p>
              <T
                v={[
                  "Delivery requires a recognized native order or entitlement receipt.",
                  "La livraison exige un reçu de commande ou droit natif reconnu.",
                  "يتطلب التسليم إيصال طلب أو أهلية أصلية معترفاً بها.",
                ]}
              />
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
export function BundleStage({
  data: d,
  bindings,
  locale,
  engine,
  onPersonal,
  initialPersonal = {},
}: StageProps) {
  const steps = array(d.steps),
    [active, setActive] = useState(""),
    [childStates, setChildStates] = useState<Data>(
      object(initialPersonal.childStates),
    ),
    [completed, setCompleted] = useState<string[]>(
      Array.isArray(initialPersonal.completed)
        ? initialPersonal.completed.map(String)
        : [],
    ),
    [values, setValues] = useState<Data>({}),
    [restarted, setRestarted] = useState(false),
    state = {
      ...blankContinuity(),
      completed,
      results: Object.entries(childStates).map(([id, value]) => ({
        ...object(value),
        id,
      })),
    },
    available = new Set(
      availableNodes(steps, state, values).map((s) => text(s.id)),
    ),
    { preview } = useUI(),
    records = object(bindings.records),
    required = steps.filter(
      (s) => d.completion === "all_steps" || s.required !== false,
    ),
    progress = journeyProgress(steps, state, values),
    done = progress.complete,
    current = steps.find(
      (s) => !completed.includes(text(s.id)) && available.has(text(s.id)),
    );
  useEffect(
    () => onPersonal?.({ completed, childStates, values, complete: done }),
    [completed, childStates, values, done, onPersonal],
  );
  const selected = steps.find((s) => s.id === active),
    bound = object(records[text(selected?.experienceId)]);
  return (
    <div data-engine={engine}>
      {selected && bound.id && (
        <div className={s.rowCard}>
          <Button onClick={() => setActive("")}>
            <T v={["Back to journey", "Retour au parcours", "العودة للمسار"]} />
          </Button>
          <RuntimePreview
            key={active}
            record={
              {
                id: text(bound.id),
                kind: "experience",
                key: text(bound.key),
                title: text(bound.title),
                family: text(bound.family) || null,
                revision: 1,
                data: object(bound.definition),
                tenant_id: null,
                territory_id: null,
              } as any
            }
            bindings={object(bound.bindings)}
            locale={locale}
            onExperienceState={(value) => {
              setChildStates((old) => ({ ...old, [active]: value }));
              if (value.complete === true)
                setCompleted((old) =>
                  old.includes(active) ? old : [...old, active],
                );
            }}
            onGrade={
              bound.releaseId
                ? (answers) =>
                    import("../ui").then(({ mutate }) =>
                      mutate({
                        action: "master_preview_grade",
                        releaseId: bound.releaseId,
                        answers,
                      }),
                    )
                : undefined
            }
            onActivity={
              bound.releaseId
                ? (input) =>
                    import("../ui").then(({ mutate }) =>
                      mutate({
                        action: "master_preview_activity",
                        releaseId: bound.releaseId,
                        input,
                      }),
                    )
                : undefined
            }
          />
        </div>
      )}
      {engine === "dashboard" && (
        <div className={s.previewResult}>
          <strong>
            {steps.length
              ? Math.round((completed.length / steps.length) * 100)
              : 0}
            %
          </strong>
          <p>
            {completed.length}/{steps.length} ·{" "}
            {done ? "complete" : "in progress"}
          </p>
          <div className={s.progressTrack}>
            <span
              style={{
                width: steps.length
                  ? (completed.length / steps.length) * 100 + "%"
                  : "0%",
              }}
            />
          </div>
        </div>
      )}
      {steps.some((s) => s.condition && s.condition !== "always") && (
        <details className={s.advanced}>
          <summary>
            <T
              v={[
                "Branch scenario inputs",
                "Valeurs du scénario de branche",
                "قيم سيناريو التفرع",
              ]}
            />
          </summary>
          {[
            ...new Set(
              steps.map((s) => text(s.conditionTarget)).filter(Boolean),
            ),
          ].map((key) => (
            <Field label={key} key={key}>
              <input
                value={text(values[key])}
                onChange={(e) =>
                  setValues((old) => ({ ...old, [key]: e.target.value }))
                }
              />
            </Field>
          ))}
        </details>
      )}
      <div className={engine === "starter" ? s.definitionBoard : s.journey}>
        {(engine === "sequential" ? (current ? [current] : []) : steps).map(
          (step, i) => {
            const id = text(step.id),
              bound = object(records[text(step.experienceId)]),
              ready = available.has(id) && Boolean(bound.id);
            return (
              <div className={s.journeyStep} key={id}>
                <span className={s.stepNumber}>{steps.indexOf(step) + 1}</span>
                <div style={{ flex: 1 }}>
                  <strong>
                    {unitText(step, "title", locale) || text(bound.key)}
                  </strong>
                  <p>
                    {step.required === false ? "optional" : "required"} ·{" "}
                    {text(step.accessDependency)}
                  </p>
                  <small>
                    {text(step.prerequisites)} ·{" "}
                    {text(step.releaseId) || "current released child"}
                  </small>
                </div>
                <div className={s.actions}>
                  <Button disabled={!ready} onClick={() => setActive(id)}>
                    <T
                      v={[
                        "Try child in this journey",
                        "Essayer l’étape dans ce parcours",
                        "تجربة الخطوة في هذا المسار",
                      ]}
                    />
                  </Button>
                  <Button
                    disabled={!bound.id}
                    onClick={() =>
                      preview(
                        text(step.experienceId),
                        text(step.releaseId) || undefined,
                      )
                    }
                    icon="Eye"
                  >
                    <T
                      v={[
                        "Inspect child",
                        "Inspecter l’enfant",
                        "فحص التجربة الفرعية",
                      ]}
                    />
                  </Button>
                  <Button
                    disabled={!ready}
                    onClick={() =>
                      setCompleted((old) => [...new Set([...old, id])])
                    }
                  >
                    {completed.includes(id) ? (
                      "✓"
                    ) : (
                      <T
                        v={[
                          "Complete scenario step",
                          "Terminer l’étape du scénario",
                          "إكمال مرحلة السيناريو",
                        ]}
                      />
                    )}
                  </Button>
                </div>
              </div>
            );
          },
        )}
      </div>
      {done && (
        <Badge tone="green">
          <T
            v={[
              "Aggregate completion reached",
              "Complétion agrégée atteinte",
              "تم الوصول للإكمال الإجمالي",
            ]}
          />
        </Badge>
      )}
      <div className={s.previewActions}>
        <Button
          disabled={d.allowRestart === false}
          icon="RotateCcw"
          onClick={() => {
            setCompleted([]);
            setValues({});
            setRestarted(true);
          }}
        >
          <T
            v={[
              "Restart scenario",
              "Recommencer le scénario",
              "إعادة بدء السيناريو",
            ]}
          />
        </Button>
        <Button
          icon="Download"
          onClick={() =>
            download(
              "journey-preview-state.json",
              JSON.stringify({ preview: true, completed, values }, null, 2),
              "application/json",
            )
          }
        >
          <T
            v={[
              "Save scenario progress",
              "Enregistrer la progression du scénario",
              "حفظ تقدم السيناريو",
            ]}
          />
        </Button>
      </div>
      {restarted && (
        <p className={s.subtitle}>{text(d.restartScope) || "journey_only"}</p>
      )}
    </div>
  );
}
