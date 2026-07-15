#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const file = path.join(
  process.cwd(),
  "components",
  "market-os",
  "ambassadors",
  "recruitment-workspace.tsx"
);

if (!fs.existsSync(file)) {
  console.error("File not found:", file);
  process.exit(1);
}

let src = fs.readFileSync(file, "utf8");

// Surgical fix: remove the broken top import area and rebuild it cleanly.
// This fixes cases where lucide icons accidentally got placed inside:
// import { ... } from "react"

let bodyStart = src.indexOf("type ModalKey");
if (bodyStart === -1) bodyStart = src.indexOf("const prospects");
if (bodyStart === -1) bodyStart = src.indexOf("function Field");
if (bodyStart === -1) {
  console.error("Could not locate start of recruitment component body.");
  process.exit(1);
}

const body = src.slice(bodyStart).replace(/\bInstagram\b/g, "MessageCircle");

const header = `"use client"

import { useState } from "react"
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
  UserCheck,
  UserPlus,
  Users,
  X,
  Zap
} from "lucide-react"

`;

fs.writeFileSync(file, header + body);
console.log("✅ recruitment-workspace.tsx import header rebuilt cleanly.");
console.log("✅ React import is now only useState; lucide icons are in lucide-react.");
