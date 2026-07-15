export type RefferQPartnerStatus = "Active" | "Pending" | "Risk" | "Paused"
export type RefferQReferralStatus = "Pending" | "Approved" | "Rejected" | "Converted"
export type RefferQPayoutStatus = "Scheduled" | "Pending" | "Approved" | "Paid" | "Blocked"

export type RefferQPartner = {
  id: string
  name: string
  group: string
  city: string
  email: string
  referralCode: string
  status: RefferQPartnerStatus
  commissionRate: number
  qualifiedLeads: number
  conversions: number
  revenueMad: number
  pendingPayoutMad: number
  riskScore: number
  lastActivity: string
}

export type RefferQReferral = {
  id: string
  partner: string
  leadName: string
  leadEmail: string
  phone: string
  source: string
  status: RefferQReferralStatus
  estimatedValueMad: number
  commissionMad: number
  createdAt: string
  reviewNote: string
}

export type RefferQTransaction = {
  id: string
  referralId: string
  customer: string
  product: string
  amountMad: number
  commissionMad: number
  status: "Pending" | "Paid" | "Disputed"
  paidAt: string
}

export type RefferQPayout = {
  id: string
  partner: string
  amountMad: number
  method: string
  status: RefferQPayoutStatus
  commissionCount: number
  scheduledFor: string
}

export type RefferQResource = {
  id: string
  title: string
  type: "Landing page" | "WhatsApp script" | "Email template" | "Creative" | "Terms"
  owner: string
  readiness: number
}

export type RefferQProgramRule = {
  id: string
  name: string
  type: "Percentage" | "Fixed" | "Tiered" | "Coupon"
  value: string
  status: "Live" | "Draft" | "Review"
}

export type RefferQSnapshot = {
  generatedAt: string
  partners: RefferQPartner[]
  referrals: RefferQReferral[]
  transactions: RefferQTransaction[]
  payouts: RefferQPayout[]
  resources: RefferQResource[]
  programRules: RefferQProgramRule[]
}

