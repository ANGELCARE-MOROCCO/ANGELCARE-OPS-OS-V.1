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
import { SoundInvestigation } from "../Interactions";

import s from "../experience.module.css";
export function Audio(p: ExperienceProps) {
  return (
    <>
      <div className={s.listeningStudio}>
        <Stage
          p={p}
          label={[
            "THE LISTENING STUDIO",
            "LE STUDIO D’ÉCOUTE",
            "استوديو الاستماع",
          ]}
        >
          {p.children}
        </Stage>
      </div>
      <SoundInvestigation {...p} />
      <Contents
        p={p}
        title={[
          "Recordings, episodes and listening routes",
          "Enregistrements, épisodes et parcours d’écoute",
          "التسجيلات والحلقات ومسارات الاستماع",
        ]}
      />
      <ObservationDesk p={p} />
      <Application
        p={p}
        title={[
          "Discover what attentive listening reveals.",
          "Découvrir ce que révèle une écoute attentive.",
          "اكتشف ما يكشفه الاستماع المتأني.",
        ]}
      >
        <Brief p={p} fields={["caregiverGuidance", "learningObjectives"]} />
      </Application>
      <Chapters p={p} />
      <PublishedFiles p={p}>{p.files}</PublishedFiles>
      <NextDiscovery p={p} />
    </>
  );
}
