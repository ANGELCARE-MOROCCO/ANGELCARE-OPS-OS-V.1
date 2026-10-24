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

import s from "../experience.module.css";
export function Presentations(p: ExperienceProps) {
  return (
    <>
      <Preparation p={p} />
      <div className={s.facilitatorDesk}>
        <Stage
          p={p}
          label={[
            "PRESENTATION & FACILITATION",
            "PRÉSENTATION ET ANIMATION",
            "العرض والتيسير",
          ]}
        >
          {p.children}
        </Stage>
      </div>
      <Contents
        p={p}
        title={[
          "The facilitation rundown",
          "Le conducteur de présentation",
          "خطة تيسير العرض",
        ]}
      />
      <Application
        p={p}
        title={[
          "Build a session that invites participation.",
          "Construire une séance qui invite à participer.",
          "ابنِ جلسة تشجع المشاركة.",
        ]}
      >
        <Brief
          p={p}
          fields={["learningObjectives", "caregiverGuidance", "instructions"]}
        />
      </Application>
      <Chapters p={p} />
      <PublishedFiles p={p}>{p.files}</PublishedFiles>
      <NextDiscovery p={p} />
    </>
  );
}
