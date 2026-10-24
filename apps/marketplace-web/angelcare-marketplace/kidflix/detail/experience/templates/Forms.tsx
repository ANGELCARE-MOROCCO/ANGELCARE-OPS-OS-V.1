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
import { PrivateFormIndex } from "../TaskPanels";

import s from "../experience.module.css";
export function Forms(p: ExperienceProps) {
  return (
    <>
      <div className={s.reflectionRoom}>
        <PrivateFormIndex p={p} />
        <Stage
          p={p}
          label={[
            "PRIVATE QUESTIONNAIRE",
            "QUESTIONNAIRE PRIVÉ",
            "الاستبيان الخاص",
          ]}
        >
          {p.children}
        </Stage>
      </div>
      <Brief p={p} fields={["instructions", "caregiverGuidance"]} />
      <Contents
        p={p}
        title={[
          "Your reflection outline",
          "Le fil de votre réflexion",
          "مخطط تأملك",
        ]}
      />
      <Chapters p={p} />
      <Application
        p={p}
        title={[
          "Make room for considered answers.",
          "Faire place aux réponses réfléchies.",
          "امنح الإجابات المتأنية مساحة.",
        ]}
      >
        <Brief p={p} fields={["learningObjectives", "methodology"]} />
      </Application>
      <PublishedFiles p={p}>{p.files}</PublishedFiles>
      <NextDiscovery p={p} />
    </>
  );
}
