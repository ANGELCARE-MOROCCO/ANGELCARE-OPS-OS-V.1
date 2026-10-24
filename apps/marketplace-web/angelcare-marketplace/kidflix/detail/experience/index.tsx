"use client";
import dynamic from "next/dynamic";
import type { ExperienceProps } from "./Primitives";
const Documents = dynamic(() =>
  import("./templates/Documents").then((m) => m.Documents),
);
const Printables = dynamic(() =>
  import("./templates/Printables").then((m) => m.Printables),
);
const Stories = dynamic(() =>
  import("./templates/Stories").then((m) => m.Stories),
);
const Learning = dynamic(() =>
  import("./templates/Learning").then((m) => m.Learning),
);
const Video = dynamic(() => import("./templates/Video").then((m) => m.Video));
const Audio = dynamic(() => import("./templates/Audio").then((m) => m.Audio));
const Cards = dynamic(() => import("./templates/Cards").then((m) => m.Cards));
const Presentations = dynamic(() =>
  import("./templates/Presentations").then((m) => m.Presentations),
);
const Assessments = dynamic(() =>
  import("./templates/Assessments").then((m) => m.Assessments),
);
const Activities = dynamic(() =>
  import("./templates/Activities").then((m) => m.Activities),
);
const Tools = dynamic(() => import("./templates/Tools").then((m) => m.Tools));
const Planners = dynamic(() =>
  import("./templates/Planners").then((m) => m.Planners),
);
const Forms = dynamic(() => import("./templates/Forms").then((m) => m.Forms));
const Community = dynamic(() =>
  import("./templates/Community").then((m) => m.Community),
);
const Commerce = dynamic(() =>
  import("./templates/Commerce").then((m) => m.Commerce),
);
const Bundles = dynamic(() =>
  import("./templates/Bundles").then((m) => m.Bundles),
);
const templates: Record<string, React.ComponentType<ExperienceProps>> = {
  documents: Documents,
  printables: Printables,
  stories: Stories,
  learning: Learning,
  video: Video,
  audio: Audio,
  "visual-cards": Cards,
  presentations: Presentations,
  assessments: Assessments,
  activities: Activities,
  tools: Tools,
  planners: Planners,
  forms: Forms,
  community: Community,
  commerce: Commerce,
  bundles: Bundles,
};
export function DetailExperience(p: ExperienceProps) {
  const Template = templates[p.m.family];
  return Template ? <Template {...p} /> : <>{p.children}</>;
}