export const refferQSnapshot: RefferQSnapshot = {
  generatedAt: "2026-07-09T20:00:00.000Z",
  partners: [
    {
      id: "rq-partner-001",
      name: "Casa Mothers Circle",
      group: "Premium Parent Partner",
      city: "Casablanca",
      email: "casa.circle@example.com",
      referralCode: "CASA-MOMS-25",
      status: "Active",
      commissionRate: 12,
      qualifiedLeads: 46,
      conversions: 13,
      revenueMad: 128500,
      pendingPayoutMad: 4280,
      riskScore: 8,
      lastActivity: "Today 14:10",
    },
    {
      id: "rq-partner-002",
      name: "Rabat Family Network",
      group: "Institutional Connector",
      city: "Rabat",
      email: "rabat.network@example.com",
      referralCode: "RABAT-FAMILY-25",
      status: "Active",
      commissionRate: 10,
      qualifiedLeads: 39,
      conversions: 9,
      revenueMad: 92200,
      pendingPayoutMad: 2980,
      riskScore: 4,
      lastActivity: "Yesterday 18:30",
    },
    {
      id: "rq-partner-003",
      name: "Kenitra Education Club",
      group: "Community Partner",
      city: "Kenitra",
      email: "kenitra.club@example.com",
      referralCode: "KENI-EDU-25",
      status: "Pending",
      commissionRate: 8,
      qualifiedLeads: 17,
      conversions: 3,
      revenueMad: 31600,
      pendingPayoutMad: 760,
      riskScore: 14,
      lastActivity: "2 days ago",
    },
    {
      id: "rq-partner-004",
      name: "B2B School Introducers",
      group: "B2B Growth Partner",
      city: "Multi-city",
      email: "schools.intro@example.com",
      referralCode: "SCHOOL-B2B-25",
      status: "Risk",
      commissionRate: 15,
      qualifiedLeads: 22,
      conversions: 4,
      revenueMad: 74400,
      pendingPayoutMad: 3900,
      riskScore: 31,
      lastActivity: "5 days ago",
    },
  ],
  referrals: [
    {
      id: "rq-ref-1001",
      partner: "Casa Mothers Circle",
      leadName: "Mme. Salma Benali",
      leadEmail: "salma.benali@example.com",
      phone: "+212 6 10 00 00 01",
      source: "WhatsApp referral link",
      status: "Converted",
      estimatedValueMad: 9800,
      commissionMad: 1176,
      createdAt: "2026-07-09",
      reviewNote: "Converted to summer home childcare package.",
    },
    {
      id: "rq-ref-1002",
      partner: "Rabat Family Network",
      leadName: "Mr. Hicham Alaoui",
      leadEmail: "hicham.alaoui@example.com",
      phone: "+212 6 10 00 00 02",
      source: "Partner landing page",
      status: "Approved",
      estimatedValueMad: 14500,
      commissionMad: 1450,
      createdAt: "2026-07-08",
      reviewNote: "Approved after phone validation.",
    },
    {
      id: "rq-ref-1003",
      partner: "Kenitra Education Club",
      leadName: "Mme. Wafa Idrissi",
      leadEmail: "wafa.idrissi@example.com",
      phone: "+212 6 10 00 00 03",
      source: "Manual lead submission",
      status: "Pending",
      estimatedValueMad: 5900,
      commissionMad: 472,
      createdAt: "2026-07-07",
      reviewNote: "Needs duplicate check before approval.",
    },
  ],
  transactions: [
    {
      id: "rq-txn-501",
      referralId: "rq-ref-1001",
      customer: "Mme. Salma Benali",
      product: "AngelCare Summer Home Childcare",
      amountMad: 9800,
      commissionMad: 1176,
      status: "Paid",
      paidAt: "2026-07-09",
    },
    {
      id: "rq-txn-502",
      referralId: "rq-ref-1002",
      customer: "Mr. Hicham Alaoui",
      product: "B2C Premium Family Package",
      amountMad: 14500,
      commissionMad: 1450,
      status: "Pending",
      paidAt: "Pending",
    },
  ],
  payouts: [
    {
      id: "rq-pay-001",
      partner: "Casa Mothers Circle",
      amountMad: 4280,
      method: "Bank transfer",
      status: "Approved",
      commissionCount: 6,
      scheduledFor: "2026-07-15",
    },
    {
      id: "rq-pay-002",
      partner: "Rabat Family Network",
      amountMad: 2980,
      method: "Wise / International",
      status: "Pending",
      commissionCount: 4,
      scheduledFor: "2026-07-18",
    },
    {
      id: "rq-pay-003",
      partner: "B2B School Introducers",
      amountMad: 3900,
      method: "Manual approval",
      status: "Blocked",
      commissionCount: 2,
      scheduledFor: "Risk review",
    },
  ],
  resources: [
    {
      id: "rq-res-001",
      title: "Parent referral WhatsApp script",
      type: "WhatsApp script",
      owner: "Growth team",
      readiness: 95,
    },
    {
      id: "rq-res-002",
      title: "B2C summer landing page copy",
      type: "Landing page",
      owner: "Marketing",
      readiness: 88,
    },
    {
      id: "rq-res-003",
      title: "Partner terms and fraud policy",
      type: "Terms",
      owner: "Operations",
      readiness: 72,
    },
    {
      id: "rq-res-004",
      title: "Referral code launch email",
      type: "Email template",
      owner: "Commercial",
      readiness: 83,
    },
  ],
  programRules: [
    {
      id: "rq-rule-001",
      name: "Default B2C commission",
      type: "Percentage",
      value: "10% of paid invoice",
      status: "Live",
    },
    {
      id: "rq-rule-002",
      name: "Premium parent connector tier",
      type: "Tiered",
      value: "10% → 12% after 10 conversions",
      status: "Live",
    },
    {
      id: "rq-rule-003",
      name: "B2B school introduction reward",
      type: "Fixed",
      value: "1,500 MAD on qualified school contract",
      status: "Review",
    },
  ],
}

export function formatMad(value: number) {
  return `${new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(value)} MAD`
}
