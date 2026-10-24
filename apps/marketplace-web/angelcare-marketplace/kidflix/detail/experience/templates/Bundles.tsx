"use client";
import {
  Stage,
  Brief,
  Preparation,
  Contents,
  Chapters,
  Application,
  PublishedFiles,
  NextDiscovery,
  type ExperienceProps,
} from "../Primitives";
import { BundleOverview } from "../TaskPanels";

import { BundlePrintPack } from "../BundlePrintPack";
import s from "../experience.module.css";
export function Bundles(p: ExperienceProps) {
  return (
    <>
      <div className={s.pathwayRoom}>
        <BundleOverview p={p} />
        <Stage
          p={p}
          label={[
            "YOUR CONNECTED PATHWAY",
            "VOTRE PARCOURS CONNECTÉ",
            "مسارك المترابط",
          ]}
        >
          {p.children}
        </Stage>
      </div>
      <BundlePrintPack {...p} />
      <Preparation p={p} />
      <Contents
        p={p}
        title={[
          "Every resource in the pathway",
          "Toutes les ressources du parcours",
          "جميع موارد المسار",
        ]}
      />
      <Chapters p={p} />
      <Application
        p={p}
        title={[
          "Build continuity across different ways of learning.",
          "Construire une continuité entre différentes façons d’apprendre.",
          "ابنِ استمرارية بين طرق التعلم المختلفة.",
        ]}
      >
        <Brief
          p={p}
          fields={["learningObjectives", "caregiverGuidance", "instructions"]}
        />
      </Application>
      <PublishedFiles p={p}>{p.files}</PublishedFiles>
      <NextDiscovery p={p} />
    </>
  );
}
