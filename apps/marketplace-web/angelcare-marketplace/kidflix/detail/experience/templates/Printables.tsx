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

import { PrintWorkbench } from "../PrintWorkbench";
import s from "../experience.module.css";
export function Printables(p: ExperienceProps) {
  return (
    <>
      <Preparation p={p} />
      <PrintWorkbench {...p} />
      <div className={s.printableInspection}>
        <Stage
          p={p}
          label={[
            "PUBLISHED PAPER EDITION",
            "ÉDITION PAPIER PUBLIÉE",
            "الإصدار الورقي المنشور",
          ]}
        >
          {p.children}
        </Stage>
        <Brief p={p} fields={["instructions", "caregiverGuidance"]} />
      </div>
      <PublishedFiles p={p}>{p.files}</PublishedFiles>
      <Contents
        p={p}
        title={[
          "Inspect the worksheet collection",
          "Inspecter la collection de fiches",
          "افحص مجموعة أوراق العمل",
        ]}
      />
      <Chapters p={p} />
      <Application
        p={p}
        title={[
          "Make room for practical learning.",
          "Faire place aux apprentissages pratiques.",
          "افسح المجال للتعلم العملي.",
        ]}
      >
        <Brief p={p} fields={["learningObjectives", "materials"]} />
      </Application>
      <NextDiscovery p={p} />
    </>
  );
}
