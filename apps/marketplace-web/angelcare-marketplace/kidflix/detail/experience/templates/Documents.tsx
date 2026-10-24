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
import { ReadingIndex } from "../TaskPanels";

import s from "../experience.module.css";
export function Documents(p: ExperienceProps) {
  return (
    <>
      <div className={s.documentDesk}>
        <div>
          <Stage
            p={p}
            label={["READING ROOM", "ESPACE DE LECTURE", "مساحة القراءة"]}
          >
            {p.children}
          </Stage>
        </div>
        <ReadingIndex p={p} />
      </div>
      <Contents
        p={p}
        title={["The reference index", "L’index de référence", "فهرس المرجع"]}
      />
      <Chapters p={p} />
      <Application
        p={p}
        title={[
          "Read closely. Put understanding to work.",
          "Lire avec attention. Mettre la compréhension en pratique.",
          "اقرأ بتمعن وطبّق فهمك.",
        ]}
      >
        <Brief
          p={p}
          fields={["learningObjectives", "source", "caregiverGuidance"]}
        />
      </Application>
      <PublishedFiles p={p}>{p.files}</PublishedFiles>
      <NextDiscovery p={p} />
    </>
  );
}
