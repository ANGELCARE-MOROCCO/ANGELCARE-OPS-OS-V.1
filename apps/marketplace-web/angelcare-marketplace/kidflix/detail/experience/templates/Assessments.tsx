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
import { AssessmentBrief } from "../TaskPanels";

import s from "../experience.module.css";
export function Assessments(p: ExperienceProps) {
  return (
    <>
      <div className={s.assessmentRoom}>
        <AssessmentBrief p={p} />
        <Stage
          p={p}
          label={[
            "ASSESSMENT WORKSPACE",
            "ESPACE D’ÉVALUATION",
            "مساحة التقييم",
          ]}
        >
          {p.children}
        </Stage>
      </div>
      <Contents
        p={p}
        title={["Question index", "Index des questions", "فهرس الأسئلة"]}
      />
      <Chapters p={p} />
      <Application
        p={p}
        title={[
          "Use evidence to decide what comes next.",
          "S’appuyer sur les résultats pour décider de la suite.",
          "استخدم النتائج لتحديد الخطوة التالية.",
        ]}
      >
        <Brief
          p={p}
          fields={["learningObjectives", "caregiverGuidance", "methodology"]}
        />
      </Application>
      <PublishedFiles p={p}>{p.files}</PublishedFiles>
      <NextDiscovery p={p} />
    </>
  );
}
