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
import { StoryRoute } from "../TaskPanels";

import s from "../experience.module.css";
export function Stories(p: ExperienceProps) {
  return (
    <>
      <div className={s.storyTheatre}>
        <Stage
          p={p}
          label={["THE STORY STUDIO", "LE STUDIO DU RÉCIT", "استوديو الحكاية"]}
        >
          {p.children}
        </Stage>
      </div>
      <StoryRoute p={p} />
      <Contents
        p={p}
        title={[
          "The story, scene by scene",
          "L’histoire, scène après scène",
          "الحكاية مشهداً بمشهد",
        ]}
      />
      <Application
        p={p}
        title={[
          "Give the story room to resonate.",
          "Laisser le récit résonner.",
          "امنح الحكاية مساحة للتأمل.",
        ]}
      >
        <Brief p={p} fields={["caregiverGuidance", "learningObjectives"]} />
      </Application>
      <Chapters p={p} />
      <Preparation p={p} />
      <PublishedFiles p={p}>{p.files}</PublishedFiles>
      <NextDiscovery p={p} />
    </>
  );
}
