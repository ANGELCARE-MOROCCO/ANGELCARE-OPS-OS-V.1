#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const file = path.join(
  process.cwd(),
  "components",
  "market-os",
  "ambassadors",
  "onboarding-workspace.tsx"
);

if (!fs.existsSync(file)) {
  console.error("File not found:", file);
  process.exit(1);
}

let src = fs.readFileSync(file, "utf8");

// Find the start of the real code after all broken imports.
// In this generated file, the first real code starts at: type ModalKey =
let bodyStart = src.indexOf("type ModalKey");
if (bodyStart === -1) bodyStart = src.indexOf("const candidates");
if (bodyStart === -1) bodyStart = src.indexOf("function Field");
if (bodyStart === -1) {
  console.error("Could not locate start of component body. Please upload onboarding-workspace.tsx.");
  process.exit(1);
}

const body = src.slice(bodyStart);

const header = `"use client"

import { useState } from "react"
import AmbassadorMarketSidebar from "@/components/market-os/ambassadors/ambassador-market-sidebar"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  FileText,
  Grid2X2,
  MapPinned,
  PackageCheck,
  Plus,
  Route,
  Search,
  ShieldCheck,
  Target,
  UserCheck,
  Users,
  X
} from "lucide-react"

`;

fs.writeFileSync(file, header + body);
console.log("✅ onboarding-workspace.tsx imports surgically rebuilt from body start.");
console.log("✅ Now run: npm run build");
