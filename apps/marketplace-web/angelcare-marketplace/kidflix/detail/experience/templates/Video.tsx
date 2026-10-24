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
import { ObservationDesk } from "../TaskPanels";

import s from "../experience.module.css";
export function Video(p: ExperienceProps) {
  return (
    <>
      <div className={s.screeningRoom}>
        <Stage
          p={p}
          label={[
            "THE SCREENING ROOM",
            "LA SALLE DE VISIONNAGE",
            "مساحة المشاهدة",
          ]}
        >
          {p.children}
        </Stage>
      </div>
      <div className={s.mediaInquiry}>
        <ObservationDesk p={p} />
        <Brief p={p} fields={["learningObjectives", "caregiverGuidance"]} />
      </div>
      <Contents
        p={p}
        title={[
          "Published films and episodes",
          "Films et épisodes publiés",
          "الأفلام والحلقات المنشورة",
        ]}
      />
      <Chapters p={p} />
      <Application
        p={p}
        title={[
          "Move from watching to noticing.",
          "Passer du visionnage à l’observation.",
          "انتقل من المشاهدة إلى الملاحظة.",
        ]}
      >
        <Brief p={p} fields={["instructions", "materials"]} />
      </Application>
      <PublishedFiles p={p}>{p.files}</PublishedFiles>
      <NextDiscovery p={p} />
    </>
  );
}
