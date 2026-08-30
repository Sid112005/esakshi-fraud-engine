import React from "react";
import {
  ShieldAlert,
  Coins,
  FileCheck2,
  TrendingDown,
  MapPin,
  Flame,
  ArrowRight
} from "lucide-react";

interface DashboardHomeProps {
  onGoToSimulation: () => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ onGoToSimulation }) => {
  const summaryCards = [
    {
      title: "Monitored Scheme Outlay",
      value: "₹2,710.4 Cr",
      subtitle: "542 Constituencies in MoSPI Ledger",
      icon: <Coins size={22} color="#38bdf8" />,
      color: "#38bdf8",
      bg: "rgba(56, 189, 248, 0.1)"
    },
    {
      title: "Total Sanctions Audited",
      value: "1,079 Works",
      subtitle: "Multi-District Synthetic & Live Queue",
      icon: <FileCheck2 size={22} color="#34d399" />,
      color: "#34d399",
      bg: "rgba(52, 211, 153, 0.1)"
    },
    {
      title: "High & Critical Alerts",
      value: "128 Flags",
      subtitle: "Cost Outliers & Split Clusters",
      icon: <ShieldAlert size={22} color="#f87171" />,
      color: "#f87171",
      bg: "rgba(248, 113, 113, 0.1)"
    },
    {
      title: "Est. Leakage Averted",
      value: "₹38.42 Cr",
      subtitle: "Through Early Pre-Disbursement Interception",
      icon: <TrendingDown size={22} color="#fbbf24" />,
      color: "#fbbf24",
      bg: "rgba(251, 191, 36, 0.1)"
    },
  ];

  const highRiskDistricts = [
    { district: "Thane", audited: 248, highRisk: 34, riskIndex: "74%", trend: "+12%" },
    { district: "Palghar", audited: 215, highRisk: 29, riskIndex: "68%", trend: "+8%" },
    { district: "Pune", audited: 230, highRisk: 26, riskIndex: "61%", trend: "-3%" },
    { district: "Nashik", audited: 198, highRisk: 21, riskIndex: "52%", trend: "+4%" },
    { district: "Nagpur", audited: 188, highRisk: 18, riskIndex: "46%", trend: "-1%" },
  ];

  const aiEngines = [
    {
      name: "Cost Anomaly Isolation Forest",
      desc: "Scores project sanctioned amounts against category medians & standard deviations.",
      accuracy: "100.0% Recall on Cost Inflation",
      status: "Active"
    },
    {
      name: "Sentence-BERT Semantic Matching",
      desc: "Identifies contract splitting and duplicate scopes within 14-day rolling windows.",
      accuracy: "88.1% Precision • 74.7% Recall",
      status: "Active"
    },
    {
      name: "MoSPI Allocation Roster Validator",
      desc: "Cross-checks MP constituency caps and single-draw expenditure concentration.",
      accuracy: "100% Deterministic SQL Verification",
      status: "Active"
    },
    {
      name: "Cartel & Collusion Graph Service",
      desc: "Graph traversal detecting repeated sole-bidder syndicates and circular subcontracting.",
      accuracy: "Neo4j Ring Discovery Engine",
      status: "Active"
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      
      {/* Top Banner */}
      <div style={{
        backgroundColor: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: "14px",
        padding: "1.75rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1.25rem",
        background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(19, 29, 51, 0.95))"
      }}>
        <div style={{ maxWidth: "680px" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
            Ministry of Statistics and Programme Implementation (MoSPI)
          </div>
          <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "#f8fafc", marginBottom: "8px", letterSpacing: "-0.02em" }}>
            e-SAKSHI Auditor Command Center
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#94a3b8", lineHeight: 1.6 }}>
            Multi-model AI forensic engine actively intercepting inflated cost anomalies, tender splitting threshold evasions, and contractor syndicates in real-time.
          </p>
        </div>

        <button
          onClick={onGoToSimulation}
          style={{
            backgroundColor: "#0284c7",
            border: "none",
            borderRadius: "8px",
            padding: "0.85rem 1.5rem",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "0.9rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            boxShadow: "0 0 20px rgba(2, 132, 199, 0.4)",
            transition: "all 0.15s ease"
          }}
        >
          Launch Live Forensic Audit
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Summary KPI Cards Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "1rem"
      }}>
        {summaryCards.map((card, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "10px",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>
                {card.title}
              </span>
              <div style={{ padding: "6px", borderRadius: "8px", backgroundColor: card.bg }}>
                {card.icon}
              </div>
            </div>
            <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.02em" }}>
              {card.value}
            </div>
            <div style={{ fontSize: "0.725rem", color: "#64748b" }}>
              {card.subtitle}
            </div>
          </div>
        ))}
      </div>

      {/* 2 Columns: High Risk Districts + AI Forensic Subsystems */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
        gap: "1.5rem"
      }}>
        
        {/* District Risk Heat Table */}
        <div style={{
          backgroundColor: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "12px",
          padding: "1.25rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <MapPin size={18} color="#f97316" />
            <span style={{ fontSize: "0.9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
              District Vulnerability Heatlist
            </span>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.825rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1e293b", color: "#64748b", textAlign: "left" }}>
                <th style={{ padding: "8px 6px", fontWeight: 600 }}>District</th>
                <th style={{ padding: "8px 6px", fontWeight: 600 }}>Audited</th>
                <th style={{ padding: "8px 6px", fontWeight: 600 }}>High Risk</th>
                <th style={{ padding: "8px 6px", fontWeight: 600 }}>Vulnerability</th>
              </tr>
            </thead>
            <tbody>
              {highRiskDistricts.map((item, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #131d33" }}>
                  <td style={{ padding: "10px 6px", fontWeight: 700, color: "#f8fafc" }}>
                    {item.district}
                  </td>
                  <td style={{ padding: "10px 6px", color: "#94a3b8" }} className="font-mono">
                    {item.audited}
                  </td>
                  <td style={{ padding: "10px 6px", color: "#fb923c", fontWeight: 700 }} className="font-mono">
                    {item.highRisk}
                  </td>
                  <td style={{ padding: "10px 6px" }}>
                    <span style={{
                      backgroundColor: "rgba(249, 115, 22, 0.15)",
                      color: "#fb923c",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontWeight: 700,
                      fontSize: "0.75rem"
                    }}>
                      {item.riskIndex}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Active AI Forensic Subsystems */}
        <div style={{
          backgroundColor: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "12px",
          padding: "1.25rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Flame size={18} color="#38bdf8" />
            <span style={{ fontSize: "0.9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Active AI Forensic Modules
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {aiEngines.map((eng, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: "#131d33",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  padding: "0.85rem 1rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "0.825rem", fontWeight: 700, color: "#f8fafc" }}>
                    {eng.name}
                  </span>
                  <span style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    color: "#34d399",
                    padding: "2px 6px",
                    borderRadius: "3px"
                  }}>
                    {eng.status}
                  </span>
                </div>
                <div style={{ fontSize: "0.725rem", color: "#94a3b8", marginBottom: "4px" }}>
                  {eng.desc}
                </div>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "#38bdf8" }}>
                  {eng.accuracy}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
