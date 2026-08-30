import React, { useState } from "react";
import type {
  RiskAssessmentResponse,
  RiskLevel,
  ActionRecommended,
  FraudAlert,
} from "../types";
import {
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Cpu,
  Clock,
  FileSearch,
  Building,
  Coins,
  Share2
} from "lucide-react";

interface RiskResultCardProps {
  result: RiskAssessmentResponse;
}

export const RiskResultCard: React.FC<RiskResultCardProps> = ({ result }) => {
  const [expandedAlerts, setExpandedAlerts] = useState<Record<number, boolean>>({
    0: true, // First alert expanded by default
  });

  const toggleAlert = (index: number) => {
    setExpandedAlerts((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const getRiskConfig = (level: RiskLevel) => {
    switch (level) {
      case "CRITICAL":
        return {
          bg: "rgba(239, 68, 68, 0.15)",
          border: "#ef4444",
          text: "#f87171",
          pillBg: "#ef4444",
          glowClass: "glow-critical",
          icon: <AlertOctagon size={24} color="#ef4444" />,
          label: "CRITICAL RISK",
        };
      case "HIGH":
        return {
          bg: "rgba(249, 115, 22, 0.15)",
          border: "#f97316",
          text: "#fb923c",
          pillBg: "#f97316",
          glowClass: "glow-high",
          icon: <ShieldAlert size={24} color="#f97316" />,
          label: "HIGH RISK",
        };
      case "MEDIUM":
        return {
          bg: "rgba(245, 158, 11, 0.15)",
          border: "#f59e0b",
          text: "#fbbf24",
          pillBg: "#f59e0b",
          glowClass: "glow-medium",
          icon: <AlertTriangle size={24} color="#f59e0b" />,
          label: "MEDIUM RISK",
        };
      case "LOW":
      default:
        return {
          bg: "rgba(16, 185, 129, 0.15)",
          border: "#10b981",
          text: "#34d399",
          pillBg: "#10b981",
          glowClass: "glow-low",
          icon: <CheckCircle2 size={24} color="#10b981" />,
          label: "LOW RISK",
        };
    }
  };

  const getActionConfig = (action: ActionRecommended) => {
    switch (action) {
      case "FREEZE_FUNDS_AND_AUDIT":
        return {
          bg: "rgba(239, 68, 68, 0.2)",
          text: "#fca5a5",
          border: "rgba(239, 68, 68, 0.4)",
          label: "FREEZE DISBURSEMENTS & INITIATE SPECIAL AUDIT",
        };
      case "MANUAL_VIGILANCE_REVIEW":
        return {
          bg: "rgba(249, 115, 22, 0.2)",
          text: "#fdba74",
          border: "rgba(249, 115, 22, 0.4)",
          label: "FORWARD TO DISTRICT VIGILANCE OFFICER",
        };
      case "ADDITIONAL_INVOICE_SCRUTINY":
        return {
          bg: "rgba(245, 158, 11, 0.2)",
          text: "#fde68a",
          border: "rgba(245, 158, 11, 0.4)",
          label: "MANDATORY BILL SCRUTINY & SITE INSPECTION",
        };
      case "AUTO_APPROVE":
      default:
        return {
          bg: "rgba(16, 185, 129, 0.2)",
          text: "#a7f3d0",
          border: "rgba(16, 185, 129, 0.4)",
          label: "PASS COMPLIANCE • AUTO-APPROVE SANCTION",
        };
    }
  };

  const getAlertIcon = (type: string) => {
    if (type.includes("ISOLATION") || type.includes("COST")) return <Coins size={16} color="#38bdf8" />;
    if (type.includes("SPLIT") || type.includes("SEMANTIC")) return <Share2 size={16} color="#fbbf24" />;
    if (type.includes("BUDGET") || type.includes("CAPITAL")) return <Building size={16} color="#f87171" />;
    return <FileSearch size={16} color="#94a3b8" />;
  };

  const risk = getRiskConfig(result.risk_level);
  const action = getActionConfig(result.action_recommended);

  return (
    <div style={{
      backgroundColor: "#0f172a",
      border: `1px solid ${risk.border}`,
      borderRadius: "14px",
      padding: "1.5rem",
      display: "flex",
      flexDirection: "column",
      gap: "1.25rem",
      position: "relative",
      overflow: "hidden"
    }} className={risk.glowClass}>
      
      {/* Top Banner: Project ID & Timestamp */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #1e293b",
        paddingBottom: "0.85rem",
        flexWrap: "wrap",
        gap: "0.5rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 500 }}>AUDIT DOSSIER:</span>
          <span className="font-mono" style={{ fontSize: "1rem", fontWeight: 700, color: "#f8fafc" }}>
            {result.project_id}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "#64748b" }}>
          <Clock size={13} />
          <span>{new Date(result.timestamp).toLocaleTimeString()} • {new Date(result.timestamp).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Hero Stats Row: Risk Score Dial + Badge + Recommended Action */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "1rem",
        alignItems: "stretch"
      }}>
        {/* Risk Score Card */}
        <div style={{
          backgroundColor: "#131d33",
          border: "1px solid #1e293b",
          borderRadius: "10px",
          padding: "1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem"
        }}>
          <div style={{
            width: "68px",
            height: "68px",
            borderRadius: "50%",
            border: `4px solid ${risk.border}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(11, 17, 32, 0.9)",
            flexShrink: 0
          }}>
            <span style={{ fontSize: "1.45rem", fontWeight: 800, color: risk.text, lineHeight: 1 }}>
              {result.overall_risk_score}
            </span>
            <span style={{ fontSize: "0.6rem", color: "#64748b", fontWeight: 600 }}>/100</span>
          </div>
          <div>
            <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>
              Composite Risk Index
            </div>
            <div style={{
              display: "inline-block",
              fontSize: "0.85rem",
              fontWeight: 800,
              color: "#ffffff",
              backgroundColor: risk.pillBg,
              padding: "2px 8px",
              borderRadius: "4px",
              marginTop: "4px"
            }}>
              {risk.label}
            </div>
          </div>
        </div>

        {/* Recommended Action Card */}
        <div style={{
          backgroundColor: action.bg,
          border: `1px solid ${action.border}`,
          borderRadius: "10px",
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "0.35rem"
        }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Recommended Auditor Action
          </div>
          <div style={{ fontSize: "0.95rem", fontWeight: 800, color: action.text }}>
            {action.label}
          </div>
        </div>
      </div>

      {/* Alerts Breakdown Section */}
      <div>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.75rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Cpu size={16} color="#38bdf8" />
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              AI Forensic Audit Findings ({result.alerts.length})
            </span>
          </div>
          {result.alerts.length === 0 && (
            <span style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: 600 }}>
              All 5 AI Subsystems Clear
            </span>
          )}
        </div>

        {result.alerts.length === 0 ? (
          <div style={{
            backgroundColor: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            borderRadius: "8px",
            padding: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            color: "#a7f3d0"
          }}>
            <CheckCircle2 size={20} color="#10b981" />
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>No Outliers or Compliance Anomalies Detected</div>
              <div style={{ fontSize: "0.75rem", color: "#6ee7b7" }}>
                Cost within category baseline, no semantic duplicate clusters found in district, MP budget verified, and contractor network clear.
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {result.alerts.map((alert: FraudAlert, index: number) => {
              const isExpanded = !!expandedAlerts[index];
              const isCritical = alert.severity === "CRITICAL";
              const isHigh = alert.severity === "HIGH";

              return (
                <div
                  key={index}
                  style={{
                    backgroundColor: "#131d33",
                    border: `1px solid ${isCritical ? "rgba(239, 68, 68, 0.4)" : isHigh ? "rgba(249, 115, 22, 0.4)" : "#1e293b"}`,
                    borderRadius: "8px",
                    overflow: "hidden"
                  }}
                >
                  <div
                    onClick={() => toggleAlert(index)}
                    style={{
                      padding: "0.75rem 1rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      backgroundColor: isExpanded ? "#18243e" : "#131d33",
                      transition: "background-color 0.15s ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
                      {getAlertIcon(alert.alert_type)}
                      <span className="font-mono" style={{ fontSize: "0.8rem", fontWeight: 700, color: "#f8fafc" }}>
                        {alert.alert_type}
                      </span>
                      <span style={{
                        fontSize: "0.65rem",
                        fontWeight: 800,
                        padding: "2px 6px",
                        borderRadius: "3px",
                        backgroundColor: isCritical ? "#ef4444" : isHigh ? "#f97316" : "#f59e0b",
                        color: "#ffffff"
                      }}>
                        {alert.severity}
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                  </div>

                  {isExpanded && (
                    <div style={{
                      padding: "0.85rem 1rem",
                      fontSize: "0.825rem",
                      color: "#cbd5e1",
                      borderTop: "1px solid #1e293b",
                      backgroundColor: "rgba(11, 17, 32, 0.5)",
                      lineHeight: 1.6
                    }}>
                      {alert.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
