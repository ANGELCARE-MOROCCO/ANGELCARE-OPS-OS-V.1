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
export function Activities(p: ExperienceProps) {
  return (
    <>
      <Preparation p={p} />
      <div className={s.investigationLab}>
        <Stage
          p={p}
          label={[
            "INVESTIGATION LABORATORY",
            "LABORATOIRE D’EXPLORATION",
            "مختبر الاستكشاف",
          ]}
        >
          {p.children}
        </Stage>
      </div>
      <Brief p={p} fields={["instructions", "learningObjectives"]} />
      <Contents
        p={p}
        title={[
          "Challenges and investigation tasks",
          "Défis et tâches d’exploration",
          "التحديات ومهام الاستكشاف",
        ]}
      />
      <Chapters p={p} />
      <Application
        p={p}
        title={[
          "Make a choice. Test it. Explain the outcome.",
          "Choisir. Tester. Expliquer le résultat.",
          "اختر واختبر واشرح النتيجة.",
        ]}
      >
        <Brief p={p} fields={["caregiverGuidance", "methodology"]} />
      </Application>
      <PublishedFiles p={p}>{p.files}</PublishedFiles>
      <NextDiscovery p={p} />
    </>
  );
}
