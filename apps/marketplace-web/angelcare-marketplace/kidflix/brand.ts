import type { Metadata } from "next";

/** KidFlix route metadata owns these icons. Other worlds retain their metadata. */
export function kidflixIcons(): Metadata["icons"] {
  const base = "/kidflix/brand/favicon-r1";
  return {
    icon: [
      { url: `${base}/kidflix-favicon.ico`, type: "image/x-icon" },
      ...[16, 32, 48].map((size) => ({
        url: `${base}/kidflix-favicon-${size}.png`,
        sizes: `${size}x${size}`,
        type: "image/png",
      })),
    ],
    shortcut: [{ url: `${base}/kidflix-favicon-32.png`, type: "image/png" }],
    apple: [{ url: `${base}/kidflix-icon-180.png`, sizes: "180x180", type: "image/png" }],
  };
}
