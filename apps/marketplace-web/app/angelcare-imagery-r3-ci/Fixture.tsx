"use client";
import { useEffect, useState } from "react";
import { ImageryContext } from "@/angelcare-marketplace/marketplace-imagery/Runtime";
import { Photo } from "@/angelcare-marketplace/homepage-living-marketplace/immersive/ExperienceUI";
import styles from "@/angelcare-marketplace/homepage-living-marketplace/immersive/immersive.module.css";
import {
  emptyConfig, placement, newBadge, type Config, type Scene,
} from "@/angelcare-marketplace/marketplace-imagery/model";

const SLOT = "home.visual.living-commerce-homepage.2.care";
const KITS_SLOT = "home.visual.living-commerce-homepage.2.kits";
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
      const badgeCase = choice.startsWith("badges-");
      const activeSlot = choice === "badges-kits" ? KITS_SLOT : SLOT;
      setConfiguration({
        version: 1,
        slots: {
          [activeSlot]: {
            ...placement(), mode: "slideshow", autoplay: true, loop: true,
            controls: choice === "three-controls", interval: 1500, transition: "fade", speed: 250,
            badgesEnabled: badgeCase,
            badges: badgeCase && choice !== "badges-empty" ? [{ ...newBadge(), text: "CARE" }] : [],
            images: sources.map((name, i) => ciScene(asset(name), i)),
          },
        },
      });
    }, 250); // Actual client hydration sequence: native fallback before override.
    return () => clearTimeout(timer);
  }, []);
  const activeSlot = testCase === "badges-kits" ? KITS_SLOT : SLOT;
  const images = configuration.slots[activeSlot]?.images ?? [];
  const badgeCase = testCase.startsWith("badges-");
  const promotion = (
    <a data-r3-promotion-link href="/angelcare-marketplace/fr/home-services"
      style={{ display: "block", width: "100%", height: "100%" }}>
      <Photo slot={testCase === "badges-kits" ? "visual.living-commerce-homepage.2.kits" : "visual.living-commerce-homepage.2.care"}
        src={testCase === "broken-original" ? "/no-original-r3.jpg" : asset("care")}
        alt="Opening promotion · home-services" />
      {badgeCase ? (
        <div>
          <span data-r3-promo-label>Services à domicile</span>
          <strong>Du temps pour vous</strong>
          <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M2 14L14 2M6 2h8v8" fill="none" stroke="currentColor" /></svg>
        </div>
      ) : null}
    </a>
  );
  return (
    <ImageryContext.Provider value={{
      page: "home", config: configuration, shared: emptyConfig(),
      editing: false, selected: "", previewScene: "",
      deliveryStatus: "ci-fixture", register: () => {},
    }}>
      <main style={{ padding: 20, fontFamily: "Arial, sans-serif", background: "#fff" }}>
        <h1>AngelCare Imagery Runtime R3 — CI fixture</h1>
        <div data-r3-test-case={testCase} data-r3-hydrated={images.length > 0 ? "yes" : "no"}
          className={badgeCase ? styles.heroSide : undefined}
          style={{ position: "relative", width: 490, height: 260 }}>
          {badgeCase ? (
            <>
              {testCase === "badges-kits" ? <div className={styles.promoTile} aria-hidden="true" /> : null}
              <div className={styles.promoTile}>{promotion}</div>
            </>
          ) : promotion}
          {images.length > 1 && configuration.slots[activeSlot]?.controls ? (
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
