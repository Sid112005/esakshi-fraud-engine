import type { ProjectSanctionRequest } from "../types";

export interface DemoScenario {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  expectedOutcome: string;
  payload: ProjectSanctionRequest;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "normal-pass",
    name: "1. Normal Work Sanction",
    badge: "Clean Sanction",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    description: "Routine community hall work with standard budget & verified MP allocation.",
    expectedOutcome: "Risk: LOW (10/100) • AUTO_APPROVE • 0 Alerts",
    payload: {
      project_id: "MPLAD-2026-NORM-01",
      mp_name: "AASHTIKAR PATIL NAGESH BAPURAO",
      district: "Thane",
      work_category: "Community Hall",
      project_description: "Routine civil construction of public community hall in Thane Ward 10",
      sanctioned_amount_inr: 1450000.0,
      implementing_agency: "Standard Village Panchayat",
      sanction_date: "2026-08-25",
    },
  },
  {
    id: "cost-inflation",
    name: "2. Cost Inflation Outlier (5x Median)",
    badge: "Isolation Forest Outlier",
    badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    description: "Solar street lights sanctioned at ₹3.80L (5.03x the district historical median of ₹75.5k).",
    expectedOutcome: "Risk: HIGH (55/100) • ML_ISOLATION_FOREST_OUTLIER",
    payload: {
      project_id: "MPLAD-2026-INFL-02",
      mp_name: "AASHTIKAR PATIL NAGESH BAPURAO",
      district: "Thane",
      work_category: "Solar Street Light",
      project_description: "Installation of 10 solar street lights in Thane Sector 11",
      sanctioned_amount_inr: 380000.0,
      implementing_agency: "Public Works Department",
      sanction_date: "2026-08-25",
    },
  },
  {
    id: "split-tender",
    name: "3. Semantic Split Tender Duplicate",
    badge: "Sentence-BERT Match",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    description: "Near-duplicate road repair work in Palghar Sector 19 sanctioned 5 days apart under ₹10L threshold.",
    expectedOutcome: "Risk: MEDIUM (35/100) • SEMANTIC_SPLIT_TENDER_ANOMALY (Sim: 0.90)",
    payload: {
      project_id: "MPLAD-2026-SPLIT-03",
      mp_name: "AASHTIKAR PATIL NAGESH BAPURAO",
      district: "Palghar",
      work_category: "Road Repair",
      project_description: "Road repair work Sector 19 internal",
      sanctioned_amount_inr: 975000.0,
      implementing_agency: "Contractor_37",
      sanction_date: "2025-08-20",
    },
  },
  {
    id: "budget-exceeded",
    name: "4. Multi-Year Budget Draw Anomaly",
    badge: "MoSPI Compliance Breach",
    badgeColor: "bg-red-500/20 text-red-400 border-red-500/30",
    description: "Single massive sanction exceeding 25% multi-year MP allocation draw limits.",
    expectedOutcome: "Risk: HIGH (60/100) • HIGH_CAPITAL_CONCENTRATION",
    payload: {
      project_id: "MPLAD-2026-CAP-04",
      mp_name: "AASHTIKAR PATIL NAGESH BAPURAO",
      district: "Hingoli",
      work_category: "Drinking Water Plant",
      project_description: "Mega district-wide deep tubewell boring and RO plant network",
      sanctioned_amount_inr: 52000000.0,
      implementing_agency: "Mega Infra Consortium",
      sanction_date: "2026-08-28",
    },
  },
];
