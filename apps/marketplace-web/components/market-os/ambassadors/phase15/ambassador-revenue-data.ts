import type { AmbassadorRevenueSnapshot } from "./ambassador-revenue-types";

export const ambassadorRevenueSnapshot: AmbassadorRevenueSnapshot = {
  attribution: [
    { id: "att-001", ambassadorName: "Salma K.", city: "Casablanca", campaign: "Academy Referral Sprint", channel: "instagram", leads: 64, qualifiedLeads: 44, conversions: 16, revenueMad: 72000, payoutMad: 5200, confidenceScore: 94, status: "clean" },
    { id: "att-002", ambassadorName: "Meryem B.", city: "Rabat", campaign: "Home Support Awareness", channel: "whatsapp", leads: 51, qualifiedLeads: 31, conversions: 12, revenueMad: 51000, payoutMad: 3900, confidenceScore: 89, status: "clean" },
    { id: "att-003", ambassadorName: "Nora H.", city: "Marrakech", campaign: "Partner Clinic Awareness", channel: "tiktok", leads: 23, qualifiedLeads: 9, conversions: 1, revenueMad: 4500, payoutMad: 1600, confidenceScore: 52, status: "needs_review" },
    { id: "att-004", ambassadorName: "Aya R.", city: "Tanger", campaign: "Home Support Awareness", channel: "referral", leads: 18, qualifiedLeads: 5, conversions: 0, revenueMad: 0, payoutMad: 900, confidenceScore: 41, status: "missing" }
  ],
  rankings: [
    { id: "rank-001", ambassadorName: "Salma K.", city: "Casablanca", tier: "elite", revenueMad: 72000, conversions: 16, roiScore: 96, rewardToRevenueRatio: 7.2, performanceStatus: "excellent", nextBestAction: "Prepare as regional mentor and assign premium academy missions." },
    { id: "rank-002", ambassadorName: "Meryem B.", city: "Rabat", tier: "gold", revenueMad: 51000, conversions: 12, roiScore: 91, rewardToRevenueRatio: 7.6, performanceStatus: "excellent", nextBestAction: "Upgrade toward platinum and assign healthcare partner missions." },
    { id: "rank-003", ambassadorName: "Nora H.", city: "Marrakech", tier: "silver", revenueMad: 4500, conversions: 1, roiScore: 38, rewardToRevenueRatio: 35.5, performanceStatus: "critical", nextBestAction: "Pause rewards, run compliance coaching, and simplify missions." },
    { id: "rank-004", ambassadorName: "Aya R.", city: "Tanger", tier: "bronze", revenueMad: 0, conversions: 0, roiScore: 18, rewardToRevenueRatio: 100, performanceStatus: "critical", nextBestAction: "Trigger referral script training and review lead quality." }
  ],
  payoutForecasts: [
    { id: "forecast-w2", period: "May 2026 W2", expectedPayoutMad: 38400, approvedPayoutMad: 21400, pendingPayoutMad: 12900, blockedPayoutMad: 4100, financeRisk: "medium", note: "Proof revisions may delay part of the payout cycle." },
    { id: "forecast-w3", period: "May 2026 W3", expectedPayoutMad: 56200, approvedPayoutMad: 0, pendingPayoutMad: 56200, blockedPayoutMad: 0, financeRisk: "high", note: "Revenue sprint expected to increase payout queue volume." }
  ],
  interventions: [
    { id: "int-001", ambassadorName: "Nora H.", reason: "High reward-to-revenue ratio and proof compliance risk.", priority: "critical", owner: "Ambassador Director", expectedRecoveryMad: 22000, dueDate: "2026-05-13", status: "doing" },
    { id: "int-002", ambassadorName: "Aya R.", reason: "Leads generated without conversion or clean attribution.", priority: "high", owner: "Revenue Command", expectedRecoveryMad: 18000, dueDate: "2026-05-14", status: "todo" }
  ]
};
