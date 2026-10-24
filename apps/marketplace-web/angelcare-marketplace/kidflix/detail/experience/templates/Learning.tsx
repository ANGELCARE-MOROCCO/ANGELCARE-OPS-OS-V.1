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
import { CurriculumMap } from "../TaskPanels";

import s from "../experience.module.css";
export function Learning(p: ExperienceProps) {
  return (
    <>
      <CurriculumMap p={p} />
      <div className={s.learningStudio}>
        <Stage
          p={p}
          label={["YOUR ACTIVE LESSON", "VOTRE LEÇON EN COURS", "درسك الحالي"]}
        >
          {p.children}
        </Stage>
      </div>
      <Brief p={p} fields={["learningObjectives", "instructions"]} />
      <Chapters p={p} />
      <Contents
        p={p}
        title={[
          "Lessons, resources and checkpoints",
          "Leçons, ressources et points d’étape",
          "الدروس والموارد ونقاط التحقق",
        ]}
      />
      <Application
        p={p}
        title={[
          "Carry learning into professional practice.",
          "Transférer les apprentissages dans la pratique.",
          "انقل التعلم إلى الممارسة المهنية.",
        ]}
      >
        <Brief p={p} fields={["methodology", "caregiverGuidance"]} />
      </Application>
      <Preparation p={p} />
      <PublishedFiles p={p}>{p.files}</PublishedFiles>
      <NextDiscovery p={p} />
    </>
  );
}
