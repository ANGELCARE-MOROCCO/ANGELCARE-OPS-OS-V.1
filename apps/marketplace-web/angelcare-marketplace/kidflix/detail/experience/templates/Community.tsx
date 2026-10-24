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

import s from "../experience.module.css";
export function Community(p: ExperienceProps) {
  return (
    <>
      <div className={s.knowledgeRoom}>
        <Stage
          p={p}
          label={[
            "KNOWLEDGE ARCHIVE",
            "ARCHIVES DE CONNAISSANCES",
            "أرشيف المعرفة",
          ]}
        >
          {p.children}
        </Stage>
        <Brief p={p} fields={["source", "caregiverGuidance"]} />
      </div>
      <Contents
        p={p}
        title={[
          "Browse the knowledge entries",
          "Parcourir les entrées de connaissances",
          "تصفح مدخلات المعرفة",
        ]}
      />
      <Chapters p={p} />
      <Application
        p={p}
        title={[
          "Connect published perspectives with practice.",
          "Relier les regards publiés à la pratique.",
          "اربط الرؤى المنشورة بالممارسة.",
        ]}
      >
        <Brief p={p} fields={["learningObjectives", "methodology"]} />
      </Application>
      <PublishedFiles p={p}>{p.files}</PublishedFiles>
      <NextDiscovery p={p} />
    </>
  );
}
