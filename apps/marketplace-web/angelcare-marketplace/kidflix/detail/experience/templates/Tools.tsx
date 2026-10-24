"use client";
import {
  Stage,
  Brief,
  Contents,
  Chapters,
  Application,
  PublishedFiles,
  NextDiscovery,
  type ExperienceProps,
} from "../Primitives";
import { ScenarioLedger } from "../TaskPanels";

import s from "../experience.module.css";
export function Tools(p: ExperienceProps) {
  return (
    <>
      <div className={s.modelDesk}>
        <Brief p={p} fields={["assumptions", "methodology"]} />
        <Stage
          p={p}
          label={["WORKING MODEL", "MODÈLE INTERACTIF", "النموذج التفاعلي"]}
        >
          {p.children}
        </Stage>
      </div>
      <ScenarioLedger p={p} />
      <Contents
        p={p}
        title={[
          "Inputs and model parameters",
          "Saisies et paramètres du modèle",
          "المدخلات ومعلمات النموذج",
        ]}
      />
      <Chapters p={p} />
      <Application
        p={p}
        title={[
          "Explore the consequence of each assumption.",
          "Explorer les conséquences de chaque hypothèse.",
          "استكشف أثر كل افتراض.",
        ]}
      >
        <Brief p={p} fields={["learningObjectives", "caregiverGuidance"]} />
      </Application>
      <PublishedFiles p={p}>{p.files}</PublishedFiles>
      <NextDiscovery p={p} />
    </>
  );
}
