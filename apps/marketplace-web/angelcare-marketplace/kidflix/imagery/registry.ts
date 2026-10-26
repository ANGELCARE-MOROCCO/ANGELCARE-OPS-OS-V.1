import { WORLDS } from "../catalogue";
import {
  TOPICS,
  PACKS,
  SEASONS,
  PATHWAYS,
  AGES,
} from "../home-reference/content";
import {
  SUBTYPES,
  USES,
  NEEDS as DOCUMENT_NEEDS,
  THEMES as DOCUMENT_THEMES,
} from "../documents/model";
import {
  subtypes,
  focusChoices,
  needChoices,
  NEEDS,
  PRINT_PACKS,
} from "../storefront-reference/model";
import { nativeArt, focusArtByFamily } from "./category-art";
import type { Descriptor } from "./model";
export type Slot = Descriptor & {
  art?: {
    kind: "home" | "documents" | "category";
    index: number;
    sheet?: string;
    rows?: number;
  };
};
export function pageSlots(page: string): Slot[] {
  const out: Slot[] = [];
  const add = (
    suffix: string,
    section: string,
    label: string,
    art?: Slot["art"],
    sequence = false,
    condition?: string,
    source?: string,
  ) =>
    out.push({
      id: page + "." + suffix,
      section,
      label,
      art,
      sequence,
      condition,
      source,
      owner: page === "shared" ? "shared" : "editable",
    });
  if (page === "shared") {
    WORLDS.forEach((w, i) =>
      add(
        "header.category." + w.key,
        "Shared category navigation",
        w.title[0],
        { kind: "home", sheet: "icons", index: i },
      ),
    );
    return out;
  }
  add(
    "opening.hero",
    "Opening",
    "Main hero",
    undefined,
    true,
    undefined,
    page === "home"
      ? "/kidflix/home-reference-r2/hero-01.png"
      : page === "documents"
        ? "/kidflix/documents-reference-r1/hero.png"
        : `/kidflix/categories-reference-r1/${page}-hero.png`,
  );
  if (page === "home") {
    [
      ["seasonal", 5],
      ["teacher", 6],
      ["play", 7],
    ].forEach(([id, i]) =>
      add(
        "opening.promo." + id,
        "Opening promotions",
        String(id),
        { kind: "home", sheet: "collections-01", index: Number(i) },
        true,
        "Visible when its category is enabled",
      ),
    );
    WORLDS.forEach((w, i) =>
      add("worlds.category." + w.key, "Category directory", w.title[0], {
        kind: "home",
        sheet: "icons",
        index: i,
      }),
    );
    const shelves: [string, typeof TOPICS][] = [
      ["today", TOPICS.slice(0, 6)],
      ["printables.teachers", TOPICS.slice(6, 10)],
      ["printables.learners", [TOPICS[1], TOPICS[10], TOPICS[2], TOPICS[11]]],
      [
        "grownups.professional",
        [TOPICS[12], TOPICS[13], TOPICS[14], TOPICS[8]],
      ],
      ["grownups.planners", [TOPICS[5], TOPICS[3], TOPICS[7], TOPICS[9]]],
      ["bundles", PACKS.slice(0, 6)],
      [
        "continuity.discoveries",
        [TOPICS[15], TOPICS[14], TOPICS[2], TOPICS[4]],
      ],
      ["new.season", SEASONS],
      ["learning.pathway", PATHWAYS],
    ];
    for (const [section, tiles] of shelves)
      for (const tile of tiles)
        add(
          `${section}.topic.${tile.id}`,
          section,
          tile.title[0],
          {
            kind: "home",
            sheet: tile.sheet,
            index: tile.cell,
            rows: tile.sheet === "pathways" ? 2 : 4,
          },
          false,
          "Editorial fallback or category-dependent section",
        );
    AGES.forEach((a, i) =>
      add("ages.stage." + (a.age || "all"), "Age stages", a.title[0], {
        kind: "home",
        sheet: "portraits",
        index: i,
        rows: 2,
      }),
    );
    return out;
  }
  if (page === "documents") {
    for (const [key, icon] of Object.entries({
      "opening.kicker": 0,
      "assurance.inventory": 0,
      "assurance.collections": 23,
      "assurance.formats": 24,
      "assurance.downloads": 25,
      "assurance.quality": 29,
      "assurance.offline": 26,
      "finder.documents": 0,
      "finder.season": 15,
      "catalogue.empty": 0,
      "packs.empty": 23,
      "feedback.empty": 14,
    }))
      add(
        key,
        key.split(".")[0],
        key.split(".").pop()!,
        { kind: "documents", index: icon },
        false,
        key.includes("empty") ? "Shown when this section is empty" : undefined,
      );
    for (const [section, choices] of [
      ["categories.subtype", SUBTYPES],
      ["categories.use", USES],
      ["needs", DOCUMENT_NEEDS],
      ["seasons", DOCUMENT_THEMES],
      ["directory.needs", DOCUMENT_NEEDS],
      ["directory.categories", [...SUBTYPES, ...USES]],
    ] as const)
      for (const c of choices)
        add(
          section + "." + c.key,
          section,
          c.title[0],
          { kind: "documents", index: c.icon },
          false,
          section.startsWith("directory")
            ? "Inside the matching directory dialog"
            : undefined,
        );
    for (const [section, icon] of Object.entries({
      categories: 0,
      catalogue: 0,
      packs: 23,
      ages: 12,
      subjects: 14,
      seasons: 15,
      rankings: 7,
      feedback: 13,
      today: 25,
    }))
      add("heading." + section, section, "Section heading", {
        kind: "documents",
        index: icon,
      });
    return out;
  }
  if (!nativeArt[page]) return out;
  const native = subtypes(page),
    focus = focusChoices(page),
    arts = focusArtByFamily[page];
  if (page === "printables")
    add("finder.papers", "Finder", "Worksheet stack", {
      kind: "category",
      sheet: "printable-packs",
      index: 0,
      rows: 1,
    });
  native.forEach((c, i) =>
    add("categories." + c.id, "Categories", c.label[0], {
      kind: "category",
      index: nativeArt[page][i],
    }),
  );
  focus.forEach((c, i) =>
    add("focus." + c.key, "Learning focus", c.title[0], {
      kind: "category",
      index: arts[i],
    }),
  );
  needChoices(page).forEach((c, i) =>
    add("needs." + c.key, "Usage needs", c.title[0], {
      kind: "category",
      index:
        page === "forms"
          ? [34, 17, 33, 30, 25, 4][i]
          : page === "community"
            ? [30, 21, 28, 14, 25, 21][i]
            : 18 + i,
    }),
  );
  [0, 2, 3, 6, 10].forEach((n, i) => {
    if (page === "printables")
      add(
        "packs." + PRINT_PACKS[i].focus,
        "Collections",
        PRINT_PACKS[i].title[0],
        { kind: "category", sheet: "printable-packs", index: i, rows: 1 },
      );
    else
      for (const [role, icon] of [
        ["main", arts[n]],
        ["support-a", nativeArt[page][i]],
        ["support-b", nativeArt[page][(i + 2) % 6]],
      ] as const)
        add(
          "packs." + focus[n].key + "." + role,
          "Collections",
          focus[n].title[0] + " · " + role,
          { kind: "category", index: icon },
        );
  });
  native
    .slice(0, 4)
    .forEach((c, i) =>
      add(
        "support.tool." + c.id,
        "Preparation tools",
        c.label[0],
        { kind: "category", index: nativeArt[page][i] },
        false,
        "Shown in default tool list",
      ),
    );
  [0, 3, 5, 9].forEach((n, i) =>
    add(
      "support.progression." + focus[n].key,
      "Progression",
      focus[n].title[0],
      { kind: "category", index: [8, 19, 11, 17][i] },
    ),
  );
  for (const [id, icon] of Object.entries({
    "catalogue.error": 34,
    "catalogue.empty": nativeArt[page][0],
    "support.recent-empty": nativeArt[page][0],
  }))
    add(
      id,
      id.split(".")[0],
      id,
      { kind: "category", index: icon },
      false,
      "Conditional empty/error state",
    );
  ["purpose", "preview", "context", "inclusion", "workspace"].forEach(
    (role, i) =>
      add("assurance." + role, "Assurances", role, {
        kind: "category",
        index: (page === "printables"
          ? [24, 25, 4, 13, 16]
          : [nativeArt[page][0], 8, 4, 16, 35])[i],
      }),
  );
  for (const [section, icon] of Object.entries({
    categories: 5,
    focus: 5,
    catalogue: page === "printables" ? 25 : nativeArt[page][0],
    needs: 5,
    workspace: page === "printables" ? 24 : nativeArt[page][0],
    packs: 5,
    ages: 28,
    subjects: 8,
    seasons: 22,
    tools: 24,
    progressions: 19,
    recent: 5,
  }))
    add("heading." + section, section, "Section heading", {
      kind: "category",
      index: icon,
    });
  for (const id of ["cover", "reference", "detail", "guidance"])
    add(
      "editorial." + id,
      "Additional editorial panels",
      id,
      undefined,
      true,
      "Visible when assigned in existing storefront Studio",
    );
  return out;
}
