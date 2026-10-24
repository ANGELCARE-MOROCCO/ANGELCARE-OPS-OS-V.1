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

import { CardClassification } from "../Interactions";

import s from "../experience.module.css";
export function Cards(p: ExperienceProps) {
  return (
    <>
      <div className={s.visualArchive}>
        <Stage
          p={p}
          label={[
            "THE VISUAL COLLECTION",
            "LA COLLECTION VISUELLE",
            "المجموعة البصرية",
          ]}
        >
          {p.children}
        </Stage>
      </div>
      <CardClassification {...p} />
      <Contents
        p={p}
        title={[
          "Inspect every visual reference",
          "Inspecter chaque référence visuelle",
          "افحص كل مرجع بصري",
        ]}
      />
      <PublishedFiles p={p}>{p.files}</PublishedFiles>
      <Chapters p={p} />
      <Application
        p={p}
        title={[
          "Compare, describe, classify and explain.",
          "Comparer, décrire, classer et expliquer.",
          "قارن وصف وصنّف واشرح.",
        ]}
      >
        <Brief
          p={p}
          fields={["instructions", "learningObjectives", "caregiverGuidance"]}
        />
      </Application>
      <NextDiscovery p={p} />
    </>
  );
}
