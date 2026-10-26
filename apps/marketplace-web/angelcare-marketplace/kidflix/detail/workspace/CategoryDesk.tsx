"use client";
import {
  ReadingIndex,
  StoryRoute,
  CurriculumMap,
  ObservationDesk,
  AssessmentBrief,
  ScenarioLedger,
  PlannerOrder,
  PrivateFormIndex,
  OfferMatrix,
  BundleOverview,
} from "../experience/TaskPanels";
import { Preparation, Brief, Chapters } from "../experience/Primitives";
import { PrintWorkbench } from "../experience/PrintWorkbench";
import { BundlePrintPack } from "../experience/BundlePrintPack";
import {
  CardClassification,
  SoundInvestigation,
} from "../experience/Interactions";
import type { PlayerProps } from "../shared";
import { local } from "../copy";
import s from "./workspace.module.css";
export function CategoryDesk({ p }: { p: PlayerProps }) {
  const f = p.m.family;
  return (
    <div className={s.categoryDesk} data-category-desk={f}>
      {f === "documents" ? <ReadingIndex p={p} /> : null}
      {f === "printables" ? (
        <>
          <PrintWorkbench {...p} />
          <Preparation p={p} />
        </>
      ) : null}
      {f === "stories" ? <StoryRoute p={p} /> : null}
      {f === "learning" ? <CurriculumMap p={p} /> : null}
      {f === "video" || f === "audio" ? <ObservationDesk p={p} /> : null}
      {f === "audio" ? <SoundInvestigation {...p} /> : null}
      {f === "visual-cards" ? <CardClassification {...p} /> : null}
      {f === "presentations" || f === "activities" ? (
        <Preparation p={p} />
      ) : null}
      {f === "assessments" ? <AssessmentBrief p={p} /> : null}
      {f === "tools" ? <ScenarioLedger p={p} /> : null}
      {f === "planners" ? <PlannerOrder p={p} /> : null}
      {f === "forms" ? <PrivateFormIndex p={p} /> : null}
      {f === "commerce" ? <OfferMatrix p={p} /> : null}
      {f === "bundles" ? (
        <>
          <BundleOverview p={p} />
          <BundlePrintPack {...p} />
        </>
      ) : null}
      <Brief
        p={p}
        fields={
          f === "tools"
            ? ["assumptions", "methodology"]
            : f === "community"
              ? ["source", "caregiverGuidance"]
              : ["instructions", "materials", "caregiverGuidance"]
        }
      />
      <Chapters p={p} />
      {f === "visual-cards" &&
      p.d.sortingEnabled !== true &&
      !local(p.d, "instructions", p.locale) ? (
        <p>
          {p.locale === "fr"
            ? "Les outils d’étude et de sélection se trouvent dans la vue Explorer."
            : p.locale === "ar"
              ? "أدوات الدراسة والاختيار متاحة في عرض الاستكشاف."
              : "Study and selection controls are available in the Explore view."}
        </p>
      ) : null}
    </div>
  );
}
