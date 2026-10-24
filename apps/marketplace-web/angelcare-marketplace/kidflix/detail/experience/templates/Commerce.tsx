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
import { OfferMatrix } from "../TaskPanels";

import s from "../experience.module.css";
export function Commerce(p: ExperienceProps) {
  return (
    <>
      <div className={s.resourceShowcase}>
        <Stage
          p={p}
          label={[
            "RESOURCE & NATIVE EXTENSIONS",
            "RESSOURCE ET PROLONGEMENTS NATIFS",
            "المورد والامتدادات الأصلية",
          ]}
        >
          {p.children}
        </Stage>
      </div>
      <OfferMatrix p={p} />
      <Brief p={p} fields={["learningObjectives", "instructions", "source"]} />
      <Contents
        p={p}
        title={[
          "The published continuations",
          "Les suites publiées",
          "المتابعات المنشورة",
        ]}
      />
      <Chapters p={p} />
      <Application
        p={p}
        title={[
          "Understand the resource before choosing an extension.",
          "Comprendre la ressource avant de choisir un prolongement.",
          "افهم المورد قبل اختيار امتداده.",
        ]}
      >
        <Brief p={p} fields={["caregiverGuidance", "methodology"]} />
      </Application>
      <PublishedFiles p={p}>{p.files}</PublishedFiles>
      <NextDiscovery p={p} />
    </>
  );
}
