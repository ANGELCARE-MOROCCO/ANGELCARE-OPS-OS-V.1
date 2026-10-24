"use client";
import Link from "next/link";
import { useState } from "react";
import { path, tr } from "../../catalogue";
import { asset, obj, rows, str, time, storyProfile, type Row } from "../model";
import { local, t } from "../copy";
import { Button, Source, type PlayerProps } from "../shared";
import {
  availableNodes,
  blankContinuity,
} from "../../../digital-customer-experience/continuity";
import { visibleFormFields } from "../../../digital-customer-experience/capabilities";
import s from "./experience.module.css";
export function ReadingIndex({ p }: { p: PlayerProps }) {
  const { m, d, locale: l, state, update } = p,
    units = rows(d.units),
    marks: string[] = Array.isArray(state.readingMarks)
      ? state.readingMarks
          .map((n: string | number) =>
            typeof n === "number" ? str(units[n]?.id) : n,
          )
          .filter(Boolean)
      : [],
    active =
      units.find((u) => u.id === state.readerUnitId) ||
      units[Number(state.index) || 0];
  return (
    <aside className={s.readingIndex}>
      <span className={s.eyebrow}>
        {tr(["READING DOSSIER", "DOSSIER DE LECTURE", "ملف القراءة"], l)}
      </span>
      <h2>
        {tr(
          [
            "A reference you can return to.",
            "Un repère à retrouver.",
            "مرجع يمكنك العودة إليه.",
          ],
          l,
        )}
      </h2>
      {str(d.rightsHolder) ? <p>{d.rightsHolder}</p> : null}
      {local(d, "source", l) ? <p>{local(d, "source", l)}</p> : null}
      {active ? (
        <Button
          aria-pressed={marks.includes(active.id)}
          onClick={() =>
            update({
              readingMarks: marks.includes(active.id)
                ? marks.filter((id) => id !== active.id)
                : [...marks, active.id],
            })
          }
        >
          {tr(
            [
              "Keep this reading position",
              "Garder ce repère de lecture",
              "احفظ موضع القراءة",
            ],
            l,
          )}{" "}
          {marks.includes(active.id) ? "✓" : "+"}
        </Button>
      ) : null}
      {marks.length ? (
        <ul>
          {units
            .filter((u) => marks.includes(u.id))
            .map((u) => (
              <li key={u.id}>
                <Button
                  onClick={() => {
                    update({ index: units.indexOf(u), readerUnitId: u.id });
                    document
                      .getElementById("kidflix-experience-player")
                      ?.scrollIntoView();
                  }}
                >
                  {local(u, "title", l) || String(units.indexOf(u) + 1)}
                </Button>
              </li>
            ))}
        </ul>
      ) : null}
      <small>
        {tr(
          [
            "Private bookmarks follow your continuity settings.",
            "Les repères privés suivent vos réglages de continuité.",
            "تتبع العلامات الخاصة إعدادات الاستمرارية لديك.",
          ],
          l,
        )}
      </small>
    </aside>
  );
}
export function StoryRoute({ p }: { p: PlayerProps }) {
  const { d, locale: l, state, update } = p,
    choices = rows(d.storyChoices),
    units = rows(d.units);
  return choices.length && !storyProfile(p.m).narration ? (
    <section className={s.storyRoute}>
      <span className={s.eyebrow}>
        {tr(["NARRATIVE PATHWAYS", "CHEMINS DU RÉCIT", "مسارات الحكاية"], l)}
      </span>
      <h2>
        {tr(
          [
            "See where a choice can lead.",
            "Voir où mène un choix.",
            "اكتشف إلى أين يقود الاختيار.",
          ],
          l,
        )}
      </h2>
      <div>
        {choices.map((c) => {
          const from = units.find((u) => u.id === c.unitId),
            to = units.find((u) => u.id === c.nextUnitId);
          return from && to ? (
            <article key={c.id}>
              <strong>{local(from, "title", l)}</strong>
              <span>↘ {local(c, "label", l) || local(c, "title", l)}</span>
              <Button
                onClick={() => {
                  update({ index: units.indexOf(to), readerUnitId: to.id });
                  document
                    .getElementById("kidflix-experience-player")
                    ?.scrollIntoView();
                }}
              >
                {local(to, "title", l)} →
              </Button>
            </article>
          ) : null;
        })}
      </div>
    </section>
  ) : null;
}
export function CurriculumMap({ p }: { p: PlayerProps }) {
  const { d, locale: l, state, update } = p,
    units = rows(d.units),
    completed: string[] = Array.isArray(state.completed) ? state.completed : [],
    ready = new Set(
      availableNodes(units, { ...blankContinuity(), completed }).map(
        (u) => u.id,
      ),
    ),
    modules = [
      ...new Set(
        units.map(
          (u) =>
            local(u, "module", l) ||
            tr(
              ["Learning sequence", "Séquence pédagogique", "تسلسل التعلم"],
              l,
            ),
        ),
      ),
    ];
  return (
    <section className={s.curriculumMap}>
      <span className={s.eyebrow}>
        {tr(
          [
            "CURRICULUM AT A GLANCE",
            "LE PROGRAMME EN UN REGARD",
            "نظرة على المنهج",
          ],
          l,
        )}
      </span>
      <h2>
        {tr(
          [
            "Understand the route before the next step.",
            "Comprendre le parcours avant l’étape suivante.",
            "افهم المسار قبل الخطوة التالية.",
          ],
          l,
        )}
      </h2>
      <div>
        {modules.map((module, n) => (
          <article key={module}>
            <span className={s.cardNumber}>
              {String(n + 1).padStart(2, "0")}
            </span>
            <h3>{module}</h3>
            {units
              .filter(
                (u) =>
                  (local(u, "module", l) ||
                    tr(
                      [
                        "Learning sequence",
                        "Séquence pédagogique",
                        "تسلسل التعلم",
                      ],
                      l,
                    )) === module,
              )
              .map((u) => (
                <Button
                  key={u.id}
                  disabled={!ready.has(u.id)}
                  aria-current={
                    units.indexOf(u) === state.index ? "step" : undefined
                  }
                  onClick={() => {
                    update({ index: units.indexOf(u) });
                    document
                      .getElementById("kidflix-experience-player")
                      ?.scrollIntoView();
                  }}
                >
                  {completed.includes(u.id)
                    ? "✓"
                    : ready.has(u.id)
                      ? "○"
                      : "▣"}{" "}
                  {local(u, "title", l)}
                  {u.required === false ? " · " + t("optional", l) : ""}
                </Button>
              ))}
          </article>
        ))}
      </div>
    </section>
  );
}
export function ObservationDesk({ p }: { p: PlayerProps }) {
  const { d, locale: l, state, update } = p,
    [draft, setDraft] = useState(""),
    notes = rows(state.observations),
    units = rows(d.units),
    unit = units[Number(state.index) || 0],
    position = Number(obj(obj(state.positions)[unit?.id]).position) || 0;
  return (
    <section className={s.observationDesk}>
      <div>
        <span className={s.eyebrow}>
          {tr(
            [
              "YOUR OBSERVATION DESK",
              "VOTRE CARNET D’OBSERVATION",
              "دفتر ملاحظاتك",
            ],
            l,
          )}
        </span>
        <h2>
          {tr(
            [
              "Keep what you noticed.",
              "Garder ce que vous avez remarqué.",
              "احتفظ بما لاحظته.",
            ],
            l,
          )}
        </h2>
        <p>
          {tr(
            [
              "Private notes stay with your personal progress. Sharing this resource shares its link only.",
              "Les notes restent dans votre progression privée. Le partage de la ressource transmet uniquement son lien.",
              "تبقى الملاحظات ضمن تقدمك الخاص. مشاركة المورد ترسل رابطه فقط.",
            ],
            l,
          )}
        </p>
      </div>
      <div>
        <label>
          {tr(["Observation", "Observation", "ملاحظة"], l)}
          <textarea
            value={draft}
            maxLength={1000}
            onChange={(e) => setDraft(e.target.value)}
          />
        </label>
        <Button
          disabled={!draft.trim() || notes.length >= 30}
          onClick={() => {
            update({
              observations: [
                ...notes,
                {
                  id: crypto.randomUUID(),
                  text: draft.trim(),
                  unitId: unit?.id || "",
                  at: position,
                },
              ],
            });
            setDraft("");
          }}
        >
          {tr(["Save note at", "Enregistrer à", "احفظ الملاحظة عند"], l)}{" "}
          {time(position)}
        </Button>
        <ol>
          {notes.map((n) => (
            <li key={n.id}>
              <small>
                {units.find((u) => u.id === n.unitId)
                  ? local(units.find((u) => u.id === n.unitId)!, "title", l)
                  : ""}{" "}
                · {time(Number(n.at) || 0)}
              </small>
              <p>{n.text}</p>
              <Button
                aria-label={tr(
                  ["Remove note", "Supprimer la note", "حذف الملاحظة"],
                  l,
                )}
                onClick={() =>
                  update({ observations: notes.filter((v) => v.id !== n.id) })
                }
              >
                {t("remove", l)}
              </Button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
export function AssessmentBrief({ p }: { p: PlayerProps }) {
  const { d, locale: l, state } = p,
    questions = rows(d.questions),
    review: string[] = Array.isArray(state.reviewIds) ? state.reviewIds : [],
    feedback =
      d.feedbackPolicy === "immediate"
        ? tr(
            [
              "After checking an answer",
              "Après vérification d’une réponse",
              "بعد التحقق من الإجابة",
            ],
            l,
          )
        : d.feedbackPolicy === "score_only"
          ? tr(["Score only", "Score uniquement", "النتيجة فقط"], l)
          : tr(["After submission", "Après validation", "بعد التسليم"], l);
  return (
    <aside className={s.assessmentBrief}>
      <span className={s.eyebrow}>
        {tr(["ASSESSMENT BRIEF", "CADRE DE L’ÉVALUATION", "إطار التقييم"], l)}
      </span>
      <dl>
        <div>
          <dt>{tr(["Questions", "Questions", "الأسئلة"], l)}</dt>
          <dd>{questions.length}</dd>
        </div>
        {p.engine === "timed" ? (
          <div>
            <dt>
              {tr(["Time allowance", "Temps imparti", "الوقت المتاح"], l)}
            </dt>
            <dd>{Number(d.minutes) || 10} min</dd>
          </div>
        ) : null}
        <div>
          <dt>{tr(["Feedback", "Retours", "الملاحظات"], l)}</dt>
          <dd>{feedback}</dd>
        </div>
        <div>
          <dt>
            {tr(
              ["Review markers", "Repères de révision", "علامات المراجعة"],
              l,
            )}
          </dt>
          <dd>{review.length}</dd>
        </div>
        {Number(d.passingScore) > 0 ? (
          <div>
            <dt>
              {tr(
                [
                  "Published passing threshold",
                  "Seuil de réussite publié",
                  "حد النجاح المنشور",
                ],
                l,
              )}
            </dt>
            <dd>{d.passingScore}%</dd>
          </div>
        ) : null}
      </dl>
      {local(d, "instructions", l) ? (
        <p>{local(d, "instructions", l)}</p>
      ) : null}
    </aside>
  );
}
export function ScenarioLedger({ p }: { p: PlayerProps }) {
  const scenarios = rows(p.state.scenarios),
    inputs = rows(p.d.inputs);
  if (!scenarios.length) return null;
  return (
    <section className={s.scenarioLedger}>
      <span className={s.eyebrow}>
        {tr(
          [
            "COMPARE YOUR ASSUMPTIONS",
            "COMPARER VOS HYPOTHÈSES",
            "قارن افتراضاتك",
          ],
          p.locale,
        )}
      </span>
      <h2>
        {tr(
          [
            "The same model. Different decisions.",
            "Le même modèle. Des décisions différentes.",
            "النموذج نفسه وقرارات مختلفة.",
          ],
          p.locale,
        )}
      </h2>
      <div className={s.tableScroll}>
        <table>
          <thead>
            <tr>
              <th>{tr(["Scenario", "Scénario", "السيناريو"], p.locale)}</th>
              {inputs.map((i) => (
                <th key={i.id}>{local(i, "label", p.locale)}</th>
              ))}
              <th>{t("result", p.locale)}</th>
              <th>{t("open", p.locale)}</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((scenario, n) => (
              <tr key={n}>
                <th>{n + 1}</th>
                {inputs.map((i) => (
                  <td key={i.id}>
                    {String(obj(scenario.values)[i.id] ?? i.value ?? "")}
                  </td>
                ))}
                <td>
                  {Number(scenario.value).toLocaleString(p.locale)}{" "}
                  {local(p.d, "outputUnit", p.locale)}
                </td>
                <td>
                  <Button
                    onClick={() => {
                      p.update({
                        values: { ...obj(scenario.values) },
                        calculation: null,
                        toolResult: null,
                        complete: false,
                      });
                      document
                        .getElementById("kidflix-experience-player")
                        ?.scrollIntoView();
                    }}
                  >
                    {tr(
                      [
                        "Restore inputs",
                        "Reprendre les saisies",
                        "استعادة المدخلات",
                      ],
                      p.locale,
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
export function PlannerOrder({ p }: { p: PlayerProps }) {
  const all = rows(p.d.items),
    ids: Array<string> = Array.isArray(p.state.plannerOrder)
      ? p.state.plannerOrder
      : [],
    items =
      ids.length === all.length &&
      new Set(ids).size === all.length &&
      ids.every((id) => all.some((i) => i.id === id))
        ? ids.map((id) => all.find((i) => i.id === id)!)
        : all,
    editable =
      p.d.editable !== false &&
      !["print", "template_gallery"].includes(p.engine);
  function move(index: number, offset: number) {
    const order = items.map((i) => i.id),
      to = index + offset;
    if (to < 0 || to >= order.length) return;
    [order[index], order[to]] = [order[to], order[index]];
    p.update({ plannerOrder: order });
  }
  return items.length ? (
    <section className={s.plannerOrder}>
      <span className={s.eyebrow}>
        {tr(
          ["YOUR WORKING SEQUENCE", "VOTRE ORDRE DE TRAVAIL", "تسلسل عملك"],
          p.locale,
        )}
      </span>
      <h2>
        {tr(
          [
            "Arrange the plan around your day.",
            "Organiser le plan selon votre journée.",
            "رتب الخطة بحسب يومك.",
          ],
          p.locale,
        )}
      </h2>
      <ol>
        {items.map((item, i) => (
          <li key={item.id}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <div>
              <strong>{local(item, "label", p.locale)}</strong>
              {local(item, "due", p.locale) ? (
                <small>{local(item, "due", p.locale)}</small>
              ) : null}
            </div>
            {editable ? (
              <div>
                <Button
                  disabled={i === 0}
                  aria-label={
                    tr(["Move earlier", "Avancer", "نقل للأمام"], p.locale) +
                    " " +
                    local(item, "label", p.locale)
                  }
                  onClick={() => move(i, -1)}
                >
                  ↑
                </Button>
                <Button
                  disabled={i === items.length - 1}
                  aria-label={
                    tr(["Move later", "Reculer", "نقل للخلف"], p.locale) +
                    " " +
                    local(item, "label", p.locale)
                  }
                  onClick={() => move(i, 1)}
                >
                  ↓
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  ) : null;
}
export function PrivateFormIndex({ p }: { p: PlayerProps }) {
  const fields: Row[] = visibleFormFields(
      rows(p.d.fields).filter(
        (f) => !["file", "email", "tel"].includes(f.type),
      ),
      obj(p.state.values),
    ),
    values = obj(p.state.values),
    done = fields.filter((f) =>
      f.type === "checkbox"
        ? values[f.id] === true
        : values[f.id] !== undefined && String(values[f.id]).trim() !== "",
    ).length;
  return (
    <aside className={s.privateFormIndex}>
      <span className={s.eyebrow}>
        {tr(["PRIVATE REFLECTION", "RÉFLEXION PRIVÉE", "تأمل خاص"], p.locale)}
      </span>
      <h2>
        {tr(
          [
            "A space for your own answers.",
            "Un espace pour vos propres réponses.",
            "مساحة لإجاباتك الخاصة.",
          ],
          p.locale,
        )}
      </h2>
      <strong>
        {done} / {fields.length}
      </strong>
      <p>
        {tr(
          [
            "Answered visible fields. This is a private questionnaire, with no submission to an administrative team.",
            "Champs visibles renseignés. Ce questionnaire est privé et ne transmet aucune demande à une équipe administrative.",
            "حقول ظاهرة تمت الإجابة عنها. هذا استبيان خاص ولا يرسل طلباً إلى فريق إداري.",
          ],
          p.locale,
        )}
      </p>
      <ol>
        {fields.map((f) => (
          <li key={f.id}>
            <span>
              {(
                f.type === "checkbox"
                  ? values[f.id] === true
                  : values[f.id] !== undefined &&
                    String(values[f.id]).trim() !== ""
              )
                ? "✓"
                : "○"}
            </span>{" "}
            {local(f, "label", p.locale)}
            {f.required ? " *" : ""}
          </li>
        ))}
      </ol>
    </aside>
  );
}
export function OfferMatrix({ p }: { p: PlayerProps }) {
  if (p.m.audience === "child") return null;
  const offers = rows(p.d.offers)
    .map((row) => ({ row, offer: obj(p.m.bindings.offers?.[row.nativeId]) }))
    .filter((v) => v.offer.url);
  return offers.length > 1 ? (
    <section className={s.offerMatrix}>
      <span className={s.eyebrow}>
        {tr(
          ["NATIVE CONTINUATIONS", "PROLONGEMENTS NATIFS", "امتدادات أصلية"],
          p.locale,
        )}
      </span>
      <h2>
        {tr(
          [
            "Compare the available next steps.",
            "Comparer les suites disponibles.",
            "قارن الخطوات التالية المتاحة.",
          ],
          p.locale,
        )}
      </h2>
      <div className={s.tableScroll}>
        <table>
          <thead>
            <tr>
              <th>{tr(["Offer", "Offre", "العرض"], p.locale)}</th>
              <th>
                {tr(
                  ["Published price", "Prix publié", "السعر المنشور"],
                  p.locale,
                )}
              </th>
              <th>{tr(["Continue", "Poursuivre", "متابعة"], p.locale)}</th>
            </tr>
          </thead>
          <tbody>
            {offers.map(({ row, offer }) => (
              <tr key={row.id}>
                <th>{offer.title || local(row, "label", p.locale)}</th>
                <td>
                  {typeof offer.price === "number"
                    ? offer.price.toLocaleString(p.locale) +
                      " " +
                      str(offer.currency)
                    : "—"}
                </td>
                <td>
                  <Link className={s.textLink} href={offer.url}>
                    {t("nativeOffer", p.locale)} ↗
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  ) : null;
}
export function BundleOverview({ p }: { p: PlayerProps }) {
  const steps = rows(p.d.steps),
    completed: string[] = Array.isArray(p.state.completed)
      ? p.state.completed
      : [],
    required = steps.filter(
      (step) => p.d.completion === "all_steps" || step.required !== false,
    ),
    ready = availableNodes(steps, { ...blankContinuity(), completed }),
    done = required.filter((step) => completed.includes(str(step.id))).length;
  return (
    <aside className={s.bundleOverview}>
      <span className={s.eyebrow}>
        {tr(
          ["PATHWAY CONTROL ROOM", "TABLEAU DE PARCOURS", "لوحة المسار"],
          p.locale,
        )}
      </span>
      <h2>
        {done} / {required.length}
      </h2>
      <p>
        {tr(
          [
            "Required steps complete",
            "Étapes requises terminées",
            "خطوات مطلوبة مكتملة",
          ],
          p.locale,
        )}
      </p>
      <div className={s.miniStats}>
        <span>
          {steps.length} {tr(["resources", "ressources", "موارد"], p.locale)}
        </span>
        <span>
          {steps.filter((s) => s.required === false).length}{" "}
          {t("optional", p.locale)}
        </span>
      </div>
      {ready.find((step) => !completed.includes(str(step.id))) ? (
        <a href="#kidflix-experience-player" className={s.primary}>
          {tr(
            [
              "Find the next available step",
              "Retrouver la prochaine étape disponible",
              "اعثر على الخطوة التالية المتاحة",
            ],
            p.locale,
          )}{" "}
          ↗
        </a>
      ) : null}
      <p>
        {tr(
          [
            "Progress follows the published prerequisites and the completion rules of each resource.",
            "La progression suit les prérequis publiés et les règles de complétion de chaque ressource.",
            "يتبع التقدم المتطلبات المنشورة وقواعد إكمال كل مورد.",
          ],
          p.locale,
        )}
      </p>
    </aside>
  );
}
