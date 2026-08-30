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
    description: "Routine community hall work in Thane with standard budget & verified MP allocation.",
    expectedOutcome: "Risk: LOW (10/100) • AUTO_APPROVE • 0 Alerts",
    payload: {
      project_id: "MPLAD-2026-NORM-01",
      mp_name: "AASHTIKAR PATIL NAGESH BAPURAO",
      state: "Maharashtra",
      district: "Thane",
      work_category: "Community Hall",
      project_description: "Routine civil construction of public community hall in Thane Ward 10",
      sanctioned_amount_inr: 1450000.0,
      implementing_agency: "Standard Village Panchayat",
      sanction_date: "2026-08-25",
      expected_completion_date: "2026-12-25",
      actual_completion_date: "2026-12-20",
    },
  },
  {
    id: "cost-inflation",
    name: "2. Cost Inflation Outlier (5x Median)",
    badge: "Isolation Forest Outlier",
    badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    description: "Solar street lights in Thane sanctioned at ₹3.80L (5.03x the historical median of ₹75.5k).",
    expectedOutcome: "Risk: HIGH (55/100) • ML_ISOLATION_FOREST_OUTLIER",
    payload: {
      project_id: "MPLAD-2026-INFL-02",
      mp_name: "AASHTIKAR PATIL NAGESH BAPURAO",
      state: "Maharashtra",
      district: "Thane",
      work_category: "Solar Street Light",
      project_description: "Installation of 10 solar street lights in Thane Sector 11",
      sanctioned_amount_inr: 380000.0,
      implementing_agency: "Public Works Department",
      sanction_date: "2026-08-25",
      expected_completion_date: "2026-11-30",
      actual_completion_date: "2026-11-28",
    },
  },
  {
    id: "split-tender",
    name: "3. Semantic Split Tender Duplicate",
    badge: "Sentence-BERT Match",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    description: "Near-duplicate road repair in Srinagar (J&K) sanctioned 2 days apart just below ₹10L threshold.",
    expectedOutcome: "Risk: MEDIUM (35/100) • SEMANTIC_SPLIT_TENDER_ANOMALY (Sim: 1.00)",
    payload: {
      project_id: "MPLAD-2026-SPLIT-03",
      mp_name: "AASHTIKAR PATIL NAGESH BAPURAO",
      state: "Jammu And Kashmir",
      district: "Srinagar",
      work_category: "Road Repair",
      project_description: "Road repair work Gram Panchayat 17 internal",
      sanctioned_amount_inr: 980000.0,
      implementing_agency: "Contractor_11",
      sanction_date: "2025-04-06",
      expected_completion_date: "2025-07-15",
      actual_completion_date: "2025-07-20",
    },
  },
  {
    id: "delayed-project",
    name: "4. Chronic Execution Delay (158 Days Overdue)",
    badge: "Milestone Delay",
    badgeColor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    description: "Road repair completed 158 days past target completion date, indicating severe contractor lag.",
    expectedOutcome: "Risk: MEDIUM (25/100) • DELAYED_PROJECT (Overdue >90 Days)",
    payload: {
      project_id: "MPLAD-2026-DELAY-04",
      mp_name: "AASHTIKAR PATIL NAGESH BAPURAO",
      state: "Maharashtra",
      district: "Thane",
      work_category: "Road Repair",
      project_description: "Major arterial highway asphalt resurfacing and repair in Thane Zone 3",
      sanctioned_amount_inr: 780000.0,
      implementing_agency: "Public Works Department",
      sanction_date: "2025-01-10",
      expected_completion_date: "2025-05-10",
      actual_completion_date: "2025-10-15",
    },
  },
  {
    id: "budget-exceeded",
    name: "5. Multi-Year Budget Draw Anomaly",
    badge: "MoSPI Allocation Breach",
    badgeColor: "bg-red-500/20 text-red-400 border-red-500/30",
    description: "Single massive sanction exceeding 25% multi-year MP allocation draw limits in Hingoli.",
    expectedOutcome: "Risk: HIGH (60/100) • HIGH_CAPITAL_CONCENTRATION",
    payload: {
      project_id: "MPLAD-2026-CAP-05",
      mp_name: "AASHTIKAR PATIL NAGESH BAPURAO",
      state: "Maharashtra",
      district: "Hingoli",
      work_category: "Drinking Water Plant",
      project_description: "Mega district-wide deep tubewell boring and RO plant network",
      sanctioned_amount_inr: 52000000.0,
      implementing_agency: "Mega Infra Consortium",
      sanction_date: "2026-08-28",
      expected_completion_date: "2027-02-28",
    },
  },
];
