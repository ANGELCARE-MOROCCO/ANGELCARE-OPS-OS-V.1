import {
  angelcareBlueprints,
  angelcareServiceModules,
} from "./seed"

export const angelCareServiceBlueprints = angelcareBlueprints ?? []
export const angelCareServiceModules = angelcareServiceModules ?? []

export const angelCareServiceRules = [
  {
    id: "rule-urgent-care",
    key: "urgent-care",
    label: "Urgent care premium",
    condition: "urgent === true",
    action: "Add urgent pricing and priority staffing",
    status: "active",
  },
  {
    id: "rule-special-needs",
    key: "special-needs",
    label: "Special needs certification",
    condition: "specialNeeds === true",
    action: "Require certified caregiver and enhanced workflow",
    status: "active",
  },
  {
    id: "rule-night-care",
    key: "night-care",
    label: "Night care operational premium",
    condition: "night === true",
    action: "Apply night pricing and senior staff availability check",
    status: "active",
  },
]

export const angelCareCityDeployments = [
  {
    id: "city-rabat-hybrid-care",
    blueprintCode: "S.H",
    serviceCode: "S.H",
    city: "Rabat",
    active: true,
    demandScore: 92,
    riskScore: 18,
    capacity: 85,
    capacityScore: 85,
    staffAvailable: 24,
    launchPriority: "high",
    notes: "Premium family, school support and hybrid home-care demand.",
  },
  {
    id: "city-casablanca-special-needs",
    blueprintCode: "S.SN",
    serviceCode: "S.SN",
    city: "Casablanca",
    active: true,
    demandScore: 96,
    riskScore: 34,
    capacity: 68,
    capacityScore: 68,
    staffAvailable: 31,
    launchPriority: "critical",
    notes: "High-volume institutional and special-needs market.",
  },
  {
    id: "city-marrakech-tourism-family",
    blueprintCode: "S.TF",
    serviceCode: "S.TF",
    city: "Marrakech",
    active: false,
    demandScore: 74,
    riskScore: 28,
    capacity: 42,
    capacityScore: 42,
    staffAvailable: 9,
    launchPriority: "medium",
    notes: "Tourism, hotel-family and temporary care opportunity.",
  },
]