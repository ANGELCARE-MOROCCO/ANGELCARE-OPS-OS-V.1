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
import { PlannerOrder } from "../TaskPanels";

import s from "../experience.module.css";
export function Planners(p: ExperienceProps) {
  return (
    <>
      <div className={s.planningDesk}>
        <PlannerOrder p={p} />
        <Stage
          p={p}
          label={[
            "YOUR PERSONAL WORKING COPY",
            "VOTRE COPIE PERSONNELLE DE TRAVAIL",
            "نسخة عملك الشخصية",
          ]}
        >
          {p.children}
        </Stage>
      </div>
      <Contents
        p={p}
        title={[
          "Planning elements and routines",
          "Éléments du plan et routines",
          "عناصر التخطيط والروتين",
        ]}
      />
      <Chapters p={p} />
      <Application
        p={p}
        title={[
          "Turn intentions into a usable routine.",
          "Transformer les intentions en routines utiles.",
          "حوّل النوايا إلى روتين قابل للتطبيق.",
        ]}
      >
        <Brief
          p={p}
          fields={["instructions", "caregiverGuidance", "learningObjectives"]}
        />
      </Application>
      <PublishedFiles p={p}>{p.files}</PublishedFiles>
      <NextDiscovery p={p} />
    </>
  );
}
