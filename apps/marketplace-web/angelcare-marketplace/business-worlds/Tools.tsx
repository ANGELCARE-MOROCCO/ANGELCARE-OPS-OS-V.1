"use client";
import { useId, useState } from "react";
import { ArrowRight, Check, CheckCircle2, ClipboardList } from "lucide-react";
import type { Words } from "../storefront-immersive/content";
import { B, tr, w } from "./content";
import { Picture, useWorld } from "./Shared";
import s from "./business.module.css";
export interface ExplorerChoice {
  label: Words;
  title: Words;
  body: Words;
  facts: Words[];
  photo?: string;
}
export function Explorer({
  dimension,
  choices,
  variant = "panel",
}: {
  dimension: string;
  choices: ExplorerChoice[];
  variant?:
    | "panel"
    | "itinerary"
    | "workspace"
    | "evidence"
    | "pathway"
    | "continuum";
}) {
  const { locale, setContext } = useWorld(),
    [active, setActive] = useState(0),
    id = useId(),
    choice = choices[active];
  return (
    <div
      className={`${s.explorer} ${s[variant]}`}
      data-business-tool={dimension}
    >
      <div
        className={s.explorerTabs}
        role="tablist"
        aria-label={tr(B.guide, locale)}
      >
        {choices.map((c, i) => (
          <button
            key={c.label.en}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={i === active}
            aria-controls={`${id}-panel`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => {
              setActive(i);
              setContext(dimension, tr(c.label, locale));
            }}
            onKeyDown={(e) => {
              const step =
                e.key === "ArrowRight"
                  ? locale === "ar"
                    ? -1
                    : 1
                  : e.key === "ArrowLeft"
                    ? locale === "ar"
                      ? 1
                      : -1
                    : 0;
              if (!step && e.key !== "Home" && e.key !== "End") return;
              e.preventDefault();
              const next =
                e.key === "Home"
                  ? 0
                  : e.key === "End"
                    ? choices.length - 1
                    : (i + step + choices.length) % choices.length;
              setActive(next);
              setContext(dimension, tr(choices[next].label, locale));
              document.getElementById(`${id}-tab-${next}`)?.focus();
            }}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            {tr(c.label, locale)}
            <ArrowRight size={14} />
          </button>
        ))}
      </div>
      <div
        className={s.explorerBody}
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${active}`}
        tabIndex={0}
      >
        {choice.photo ? (
          <Picture name={choice.photo} alt={tr(choice.label, locale)} />
        ) : null}
        <div>
          <span className={s.kicker}>
            {tr(B.guide, locale)} / {String(active + 1).padStart(2, "0")}
          </span>
          <h3>{tr(choice.title, locale)}</h3>
          <p>{tr(choice.body, locale)}</p>
          <ul>
            {choice.facts.map((f) => (
              <li key={f.en}>
                <CheckCircle2 size={17} />
                <span>{tr(f, locale)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
export function PreparedEvidence() {
  const { locale, setContext } = useWorld(),
    [checked, setChecked] = useState<number[]>([]),
    labels = [
      w(
        "Objectifs et périmètre envisagé",
        "Objectives and proposed scope",
        "الأهداف والنطاق المقترح",
      ),
      w(
        "Organisation et responsabilités",
        "Organisation and responsibilities",
        "التنظيم والمسؤوليات",
      ),
      w(
        "Pratiques et supports disponibles",
        "Available practices and materials",
        "الممارسات والوثائق المتوفرة",
      ),
      w(
        "Questions et points à examiner",
        "Questions and points to examine",
        "الأسئلة والنقاط التي يجب فحصها",
      ),
    ];
  return (
    <div
      className={s.evidenceChecklist}
      data-business-tool="evidence-preparation"
    >
      <div>
        <ClipboardList size={40} />
        <h3>
          {tr(
            w(
              "Avant le premier échange",
              "Before the first discussion",
              "قبل المناقشة الأولى",
            ),
            locale,
          )}
        </h3>
        <p>
          {tr(
            w(
              "Sélectionnez les éléments que vous pouvez préparer. Cette liste organise votre demande et ne calcule aucun score de qualité.",
              "Select what you can prepare. This list organises your enquiry and does not calculate a quality score.",
              "حددوا ما يمكن إعداده. تنظم القائمة الطلب ولا تحسب أي درجة جودة.",
            ),
            locale,
          )}
        </p>
        <strong>
          {checked.length} / {labels.length}
        </strong>
      </div>
      <div>
        {labels.map((label, i) => (
          <label key={label.en}>
            <input
              type="checkbox"
              checked={checked.includes(i)}
              onChange={() => {
                const next = checked.includes(i)
                  ? checked.filter((v) => v !== i)
                  : [...checked, i];
                setChecked(next);
                setContext(
                  "preparation",
                  `${tr(w("Éléments préparables", "Items to prepare", "عناصر للتحضير"), locale)}: ${next.map((n) => tr(labels[n], locale)).join(" / ") || "—"}`,
                );
              }}
            />
            <span>{tr(label, locale)}</span>
            {checked.includes(i) ? <Check size={18} /> : null}
          </label>
        ))}
      </div>
    </div>
  );
}
