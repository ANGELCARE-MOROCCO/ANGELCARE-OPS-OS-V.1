#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "components/market-os/ambassadors/recruitment-workspace.tsx");

if (!fs.existsSync(file)) {
  console.error("❌ File not found:", file);
  process.exit(1);
}

let src = fs.readFileSync(file, "utf8");

// Find the first real code after imports.
const markers = [
  "type ModalKey",
  "type Recruitment",
  "const prospects",
  "const recruitment",
  "function Field",
  "function Recruitment",
  "export default",
];

let bodyStart = -1;
for (const marker of markers) {
  const index = src.indexOf(marker);
  if (index !== -1 && (bodyStart === -1 || index < bodyStart)) {
    bodyStart = index;
  }
}

if (bodyStart === -1) {
  console.error("❌ Could not locate component body. Open recruitment-workspace.tsx and check top section manually.");
  process.exit(1);
}

let body = src.slice(bodyStart);

// Remove bad / unsupported icon references in body.
body = body.replace(/\bInstagram\b/g, "MessageCircle");
body = body.replace(/\bCrown\b/g, "Trophy");

const header = `"use client"

import { useMemo, useState } from "react"
import AmbassadorMarketSidebar from "@/components/market-os/ambassadors/ambassador-market-sidebar"
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  Grid2X2,
  Import,
  Mail,
  MapPinned,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  X,
  Zap
} from "lucide-react"

`;

src = header + body;
fs.writeFileSync(file, src, "utf8");

const final = fs.readFileSync(file, "utf8");
const badReactImport = /import\s*\{[\s\S]*ArrowRight[\s\S]*\}\s*from\s*["']react["']/.test(final);

if (badReactImport) {
  console.error("❌ ArrowRight is still inside React import. Fix failed.");
  process.exit(1);
}

if (final.includes("Crown") || final.includes("Instagram")) {
  console.error("❌ Unsupported icon still exists after fix.");
  process.exit(1);
}

console.log("✅ recruitment-workspace.tsx import header rebuilt.");
console.log("✅ React imports only hooks.");
console.log("✅ lucide icons are imported from lucide-react.");
console.log("✅ Crown -> Trophy and Instagram -> MessageCircle.");
