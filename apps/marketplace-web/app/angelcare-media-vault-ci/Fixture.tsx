"use client";
import { useState } from "react";
import { UI } from "@/angelcare-marketplace/digital-customer-experience/components/ui";
import { NativeImagePicker } from "@/angelcare-marketplace/kidflix/StudioPickers";

type Selected = { id: string; url: string; title: string };
const rights = { view: true, manage: true, publish: true, moderate: true,
  monetize: true, export: true, purge: true, media: true, customers: true };
export function MediaVaultCIFixture() {
  const [selected, setSelected] = useState<Selected[]>([]);
  return <UI.Provider value={{
    locale: "en",
    boot: { actor: { id: "ci", name: "CI Operator", email: null,
      locale: "en", rights }, activated: true, summary: {}, recent: [],
      topics: [], releases: [], health: {}, settings: {}, contract: "CI" },
    refresh: async () => {}, notify: () => {}, open: () => {},
    create: () => {}, preview: () => {},
  }}>
    <main style={{ padding: 32, fontFamily: "Arial, sans-serif" }}>
      <h1>AngelCare Native Media Vault — browser integration</h1>
      <NativeImagePicker onSelect={asset => setSelected([asset])}
        onSelectMany={assets => setSelected(assets)}
        max={3} excludeIds={["aaaaaaaa-0000-4000-8000-000000000005"]} />
      <output data-media-picker-accepted>{selected.map(item => item.id).join(",")}</output>
    </main>
  </UI.Provider>;
}
