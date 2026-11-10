"use client";
import { useEffect, useState } from "react";
import { ImageryContext } from "@/angelcare-marketplace/marketplace-imagery/Runtime";
import { Photo } from "@/angelcare-marketplace/homepage-living-marketplace/immersive/ExperienceUI";
import {
  emptyConfig, placement, type Config, type Scene,
} from "@/angelcare-marketplace/marketplace-imagery/model";

const SLOT = "home.visual.living-commerce-homepage.2.care";
const asset = (name: string) => "/angelcare-marketplace/families-world-r2/" + name + ".jpg";
const validImages = ["care", "kits", "care"];
const ciScene = (src: string, index: number): Scene => ({
  id: "ci-image-" + index,
  src, assetId: "123e4567-e89b-42d3-a456-" + String(index + 1).padStart(12, "0"),
  mobile: "", mobileAssetId: "", enabled: true,
  alt: "CI scene " + (index + 1),
  focal: { x: 50, y: 50 }, mobileFocal: { x: 50, y: 50 },
  fit: "cover", zoom: 1, mobileZoom: 1, duration: 0,
});

export function ImageryR3Fixture() {
  const [configuration, setConfiguration] = useState<Config>(emptyConfig());
  const [testCase, setTestCase] = useState("loading");
  useEffect(() => {
    const choice = new URLSearchParams(location.search).get("case") || "three";
    setTestCase(choice);
    const sources = choice === "all-failed"
      ? ["missing-r3-first", "missing-r3-second", "missing-r3-third"]
      : choice === "failed-second"
      ? [validImages[0], "missing-r3-second", validImages[1]]
      : choice === "twelve"
      ? Array.from({ length: 12 }, (_, i) => validImages[i % validImages.length])
      : validImages;
    const timer = window.setTimeout(() => {
      setConfiguration({
        version: 1,
        slots: {
          [SLOT]: {
            ...placement(), mode: "slideshow", autoplay: true, loop: true,
            controls: true, interval: 1500, transition: "fade", speed: 250,
            images: sources.map((name, i) => ciScene(asset(name), i)),
          },
        },
      });
    }, 250); // Actual client hydration sequence: native fallback before override.
    return () => clearTimeout(timer);
  }, []);
  const images = configuration.slots[SLOT]?.images ?? [];
  return (
    <ImageryContext.Provider value={{
      page: "home", config: configuration, shared: emptyConfig(),
      editing: false, selected: "", previewScene: "",
      deliveryStatus: "ci-fixture", register: () => {},
    }}>
      <main style={{ padding: 20, fontFamily: "Arial, sans-serif", background: "#fff" }}>
        <h1>AngelCare Imagery Runtime R3 — CI fixture</h1>
        <div data-r3-test-case={testCase} data-r3-hydrated={images.length > 0 ? "yes" : "no"}
          style={{ position: "relative", width: 490, height: 260 }}>
          <a data-r3-promotion-link href="/angelcare-marketplace/fr/home-services"
            style={{ display: "block", width: "100%", height: "100%" }}>
            <Photo slot="visual.living-commerce-homepage.2.care"
              src={testCase === "broken-original" ? "/no-original-r3.jpg" : asset("care")}
              alt="Opening promotion · home-services" />
          </a>
          {images.length > 1 ? (
            <div data-r3-external-controls role="group" aria-label="Promotion images"
              style={{ position: "absolute", top: 5, right: 5, display: "flex", gap: 4, zIndex: 8 }}>
              <button type="button" aria-label="Previous image"
                onClick={() => dispatchEvent(new CustomEvent("angelcare-imagery-navigate", { detail: { slot: SLOT, direction: -1 } }))}>Previous</button>
              <button type="button" aria-label="Next image"
                onClick={() => dispatchEvent(new CustomEvent("angelcare-imagery-navigate", { detail: { slot: SLOT, direction: 1 } }))}>Next</button>
            </div>
          ) : null}
        </div>
      </main>
    </ImageryContext.Provider>
  );
}
